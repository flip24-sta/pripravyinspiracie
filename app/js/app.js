/* Iskrička — hlavná aplikácia: router, obrazovky, onboarding, paywall, notifikácie */
(function () {
  const S = () => ISK.state;
  const app = document.getElementById('app');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nl2br = (s) => esc(s).replace(/\n/g, '<br>');
  ISK.esc = esc;
  const area = (id) => ISK.AREAS.find((a) => a.id === id) || { short: id, color: '#999', icon: '•' };
  const ptype = (id) => ISK.PLAN_TYPES.find((t) => t.id === id) || ISK.PLAN_TYPES[0];
  const fmtDate = (iso) => new Date(iso).toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric', year: 'numeric' });
  const timeAgo = (iso) => {
    const m = Math.round((Date.now() - new Date(iso)) / 60000);
    if (m < 1) return 'práve teraz'; if (m < 60) return `pred ${m} min`;
    const h = Math.round(m / 60); if (h < 24) return `pred ${h} h`;
    const d = Math.round(h / 24); return d === 1 ? 'včera' : `pred ${d} dňami`;
  };

  /* ---------------- Toast & modal ---------------- */
  function toast(msg, kind = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + kind; t.textContent = msg;
    document.getElementById('toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), 2800);
    setTimeout(() => t.remove(), 3300);
  }
  ISK.toast = toast;

  function modal(html, opts = {}) {
    closeModal();
    const m = document.createElement('div');
    m.className = 'modal-bg'; m.id = 'modal';
    m.innerHTML = `<div class="modal ${opts.cls || ''}" role="dialog" aria-modal="true"><button class="modal-x" aria-label="Zavrieť">✕</button>${html}</div>`;
    document.body.appendChild(m);
    m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('.modal-x')) closeModal(); });
    requestAnimationFrame(() => m.classList.add('in'));
    const first = m.querySelector('input,textarea,select');
    if (first && !opts.noFocus) setTimeout(() => first.focus(), 50);
    return m.querySelector('.modal');
  }
  function closeModal() { const m = document.getElementById('modal'); if (m) m.remove(); }
  ISK.modal = modal; ISK.closeModal = closeModal;
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  /* ---------------- Router ---------------- */
  const NAV = [
    ['domov', '🏠', 'Domov'],
    ['pripravy', '✨', 'AI prípravy'],
    ['hry', '🎮', 'Hry'],
    ['tyzden', '📅', 'Týždeň'],
    ['trieda', '👧', 'Trieda'],
    ['kniznica', '📚', 'Knižnica'],
    ['asistent', '💬', 'Asistent'],
  ];
  const ROUTES = {};

  function route() {
    if (!S().profile.onboarded) return renderOnboarding();
    const hash = location.hash.replace(/^#\/?/, '') || 'domov';
    const [name, ...rest] = hash.split('/');
    if (name === 'admin') { document.body.classList.add('admin-mode'); return ISK.renderAdmin(app); }
    document.body.classList.remove('admin-mode');
    const fn = ROUTES[name] || ROUTES.domov;
    renderShell(name);
    fn(document.getElementById('view'), rest);
    document.getElementById('view').focus({ preventScroll: true });
    window.scrollTo(0, 0);
    ISK.track('view', { screen: name });
  }
  window.addEventListener('hashchange', route);
  ISK.on('route', () => { if (S().profile.onboarded) route(); });
  ISK.go = (h) => { if (location.hash === '#/' + h) route(); else location.hash = '#/' + h; };

  function renderShell(active) {
    const p = S().profile;
    const unread = S().notifications.filter((n) => !n.read).length;
    const prem = ISK.isPremium();
    app.innerHTML = `
      <aside class="side">
        <a class="logo" href="#/domov">${ISK.logoSvg()}<span>Iskrička</span></a>
        <nav class="nav">${NAV.map(([id, ic, label]) => `<a href="#/${id}" class="${active === id ? 'on' : ''}"><span class="ni">${ic}</span><span>${label}</span></a>`).join('')}</nav>
        <div class="side-foot">
          ${prem ? `<div class="prem-pill">👑 Premium</div>` : `<button class="upsell" data-upgrade>
            <b>👑 Iskrička Premium</b><span>Neobmedzené AI, všetky hry a týždenné plány</span><em>Vyskúšať</em></button>`}
          <a class="me" href="#/profil"><span class="me-av">${esc((p.name || '?').charAt(0))}</span><span><b>${esc(p.name)}</b><small>${esc(p.className || p.school || '')}</small></span></a>
        </div>
      </aside>
      <div class="main">
        <header class="top">
          <a class="logo sm" href="#/domov">${ISK.logoSvg()}<span>Iskrička</span></a>
          <div class="top-right">
            ${prem ? '' : `<button class="quota" data-upgrade title="AI generovania tento mesiac">✨ ${ISK.aiLeft()}/${ISK.PLANS.free.aiPerMonth}</button>`}
            <span class="streak" title="Dni v rade">🔥 ${S().streak.count}</span>
            <button class="bell" id="bell" aria-label="Upozornenia">🔔${unread ? `<i>${unread}</i>` : ''}</button>
            <a class="me-av top-av" href="#/profil" aria-label="Profil">${esc((p.name || '?').charAt(0))}</a>
          </div>
        </header>
        <main id="view" tabindex="-1"></main>
      </div>
      <nav class="tabbar">${NAV.slice(0, 5).map(([id, ic, label]) => `<a href="#/${id}" class="${active === id ? 'on' : ''}"><span>${ic}</span><small>${label}</small></a>`).join('')}</nav>`;
    app.querySelectorAll('[data-upgrade]').forEach((b) => b.onclick = () => paywall('upsell'));
    document.getElementById('bell').onclick = openNotifications;
  }

  /* ---------------- Onboarding ---------------- */
  let ob = { step: 0, data: { focus: [] } };
  function renderOnboarding() {
    document.body.classList.add('onboarding');
    const d = ob.data;
    const steps = [
      () => `<div class="ob-hero">
          <div class="ob-logo">${ISK.logoSvg(96)}</div>
          <h1>Iskrička</h1>
          <p class="tag">Prípravy za 30 sekúnd. Hry, z ktorých deti iskria.</p>
          <ul class="ob-bul">
            <li><span>✨</span>AI prípravy podľa Štátneho vzdelávacieho programu</li>
            <li><span>🎮</span>7 interaktívnych hier pre deti na tablete či tabuli</li>
            <li><span>📅</span>Týždenný plán, triedny denník a správy pre rodičov</li>
          </ul>
          <button class="btn big" data-next>Začať zadarmo →</button>
          <p class="fine">Od tvorcov <a href="/" target="_blank">Prípravy Inšpirácie</a> · Bez kreditnej karty</p>
        </div>`,
      () => `<h2>Ahoj! Ako vás máme oslovovať? 👋</h2>
        <p class="sub">Iskrička sa prispôsobí vašej triede.</p>
        <label>Vaše meno<input id="ob-name" value="${esc(d.name || '')}" placeholder="napr. Janka Nováková" autocomplete="name"></label>
        <label>E-mail<input id="ob-email" type="email" value="${esc(d.email || '')}" placeholder="janka@skolka.sk" autocomplete="email"></label>
        <div class="row2">
          <label>Materská škola<input id="ob-school" value="${esc(d.school || '')}" placeholder="MŠ Slniečko"></label>
          <label>Názov triedy<input id="ob-class" value="${esc(d.className || '')}" placeholder="Lienky 🐞"></label>
        </div>
        <label class="check"><input type="checkbox" id="ob-consent" ${d.consent ? 'checked' : ''}> Súhlasím so <a href="/obchodne-podmienky" target="_blank">podmienkami</a> a <a href="/ochrana-osobnych-udajov" target="_blank">spracovaním osobných údajov</a>.</label>
        <div class="ob-nav"><button class="btn ghost" data-back>Späť</button><button class="btn" data-next>Pokračovať</button></div>`,
      () => `<h2>Aké deti učíte? 🧒</h2>
        <p class="sub">Hry aj prípravy nastavíme na správnu náročnosť.</p>
        <div class="choice-grid">${ISK.AGES.map((a) => `<button class="choice ${d.age === a.id ? 'on' : ''}" data-age="${a.id}"><b>${a.name}</b></button>`).join('')}</div>
        <label>Počet detí v triede<input id="ob-kids" type="number" min="1" max="30" value="${d.kids || 20}"></label>
        <h3 class="mt">Na čo sa chcete zamerať?</h3>
        <div class="chips">${ISK.AREAS.map((a) => `<button class="chip ${d.focus.includes(a.id) ? 'on' : ''}" data-focus="${a.id}" style="--c:${a.color}">${a.icon} ${a.short}</button>`).join('')}</div>
        <div class="ob-nav"><button class="btn ghost" data-back>Späť</button><button class="btn" data-next>Pokračovať</button></div>`,
      () => `<h2>Kedy vám mám pripomenúť plán dňa? ⏰</h2>
        <p class="sub">Každé ráno vám pošlem prehľad aktivít a nápad dňa. V nedeľu večer pripomeniem plánovanie týždňa.</p>
        <label>Ranná pripomienka<input id="ob-time" type="time" value="${d.time || '07:30'}"></label>
        <div class="notif-demo"><span>🔔</span><div><b>Iskrička · Dobré ráno, ${esc((d.name || '').split(' ')[0] || 'pani učiteľka')}!</b><small>Dnes vás čaká ranný kruh „Jeseň“ a pohybová hra. Deti si zaslúžia pexeso 🍂</small></div></div>
        <button class="btn soft wide" id="ob-perm">🔔 Povoliť upozornenia</button>
        <div class="ob-nav"><button class="btn ghost" data-back>Späť</button><button class="btn" data-next>Dokončiť</button></div>`,
    ];
    app.innerHTML = `<div class="ob"><div class="ob-card">
      ${ob.step ? `<div class="ob-prog">${[1, 2, 3].map((i) => `<i class="${i <= ob.step ? 'on' : ''}"></i>`).join('')}</div>` : ''}
      ${steps[ob.step]()}</div>
      <div class="ob-deco" aria-hidden="true"><span>🍎</span><span>⭐</span><span>🦊</span><span>🎈</span><span>🌈</span><span>🐞</span></div></div>`;

    const q = (s) => app.querySelector(s);
    const collect = () => {
      if (ob.step === 1) Object.assign(d, { name: q('#ob-name').value.trim(), email: q('#ob-email').value.trim(), school: q('#ob-school').value.trim(), className: q('#ob-class').value.trim(), consent: q('#ob-consent').checked });
      if (ob.step === 2) d.kids = +q('#ob-kids').value || 20;
      if (ob.step === 3) d.time = q('#ob-time').value;
    };
    app.querySelectorAll('[data-age]').forEach((b) => b.onclick = () => { collect(); d.age = b.dataset.age; renderOnboarding(); });
    app.querySelectorAll('[data-focus]').forEach((b) => b.onclick = () => { collect(); d.focus = d.focus.includes(b.dataset.focus) ? d.focus.filter((x) => x !== b.dataset.focus) : d.focus.concat(b.dataset.focus); renderOnboarding(); });
    const back = q('[data-back]'); if (back) back.onclick = () => { collect(); ob.step--; renderOnboarding(); };
    const perm = q('#ob-perm'); if (perm) perm.onclick = async () => { collect(); const ok = await askPermission(); perm.textContent = ok ? '✅ Upozornenia povolené' : 'Upozornenia sú v prehliadači zablokované'; perm.disabled = true; };
    q('[data-next]').onclick = () => {
      collect();
      if (ob.step === 1) {
        if (d.name.length < 2) return toast('Napíšte prosím svoje meno.', 'err');
        if (!/^\S+@\S+\.\S+$/.test(d.email)) return toast('Zadajte platný e-mail.', 'err');
        if (!d.consent) return toast('Pre pokračovanie potrebujeme váš súhlas.', 'err');
      }
      if (ob.step === 2 && !d.age) return toast('Vyberte vekovú skupinu detí.', 'err');
      if (ob.step < 3) { ob.step++; return renderOnboarding(); }
      finishOnboarding();
    };
    const first = q('input'); if (first) first.focus();
  }

  function finishOnboarding() {
    const d = ob.data, s = S();
    s.profile = { onboarded: true, name: d.name, email: d.email, school: d.school, className: d.className || 'Moja trieda', age: d.age, kids: d.kids, focus: d.focus, createdAt: new Date().toISOString() };
    s.settings.reminderTime = d.time || '07:30';
    ISK.touchStreak();
    ISK.notify({ icon: '🎉', title: 'Vitajte v Iskričke!', body: 'Vyskúšajte prvú AI prípravu — stačí napísať tému.', action: '#/pripravy' });
    ISK.notify({ icon: '🎮', title: 'Pridajte deti do triedy', body: 'Hry potom ukladajú pokroky každého dieťaťa.', action: '#/trieda' });
    ISK.save();
    document.body.classList.remove('onboarding');
    ISK.track('signup', { age: d.age });
    ISK.sync();
    location.hash = '#/domov';
    route();
    setTimeout(() => ISK.confetti(document.body, 80), 200);
  }

  /* ---------------- Domov ---------------- */
  ROUTES.domov = function (v) {
    const s = S(), p = s.profile;
    const h = new Date().getHours();
    const greet = h < 10 ? 'Dobré ráno' : h < 18 ? 'Pekný deň' : 'Dobrý večer';
    const wk = ISK.getWeek(ISK.weekKey(new Date()));
    const dk = ISK.todayDayKey();
    const todays = dk ? wk.days[dk] : [];
    const themeOfWeek = wk.theme || suggestedTheme().name;
    const sugg = suggestedTheme();
    const recent = s.plans.slice(0, 3);
    const kids = s.children.length;
    const planned = ISK.DAYS.filter(([k]) => wk.days[k].length).length;
    v.innerHTML = `
      <section class="hello">
        <div><h1>${greet}, ${esc(p.name.split(' ')[0])}! <span class="wave">👋</span></h1>
        <p>${dk ? `Dnes je ${ISK.DAYS.find((x) => x[0] === dk)[1].toLowerCase()} — téma týždňa: <b>${esc(themeOfWeek)}</b>` : 'Víkend! Ideálny čas naplánovať budúci týždeň.'}</p></div>
        <button class="btn big" onclick="ISK.go('pripravy')">✨ Nová príprava</button>
      </section>

      <section class="stats-row">
        <div class="stat" style="--c:#FF6B6B"><b>${s.stats.plansGenerated}</b><span>príprav</span></div>
        <div class="stat" style="--c:#5B8DEF"><b>${s.stats.gamesPlayed}</b><span>odohraných hier</span></div>
        <div class="stat" style="--c:#3DBE8B"><b>${planned}/5</b><span>dní naplánovaných</span></div>
        <div class="stat" style="--c:#FFC93C"><b>${s.streak.count} 🔥</b><span>dni v rade</span></div>
      </section>

      <div class="grid2">
        <section class="card">
          <div class="card-h"><h2>📌 Dnes v triede</h2><a href="#/tyzden">Celý týždeň →</a></div>
          ${todays && todays.length ? `<ul class="today">${todays.map((a) => `<li class="${a.done ? 'done' : ''}"><button class="tick" data-tick="${a.id}" aria-label="Hotovo">${a.done ? '✔' : ''}</button><span>${ptype(a.type).icon}</span><div><b>${esc(a.title)}</b>${a.text ? `<small>${esc(a.text)}</small>` : ''}</div></li>`).join('')}</ul>`
            : `<div class="empty"><span>🗓️</span><p>${dk ? 'Na dnes zatiaľ nemáte nič v pláne.' : 'Cez víkend si oddýchnite — alebo pripravte budúci týždeň.'}</p><button class="btn soft" onclick="ISK.go('tyzden')">Naplánovať</button></div>`}
        </section>

        <section class="card theme-card" style="--c:${sugg.color}">
          <div class="card-h"><h2>💡 Nápad dňa</h2></div>
          <div class="idea"><span class="idea-ic">${sugg.icon}</span><div><b>${sugg.name}</b><p>${esc(sugg.poem.split('\n').slice(0, 2).join(' '))}</p></div></div>
          <div class="btnrow">
            <button class="btn" data-gen="${esc(sugg.name)}">✨ Vytvoriť prípravu</button>
            <button class="btn soft" data-play="${sugg.id}">🎮 Zahrať pexeso</button>
          </div>
        </section>
      </div>

      <section class="card">
        <div class="card-h"><h2>🎮 Rýchle hry pre deti</h2><a href="#/hry">Všetky hry →</a></div>
        <div class="game-strip">${ISK.GAMES.map((g) => `<button class="gtile ${ISK.canPlay(g.id) ? '' : 'locked'}" data-game="${g.id}" style="--c:${g.color}"><span>${g.icon}</span><b>${g.name}</b>${ISK.canPlay(g.id) ? '' : '<i>👑</i>'}</button>`).join('')}</div>
      </section>

      <div class="grid2">
        <section class="card">
          <div class="card-h"><h2>🕘 Posledné prípravy</h2><a href="#/kniznica">Knižnica →</a></div>
          ${recent.length ? `<ul class="list">${recent.map((r) => `<li><a href="#/kniznica/${r.id}"><span>${ptype(r.type).icon}</span><div><b>${esc(r.title)}</b><small>${timeAgo(r.createdAt)} · ${esc(r.theme || '')}</small></div></a></li>`).join('')}</ul>`
            : `<div class="empty"><span>✨</span><p>Vaša prvá AI príprava je vzdialená 30 sekúnd.</p><button class="btn soft" onclick="ISK.go('pripravy')">Vyskúšať</button></div>`}
        </section>
        <section class="card">
          <div class="card-h"><h2>👧 Moja trieda</h2><a href="#/trieda">Otvoriť →</a></div>
          ${kids ? `<div class="kid-row">${s.children.slice(0, 12).map((k) => `<span class="kid-av" style="--c:${k.color}" title="${esc(k.name)}">${k.avatar}</span>`).join('')}${kids > 12 ? `<span class="kid-av more">+${kids - 12}</span>` : ''}</div>
            <p class="muted">${kids} detí · ${s.stats.observations} pozorovaní</p>`
            : `<div class="empty"><span>🧒</span><p>Pridajte deti — hry budú sledovať ich pokrok.</p><button class="btn soft" onclick="ISK.go('trieda')">Pridať deti</button></div>`}
        </section>
      </div>

      ${ISK.isPremium() ? '' : `<section class="promo">
        <div><h2>👑 Odomknite celú Iskričku</h2><p>Neobmedzené AI prípravy, všetkých 7 hier, AI týždenný plán a správy pre rodičov. Prvých 7 dní zadarmo.</p></div>
        <button class="btn gold" data-upgrade>Vyskúšať Premium</button></section>`}

      <section class="card shop">
        <div><h2>🛍️ Hotové materiály na tlač</h2><p class="muted">Písomné prípravy, ranné kruhy a megasúbory od Prípravy Inšpirácie.</p></div>
        <a class="btn soft" href="${ISK.SHOP_URL}" target="_blank" rel="noopener">Do e-shopu →</a>
      </section>`;

    v.querySelectorAll('[data-tick]').forEach((b) => b.onclick = () => {
      const a = todays.find((x) => x.id === b.dataset.tick); a.done = !a.done; ISK.save();
      if (a.done) { ISK.games.sfx.ok(); ISK.track('activity_done'); }
      route();
    });
    v.querySelectorAll('[data-gen]').forEach((b) => b.onclick = () => { draft.theme = b.dataset.gen; ISK.go('pripravy'); });
    v.querySelectorAll('[data-play]').forEach((b) => b.onclick = () => ISK.games.open('pexeso', b.dataset.play));
    v.querySelectorAll('[data-game]').forEach((b) => b.onclick = () => ISK.games.open(b.dataset.game, gameSetId));
    v.querySelectorAll('[data-upgrade]').forEach((b) => b.onclick = () => paywall('home'));
  };

  function suggestedTheme() {
    const m = new Date().getMonth();
    const byMonth = { 8: 'jesen', 9: 'jesen', 10: 'les', 11: 'zima', 0: 'zima', 1: 'zima', 2: 'jar', 3: 'jar', 4: 'zvierata', 5: 'leto', 6: 'leto', 7: 'more' };
    const day = new Date().getDate();
    const pool = [byMonth[m], 'ovocie', 'doprava', 'vesmir', byMonth[m]];
    return ISK.THEMES.find((t) => t.id === pool[day % pool.length]) || ISK.THEMES[0];
  }

  /* ---------------- AI prípravy ---------------- */
  const draft = { theme: '', type: 'denna', age: null, duration: '30 min', areas: [], notes: '' };
  let lastResult = null;

  ROUTES.pripravy = function (v) {
    const s = S();
    draft.age = draft.age || s.profile.age;
    if (!draft.areas.length) draft.areas = (s.profile.focus && s.profile.focus.length ? s.profile.focus : ['jazyk', 'matematika', 'pohyb']).slice(0, 3);
    v.innerHTML = `
      <div class="page-h"><h1>✨ AI prípravy</h1><p>Napíšte tému a Iskrička pripraví kompletnú aktivitu podľa ŠVP — ciele, pomôcky, priebeh, básničku aj hru.</p></div>
      <div class="gen">
        <form class="card gen-form" id="genForm">
          <label>Téma<input id="g-theme" value="${esc(draft.theme)}" placeholder="napr. Jesenné listy, Hasiči, Moja rodina…" required maxlength="80"></label>
          <div class="chips sm">${ISK.THEMES.map((t) => `<button type="button" class="chip" data-th="${esc(t.name)}">${t.icon} ${t.name}</button>`).join('')}</div>
          <label>Typ aktivity</label>
          <div class="seg">${ISK.PLAN_TYPES.map((t) => `<button type="button" class="${draft.type === t.id ? 'on' : ''}" data-type="${t.id}">${t.icon} ${t.name}${t.premium && !ISK.isPremium() ? ' 👑' : ''}</button>`).join('')}</div>
          <div class="row2">
            <label>Vek detí<select id="g-age">${ISK.AGES.map((a) => `<option value="${a.id}" ${draft.age === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}</select></label>
            <label>Dĺžka<select id="g-dur">${ISK.DURATIONS.map((d) => `<option ${draft.duration === d ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
          </div>
          <label>Vzdelávacie oblasti ŠVP</label>
          <div class="chips">${ISK.AREAS.map((a) => `<button type="button" class="chip ${draft.areas.includes(a.id) ? 'on' : ''}" data-area="${a.id}" style="--c:${a.color}">${a.icon} ${a.short}</button>`).join('')}</div>
          <label>Poznámka pre Iskričku <small>(nepovinné)</small><textarea id="g-notes" rows="2" placeholder="napr. máme v triede dieťa s ADHD, chceme viac pobytu vonku…">${esc(draft.notes)}</textarea></label>
          <button class="btn big wide" type="submit">✨ Vygenerovať prípravu</button>
          <p class="fine center">${ISK.isPremium() ? '👑 Premium — neobmedzené generovanie' : `Zostáva ${ISK.aiLeft()} z ${ISK.PLANS.free.aiPerMonth} AI generovaní tento mesiac`}</p>
        </form>
        <div id="genOut">${lastResult ? planHtml(lastResult, true) : `<div class="card gen-empty"><div class="float">🧚</div><h3>Tu sa objaví vaša príprava</h3><p>Tip: čím konkrétnejšia téma, tým lepší výsledok. Skúste „Ježko hľadá domček“ alebo „Prečo padá lístie“.</p></div>`}</div>
      </div>`;

    const f = v.querySelector('#genForm');
    const sync = () => { draft.theme = f.querySelector('#g-theme').value; draft.age = f.querySelector('#g-age').value; draft.duration = f.querySelector('#g-dur').value; draft.notes = f.querySelector('#g-notes').value; };
    f.querySelectorAll('[data-th]').forEach((b) => b.onclick = () => { f.querySelector('#g-theme').value = b.dataset.th; sync(); });
    f.querySelectorAll('[data-type]').forEach((b) => b.onclick = () => {
      const t = ptype(b.dataset.type);
      if (t.premium && !ISK.isPremium()) return paywall('projekt');
      draft.type = b.dataset.type; f.querySelectorAll('[data-type]').forEach((x) => x.classList.toggle('on', x === b));
    });
    f.querySelectorAll('[data-area]').forEach((b) => b.onclick = () => {
      const id = b.dataset.area;
      draft.areas = draft.areas.includes(id) ? draft.areas.filter((x) => x !== id) : draft.areas.concat(id);
      b.classList.toggle('on');
    });
    f.onsubmit = async (e) => {
      e.preventDefault(); sync();
      if (!draft.theme.trim()) return toast('Napíšte tému.', 'err');
      if (!draft.areas.length) return toast('Vyberte aspoň jednu oblasť.', 'err');
      const out = v.querySelector('#genOut');
      out.innerHTML = loadingHtml(['Čítam ŠVP…', 'Vymýšľam motiváciu…', 'Skladám básničku…', 'Pripravujem pohybovú hru…', 'Dolaďujem priebeh…']);
      cycleLoading(out);
      const btn = f.querySelector('[type=submit]'); btn.disabled = true;
      try {
        const { result, source } = await ISK.ai.run('plan', { ...draft });
        const plan = savePlanDraft(result, source);
        lastResult = plan;
        out.innerHTML = planHtml(plan, true);
        bindPlanActions(out, plan);
        s.stats.plansGenerated++; ISK.save();
        ISK.unlock('first_plan'); if (s.stats.plansGenerated >= 5) ISK.unlock('plans5');
        if (source === 'template') toast('AI server nie je dostupný — použila som offline šablónu.');
        out.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (err) {
        if (err.quota) { out.innerHTML = quotaHtml(); out.querySelector('[data-upgrade]').onclick = () => paywall('quota'); }
        else { out.innerHTML = `<div class="card gen-empty"><h3>Niečo sa pokazilo</h3><p>${esc(err.message)}</p></div>`; }
      } finally { btn.disabled = false; updateTopQuota(); }
    };
    if (lastResult) bindPlanActions(v.querySelector('#genOut'), lastResult);
  };

  function updateTopQuota() { const q = document.querySelector('.quota'); if (q) q.textContent = `✨ ${ISK.aiLeft()}/${ISK.PLANS.free.aiPerMonth}`; }

  function savePlanDraft(r, source) {
    return Object.assign({
      id: ISK.uid(), createdAt: new Date().toISOString(), source,
      type: draft.type, theme: draft.theme, age: draft.age, duration: draft.duration, areas: draft.areas.slice(), saved: false,
    }, r);
  }

  function loadingHtml(msgs) {
    return `<div class="card loading"><div class="spark-loader"><i></i><i></i><i></i><span>✨</span></div><p class="load-msg" data-msgs='${esc(JSON.stringify(msgs))}'>${msgs[0]}</p><div class="skel"></div><div class="skel s2"></div><div class="skel s3"></div></div>`;
  }
  function cycleLoading(root) {
    const el = root.querySelector('.load-msg'); if (!el) return;
    const msgs = JSON.parse(el.dataset.msgs); let i = 0;
    const t = setInterval(() => { if (!document.body.contains(el)) return clearInterval(t); el.textContent = msgs[++i % msgs.length]; }, 1400);
  }
  function quotaHtml() {
    return `<div class="card gen-empty"><div class="float">🔋</div><h3>Mesačný limit AI je vyčerpaný</h3><p>Vo free verzii máte ${ISK.PLANS.free.aiPerMonth} AI generovaní mesačne. S Premium tvoríte bez obmedzení.</p><button class="btn gold" data-upgrade>👑 Odomknúť neobmedzene</button></div>`;
  }

  function planHtml(p, actions) {
    const areas = (p.areas || []).map((a) => `<span class="tag" style="--c:${area(a).color}">${area(a).icon} ${area(a).short}</span>`).join('');
    const steps = (p.steps || []).map((st, i) => `<li><span class="st-n">${i + 1}</span><div><b>${esc(st.title)}</b>${st.time ? `<em>${esc(st.time)}</em>` : ''}<p>${nl2br(st.text)}</p></div></li>`).join('');
    return `<article class="card plan" id="plan-${p.id}">
      <div class="plan-h">
        <div><span class="badge">${ptype(p.type).icon} ${ptype(p.type).name}</span>${p.source === 'ai' ? '<span class="badge ai">✨ AI</span>' : p.source === 'template' ? '<span class="badge">📄 Šablóna</span>' : '<span class="badge">💡 Inšpirácia</span>'}
        <h2>${esc(p.title)}</h2><p class="muted">${esc(p.summary || '')}</p>
        <div class="tags">${areas}${p.age ? `<span class="tag plain">👶 ${esc(p.age)}</span>` : ''}${p.duration ? `<span class="tag plain">⏱ ${esc(p.duration)}</span>` : ''}</div></div>
      </div>
      ${actions ? `<div class="plan-actions">
        <button class="btn sm" data-act="save">${p.saved ? '✔ Uložené' : '💾 Uložiť'}</button>
        <button class="btn sm soft" data-act="week">📅 Do plánu</button>
        <button class="btn sm soft" data-act="game">🎮 Hra k téme</button>
        <button class="btn sm soft" data-act="print">🖨️ Tlačiť</button>
        <button class="btn sm soft" data-act="copy">📋 Kopírovať</button>
        <button class="btn sm ghost" data-act="fav" aria-label="Obľúbené">${S().favorites.includes(p.id) ? '❤️' : '🤍'}</button>
      </div>` : ''}
      ${p.goals && p.goals.length ? `<h3>🎯 Ciele</h3><ul class="dots">${p.goals.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>` : ''}
      ${p.materials && p.materials.length ? `<h3>🧺 Pomôcky</h3><div class="mats">${p.materials.map((m) => `<span>${esc(m)}</span>`).join('')}</div>` : ''}
      ${p.motivation ? `<h3>🌟 Motivácia</h3><p>${nl2br(p.motivation)}</p>` : ''}
      ${steps ? `<h3>🪜 Priebeh</h3><ol class="steps">${steps}</ol>` : ''}
      ${p.poem && p.poem.text ? `<div class="poem"><h3>🎵 ${esc(p.poem.title || 'Básnička')}</h3><p>${nl2br(p.poem.text)}</p></div>` : ''}
      ${p.movementGame && p.movementGame.name ? `<h3>🏃 Pohybová hra: ${esc(p.movementGame.name)}</h3><p>${nl2br(p.movementGame.rules)}</p>` : ''}
      ${p.differentiation ? `<h3>🧩 Diferenciácia</h3><div class="diff"><div><b>Mladšie / pomalšie deti</b><p>${esc(p.differentiation.younger)}</p></div><div><b>Staršie / šikovnejšie deti</b><p>${esc(p.differentiation.older)}</p></div></div>` : ''}
      ${p.evaluation ? `<h3>📋 Hodnotenie</h3><p>${nl2br(p.evaluation)}</p>` : ''}
      ${p.parentTip ? `<div class="tip"><b>💌 Tip pre rodičov:</b> ${esc(p.parentTip)}</div>` : ''}
      ${!ISK.isPremium() ? '<p class="watermark">Vytvorené v aplikácii Iskrička · Prípravy Inšpirácie</p>' : ''}
    </article>`;
  }
  ISK.planHtml = planHtml;

  function bindPlanActions(root, p) {
    root.querySelectorAll('[data-act]').forEach((b) => b.onclick = () => planAction(b.dataset.act, p, b));
  }

  function planAction(act, p, b) {
    const s = S();
    if (act === 'save') {
      if (p.saved) return toast('Už je v knižnici.');
      if (!ISK.isPremium() && s.plans.length >= ISK.PLANS.free.libraryMax) return paywall('library');
      p.saved = true;
      if (!s.plans.find((x) => x.id === p.id)) s.plans.unshift(p);
      ISK.save(); b.textContent = '✔ Uložené'; toast('Uložené do knižnice 📚', 'ok'); ISK.track('plan_saved');
    }
    if (act === 'fav') {
      if (!s.plans.find((x) => x.id === p.id) && !ISK.INSPIRATIONS.find((x) => x.id === p.id)) { p.saved = true; s.plans.unshift(p); }
      s.favorites = s.favorites.includes(p.id) ? s.favorites.filter((x) => x !== p.id) : s.favorites.concat(p.id);
      ISK.save(); b.textContent = s.favorites.includes(p.id) ? '❤️' : '🤍';
    }
    if (act === 'week') addToWeekDialog({ title: p.title, type: p.type, text: p.summary, planId: p.id }, p);
    if (act === 'game') {
      const th = ISK.findTheme(p.theme);
      if (th) { gameSetId = th.id; ISK.go('hry'); }
      else { ISK.go('hry'); setTimeout(() => { const i = document.getElementById('aiSetInput'); if (i) { i.value = p.theme; i.focus(); } }, 50); }
    }
    if (act === 'print') printHtml(planHtml(p, false), p.title);
    if (act === 'copy') {
      navigator.clipboard.writeText(planToText(p)).then(() => toast('Skopírované do schránky 📋', 'ok'), () => toast('Kopírovanie zlyhalo', 'err'));
    }
    if (act === 'delete') {
      if (!confirm('Naozaj vymazať túto prípravu?')) return;
      s.plans = s.plans.filter((x) => x.id !== p.id); ISK.save(); closeModal(); ISK.go('kniznica'); toast('Vymazané');
    }
  }

  function planToText(p) {
    const L = [p.title, '', p.summary || ''];
    if (p.goals) L.push('', 'CIELE:', ...p.goals.map((g) => '• ' + g));
    if (p.materials) L.push('', 'POMÔCKY: ' + p.materials.join(', '));
    if (p.motivation) L.push('', 'MOTIVÁCIA:', p.motivation);
    if (p.steps) L.push('', 'PRIEBEH:', ...p.steps.map((s, i) => `${i + 1}. ${s.title}${s.time ? ' (' + s.time + ')' : ''} — ${s.text}`));
    if (p.poem && p.poem.text) L.push('', 'BÁSNIČKA:', p.poem.text);
    if (p.movementGame && p.movementGame.name) L.push('', 'POHYBOVÁ HRA: ' + p.movementGame.name, p.movementGame.rules);
    if (p.evaluation) L.push('', 'HODNOTENIE:', p.evaluation);
    return L.join('\n');
  }

  function printHtml(inner, title) {
    const w = window.open('', '_blank');
    if (!w) return toast('Povoľte vyskakovacie okná pre tlač.', 'err');
    const css = [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => `<link rel="stylesheet" href="${l.href}">`).join('');
    w.document.write(`<!doctype html><html lang="sk"><head><meta charset="utf-8"><title>${esc(title)}</title>${css}</head><body class="print-body">${inner}<script>setTimeout(()=>print(),600)<\/script></body></html>`);
    w.document.close();
    ISK.track('print');
  }

  /* ---------------- Hry ---------------- */
  let gameSetId = null;
  ROUTES.hry = function (v) {
    const s = S();
    gameSetId = gameSetId || suggestedTheme().id;
    const sets = ISK.allSets();
    v.innerHTML = `
      <div class="page-h"><h1>🎮 Hrací kútik</h1><p>Interaktívne hry pre deti na tablete, počítači alebo interaktívnej tabuli. Hlasové pokyny, veľké tlačidlá, žiadne reklamy.</p></div>
      <section class="card">
        <h3>1. Vyberte tematickú sadu</h3>
        <div class="sets">${sets.map((t) => `<button class="set ${gameSetId === t.id ? 'on' : ''}" data-set="${t.id}" style="--c:${t.color || '#9B5DE5'}"><span>${t.icon || '✨'}</span><b>${esc(t.name)}</b>${t.custom ? '<i>AI</i>' : ''}</button>`).join('')}</div>
        <form class="ai-set" id="aiSet">
          <span>🪄</span><input id="aiSetInput" placeholder="Vlastná téma pre AI — napr. Hasiči, Dinosaury, Moje telo…" maxlength="60">
          <button class="btn sm" type="submit">Vytvoriť sadu${ISK.isPremium() ? '' : ' 👑'}</button>
        </form>
      </section>
      <section>
        <h3 class="sec-t">2. Vyberte hru</h3>
        <div class="games">${ISK.GAMES.map((g) => {
          const ok = ISK.canPlay(g.id);
          const plays = s.children.reduce((n, k) => n + ((k.games || {})[g.id] ? k.games[g.id].plays : 0), 0);
          return `<button class="game ${ok ? '' : 'locked'}" data-game="${g.id}" style="--c:${g.color}">
            <span class="g-ic">${g.icon}</span><b>${g.name}</b><p>${g.desc}</p>
            <div class="g-meta"><span class="tag" style="--c:${area(g.area).color}">${g.skill}</span>${plays ? `<small>${plays}× hrané</small>` : ''}</div>
            ${ok ? '<em class="g-play">▶ Hrať</em>' : '<em class="g-lock">👑 Premium</em>'}</button>`;
        }).join('')}</div>
      </section>
      <section class="card tipbox"><b>💡 Tip pre učiteľku:</b> hru ukončíte <b>podržaním ✕</b> na 1 sekundu — deti ju tak omylom nezavrú. Náročnosť sa nastavuje podľa veku triedy (${esc((ISK.AGES.find((a) => a.id === s.profile.age) || {}).name || '')}), zmeniť ju môžete v profile.</section>`;

    v.querySelectorAll('[data-set]').forEach((b) => b.onclick = () => { gameSetId = b.dataset.set; v.querySelectorAll('[data-set]').forEach((x) => x.classList.toggle('on', x === b)); });
    v.querySelectorAll('[data-game]').forEach((b) => b.onclick = () => ISK.games.open(b.dataset.game, gameSetId));
    v.querySelector('#aiSet').onsubmit = async (e) => {
      e.preventDefault();
      if (!ISK.isPremium()) return paywall('aiset');
      const theme = v.querySelector('#aiSetInput').value.trim();
      if (!theme) return toast('Napíšte tému.', 'err');
      const btn = e.target.querySelector('button'); btn.disabled = true; btn.textContent = '🪄 Čarujem…';
      try {
        const { result, source } = await ISK.ai.run('game', { theme });
        const items = (result.items || []).filter((x) => Array.isArray(x) ? x[0] && x[1] : x.emoji && x.word).map((x) => Array.isArray(x) ? [x[0], String(x[1]).toLowerCase()] : [x.emoji, String(x.word).toLowerCase()]);
        if (items.length < 6) throw new Error('Málo položiek, skúste inú tému.');
        const set = { id: 'ai-' + ISK.uid(), name: result.name || theme, icon: result.icon || items[0][0], color: '#9B5DE5', items: items.slice(0, 12), custom: true };
        s.gameSets.unshift(set); s.gameSets = s.gameSets.slice(0, 20); gameSetId = set.id; ISK.save();
        toast(source === 'ai' ? `Sada „${set.name}“ je pripravená ✨` : (result.note || 'Vytvorené zo šablóny'), 'ok');
        ISK.track('ai_set_created');
        route();
      } catch (err) {
        if (err.quota) paywall('quota'); else toast(err.message, 'err');
        btn.disabled = false; btn.textContent = 'Vytvoriť sadu';
      }
    };
  };

  /* ---------------- Týždenný plán ---------------- */
  let weekOffset = 0;
  ROUTES.tyzden = function (v) {
    const s = S();
    const mon = ISK.mondayOf(new Date(Date.now() + weekOffset * 7 * 864e5));
    const key = ISK.weekKey(mon);
    const wk = ISK.getWeek(key);
    const fri = new Date(mon); fri.setDate(mon.getDate() + 4);
    const fmt = (d) => d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric' });
    const tdk = weekOffset === 0 ? ISK.todayDayKey() : null;
    v.innerHTML = `
      <div class="page-h row"><div><h1>📅 Týždenný plán</h1><p>Presúvajte aktivity ťahaním, odškrtávajte hotové a pošlite rodičom zhrnutie.</p></div>
        <div class="wk-nav"><button class="btn sm ghost" data-w="-1" aria-label="Predchádzajúci týždeň">←</button><b>${fmt(mon)} – ${fmt(fri)}</b><button class="btn sm ghost" data-w="1" aria-label="Ďalší týždeň">→</button>${weekOffset ? '<button class="btn sm soft" data-w="0">Dnes</button>' : ''}</div></div>
      <section class="card wk-bar">
        <label class="wk-theme">Téma týždňa<input id="wkTheme" value="${esc(wk.theme)}" placeholder="napr. Jeseň v lese"></label>
        <div class="btnrow">
          <button class="btn" id="wkAi">🪄 AI naplniť týždeň${ISK.isPremium() ? '' : ' 👑'}</button>
          <button class="btn soft" id="wkParents">💌 Správa rodičom${ISK.isPremium() ? '' : ' 👑'}</button>
          <button class="btn soft" id="wkPrint">🖨️ Tlačiť</button>
        </div>
      </section>
      <div class="week">${ISK.DAYS.map(([k, name], i) => {
        const d = new Date(mon); d.setDate(mon.getDate() + i);
        return `<section class="day ${tdk === k ? 'today' : ''}" data-day="${k}">
          <header><b>${name}</b><small>${fmt(d)}</small></header>
          <div class="day-list">${wk.days[k].map((a) => `<div class="act ${a.done ? 'done' : ''}" draggable="true" data-id="${a.id}" style="--c:${typeColor(a.type)}">
            <button class="tick" data-tick="${a.id}" aria-label="Hotovo">${a.done ? '✔' : ''}</button>
            <div class="act-b" data-open="${a.id}"><b>${ptype(a.type).icon} ${esc(a.title)}</b>${a.text ? `<small>${esc(a.text)}</small>` : ''}</div>
            <button class="act-x" data-del="${a.id}" aria-label="Odstrániť">✕</button></div>`).join('')}</div>
          <button class="add-act" data-add="${k}">+ Pridať</button></section>`;
      }).join('')}</div>`;

    v.querySelectorAll('[data-w]').forEach((b) => b.onclick = () => { weekOffset = +b.dataset.w === 0 ? 0 : weekOffset + +b.dataset.w; route(); });
    v.querySelector('#wkTheme').onchange = (e) => { wk.theme = e.target.value.trim(); ISK.save(); };
    const find = (id) => { for (const k in wk.days) { const a = wk.days[k].find((x) => x.id === id); if (a) return [k, a]; } return []; };
    v.querySelectorAll('[data-tick]').forEach((b) => b.onclick = () => { const [, a] = find(b.dataset.tick); a.done = !a.done; ISK.save(); if (a.done) ISK.games.sfx.ok(); route(); });
    v.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => { const [k] = find(b.dataset.del); wk.days[k] = wk.days[k].filter((x) => x.id !== b.dataset.del); ISK.save(); route(); });
    v.querySelectorAll('[data-open]').forEach((b) => b.onclick = () => {
      const [, a] = find(b.dataset.open);
      const plan = a.planId && (s.plans.find((p) => p.id === a.planId) || ISK.INSPIRATIONS.find((p) => p.id === a.planId));
      if (plan) openPlan(plan); else editActivity(wk, a);
    });
    v.querySelectorAll('[data-add]').forEach((b) => b.onclick = () => addActivityDialog(wk, b.dataset.add));

    // Drag & drop medzi dňami
    let dragId = null;
    v.querySelectorAll('.act').forEach((el) => {
      el.addEventListener('dragstart', (e) => { dragId = el.dataset.id; el.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
      el.addEventListener('dragend', () => el.classList.remove('dragging'));
    });
    v.querySelectorAll('.day').forEach((day) => {
      day.addEventListener('dragover', (e) => { e.preventDefault(); day.classList.add('over'); });
      day.addEventListener('dragleave', () => day.classList.remove('over'));
      day.addEventListener('drop', (e) => {
        e.preventDefault(); day.classList.remove('over');
        const [from, a] = find(dragId); if (!a) return;
        wk.days[from] = wk.days[from].filter((x) => x.id !== dragId);
        wk.days[day.dataset.day].push(a); ISK.save(); route();
      });
    });

    v.querySelector('#wkPrint').onclick = () => printHtml(`<h1>Týždenný plán ${fmt(mon)} – ${fmt(fri)}</h1>${wk.theme ? `<h2>Téma: ${esc(wk.theme)}</h2>` : ''}<table class="print-week"><tr>${ISK.DAYS.map(([, n]) => `<th>${n}</th>`).join('')}</tr><tr>${ISK.DAYS.map(([k]) => `<td>${wk.days[k].map((a) => `<p><b>${esc(a.title)}</b><br><small>${esc(a.text || '')}</small></p>`).join('')}</td>`).join('')}</tr></table>`, 'Týždenný plán');

    v.querySelector('#wkAi').onclick = async (e) => {
      if (!ISK.isPremium()) return paywall('week');
      const theme = v.querySelector('#wkTheme').value.trim() || suggestedTheme().name;
      const hasAny = ISK.DAYS.some(([k]) => wk.days[k].length);
      if (hasAny && !confirm('AI pridá aktivity ku existujúcemu plánu. Pokračovať?')) return;
      const btn = e.currentTarget; btn.disabled = true; btn.textContent = '🪄 Plánujem týždeň…';
      try {
        const { result } = await ISK.ai.run('week', { theme, age: s.profile.age, focus: s.profile.focus });
        wk.theme = result.theme || theme;
        (result.days || []).forEach((d, i) => {
          const k = (ISK.DAYS[i] || [])[0]; if (!k) return;
          (d.activities || []).forEach((a) => wk.days[k].push({ id: ISK.uid(), title: a.title, type: a.type || 'denna', text: a.text || '', done: false }));
        });
        ISK.save(); checkWeekFull(wk); toast('Týždeň je naplánovaný ✨', 'ok'); route();
      } catch (err) { if (err.quota) paywall('quota'); else toast(err.message, 'err'); btn.disabled = false; }
    };

    v.querySelector('#wkParents').onclick = async (e) => {
      if (!ISK.isPremium()) return paywall('parents');
      const acts = ISK.DAYS.flatMap(([k]) => wk.days[k].map((a) => a.title));
      const btn = e.currentTarget; btn.disabled = true; btn.textContent = '💌 Píšem…';
      try {
        const { result } = await ISK.ai.run('parents', { theme: wk.theme, activities: acts });
        const m = modal(`<h2>💌 Správa pre rodičov</h2>
          <label>Predmet<input id="pmS" value="${esc(result.subject)}"></label>
          <label>Text<textarea id="pmB" rows="14">${esc(result.body)}</textarea></label>
          <div class="btnrow"><button class="btn" id="pmCopy">📋 Kopírovať</button><a class="btn soft" id="pmMail">✉️ Otvoriť v e-maile</a><button class="btn soft" id="pmPrint">🖨️ Tlačiť na nástenku</button></div>`, { cls: 'wide', noFocus: true });
        const get = () => [m.querySelector('#pmS').value, m.querySelector('#pmB').value];
        m.querySelector('#pmCopy').onclick = () => { const [a, b] = get(); navigator.clipboard.writeText(a + '\n\n' + b).then(() => toast('Skopírované', 'ok')); };
        m.querySelector('#pmMail').onclick = () => { const [a, b] = get(); location.href = `mailto:?subject=${encodeURIComponent(a)}&body=${encodeURIComponent(b)}`; };
        m.querySelector('#pmPrint').onclick = () => { const [a, b] = get(); printHtml(`<article class="card plan"><h2>${esc(a)}</h2><p>${nl2br(b)}</p></article>`, a); };
        ISK.track('parents_letter');
      } catch (err) { if (err.quota) paywall('quota'); else toast(err.message, 'err'); }
      btn.disabled = false; btn.textContent = '💌 Správa rodičom';
    };
  };

  function typeColor(t) { return { kruh: '#FFC93C', pohyb: '#00BBD3', vytvarna: '#9B5DE5', projekt: '#3DBE8B' }[t] || '#FF6B6B'; }
  function checkWeekFull(wk) { if (ISK.DAYS.every(([k]) => wk.days[k].length)) ISK.unlock('week_full'); }

  function addActivityDialog(wk, dayKey) {
    const s = S();
    const items = s.plans.slice(0, 20).concat(ISK.INSPIRATIONS);
    const m = modal(`<h2>Pridať aktivitu — ${ISK.DAYS.find((d) => d[0] === dayKey)[1]}</h2>
      <form id="qa"><label>Názov<input id="qaT" required placeholder="napr. Pohybová hra Na sochy"></label>
      <div class="row2"><label>Typ<select id="qaY">${ISK.PLAN_TYPES.map((t) => `<option value="${t.id}">${t.icon} ${t.name}</option>`).join('')}</select></label>
      <label>Poznámka<input id="qaN" placeholder="nepovinné"></label></div>
      <button class="btn wide">Pridať</button></form>
      <h3 class="mt">…alebo z knižnice</h3>
      <div class="pick-list">${items.map((p) => `<button data-pid="${p.id}"><span>${ptype(p.type).icon}</span><b>${esc(p.title)}</b></button>`).join('')}</div>`);
    m.querySelector('#qa').onsubmit = (e) => {
      e.preventDefault();
      wk.days[dayKey].push({ id: ISK.uid(), title: m.querySelector('#qaT').value.trim(), type: m.querySelector('#qaY').value, text: m.querySelector('#qaN').value.trim(), done: false });
      ISK.save(); checkWeekFull(wk); closeModal(); route();
    };
    m.querySelectorAll('[data-pid]').forEach((b) => b.onclick = () => {
      const p = items.find((x) => x.id === b.dataset.pid);
      wk.days[dayKey].push({ id: ISK.uid(), title: p.title, type: p.type, text: p.summary || '', planId: p.id, done: false });
      ISK.save(); checkWeekFull(wk); closeModal(); route();
    });
  }

  function editActivity(wk, a) {
    const m = modal(`<h2>Upraviť aktivitu</h2><form id="ea">
      <label>Názov<input id="eaT" value="${esc(a.title)}" required></label>
      <label>Typ<select id="eaY">${ISK.PLAN_TYPES.map((t) => `<option value="${t.id}" ${a.type === t.id ? 'selected' : ''}>${t.icon} ${t.name}</option>`).join('')}</select></label>
      <label>Popis<textarea id="eaN" rows="4">${esc(a.text || '')}</textarea></label>
      <div class="btnrow"><button class="btn">Uložiť</button><button type="button" class="btn soft" id="eaGen">✨ Rozpracovať v AI</button></div></form>`);
    m.querySelector('#ea').onsubmit = (e) => { e.preventDefault(); a.title = m.querySelector('#eaT').value; a.type = m.querySelector('#eaY').value; a.text = m.querySelector('#eaN').value; ISK.save(); closeModal(); route(); };
    m.querySelector('#eaGen').onclick = () => { draft.theme = a.title.replace(/^[^:]+:\s*/, ''); draft.type = a.type === 'projekt' ? 'denna' : a.type; closeModal(); ISK.go('pripravy'); };
  }

  function addToWeekDialog(item, plan) {
    const mon = ISK.mondayOf(new Date());
    const m = modal(`<h2>📅 Pridať do plánu</h2><p class="muted">${esc(item.title)}</p>
      <label>Týždeň<select id="awW"><option value="0">Tento týždeň</option><option value="1">Budúci týždeň</option></select></label>
      <div class="day-pick">${ISK.DAYS.map(([k, n]) => `<button class="btn soft" data-d="${k}">${n}</button>`).join('')}</div>`, { noFocus: true });
    m.querySelectorAll('[data-d]').forEach((b) => b.onclick = () => {
      const w = +m.querySelector('#awW').value;
      const key = ISK.weekKey(new Date(mon.getTime() + w * 7 * 864e5));
      const wk = ISK.getWeek(key);
      if (plan && !S().plans.find((x) => x.id === plan.id) && !ISK.INSPIRATIONS.find((x) => x.id === plan.id)) { plan.saved = true; S().plans.unshift(plan); }
      wk.days[b.dataset.d].push(Object.assign({ id: ISK.uid(), done: false }, item));
      if (!wk.theme && plan && plan.theme) wk.theme = plan.theme;
      ISK.save(); checkWeekFull(wk); closeModal(); toast('Pridané do plánu 📅', 'ok'); ISK.track('added_to_week');
    });
  }

  /* ---------------- Trieda ---------------- */
  const KID_COLORS = ['#FF6B6B', '#FFC93C', '#4ECDC4', '#5B8DEF', '#9B5DE5', '#3DBE8B', '#F4A261', '#F472B6'];
  ROUTES.trieda = function (v, rest) {
    const s = S();
    if (rest && rest[0]) { const kid = s.children.find((k) => k.id === rest[0]); if (kid) return childDetail(v, kid); }
    v.innerHTML = `
      <div class="page-h row"><div><h1>👧 ${esc(s.profile.className || 'Moja trieda')}</h1><p>Deti, pozorovania a pokroky z hier na jednom mieste. Údaje zostávajú vo vašom zariadení.</p></div>
        <div class="btnrow"><button class="btn" id="addKid">+ Pridať dieťa</button><button class="btn soft" id="addMany">📋 Hromadne</button></div></div>
      ${s.children.length ? `<div class="kids">${s.children.map((k) => {
        const plays = Object.values(k.games || {}).reduce((n, g) => n + g.plays, 0);
        const stars = Object.values(k.games || {}).reduce((n, g) => n + g.stars, 0);
        return `<a class="kid" href="#/trieda/${k.id}" style="--c:${k.color}"><span class="kid-av big">${k.avatar}</span><b>${esc(k.name)}</b>
          <small>${plays} hier · ${stars} ⭐ · ${(k.observations || []).length} 📝</small></a>`;
      }).join('')}</div>` : `<div class="card empty big"><span>🧒</span><h3>Trieda je zatiaľ prázdna</h3><p>Pridajte deti (stačí krstné meno alebo prezývka). V hrách si potom vyberú svoje zvieratko a Iskrička zaznamená ich pokrok.</p><button class="btn" id="addKid2">+ Pridať prvé dieťa</button></div>`}`;
    const add = () => kidDialog();
    v.querySelector('#addKid').onclick = add;
    const a2 = v.querySelector('#addKid2'); if (a2) a2.onclick = add;
    v.querySelector('#addMany').onclick = () => {
      const m = modal(`<h2>📋 Hromadné pridanie</h2><p class="muted">Jedno meno na riadok. Zvieratká a farby priradíme automaticky.</p><textarea id="many" rows="10" placeholder="Ema\nJakub\nSofia"></textarea><button class="btn wide" id="manyGo">Pridať deti</button>`);
      m.querySelector('#manyGo').onclick = () => {
        const names = m.querySelector('#many').value.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 40);
        names.forEach((n) => s.children.push(newKid(n)));
        ISK.save(); closeModal(); if (s.children.length >= 10) ISK.unlock('class10'); toast(`Pridaných ${names.length} detí`, 'ok'); route();
      };
    };
  };

  function newKid(name) {
    const s = S(); const i = s.children.length;
    const used = s.children.map((k) => k.avatar);
    const av = ISK.AVATARS.find((a) => !used.includes(a)) || ISK.AVATARS[i % ISK.AVATARS.length];
    return { id: ISK.uid(), name, avatar: av, color: KID_COLORS[i % KID_COLORS.length], observations: [], games: {}, createdAt: new Date().toISOString() };
  }

  function kidDialog(kid) {
    const s = S();
    const k = kid || newKid('');
    const m = modal(`<h2>${kid ? 'Upraviť dieťa' : 'Nové dieťa'}</h2><form id="kd">
      <label>Meno alebo prezývka<input id="kdN" value="${esc(k.name)}" required maxlength="30"></label>
      <label>Zvieratko</label><div class="av-pick">${ISK.AVATARS.map((a) => `<button type="button" class="${k.avatar === a ? 'on' : ''}" data-av="${a}">${a}</button>`).join('')}</div>
      <label>Farba</label><div class="col-pick">${KID_COLORS.map((c) => `<button type="button" class="${k.color === c ? 'on' : ''}" data-col="${c}" style="background:${c}" aria-label="farba"></button>`).join('')}</div>
      <button class="btn wide">${kid ? 'Uložiť' : 'Pridať do triedy'}</button></form>`);
    m.querySelectorAll('[data-av]').forEach((b) => b.onclick = () => { k.avatar = b.dataset.av; m.querySelectorAll('[data-av]').forEach((x) => x.classList.toggle('on', x === b)); });
    m.querySelectorAll('[data-col]').forEach((b) => b.onclick = () => { k.color = b.dataset.col; m.querySelectorAll('[data-col]').forEach((x) => x.classList.toggle('on', x === b)); });
    m.querySelector('#kd').onsubmit = (e) => {
      e.preventDefault(); k.name = m.querySelector('#kdN').value.trim();
      if (!kid) s.children.push(k);
      ISK.save(); closeModal(); if (s.children.length >= 10) ISK.unlock('class10'); ISK.track('child_saved'); route();
    };
  }

  function childDetail(v, k) {
    const s = S();
    const games = ISK.GAMES.map((g) => ({ g, r: (k.games || {})[g.id] }));
    const byArea = {};
    (k.observations || []).forEach((o) => { byArea[o.area] = (byArea[o.area] || 0) + 1; });
    v.innerHTML = `
      <a class="back" href="#/trieda">← Trieda</a>
      <div class="kid-head" style="--c:${k.color}"><span class="kid-av huge">${k.avatar}</span><div><h1>${esc(k.name)}</h1><p class="muted">V triede od ${fmtDate(k.createdAt)}</p></div>
        <div class="btnrow"><button class="btn soft sm" id="kEdit">✏️ Upraviť</button><button class="btn soft sm" id="kPlay">🎮 Hrať</button><button class="btn sm" id="kReport">💌 Zhrnutie pre rodiča${ISK.isPremium() ? '' : ' 👑'}</button></div></div>
      <div class="grid2">
        <section class="card"><h2>🎮 Pokrok v hrách</h2>
          <div class="prog">${games.map(({ g, r }) => `<div class="prog-row"><span>${g.icon} ${g.name}</span><div class="bar"><i style="width:${r ? Math.round((r.stars / (r.plays * 3)) * 100) : 0}%;background:${g.color}"></i></div><small>${r ? `${r.plays}× · ${'⭐'.repeat(r.best)}` : '—'}</small></div>`).join('')}</div>
        </section>
        <section class="card"><h2>📝 Pozorovania</h2>
          <form id="obs" class="obs-form"><select id="obA">${ISK.AREAS.map((a) => `<option value="${a.id}">${a.icon} ${a.short}</option>`).join('')}</select>
          <input id="obT" placeholder="napr. Dnes samostatne spočítala do 10" required maxlength="300"><button class="btn sm">Zapísať</button></form>
          <div class="area-dots">${ISK.AREAS.map((a) => `<span title="${a.name}" style="--c:${a.color};opacity:${byArea[a.id] ? 1 : 0.25}">${a.icon} ${byArea[a.id] || 0}</span>`).join('')}</div>
          <ul class="obs-list">${(k.observations || []).map((o) => `<li><span class="tag" style="--c:${area(o.area).color}">${area(o.area).icon}</span><div><p>${esc(o.text)}</p><small>${fmtDate(o.date)}</small></div><button data-od="${o.id}" aria-label="Zmazať">✕</button></li>`).join('') || '<li class="muted">Zatiaľ žiadne pozorovania.</li>'}</ul>
        </section>
      </div>
      <button class="btn ghost danger" id="kDel">Odstrániť dieťa z triedy</button>`;
    v.querySelector('#kEdit').onclick = () => kidDialog(k);
    v.querySelector('#kPlay').onclick = () => ISK.go('hry');
    v.querySelector('#obs').onsubmit = (e) => {
      e.preventDefault();
      k.observations = k.observations || [];
      k.observations.unshift({ id: ISK.uid(), area: v.querySelector('#obA').value, text: v.querySelector('#obT').value.trim(), date: new Date().toISOString() });
      s.stats.observations++; ISK.save(); if (s.stats.observations >= 10) ISK.unlock('observer'); ISK.track('observation'); route();
    };
    v.querySelectorAll('[data-od]').forEach((b) => b.onclick = () => { k.observations = k.observations.filter((o) => o.id !== b.dataset.od); ISK.save(); route(); });
    v.querySelector('#kDel').onclick = () => { if (confirm(`Naozaj odstrániť ${k.name}?`)) { s.children = s.children.filter((x) => x.id !== k.id); ISK.save(); ISK.go('trieda'); } };
    v.querySelector('#kReport').onclick = async (e) => {
      if (!ISK.isPremium()) return paywall('report');
      const btn = e.currentTarget; btn.disabled = true; btn.textContent = '💌 Píšem…';
      try {
        const child = { name: k.name, observations: (k.observations || []).slice(0, 15).map((o) => ({ area: area(o.area).name, text: o.text, date: o.date.slice(0, 10) })), games: k.games };
        const { result } = await ISK.ai.run('child', { child });
        const text = typeof result === 'string' ? result : result.text;
        const m = modal(`<h2>💌 Zhrnutie: ${esc(k.name)}</h2><textarea id="crT" rows="14">${esc(text)}</textarea><div class="btnrow"><button class="btn" id="crC">📋 Kopírovať</button><button class="btn soft" id="crP">🖨️ Tlačiť</button></div>`, { cls: 'wide', noFocus: true });
        m.querySelector('#crC').onclick = () => navigator.clipboard.writeText(m.querySelector('#crT').value).then(() => toast('Skopírované', 'ok'));
        m.querySelector('#crP').onclick = () => printHtml(`<article class="card plan"><h2>${esc(k.avatar + ' ' + k.name)}</h2><p>${nl2br(m.querySelector('#crT').value)}</p></article>`, k.name);
      } catch (err) { if (err.quota) paywall('quota'); else toast(err.message, 'err'); }
      btn.disabled = false; btn.textContent = '💌 Zhrnutie pre rodiča';
    };
  }

  /* ---------------- Knižnica ---------------- */
  let libFilter = { q: '', type: '', tab: 'moje' };
  ROUTES.kniznica = function (v, rest) {
    const s = S();
    if (rest && rest[0]) {
      const p = s.plans.find((x) => x.id === rest[0]) || ISK.INSPIRATIONS.find((x) => x.id === rest[0]);
      if (p) setTimeout(() => openPlan(p), 0);
    }
    const src = libFilter.tab === 'moje' ? s.plans : libFilter.tab === 'oblubene' ? s.plans.concat(ISK.INSPIRATIONS).filter((p) => s.favorites.includes(p.id)) : ISK.INSPIRATIONS;
    const q = libFilter.q.toLowerCase();
    const list = src.filter((p) => (!libFilter.type || p.type === libFilter.type) && (!q || (p.title + ' ' + (p.theme || '') + ' ' + (p.summary || '')).toLowerCase().includes(q)));
    v.innerHTML = `
      <div class="page-h"><h1>📚 Knižnica</h1><p>Vaše uložené prípravy a overené inšpirácie od Prípravy Inšpirácie.</p></div>
      <div class="lib-bar">
        <div class="tabs">${[['moje', `Moje (${s.plans.length}${ISK.isPremium() ? '' : '/' + ISK.PLANS.free.libraryMax})`], ['inspiracie', `Inšpirácie (${ISK.INSPIRATIONS.length})`], ['oblubene', `❤️ Obľúbené (${s.favorites.length})`]].map(([id, l]) => `<button class="${libFilter.tab === id ? 'on' : ''}" data-tab="${id}">${l}</button>`).join('')}</div>
        <input id="libQ" type="search" placeholder="🔍 Hľadať…" value="${esc(libFilter.q)}">
        <select id="libT"><option value="">Všetky typy</option>${ISK.PLAN_TYPES.map((t) => `<option value="${t.id}" ${libFilter.type === t.id ? 'selected' : ''}>${t.icon} ${t.name}</option>`).join('')}</select>
      </div>
      ${list.length ? `<div class="lib">${list.map((p) => `<button class="lib-item" data-pid="${p.id}" style="--c:${typeColor(p.type)}">
        <span class="lib-ic">${ptype(p.type).icon}</span><b>${esc(p.title)}</b><p>${esc(p.summary || '')}</p>
        <div class="tags">${(p.areas || []).slice(0, 3).map((a) => `<span class="tag" style="--c:${area(a).color}">${area(a).icon} ${area(a).short}</span>`).join('')}${s.favorites.includes(p.id) ? '<span>❤️</span>' : ''}</div>
        ${p.createdAt ? `<small>${fmtDate(p.createdAt)}</small>` : ''}</button>`).join('')}</div>`
        : `<div class="card empty big"><span>📭</span><h3>${libFilter.tab === 'moje' ? 'Zatiaľ nemáte uložené prípravy' : 'Nič sme nenašli'}</h3><p>${libFilter.tab === 'moje' ? 'Vygenerujte prvú prípravu a uložte ju jedným klikom.' : 'Skúste iný filter.'}</p>${libFilter.tab === 'moje' ? `<button class="btn" onclick="ISK.go('pripravy')">✨ Vytvoriť prípravu</button>` : ''}</div>`}`;
    v.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { libFilter.tab = b.dataset.tab; route(); });
    const qi = v.querySelector('#libQ');
    qi.oninput = () => { libFilter.q = qi.value; clearTimeout(qi._t); qi._t = setTimeout(() => { route(); const n = document.getElementById('libQ'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); };
    v.querySelector('#libT').onchange = (e) => { libFilter.type = e.target.value; route(); };
    v.querySelectorAll('[data-pid]').forEach((b) => b.onclick = () => openPlan(src.find((x) => x.id === b.dataset.pid)));
  };

  function openPlan(p) {
    const own = S().plans.find((x) => x.id === p.id);
    const m = modal(planHtml(p, true) + (own ? '<button class="btn ghost danger sm" data-act="delete">🗑️ Vymazať</button>' : ''), { cls: 'wide', noFocus: true });
    if (!own) { const sv = m.querySelector('[data-act=save]'); if (sv) sv.textContent = '💾 Uložiť kópiu'; }
    m.querySelectorAll('[data-act]').forEach((b) => b.onclick = () => {
      if (b.dataset.act === 'save' && !own) {
        const copy = Object.assign({}, p, { id: ISK.uid(), createdAt: new Date().toISOString(), source: 'inspiration', saved: false });
        return planAction('save', copy, b);
      }
      planAction(b.dataset.act, p, b);
    });
  }

  /* ---------------- AI asistent (chat) ---------------- */
  ROUTES.asistent = function (v) {
    const s = S();
    const starters = ['Vymysli básničku o ježkovi', 'Pohybová hra do malej triedy', 'Ako upokojiť nepokojnú triedu?', 'Ako napísať rodičom o hryzení?', 'Nápady na pobyt vonku v daždi'];
    v.innerHTML = `
      <div class="page-h"><h1>💬 Asistentka Iskrička</h1><p>Pýtajte sa na čokoľvek z praxe v MŠ — nápady, básničky, riešenie situácií, komunikácia s rodičmi.</p></div>
      <section class="chat card">
        <div class="chat-log" id="chatLog">${s.chat.length ? s.chat.map(msgHtml).join('') : `<div class="chat-hello"><div class="float">🧚</div><p>Ahoj, som Iskrička! S čím vám dnes pomôžem?</p><div class="chips">${starters.map((x) => `<button class="chip" data-st="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>`}</div>
        <form class="chat-in" id="chatForm"><textarea id="chatQ" rows="1" placeholder="Napíšte otázku…" maxlength="1000"></textarea><button class="btn" aria-label="Odoslať">➤</button></form>
        <div class="chat-foot">${s.chat.length ? '<button class="linkbtn" id="chatClear">Vymazať konverzáciu</button>' : ''}<small>${ISK.isPremium() ? '👑 Neobmedzene' : `Každá otázka = 1 AI generovanie (zostáva ${ISK.aiLeft()})`}</small></div>
      </section>`;
    const log = v.querySelector('#chatLog');
    log.scrollTop = log.scrollHeight;
    const ta = v.querySelector('#chatQ');
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); v.querySelector('#chatForm').requestSubmit(); } });
    v.querySelectorAll('[data-st]').forEach((b) => b.onclick = () => { ta.value = b.dataset.st; v.querySelector('#chatForm').requestSubmit(); });
    const clr = v.querySelector('#chatClear'); if (clr) clr.onclick = () => { s.chat = []; ISK.save(); route(); };
    v.querySelector('#chatForm').onsubmit = async (e) => {
      e.preventDefault();
      const q = ta.value.trim(); if (!q) return;
      ta.value = '';
      s.chat.push({ role: 'user', text: q });
      if (!log.querySelector('.msg')) log.innerHTML = '';
      log.insertAdjacentHTML('beforeend', msgHtml({ role: 'user', text: q }) + '<div class="msg bot typing"><span></span><span></span><span></span></div>');
      log.scrollTop = log.scrollHeight;
      try {
        const { result } = await ISK.ai.run('chat', { message: q, history: s.chat.slice(-10, -1) });
        const text = typeof result === 'string' ? result : result.text;
        s.chat.push({ role: 'bot', text });
        s.chat = s.chat.slice(-40); ISK.save();
        log.querySelector('.typing').outerHTML = msgHtml({ role: 'bot', text });
      } catch (err) {
        s.chat.pop(); ISK.save();
        log.querySelector('.typing').remove();
        if (err.quota) paywall('quota'); else toast(err.message, 'err');
      }
      log.scrollTop = log.scrollHeight; updateTopQuota();
    };
  };
  function msgHtml(m) {
    const t = esc(m.text).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
    return `<div class="msg ${m.role === 'user' ? 'me' : 'bot'}">${m.role === 'user' ? '' : '<span class="msg-av">🧚</span>'}<div>${t}</div></div>`;
  }

  /* ---------------- Profil, predplatné, nastavenia ---------------- */
  ROUTES.profil = function (v) {
    const s = S(), p = s.profile, st = s.settings;
    const prem = ISK.isPremium();
    v.innerHTML = `
      <div class="page-h"><h1>⚙️ Profil a nastavenia</h1></div>
      <div class="grid2">
        <section class="card plan-card ${prem ? 'prem' : ''}">
          <h2>${prem ? '👑 Iskrička Premium' : '🌱 Free plán'}</h2>
          ${prem ? `<p>Ďakujeme, že podporujete Iskričku! ${s.premiumUntil ? `Aktívne do <b>${fmtDate(s.premiumUntil)}</b>.` : ''} ${s.billing === 'trial' ? '(skúšobná verzia)' : ''}</p>`
            : `<div class="meter"><i style="width:${(1 - ISK.aiLeft() / ISK.PLANS.free.aiPerMonth) * 100}%"></i></div><p>${ISK.PLANS.free.aiPerMonth - ISK.aiLeft()} z ${ISK.PLANS.free.aiPerMonth} AI generovaní tento mesiac · ${s.plans.length}/${ISK.PLANS.free.libraryMax} v knižnici · 3 zo 7 hier</p>
            <button class="btn gold" data-upgrade>👑 Prejsť na Premium</button>`}
        </section>
        <section class="card">
          <h2>🏅 Odznaky</h2>
          <div class="badges">${ISK.ACHIEVEMENTS.map((a) => `<div class="bdg ${s.achievements[a.id] ? 'on' : ''}" title="${esc(a.desc)}"><span>${a.icon}</span><small>${a.name}</small></div>`).join('')}</div>
          <p class="muted">Najdlhšia séria: ${s.streak.best} dní 🔥</p>
        </section>
      </div>
      <div class="grid2">
        <form class="card" id="profF"><h2>👤 Profil</h2>
          <label>Meno<input id="pfN" value="${esc(p.name)}" required></label>
          <label>E-mail<input id="pfE" type="email" value="${esc(p.email)}" required></label>
          <div class="row2"><label>Škola<input id="pfS" value="${esc(p.school || '')}"></label><label>Trieda<input id="pfC" value="${esc(p.className || '')}"></label></div>
          <label>Vek detí<select id="pfA">${ISK.AGES.map((a) => `<option value="${a.id}" ${p.age === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}</select></label>
          <button class="btn">Uložiť profil</button></form>
        <form class="card" id="setF"><h2>🔔 Upozornenia a zvuky</h2>
          <label class="switch"><input type="checkbox" id="stD" ${st.dailyReminder ? 'checked' : ''}><span></span> Ranný prehľad dňa o <input type="time" id="stT" value="${st.reminderTime}"></label>
          <label class="switch"><input type="checkbox" id="stW" ${st.weeklyReminder ? 'checked' : ''}><span></span> Nedeľná pripomienka plánovania týždňa</label>
          <label class="switch"><input type="checkbox" id="stG" ${st.gameReminder ? 'checked' : ''}><span></span> Tipy na hry a nové funkcie</label>
          <label class="switch"><input type="checkbox" id="stS" ${st.sound ? 'checked' : ''}><span></span> Zvuky v hrách</label>
          <label class="switch"><input type="checkbox" id="stV" ${st.speech ? 'checked' : ''}><span></span> Hlasové pokyny v hrách</label>
          <div class="btnrow"><button class="btn">Uložiť</button><button type="button" class="btn soft" id="stPerm">${'Notification' in window && Notification.permission === 'granted' ? '✅ Systémové upozornenia zapnuté' : '🔔 Povoliť systémové upozornenia'}</button><button type="button" class="btn ghost" id="stTest">Test</button></div>
        </form>
      </div>
      <section class="card"><h2>💾 Dáta</h2><p class="muted">Vaše prípravy a údaje o deťoch sú uložené v tomto zariadení. Mená detí sa na server neodosielajú.</p>
        <div class="btnrow"><button class="btn soft" id="dExp">⬇️ Exportovať zálohu</button><label class="btn soft">⬆️ Obnoviť zo zálohy<input type="file" id="dImp" accept="application/json" hidden></label><button class="btn ghost danger" id="dDel">Vymazať všetko</button></div>
      </section>
      <p class="center fine">Iskrička 1.0 · od <a href="/" target="_blank">Prípravy Inšpirácie</a> · <a href="/obchodne-podmienky" target="_blank">Podmienky</a> · <a href="/ochrana-osobnych-udajov" target="_blank">Súkromie</a> · <a href="#/admin">Admin</a></p>`;

    v.querySelectorAll('[data-upgrade]').forEach((b) => b.onclick = () => paywall('profile'));
    v.querySelector('#profF').onsubmit = (e) => {
      e.preventDefault();
      Object.assign(p, { name: v.querySelector('#pfN').value.trim(), email: v.querySelector('#pfE').value.trim(), school: v.querySelector('#pfS').value.trim(), className: v.querySelector('#pfC').value.trim(), age: v.querySelector('#pfA').value });
      ISK.save(); ISK.sync(); toast('Profil uložený', 'ok'); route();
    };
    v.querySelector('#setF').onsubmit = (e) => {
      e.preventDefault();
      Object.assign(st, { dailyReminder: v.querySelector('#stD').checked, reminderTime: v.querySelector('#stT').value || '07:30', weeklyReminder: v.querySelector('#stW').checked, gameReminder: v.querySelector('#stG').checked, sound: v.querySelector('#stS').checked, speech: v.querySelector('#stV').checked });
      ISK.save(); toast('Nastavenia uložené', 'ok');
    };
    v.querySelector('#stPerm').onclick = async (e) => { const ok = await askPermission(); e.target.textContent = ok ? '✅ Systémové upozornenia zapnuté' : 'Zablokované v prehliadači'; };
    v.querySelector('#stTest').onclick = () => { ISK.notify({ icon: '🧚', title: 'Takto vyzerá pripomienka', body: 'Dobré ráno! Dnes vás čaká skvelý deň s deťmi.', action: '#/domov' }, { system: true }); toast('Testovacie upozornenie odoslané'); };
    v.querySelector('#dExp').onclick = () => {
      const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `iskricka-zaloha-${ISK.today()}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    v.querySelector('#dImp').onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then((t) => {
        const data = JSON.parse(t);
        if (!data.profile || !data.userId) throw new Error('bad');
        localStorage.setItem('iskricka.v1', t); location.reload();
      }).catch(() => toast('Neplatný súbor zálohy', 'err'));
    };
    v.querySelector('#dDel').onclick = () => { if (confirm('Naozaj vymazať všetky dáta z tohto zariadenia? Túto akciu nie je možné vrátiť.')) ISK.reset(); };
  };

  /* ---------------- Paywall ---------------- */
  function paywall(reason) {
    ISK.track('paywall_view', { reason });
    const s = S();
    const titles = {
      game: 'Táto hra je v Premium 🎮', quota: 'Mesačný limit AI je vyčerpaný 🔋', week: 'AI naplní celý týždeň za vás 📅',
      parents: 'Správy pre rodičov za pár sekúnd 💌', report: 'Individuálne zhrnutia o deťoch 💌', aiset: 'Hry na akúkoľvek tému 🪄',
      projekt: 'Týždenné projekty sú v Premium 🗂️', library: 'Knižnica je plná 📚',
    };
    let yearly = true;
    const m = modal(`<div class="pw">
      <div class="pw-h"><div class="crown">👑</div><h2>${titles[reason] || 'Iskrička Premium'}</h2><p>Ušetrite 5+ hodín prípravy každý týždeň a dajte deťom hry, ktoré ich bavia.</p></div>
      <ul class="pw-feat">${ISK.PREMIUM_FEATURES.map(([i, t, d]) => `<li><span>${i}</span><div><b>${t}</b><small>${d}</small></div></li>`).join('')}</ul>
      <div class="pw-toggle"><button data-b="m">Mesačne</button><button data-b="y" class="on">Ročne <em>−29 %</em></button></div>
      <div class="pw-price"><b id="pwP">4,92 €</b><span id="pwS">/ mesiac · fakturované 59 € ročne</span></div>
      <button class="btn gold big wide" id="pwBuy">Pokračovať k platbe</button>
      ${s.trialUsed ? '' : '<button class="btn soft wide" id="pwTrial">🎁 Vyskúšať 7 dní zadarmo — bez karty</button>'}
      <table class="pw-cmp"><tr><th></th><th>Free</th><th>Premium</th></tr>
        <tr><td>AI prípravy</td><td>${ISK.PLANS.free.aiPerMonth}/mesiac</td><td>∞</td></tr>
        <tr><td>Interaktívne hry</td><td>3</td><td>7 + AI sady</td></tr>
        <tr><td>Knižnica</td><td>${ISK.PLANS.free.libraryMax}</td><td>∞</td></tr>
        <tr><td>AI týždeň a rodičia</td><td>—</td><td>✔</td></tr></table>
      <p class="fine center">Bezpečná platba cez Stripe · Zrušíte kedykoľvek · Faktúra pre školu na požiadanie</p></div>`, { cls: 'pw-modal', noFocus: true });
    const upd = () => {
      m.querySelectorAll('[data-b]').forEach((b) => b.classList.toggle('on', (b.dataset.b === 'y') === yearly));
      m.querySelector('#pwP').textContent = yearly ? '4,92 €' : '6,90 €';
      m.querySelector('#pwS').textContent = yearly ? '/ mesiac · fakturované 59 € ročne' : '/ mesiac · zrušíte kedykoľvek';
    };
    m.querySelectorAll('[data-b]').forEach((b) => b.onclick = () => { yearly = b.dataset.b === 'y'; upd(); });
    m.querySelector('#pwBuy').onclick = async (e) => {
      const btn = e.currentTarget; btn.disabled = true; btn.textContent = 'Presmerovávam na Stripe…';
      ISK.track('checkout_start', { plan: yearly ? 'year' : 'month', reason });
      try {
        const data = await ISK.api('create-subscription-session', { plan: yearly ? 'year' : 'month', userId: s.userId, email: s.profile.email }, { timeout: 15000 });
        location.href = data.url;
      } catch (err) {
        toast('Platba je momentálne nedostupná: ' + err.message, 'err');
        btn.disabled = false; btn.textContent = 'Pokračovať k platbe';
      }
    };
    const tr = m.querySelector('#pwTrial');
    if (tr) tr.onclick = async () => {
      tr.disabled = true;
      let until = new Date(Date.now() + 7 * 864e5).toISOString();
      try {
        const data = await ISK.api('track', { action: 'trial', userId: s.userId }, { timeout: 8000 });
        if (data && data.user) { ISK.applyServerUser(data.user); until = data.user.premiumUntil || until; }
        if (data && data.error) throw new Error(data.error);
      } catch (err) {
        if (err.status === 409) { toast('Skúšobnú verziu ste už využili.', 'err'); s.trialUsed = true; ISK.save(); closeModal(); return; }
      }
      Object.assign(s, { tier: 'premium', premiumUntil: until, trialUsed: true, billing: 'trial' });
      ISK.save(); closeModal(); ISK.track('trial_start');
      ISK.notify({ icon: '👑', title: 'Premium je aktívne!', body: `Máte 7 dní na vyskúšanie všetkého. Platí do ${fmtDate(until)}.`, action: '#/hry' });
      ISK.confetti(document.body, 120); toast('👑 Premium aktivované na 7 dní!', 'ok'); route();
    };
  }
  ISK.paywall = paywall;

  /* Návrat zo Stripe Checkout */
  async function handleCheckoutReturn() {
    const params = new URLSearchParams(location.search);
    const st = params.get('upgrade');
    if (!st) return;
    history.replaceState(null, '', location.pathname + location.hash);
    if (st === 'cancel') { toast('Platba bola zrušená. Premium môžete aktivovať kedykoľvek.'); return; }
    const sid = params.get('session_id');
    try {
      const data = await ISK.api('verify-subscription', { sessionId: sid, userId: S().userId });
      if (data.premium) {
        Object.assign(S(), { tier: 'premium', premiumUntil: data.premiumUntil || null, billing: data.plan || 'stripe' });
        ISK.save();
        ISK.notify({ icon: '👑', title: 'Vitajte v Premium!', body: 'Ďakujeme! Všetky funkcie sú odomknuté.', action: '#/domov' });
        modal(`<div class="center"><div class="crown big">👑</div><h2>Ďakujeme!</h2><p>Iskrička Premium je aktívna. Všetky hry, neobmedzená AI a týždenné plány sú vaše.</p><button class="btn wide" onclick="ISK.closeModal()">Poďme na to ✨</button></div>`);
        ISK.confetti(document.body, 140); route();
      } else toast('Platba ešte nebola potvrdená. Skúste obnoviť stránku o chvíľu.', 'err');
    } catch (e) { toast('Nepodarilo sa overiť platbu: ' + e.message, 'err'); }
  }

  /* ---------------- Notifikácie ---------------- */
  async function askPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    try { const r = await Notification.requestPermission(); ISK.track('notif_permission', { r }); return r === 'granted'; } catch (e) { return false; }
  }

  function openNotifications() {
    const s = S();
    const m = modal(`<h2>🔔 Upozornenia</h2>${s.notifications.length ? `<ul class="notifs">${s.notifications.map((n) => `<li class="${n.read ? '' : 'unread'}"><a href="${n.action || '#/domov'}" data-nid="${n.id}"><span>${n.icon}</span><div><b>${esc(n.title)}</b><p>${esc(n.body || '')}</p><small>${timeAgo(n.date)}</small></div></a></li>`).join('')}</ul>
      <button class="linkbtn" id="nAll">Označiť všetko ako prečítané</button>` : '<div class="empty"><span>🔕</span><p>Žiadne upozornenia.</p></div>'}`, { noFocus: true });
    m.querySelectorAll('[data-nid]').forEach((a) => a.onclick = () => { const n = s.notifications.find((x) => x.id === a.dataset.nid); n.read = true; ISK.save(); closeModal(); });
    const all = m.querySelector('#nAll'); if (all) all.onclick = () => { s.notifications.forEach((n) => (n.read = true)); ISK.save(); closeModal(); route(); };
  }

  /* Plánovač pripomienok — kontroluje každých 30 s, kým je aplikácia otvorená (aj na pozadí v PWA) */
  function scheduler() {
    const s = S(); if (!s.profile.onboarded) return;
    const now = new Date(); const t = ISK.today();
    const hm = now.toTimeString().slice(0, 5);
    const dow = now.getDay();
    const name = (s.profile.name || '').split(' ')[0];
    const wk = ISK.getWeek(ISK.weekKey(now));
    // Ranný prehľad dňa
    if (s.settings.dailyReminder && dow >= 1 && dow <= 5 && hm >= s.settings.reminderTime && s.sent.daily !== t) {
      s.sent.daily = t;
      const today = wk.days[ISK.todayDayKey()] || [];
      ISK.notify({ icon: '☀️', tag: 'daily', title: `Dobré ráno, ${name}!`, body: today.length ? `Dnes: ${today.map((a) => a.title).slice(0, 3).join(' · ')}` : 'Na dnes nemáte nič v pláne — vytvorte prípravu za 30 sekúnd ✨', action: today.length ? '#/domov' : '#/pripravy' }, { system: true });
    }
    // Nedeľná pripomienka plánovania
    const nextKey = ISK.weekKey(new Date(now.getTime() + 2 * 864e5));
    const nextEmpty = !ISK.DAYS.some(([k]) => (s.week[nextKey] || { days: {} }).days[k] && s.week[nextKey].days[k].length);
    if (s.settings.weeklyReminder && dow === 0 && hm >= '18:00' && s.sent.weekly !== t && nextEmpty) {
      s.sent.weekly = t;
      ISK.notify({ icon: '📅', tag: 'weekly', title: 'Budúci týždeň je zatiaľ prázdny', body: 'Naplánujte ho s Iskričkou za 2 minúty — v pondelok budete mať pokoj.', action: '#/tyzden' }, { system: true });
    }
    // Popoludňajší tip na hru (raz týždenne v stredu)
    if (s.settings.gameReminder && dow === 3 && hm >= '10:00' && s.sent.game !== t) {
      s.sent.game = t;
      const g = ISK.pick(ISK.GAMES.filter((x) => ISK.canPlay(x.id)));
      ISK.notify({ icon: g.icon, tag: 'game', title: `Hra dňa: ${g.name}`, body: `${g.desc} Ideálne na 10 minút po desiate.`, action: '#/hry' }, { system: true });
    }
    // Upozornenie na koniec skúšobnej verzie
    if (s.billing === 'trial' && s.premiumUntil) {
      const left = Math.ceil((new Date(s.premiumUntil) - now) / 864e5);
      if (left <= 2 && left > 0 && s.sent.trialEnd !== s.premiumUntil) {
        s.sent.trialEnd = s.premiumUntil;
        ISK.notify({ icon: '⏳', title: `Premium končí o ${left} ${left === 1 ? 'deň' : 'dni'}`, body: 'Ponechajte si neobmedzenú AI a všetky hry — ročne len 4,92 € mesačne.', action: '#/profil' }, { system: true });
      }
    }
    // Free limit takmer vyčerpaný
    if (!ISK.isPremium() && ISK.aiLeft() <= 2 && s.sent.quota !== s.usage.month + ISK.aiLeft()) {
      s.sent.quota = s.usage.month + ISK.aiLeft();
      ISK.notify({ icon: '🔋', title: `Zostávajú ${ISK.aiLeft()} AI generovania`, body: 'Limit sa obnoví 1. dňa v mesiaci. S Premium bez obmedzení.', action: '#/profil' });
    }
    ISK.save();
  }

  ISK.on('notifications', () => {
    const b = document.getElementById('bell'); if (!b) return;
    const n = S().notifications.filter((x) => !x.read).length;
    b.innerHTML = '🔔' + (n ? `<i>${n}</i>` : ''); b.classList.remove('ring'); void b.offsetWidth; b.classList.add('ring');
  });
  ISK.on('achievement', (a) => toast(`${a.icon} Nový odznak: ${a.name}`, 'ok'));

  /* ---------------- Logo ---------------- */
  let logoN = 0;
  ISK.logoSvg = (size = 34, id = 'lg' + (++logoN)) => `<svg class="logo-svg" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFC93C"/><stop offset="1" stop-color="#FF6B6B"/></linearGradient></defs><rect width="64" height="64" rx="18" fill="url(#${id})"/><path d="M32 11l5.6 13.2L51 26l-10.2 9 3 14L32 41.8 20.2 49l3-14L13 26l13.4-1.8z" fill="#fff"/><circle cx="27.5" cy="31" r="2.2" fill="#2B2D42"/><circle cx="36.5" cy="31" r="2.2" fill="#2B2D42"/><path d="M28 36.5q4 3.5 8 0" stroke="#2B2D42" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;

  /* ---------------- Štart ---------------- */
  function boot() {
    if (S().profile.onboarded) {
      ISK.touchStreak();
      const before = ISK.isPremium() + '|' + ISK.aiLeft();
      ISK.sync().then(() => {
        const changed = before !== ISK.isPremium() + '|' + ISK.aiLeft();
        if (changed && !document.body.classList.contains('playing') && !document.getElementById('modal')) route();
        if (S().blocked) toast('Váš účet bol pozastavený. Kontaktujte podporu.', 'err');
      });
    }
    route();
    handleCheckoutReturn();
    scheduler(); setInterval(scheduler, 30000);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
    navigator.serviceWorker && navigator.serviceWorker.addEventListener('message', (e) => { if (e.data && e.data.url) location.hash = e.data.url.replace(/^.*#/, '#'); });
    ISK.track('app_open');
  }
  boot();
})();
