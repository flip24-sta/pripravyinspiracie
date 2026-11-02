/* Iskrička — admin konzola: používatelia, tarify, analytika */
(function () {
  const esc = (s) => ISK.esc(s);
  const TKEY = 'iskricka.admin';
  let data = null, mode = 'server', q = '', tierF = '';

  const getToken = () => { try { return sessionStorage.getItem(TKEY) || ''; } catch (e) { return ''; } };
  const setToken = (t) => { try { t ? sessionStorage.setItem(TKEY, t) : sessionStorage.removeItem(TKEY); } catch (e) {} };

  async function call(action, extra) {
    return ISK.api('admin', Object.assign({ action }, extra || {}), { headers: { 'x-admin-token': getToken() }, timeout: 20000 });
  }

  ISK.renderAdmin = function (root) {
    if (!getToken() && mode !== 'local') return login(root);
    root.innerHTML = `<div class="adm"><header class="adm-top">
        <a class="logo" href="#/domov">${ISK.logoSvg(30)}<span>Iskrička <em>Admin</em></span></a>
        <div class="btnrow"><span class="badge">${mode === 'local' ? '💻 Lokálny režim (toto zariadenie)' : '☁️ Produkčné dáta'}</span>
        <button class="btn sm soft" id="aRef">↻ Obnoviť</button><button class="btn sm ghost" id="aOut">Odhlásiť</button></div></header>
      <main class="adm-main" id="admMain"><div class="card loading"><div class="spark-loader"><i></i><i></i><i></i><span>✨</span></div><p>Načítavam dáta…</p></div></main></div>`;
    root.querySelector('#aOut').onclick = () => { setToken(''); mode = 'server'; data = null; location.hash = '#/domov'; };
    root.querySelector('#aRef').onclick = () => load(root);
    load(root);
  };

  function login(root) {
    root.innerHTML = `<div class="ob"><form class="ob-card adm-login" id="al">
      <div class="ob-logo">${ISK.logoSvg(64)}</div><h2>Admin konzola</h2>
      <p class="sub">Zadajte admin token (premenná prostredia <code>ADMIN_TOKEN</code> v Netlify).</p>
      <label>Admin token<input id="alT" type="password" autocomplete="current-password" required></label>
      <button class="btn wide">Prihlásiť</button>
      <button type="button" class="btn ghost wide" id="alLocal">Zobraziť demo z tohto zariadenia</button>
      <p class="fine center"><a href="#/domov">← Späť do aplikácie</a></p></form></div>`;
    root.querySelector('#al').onsubmit = (e) => { e.preventDefault(); setToken(root.querySelector('#alT').value.trim()); mode = 'server'; ISK.renderAdmin(root); };
    root.querySelector('#alLocal').onclick = () => { mode = 'local'; ISK.renderAdmin(root); };
  }

  async function load(root) {
    const main = root.querySelector('#admMain');
    if (mode === 'local') { data = localData(); return render(main); }
    try {
      data = await call('overview');
      render(main);
    } catch (e) {
      if (e.status === 401) { setToken(''); ISK.toast('Nesprávny admin token', 'err'); return login(root); }
      main.innerHTML = `<div class="card empty big"><span>🔌</span><h3>Server nie je dostupný</h3><p>${esc(e.message)}. Funkcia <code>admin</code> beží len na nasadenom Netlify webe s nastaveným <code>ADMIN_TOKEN</code>.</p><button class="btn" id="goLocal">Zobraziť lokálne dáta</button></div>`;
      main.querySelector('#goLocal').onclick = () => { mode = 'local'; ISK.renderAdmin(root); };
    }
  }

  /* Demo dáta z tohto zariadenia — admin funguje aj bez servera */
  function localData() {
    const s = ISK.state;
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
      const evs = s.localEvents.filter((e) => new Date(e.t).toISOString().slice(0, 10) === d);
      const events = {}; evs.forEach((e) => { const k = e.type.replace(/^tpl_/, 'ai_'); events[k] = (events[k] || 0) + 1; });
      days.push({ date: d, events, active: evs.length ? 1 : 0, signups: events.signup || 0 });
    }
    const u = ISK.publicProfile();
    return { days, users: [Object.assign(u, { tier: s.tier, premiumUntil: s.premiumUntil, createdAt: s.profile.createdAt, lastSeen: new Date().toISOString(), aiCount: s.usage.ai, aiMonth: s.usage.month })] };
  }

  function sum(days, type) { return days.reduce((n, d) => n + ((d.events || {})[type] || 0), 0); }

  function render(main) {
    const { days, users } = data;
    const now = Date.now();
    const total = users.length;
    const prem = users.filter((u) => u.tier === 'premium' && (!u.premiumUntil || new Date(u.premiumUntil) > now));
    const paying = prem.filter((u) => u.billing === 'month' || u.billing === 'year');
    const mrr = paying.reduce((n, u) => n + (u.billing === 'year' ? 59 / 12 : 6.9), 0);
    const last7 = days.slice(-7);
    const dau = days.length ? days[days.length - 1].active : 0;
    const wau = users.filter((u) => u.lastSeen && now - new Date(u.lastSeen) < 7 * 864e5).length;
    const aiAll = days.reduce((n, d) => n + Object.entries(d.events || {}).filter(([k]) => k.startsWith('ai_')).reduce((a, [, v]) => a + v, 0), 0);
    const games = sum(days, 'game_played');
    const pv = sum(days, 'paywall_view'), co = sum(days, 'checkout_start'), pu = sum(days, 'purchase'), tr = sum(days, 'trial_start');
    const signups = days.reduce((n, d) => n + (d.signups || 0), 0);

    const maxA = Math.max(1, ...days.map((d) => d.active));
    const bars = days.map((d, i) => {
      const h = Math.round((d.active / maxA) * 120);
      return `<g><rect x="${i * 20 + 4}" y="${130 - h}" width="14" height="${Math.max(h, 1)}" rx="4" fill="${i === days.length - 1 ? '#FF6B6B' : '#FFC93C'}"><title>${d.date}: ${d.active} aktívnych</title></rect></g>`;
    }).join('');

    const featureCounts = {};
    days.forEach((d) => Object.entries(d.events || {}).forEach(([k, v]) => { featureCounts[k] = (featureCounts[k] || 0) + v; }));
    const LABELS = { ai_plan: '✨ AI prípravy', ai_chat: '💬 Asistent', ai_week: '📅 AI týždeň', ai_game: '🪄 AI herné sady', ai_parents: '💌 Správy rodičom', ai_child: '👧 Zhrnutia o deťoch', game_played: '🎮 Odohrané hry', plan_saved: '💾 Uložené prípravy', print: '🖨️ Tlač', observation: '📝 Pozorovania', added_to_week: '📌 Pridané do plánu', app_open: '📱 Otvorenia appky' };
    const feats = Object.entries(LABELS).map(([k, l]) => [l, featureCounts[k] || 0]).sort((a, b) => b[1] - a[1]);
    const maxF = Math.max(1, ...feats.map((f) => f[1]));

    const list = users.filter((u) => (!tierF || (tierF === 'blocked' ? u.blocked : u.tier === tierF)) && (!q || ((u.name || '') + ' ' + (u.email || '') + ' ' + (u.school || '')).toLowerCase().includes(q.toLowerCase())))
      .sort((a, b) => new Date(b.lastSeen || 0) - new Date(a.lastSeen || 0));

    const pct = (a, b) => (b ? Math.round((a / b) * 100) + ' %' : '—');
    main.innerHTML = `
      <div class="kpis">
        ${kpi('👩‍🏫', 'Používateľky', total, `+${signups} za 30 dní`)}
        ${kpi('👑', 'Premium', prem.length, `${pct(prem.length, total)} konverzia`)}
        ${kpi('💶', 'MRR', mrr.toFixed(2).replace('.', ',') + ' €', `${paying.length} platiacich`)}
        ${kpi('📈', 'DAU / WAU', `${dau} / ${wau}`, 'aktívne dnes / 7 dní')}
        ${kpi('✨', 'AI generovaní', aiAll, '30 dní')}
        ${kpi('🎮', 'Odohrané hry', games, '30 dní')}
      </div>
      <div class="grid2">
        <section class="card"><h2>Aktívni používatelia — 30 dní</h2>
          <svg class="chart" viewBox="0 0 ${days.length * 20 + 8} 150" preserveAspectRatio="none" role="img" aria-label="Graf aktívnych používateľov">${bars}<line x1="0" y1="130.5" x2="${days.length * 20 + 8}" y2="130.5" stroke="#E5E7EB"/></svg>
          <div class="chart-x"><span>${days[0] ? days[0].date.slice(5) : ''}</span><span>dnes</span></div></section>
        <section class="card"><h2>Monetizačný lievik (30 dní)</h2>
          <div class="funnel">${[['Paywall zobrazený', pv], ['Skúšobná verzia', tr], ['Začatá platba', co], ['Dokončená platba', pu]].map(([l, n], i) => `<div class="fn" style="--w:${pv ? Math.max(8, (n / pv) * 100) : 8}%;--i:${i}"><b>${n}</b><span>${l}</span></div>`).join('')}</div>
          <p class="muted">Paywall → platba: <b>${pct(pu, pv)}</b> · Checkout → platba: <b>${pct(pu, co)}</b></p></section>
      </div>
      <section class="card"><h2>Používanie funkcií</h2>
        <div class="prog">${feats.map(([l, n]) => `<div class="prog-row"><span>${l}</span><div class="bar"><i style="width:${(n / maxF) * 100}%;background:#9B5DE5"></i></div><small>${n}</small></div>`).join('')}</div></section>
      <section class="card">
        <div class="card-h"><h2>Používateľky (${list.length})</h2>
          <div class="btnrow"><input id="aQ" type="search" placeholder="🔍 meno, e-mail, škola" value="${esc(q)}"><select id="aT"><option value="">Všetky</option><option value="free" ${tierF === 'free' ? 'selected' : ''}>Free</option><option value="premium" ${tierF === 'premium' ? 'selected' : ''}>Premium</option><option value="blocked" ${tierF === 'blocked' ? 'selected' : ''}>Zablokované</option></select>
          <button class="btn sm soft" id="aCsv">⬇️ CSV</button></div></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Používateľka</th><th>Škola / trieda</th><th>Tarif</th><th>AI (mes.)</th><th>Hry</th><th>Posledná aktivita</th><th></th></tr></thead><tbody>
        ${list.map((u) => `<tr class="${u.blocked ? 'blocked' : ''}"><td><b>${esc(u.name || '—')}</b><small>${esc(u.email || '')}</small></td><td>${esc(u.school || '')}<small>${esc(u.className || '')}</small></td>
          <td><span class="tier ${u.tier}">${u.tier === 'premium' ? '👑 Premium' : 'Free'}</span>${u.premiumUntil ? `<small>do ${new Date(u.premiumUntil).toLocaleDateString('sk-SK')}</small>` : ''}${u.billing ? `<small>${esc(u.billing)}</small>` : ''}</td>
          <td>${u.aiCount || 0}</td><td>${(u.stats && u.stats.gamesPlayed) || 0}</td><td>${u.lastSeen ? new Date(u.lastSeen).toLocaleString('sk-SK') : '—'}</td>
          <td><button class="btn sm soft" data-u="${esc(u.id)}">Spravovať</button></td></tr>`).join('') || '<tr><td colspan="7" class="muted center">Žiadni používatelia</td></tr>'}
        </tbody></table></div></section>`;

    const qi = main.querySelector('#aQ');
    qi.oninput = () => { q = qi.value; clearTimeout(qi._t); qi._t = setTimeout(() => { render(main); const n = main.querySelector('#aQ'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); };
    main.querySelector('#aT').onchange = (e) => { tierF = e.target.value; render(main); };
    main.querySelector('#aCsv').onclick = () => csv(list);
    main.querySelectorAll('[data-u]').forEach((b) => b.onclick = () => manage(main, users.find((u) => u.id === b.dataset.u)));
  }

  function kpi(ic, label, val, sub) {
    return `<div class="kpi"><span>${ic}</span><small>${label}</small><b>${val}</b><em>${sub}</em></div>`;
  }

  function manage(main, u) {
    const m = ISK.modal(`<h2>${esc(u.name || 'Používateľka')}</h2>
      <p class="muted">${esc(u.email || '')} · ${esc(u.school || '')} ${esc(u.className || '')}<br>ID: <code>${esc(u.id)}</code><br>Registrácia: ${u.createdAt ? new Date(u.createdAt).toLocaleDateString('sk-SK') : '—'}</p>
      <div class="kpis sm">${kpi('📝', 'Prípravy', (u.stats && u.stats.plansGenerated) || 0, '')}${kpi('🎮', 'Hry', (u.stats && u.stats.gamesPlayed) || 0, '')}${kpi('👧', 'Deti', u.children || 0, '')}${kpi('🔥', 'Séria', u.streak || 0, '')}</div>
      <h3>Tarif</h3>
      <div class="btnrow"><button class="btn sm gold" data-t="premium30">👑 Premium 30 dní</button><button class="btn sm gold" data-t="premium365">👑 Premium 1 rok</button><button class="btn sm soft" data-t="free">Prepnúť na Free</button><button class="btn sm soft" data-t="resetai">Vynulovať AI limit</button></div>
      <h3>Účet</h3>
      <div class="btnrow"><button class="btn sm soft" data-t="${u.blocked ? 'unblock' : 'block'}">${u.blocked ? '✅ Odblokovať' : '⛔ Zablokovať'}</button><button class="btn sm ghost danger" data-t="delete">🗑️ Zmazať (GDPR)</button></div>`, { noFocus: true });
    m.querySelectorAll('[data-t]').forEach((b) => b.onclick = async () => {
      const op = b.dataset.t;
      if (op === 'delete' && !confirm('Natrvalo zmazať údaje používateľky?')) return;
      try {
        if (mode === 'local') {
          const s = ISK.state;
          if (op.startsWith('premium')) Object.assign(s, { tier: 'premium', premiumUntil: new Date(Date.now() + (op === 'premium30' ? 30 : 365) * 864e5).toISOString(), billing: 'admin' });
          if (op === 'free') Object.assign(s, { tier: 'free', premiumUntil: null, billing: null });
          if (op === 'resetai') s.usage.ai = 0;
          ISK.save();
        } else {
          await call('update', { userId: u.id, op });
        }
        ISK.toast('Hotovo ✔', 'ok'); ISK.closeModal();
        data = mode === 'local' ? localData() : await call('overview');
        render(main);
      } catch (e) { ISK.toast(e.message, 'err'); }
    });
  }

  function csv(list) {
    const rows = [['id', 'meno', 'email', 'skola', 'trieda', 'tarif', 'premium_do', 'ai_mesiac', 'hry', 'registracia', 'posledna_aktivita']]
      .concat(list.map((u) => [u.id, u.name, u.email, u.school, u.className, u.tier, u.premiumUntil, u.aiCount, u.stats && u.stats.gamesPlayed, u.createdAt, u.lastSeen]));
    const text = rows.map((r) => r.map((x) => `"${String(x == null ? '' : x).replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }));
    a.download = `iskricka-pouzivatelia-${ISK.today()}.csv`; a.click();
  }
})();
