/* Iskrička — stav aplikácie, perzistencia, API a analytika */
(function () {
  const KEY = 'iskricka.v1';
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
  ISK.uid = () => uid().slice(0, 12);

  const today = () => new Date().toISOString().slice(0, 10);
  const monthKey = () => new Date().toISOString().slice(0, 7);
  ISK.today = today;

  function fresh() {
    return {
      v: 1,
      userId: uid(),
      profile: { onboarded: false },
      tier: 'free', premiumUntil: null, trialUsed: false, billing: null,
      usage: { month: monthKey(), ai: 0 },
      plans: [], favorites: [], week: {}, children: [], gameSets: [],
      notifications: [],
      settings: { reminderTime: '07:30', dailyReminder: true, weeklyReminder: true, gameReminder: true, sound: true, speech: true },
      streak: { last: null, count: 0, best: 0 },
      achievements: {},
      stats: { plansGenerated: 0, gamesPlayed: 0, aiCalls: 0, observations: 0 },
      chat: [],
      localEvents: [],
      sent: {},
    };
  }

  let state;
  try { state = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || 'null') || {}); }
  catch (e) { state = fresh(); }
  ISK.state = state;

  let saveTimer;
  ISK.save = function () {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn('save failed', e); }
    }, 60);
  };
  ISK.reset = function () { try { localStorage.removeItem(KEY); } catch (e) {} location.href = location.pathname; };

  /* ---------- Predplatné ---------- */
  ISK.isPremium = function () {
    if (state.tier !== 'premium') return false;
    if (state.premiumUntil && new Date(state.premiumUntil) < new Date()) { state.tier = 'free'; ISK.save(); return false; }
    return true;
  };
  ISK.aiLeft = function () {
    if (state.usage.month !== monthKey()) { state.usage = { month: monthKey(), ai: 0 }; ISK.save(); }
    if (ISK.isPremium()) return Infinity;
    return Math.max(0, ISK.PLANS.free.aiPerMonth - state.usage.ai);
  };
  ISK.canPlay = (gameId) => ISK.isPremium() || ISK.PLANS.free.games.includes(gameId);

  /* ---------- Serverové API (Netlify Functions) ---------- */
  ISK.api = async function (fn, body, opts = {}) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), opts.timeout || 30000);
    try {
      const res = await fetch('/.netlify/functions/' + fn, {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {}),
        body: JSON.stringify(body || {}),
        signal: ctrl.signal,
      });
      let data = null;
      try { data = await res.json(); } catch (e) { data = null; }
      if (!res.ok) { const err = new Error((data && data.error) || 'HTTP ' + res.status); err.status = res.status; err.data = data; throw err; }
      return data;
    } finally { clearTimeout(t); }
  };

  ISK.publicProfile = function () {
    const p = state.profile;
    return {
      id: state.userId, name: p.name, email: p.email, school: p.school, className: p.className,
      age: p.age, kids: p.kids, children: state.children.length, plans: state.plans.length,
      stats: state.stats, streak: state.streak.count,
    };
  };

  /* Synchronizácia so serverom: registrácia, tarif nastavený adminom/Stripe, limit AI */
  ISK.sync = async function () {
    if (!state.profile.onboarded) return;
    try {
      const data = await ISK.api('track', { action: 'hello', user: ISK.publicProfile() }, { timeout: 8000 });
      ISK.online = true;
      if (data && data.user) applyServerUser(data.user);
    } catch (e) { ISK.online = false; }
  };
  function applyServerUser(u) {
    if (u.blocked) { state.blocked = true; }
    if (u.tier) { state.tier = u.tier; state.premiumUntil = u.premiumUntil || null; }
    if (typeof u.trialUsed === 'boolean') state.trialUsed = u.trialUsed || state.trialUsed;
    if (u.aiMonth === monthKey() && typeof u.aiCount === 'number') state.usage = { month: u.aiMonth, ai: Math.max(state.usage.ai, u.aiCount) };
    if (u.billing) state.billing = u.billing;
    ISK.save();
    ISK.emit && ISK.emit('tier');
  }
  ISK.applyServerUser = applyServerUser;

  /* ---------- Analytika ---------- */
  let queue = [];
  ISK.track = function (type, meta) {
    const ev = { type, t: Date.now(), meta: meta || null };
    queue.push(ev);
    state.localEvents.push({ type, t: ev.t });
    if (state.localEvents.length > 600) state.localEvents.splice(0, state.localEvents.length - 600);
    ISK.save();
    if (queue.length >= 15) flush();
  };
  function flush(beacon) {
    if (!queue.length || !state.profile.onboarded) return;
    const payload = JSON.stringify({ action: 'events', userId: state.userId, events: queue.slice(0, 50) });
    queue = queue.slice(50);
    if (beacon && navigator.sendBeacon) {
      navigator.sendBeacon('/.netlify/functions/track', new Blob([payload], { type: 'application/json' }));
    } else {
      fetch('/.netlify/functions/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }).catch(() => {});
    }
  }
  setInterval(flush, 15000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(true); });

  /* ---------- Jednoduchý event bus ---------- */
  const listeners = {};
  ISK.on = (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); };
  ISK.emit = (ev, data) => { (listeners[ev] || []).forEach((fn) => { try { fn(data); } catch (e) { console.error(e); } }); };

  /* ---------- Séria a úspechy ---------- */
  ISK.touchStreak = function () {
    const t = today();
    const s = state.streak;
    if (s.last === t) return;
    const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    s.count = s.last === y ? s.count + 1 : 1;
    s.best = Math.max(s.best, s.count);
    s.last = t;
    if (s.count >= 3) ISK.unlock('streak3');
    if (s.count >= 7) ISK.unlock('streak7');
    ISK.save();
  };

  ISK.unlock = function (id) {
    if (state.achievements[id]) return;
    const a = ISK.ACHIEVEMENTS.find((x) => x.id === id);
    if (!a) return;
    state.achievements[id] = today();
    ISK.save();
    ISK.notify({ icon: a.icon, title: 'Nový odznak: ' + a.name, body: a.desc, action: '#/profil' });
    ISK.track('achievement', { id });
    ISK.emit('achievement', a);
  };

  /* ---------- Notifikácie (in-app + systémové) ---------- */
  ISK.notify = function (n, opts = {}) {
    const item = Object.assign({ id: ISK.uid(), date: new Date().toISOString(), read: false, icon: '✨' }, n);
    state.notifications.unshift(item);
    state.notifications = state.notifications.slice(0, 60);
    ISK.save();
    ISK.emit('notifications');
    if (opts.system) ISK.systemNotify(item);
    return item;
  };
  ISK.systemNotify = async function (n) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      const reg = navigator.serviceWorker && (await navigator.serviceWorker.getRegistration());
      const opts = { body: n.body, icon: 'icon.svg', badge: 'icon.svg', tag: n.tag || n.id, data: { url: n.action || '#/' } };
      if (reg) reg.showNotification(n.title, opts); else new Notification(n.title, opts);
    } catch (e) { /* ignore */ }
  };

  /* ---------- Pomocníci týždňa ---------- */
  ISK.weekKey = function (d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const wk = Math.ceil(((date - yearStart) / 864e5 + 1) / 7);
    return date.getUTCFullYear() + '-W' + String(wk).padStart(2, '0');
  };
  ISK.mondayOf = function (d) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = x.getDay() || 7;
    x.setDate(x.getDate() - day + 1);
    return x;
  };
  ISK.DAYS = [['po', 'Pondelok'], ['ut', 'Utorok'], ['st', 'Streda'], ['st2', 'Štvrtok'], ['pi', 'Piatok']];
  ISK.getWeek = function (key) {
    if (!state.week[key]) state.week[key] = { theme: '', days: { po: [], ut: [], st: [], st2: [], pi: [] } };
    return state.week[key];
  };
  ISK.todayDayKey = function () {
    const d = new Date().getDay();
    return { 1: 'po', 2: 'ut', 3: 'st', 4: 'st2', 5: 'pi' }[d] || null;
  };
})();
