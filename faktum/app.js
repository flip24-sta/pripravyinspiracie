/* ==========================================================================
   FAKTUM app — views, router, interactions. Depends on core.js (window.F).
   ========================================================================== */
(() => {
'use strict';
const F = window.F;
const { $, $$, esc, uid, round2, eur, nf, today, addDays, addMonths, diffDays, fmtD, ym, MONTHS, ago, initials, avatarBg, PLANS, FEATURES, VAT_RATES, chip, totals, status } = F;
const S = F.getS();
const app = $('#app');

/* ---------------- icons ---------------- */
const P = {
  dash: '<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>',
  inv: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M8 13h8M8 17h5"/>',
  users: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8"/>',
  exp: '<path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 1 .7V2l-1 .7-3-2-3 2-3-2-3 2-3-2zM8 8h8M8 12h8M8 16h5"/>',
  rep: '<path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"/>',
  tax: '<path d="M3 3v18h18M7 14l4-4 4 4 5-6"/>',
  ai: '<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  bell: '<path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
  dl: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>',
  trash: '<path d="M3 6h18M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
  mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/>',
  menu: '<path d="M3 12h18M3 6h18M3 18h18"/>',
  out: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>',
  up: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  cam: '<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>',
  print: '<path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/>',
  xml: '<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>',
  money: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>',
  play: '<path d="M5 3l14 9-14 9z"/>',
  arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
};
const ic = (n, s = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${s}>${P[n] || ''}</svg>`;
const LOGO = `<span class="logo-mark"><svg viewBox="0 0 24 24"><text x="12" y="17.6" text-anchor="middle" font-size="18" font-weight="800" font-family="Plus Jakarta Sans,Arial,sans-serif" fill="currentColor">e</text></svg></span><span>eFakturko<span class="dot">.</span></span>`;

/* ---------------- toast & modal ---------------- */
function toast(msg, kind = 'ok') {
  const el = document.createElement('div');
  el.className = 'toast' + (kind === 'err' ? ' err' : '');
  el.innerHTML = `<span class="ic">${kind === 'err' ? '!' : kind === 'ai' ? '✦' : '✓'}</span><span>${msg}</span>`;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.style.transition = '.3s'; el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; setTimeout(() => el.remove(), 300); }, 3600);
}
function modal(html, { wide = false, onClose } = {}) {
  closeModal();
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div>`;
  bg.addEventListener('mousedown', (e) => { if (e.target === bg) closeModal(); });
  bg._onClose = onClose;
  $('#modal-root').appendChild(bg);
  setTimeout(() => bg.querySelector('[autofocus]')?.focus(), 30);
  return bg.firstElementChild;
}
function closeModal() { const m = $('#modal-root .modal-bg'); if (m) { m._onClose?.(); m.remove(); } }
const mh = (title, sub = '') => `<div class="modal-h"><div><h2>${title}</h2>${sub ? `<p class="muted" style="margin-top:4px">${sub}</p>` : ''}</div><button class="x" data-act="close" aria-label="Zavrieť">${ic('x', 'width="18"')}</button></div>`;
function confirmBox(title, body, okLabel = 'Potvrdiť', danger = false) {
  return new Promise((res) => {
    const m = modal(`${mh(title)}<div class="modal-b"><p style="color:#34433C">${body}</p><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px"><button class="btn btn-ghost" data-r="0">Zrušiť</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-r="1" autofocus>${okLabel}</button></div></div>`, { onClose: () => res(false) });
    m.addEventListener('click', (e) => { const b = e.target.closest('[data-r]'); if (b) { const v = b.dataset.r === '1'; $('#modal-root .modal-bg')._onClose = null; closeModal(); res(v); } });
  });
}

/* ---------------- paywall ---------------- */
function gate(feature) {
  if (F.has(feature)) return true;
  paywall(feature);
  return false;
}
function paywall(feature, preselect) {
  const f = FEATURES[feature] || { name: 'eFakturko Pro', plan: 'pro', pitch: '' };
  const pick = preselect || f.plan;
  F.track('paywall_' + feature);
  const plans = ['pro', 'business', 'max'];
  const m = modal(`
    <div class="modal-b" style="padding-top:24px">
      <div class="pw-hero"><button class="x" data-act="close" style="position:absolute;right:12px;top:12px;color:#C4B5FD">${ic('x', 'width="18"')}</button>
        <span class="chip plain" style="background:#fff;color:var(--violet)">${ic('lock', 'width="12"')} ${esc(f.name)}</span>
        <h3 style="margin-top:12px">Odomknite <em>${esc(f.name.toLowerCase())}</em> a fakturujte bez brzdy.</h3>
        <p style="color:#C4B5FD;margin-top:8px;font-size:14px">${esc(f.pitch)}</p>
      </div>
      <div class="pw-plans">${plans.map((p) => `<div class="pw-plan ${p === pick ? 'on' : ''}" data-pick="${p}"><span class="tag-plan ${p}">${PLANS[p].name}</span><div class="p">${nf(PLANS[p].price)} €<span class="muted" style="font-size:12px;font-weight:500"> / mes</span></div><div class="muted" style="font-size:12px">alebo ${nf(PLANS[p].yprice)} € pri ročnej platbe</div></div>`).join('')}</div>
      <div class="pw-list" id="pwList"></div>
      <button class="btn btn-lime btn-lg btn-block" id="pwGo">Pokračovať k platbe</button>
      ${!S.billing.trialUsed ? `<button class="btn btn-quiet btn-block" style="margin-top:8px" id="pwTrial">alebo vyskúšať 14 dní zadarmo, bez karty</button>` : ''}
    </div>`);
  let sel = pick;
  const list = { pro: ['Neobmedzené faktúry', '100 AI akcií mesačne', 'Automatické upomienky', 'Opakované faktúry', 'Daňový radar', 'e‑Faktúra Peppol UBL', 'Bez loga eFakturko'], business: ['Všetko z Pro', 'Neobmedzené AI', '10 firiem, 3 používatelia', 'Cashflow predikcia 90 dní', 'Prioritná podpora'], max: ['Všetko z Business', '50 firiem, 6 používateľov', '50 GB úložisko', 'Prioritná podpora'] };
  const draw = () => { $$('.pw-plan', m).forEach((x) => x.classList.toggle('on', x.dataset.pick === sel)); $('#pwList', m).innerHTML = list[sel].map((x) => `<div>${x}</div>`).join(''); };
  draw();
  m.addEventListener('click', (e) => { const p = e.target.closest('[data-pick]'); if (p) { sel = p.dataset.pick; draw(); } });
  $('#pwGo', m).onclick = () => checkout(sel);
  const tr = $('#pwTrial', m); if (tr) tr.onclick = () => { startTrial(sel); closeModal(); };
}
function startTrial(p) {
  S.user.plan = p; S.billing.trialEnds = Date.now() + 14 * 864e5; S.billing.trialUsed = true;
  F.notify('trial-start-' + Date.now(), { type: 'billing', title: `Skúšobné obdobie ${PLANS[p].name} aktivované`, body: 'Máte 14 dní plného prístupu. Pripomenieme sa 3 dni pred koncom.', href: '#/billing' });
  F.track('trial_start'); F.save(); toast(`${PLANS[p].name} odomknutý na 14 dní`); render();
}
const luhn = (n) => { const d = n.replace(/\D/g, ''); if (d.length < 13) return false; let s = 0; for (let i = 0; i < d.length; i++) { let x = +d[d.length - 1 - i]; if (i % 2) { x *= 2; if (x > 9) x -= 9; } s += x; } return s % 10 === 0; };
function checkout(p, cycle = S.billing.cycle || 'm') {
  F.track('checkout_open');
  const m = modal(`${mh('Bezpečná platba', 'Testovací režim — použite kartu 4242 4242 4242 4242')}
    <div class="modal-b">
      <div class="tabs" style="margin-bottom:14px"><button data-cy="m" class="${cycle === 'm' ? 'on' : ''}">Mesačne</button><button data-cy="y" class="${cycle === 'y' ? 'on' : ''}">Ročne −20 %</button></div>
      <div class="card card-pad" style="background:var(--paper);box-shadow:none;margin-bottom:16px" id="coSum"></div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="field"><label>Číslo karty</label><input class="input mono" id="cn" inputmode="numeric" placeholder="4242 4242 4242 4242" autocomplete="cc-number" autofocus></div>
        <div class="grid-2"><div class="field"><label>Platnosť</label><input class="input mono" id="ce" placeholder="MM/RR" autocomplete="cc-exp"></div><div class="field"><label>CVC</label><input class="input mono" id="cc" placeholder="123" inputmode="numeric" autocomplete="cc-csc"></div></div>
        <div class="field"><label>Zľavový kód</label><div class="inline"><input class="input mono" id="cp" placeholder="napr. PARTNER1" value="${esc(S.billing.coupon || '')}"><button class="btn btn-ghost" id="cpGo">Použiť</button></div></div>
        <button class="btn btn-lime btn-lg btn-block" id="pay">Zaplatiť</button>
        <p class="muted" style="font-size:12px;text-align:center">${ic('lock', 'width="12" style="display:inline;vertical-align:-1px"')} Šifrované spojenie · predplatné zrušíte kedykoľvek · faktúru dostanete e‑mailom</p>
      </div>
    </div>`);
  let coupon = S.billing.coupon || '';
  const COUPONS = { PARTNER1: { label: 'Partner: 2 mesiace za 1 €', fn: (base, cy) => (cy === 'm' ? 1 : base * 0.85) }, FAKTUM20: { label: '−20 % na prvé obdobie', fn: (b) => b * 0.8 }, ZOSTAN50: { label: '−50 % na 2 mesiace', fn: (b) => b * 0.5 } };
  const calc = () => {
    const base = cycle === 'm' ? PLANS[p].price : round2(PLANS[p].yprice * 12);
    const c = COUPONS[coupon];
    const net = round2(c ? c.fn(base, cycle) : base);
    const vat = round2(net * 0.23);
    return { base, net, vat, total: round2(net + vat), c };
  };
  const draw = () => {
    const k = calc();
    $('#coSum', m).innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><span class="tag-plan ${p}">${PLANS[p].name}</span><span class="muted" style="font-size:13px">${cycle === 'm' ? 'mesačné predplatné' : 'ročné predplatné'}</span></div>
      <div class="kv"><span>Cena</span><b>${eur(k.base)}</b></div>${k.c ? `<div class="kv" style="color:#0F7A52"><span>${esc(k.c.label)}</span><b>−${eur(k.base - k.net)}</b></div>` : ''}
      <div class="kv"><span>DPH 23 %</span><b>${eur(k.vat)}</b></div><div class="kv" style="border-top:1px solid var(--line-2);margin-top:6px;padding-top:10px;font-size:16px"><span><b style="font-family:var(--f-ui)">Spolu dnes</b></span><b>${eur(k.total)}</b></div>`;
    $('#pay', m).textContent = `Zaplatiť ${eur(k.total)}`;
  };
  draw();
  m.addEventListener('click', (e) => { const b = e.target.closest('[data-cy]'); if (b) { cycle = b.dataset.cy; $$('[data-cy]', m).forEach((x) => x.classList.toggle('on', x === b)); draw(); } });
  $('#cn', m).oninput = (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim(); };
  $('#ce', m).oninput = (e) => { let v = e.target.value.replace(/\D/g, '').slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2); e.target.value = v; };
  $('#cpGo', m).onclick = () => { const v = $('#cp', m).value.trim().toUpperCase(); if (COUPONS[v]) { coupon = v; toast('Zľava uplatnená'); } else { coupon = ''; toast('Neplatný kód', 'err'); } draw(); };
  $('#pay', m).onclick = async () => {
    const cn = $('#cn', m).value, ce = $('#ce', m).value, cc = $('#cc', m).value;
    if (!luhn(cn)) return toast('Skontrolujte číslo karty', 'err');
    const [mm, yy] = ce.split('/').map(Number); const now = new Date();
    if (!mm || mm > 12 || !yy || 2000 + yy < now.getFullYear() || (2000 + yy === now.getFullYear() && mm < now.getMonth() + 1)) return toast('Karta je neplatná alebo expirovaná', 'err');
    if (!/^\d{3,4}$/.test(cc)) return toast('Zadajte CVC', 'err');
    const btn = $('#pay', m); btn.innerHTML = '<span class="spinner"></span> Spracúvam platbu…'; btn.disabled = true;
    await new Promise((r) => setTimeout(r, 1300));
    if (cn.replace(/\D/g, '') === '4000000000000002') { btn.disabled = false; draw(); return toast('Banka platbu zamietla. Skúste inú kartu.', 'err'); }
    const k = calc();
    const prev = S.user.plan;
    S.user.plan = p; S.billing.cycle = cycle; S.billing.trialEnds = null; S.billing.coupon = coupon || null;
    S.billing.paidUntil = Date.now() + (cycle === 'm' ? 30 : 365) * 864e5;
    S.billing.history.unshift({ id: 'FK' + Date.now().toString().slice(-8), at: Date.now(), desc: `eFakturko ${PLANS[p].name} — ${cycle === 'm' ? 'mesačne' : 'ročne'}`, net: k.net, total: k.total, card: '•••• ' + cn.replace(/\D/g, '').slice(-4) });
    F.track('upgrade_' + p); F.notify('paid-' + Date.now(), { type: 'billing', title: `Vitajte v ${PLANS[p].name}`, body: `Platba ${eur(k.total)} prijatá. Faktúru nájdete v Predplatnom.`, href: '#/billing' });
    F.save();
    render();
    modal(`<div class="modal-b" style="text-align:center;padding:40px 28px"><div style="width:72px;height:72px;border-radius:22px;background:var(--violet);color:#fff;display:grid;place-items:center;margin:0 auto 18px">${ic('check', 'width="34" stroke-width="3"')}</div>
      <h2 class="serif" style="font-size:40px;line-height:1">${prev === 'free' ? 'Ste <em>Pro</em>.' : 'Hotovo.'}</h2><p class="muted" style="margin:10px 0 24px">Plán ${PLANS[p].name} je aktívny. Všetky funkcie sú odomknuté.</p>
      <button class="btn btn-primary btn-lg" data-act="close">Pokračovať</button></div>`);
  };
}

/* ---------------- AI runner ---------------- */
async function runAI(action, payload) {
  try {
    const r = await F.ai(action, payload);
    if (r.source === 'local') toast('AI beží v offline režime — použitý lokálny návrh', 'ai');
    refreshChrome();
    return r;
  } catch (e) {
    if (e.code === 'quota') { paywall('ai'); return null; }
    toast('AI je dočasne nedostupná', 'err'); return null;
  }
}

/* ---------------- router ---------------- */
let ROUTE = { parts: ['dashboard'], q: new URLSearchParams() };
function parse() {
  const h = location.hash.replace(/^#\/?/, '') || 'dashboard';
  const [path, qs] = h.split('?');
  ROUTE = { parts: path.split('/').filter(Boolean), q: new URLSearchParams(qs || '') };
  return ROUTE;
}
const go = (h) => { if (location.hash === h) render(); else location.hash = h; };

function render() {
  parse();
  const [r0] = ROUTE.parts;
  closeModal();
  if (r0 === 'admin') return vAdmin();
  if (r0 === 'demo') return startDemo();
  if (r0 === 'onboarding' || (!S.user && r0 !== 'login')) return vOnboarding();
  if (r0 === 'login') return vLogin();
  if (!S.user) return go('#/onboarding');
  F.engine();
  const views = { dashboard: vDashboard, invoices: vInvoices, clients: vClients, expenses: vExpenses, recurring: vRecurring, taxes: vTaxes, ai: vAI, notifications: vNotifications, billing: vBilling, settings: vSettings };
  const fn = views[r0] || vDashboard;
  shell(r0 in views ? r0 : 'dashboard', fn());
  scrollTo(0, 0);
}

/* ---------------- shell ---------------- */
function usageHTML() {
  const q = F.quota('invoices'), qa = F.quota('ai'); const pl = F.plan();
  const trial = S.billing.trialEnds ? Math.max(0, Math.ceil((S.billing.trialEnds - Date.now()) / 864e5)) : null;
  const meter = (lbl, x) => x.lim === Infinity ? `<div style="display:flex;justify-content:space-between"><span>${lbl}</span><b style="color:var(--ink)">neobmedzene</b></div><div class="meter"><i style="width:100%;opacity:.35"></i></div>` : `<div style="display:flex;justify-content:space-between"><span>${lbl}</span><b style="color:var(--ink)" class="mono">${x.used}/${x.lim}</b></div><div class="meter ${x.pct >= 100 ? 'full' : x.pct >= 70 ? 'warn' : ''}"><i style="width:${x.pct}%"></i></div>`;
  return `<div class="usage" id="usageBox">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><span class="tag-plan ${pl.id}">${pl.name}</span>${trial !== null ? `<span style="font-size:11.5px;color:var(--violet);font-weight:600">skúška · ${trial} d</span>` : ''}</div>
          ${meter('Faktúry tento mesiac', q)}${meter('AI akcie', qa)}
          ${pl.id === 'free' || trial !== null ? `<button class="btn btn-lime btn-sm btn-block" data-act="upgrade">${trial !== null ? 'Ponechať si ' + pl.name : 'Upgrade na Pro'}</button>` : `<a href="#/billing" style="font-size:12px;color:var(--violet);font-weight:600">Spravovať predplatné →</a>`}
        </div>`;
}
function shell(active, body) {
  const st = F.stats();
  const nav = [
    ['dashboard', 'dash', 'Prehľad'], ['invoices', 'inv', 'Faktúry', st.overdueCount ? `<span class="cnt">${st.overdueCount}</span>` : ''], ['clients', 'users', 'Klienti'], ['expenses', 'exp', 'Výdavky'],
    ['recurring', 'rep', 'Opakované', F.has('recurring') ? '' : '<span class="lock">PRO</span>'], ['taxes', 'tax', 'Daňový radar', F.has('tax') ? '' : '<span class="lock">PRO</span>'], ['ai', 'ai', 'AI asistent'],
  ];
  const nav2 = [['notifications', 'bell', 'Upozornenia', F.unread() ? `<span class="cnt" style="background:var(--violet)">${F.unread()}</span>` : ''], ['billing', 'card', 'Predplatné'], ['settings', 'gear', 'Nastavenia']];
  const item = ([k, i, l, extra = '']) => `<a href="#/${k}" class="nav-i ${active === k ? 'on' : ''}">${ic(i)}<span>${l}</span>${extra}</a>`;
  app.innerHTML = `
  <div class="shell">
    <aside class="side" id="side">
      <a href="#/dashboard" class="logo">${LOGO}</a>
      <nav class="side-nav">${nav.map(item).join('')}<div class="side-sec">Účet</div>${nav2.map(item).join('')}</nav>
      <div class="side-foot">
        ${usageHTML()}
      </div>
    </aside>
    <div class="scrim" id="scrim" data-act="menu"></div>
    <div class="main">
      <header class="top">
        <button class="icon-btn menu-btn" data-act="menu" aria-label="Menu">${ic('menu')}</button>
        <button class="cmd" data-act="cmdk">${ic('ai')}<span class="t">Napíšte, čo chcete vyfakturovať, alebo hľadajte…</span><span class="kbd">⌘ K</span></button>
        <div class="top-r">
          <a href="#/invoices/new" class="btn btn-primary">${ic('plus')}<span class="t">Nová faktúra</span></a>
          <div style="position:relative"><button class="icon-btn" data-act="bell" aria-label="Upozornenia">${ic('bell')}${F.unread() ? `<span class="dot">${F.unread() > 9 ? '9+' : F.unread()}</span>` : ''}</button><div id="dropHost"></div></div>
          <button class="avatar" data-act="usermenu" title="${esc(S.user.name)}">${esc(initials(S.user.name))}</button>
        </div>
      </header>
      <main class="page">${body}</main>
    </div>
  </div>`;
  after.forEach((f) => f()); after = [];
}
let after = [];
const onMount = (f) => after.push(f);
function refreshChrome() { const box = $('#usageBox'); if (box) box.outerHTML = usageHTML(); }

/* ---------------- shared bits ---------------- */
const kpi = (l, v, d = '', cls = '') => `<div class="kpi ${cls}"><div class="l">${l}</div><div class="v">${v}</div><div class="d">${d}</div></div>`;
const delta = (x) => (x === 0 || !isFinite(x) ? '<span class="muted">—</span>' : `<span class="${x > 0 ? 'up' : 'down'}">${x > 0 ? '▲' : '▼'} ${Math.abs(Math.round(x * 100))} %</span> <span class="muted">oproti min. mesiacu</span>`);
const clientAv = (n, size = 36) => `<span class="ic" style="width:${size}px;height:${size}px;background:${avatarBg(n)};color:var(--ink);display:grid;place-items:center;border-radius:${Math.round(size / 3)}px;font-weight:700;font-size:${Math.round(size / 2.9)}px;flex:none">${esc(initials(n))}</span>`;
function barChart(data, { h = 170, keys = ['billed', 'paid'], colors = ['var(--ink)', 'var(--lime-2)'] } = {}) {
  const max = Math.max(1, ...data.flatMap((d) => keys.map((k) => d[k])));
  const W = 600, gw = W / data.length, bw = Math.min(16, (gw - 10) / keys.length);
  const grid = [0.25, 0.5, 0.75, 1].map((g) => `<line x1="0" x2="${W}" y1="${h - g * h}" y2="${h - g * h}" stroke="#E2DCCB" stroke-dasharray="3 4"/>`).join('');
  const bars = data.map((d, i) => keys.map((k, j) => { const bh = Math.max(d[k] ? 3 : 0, (d[k] / max) * (h - 6)); const x = i * gw + gw / 2 - (keys.length * bw) / 2 + j * bw; return `<rect x="${x}" y="${h - bh}" width="${bw - 3}" height="${bh}" rx="3" fill="${colors[j]}"><title>${d.label}: ${eur(d[k], 0)}</title></rect>`; }).join('')).join('');
  return `<svg viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" style="height:${h}px">${grid}${bars}</svg><div class="lbls">${data.map((d) => `<span>${d.label}</span>`).join('')}</div>`;
}

/* ================= DASHBOARD ================= */
function vDashboard() {
  const st = F.stats();
  const hr = new Date().getHours();
  const hi = hr < 10 ? 'Dobré ráno' : hr < 18 ? 'Dobrý deň' : 'Dobrý večer';
  const first = esc((S.user.name || '').split(' ')[0]);
  const todo = [...st.overdue.map((i) => ({ i, k: 'overdue' })), ...st.dueSoon.map((i) => ({ i, k: 'due' })), ...S.invoices.filter((i) => i.status === 'draft').map((i) => ({ i, k: 'draft' }))].slice(0, 6);
  const cl = [
    ['company', 'Vyplniť údaje firmy', '#/settings', !!S.company?.ico], ['iban', 'Pridať IBAN pre QR platby', '#/settings', F.ibanValid(S.company?.iban)],
    ['client', 'Pridať prvého klienta', '#/clients', S.clients.length > 0], ['invoice', 'Vystaviť prvú faktúru', '#/invoices/new', S.invoices.length > 0],
    ['dunning', 'Zapnúť automatické upomienky', '#/settings', F.has('dunning') && S.settings.autoDunning], ['push', 'Povoliť upozornenia v prehliadači', '#/notifications', !!S.settings.push],
  ];
  const done = cl.filter((c) => c[3]).length;
  onMount(() => loadInsights(false));
  return `
  <div class="page-h"><div><h1>${hi}, <em>${first}</em>.</h1><div class="sub">${st.overdueCount ? `Máte <b style="color:var(--coral)">${st.overdueCount} ${st.overdueCount === 1 ? 'faktúru' : 'faktúry'} po splatnosti</b> za ${eur(st.overdueSum)}.` : st.openCount ? `Čakáte na ${eur(st.openSum)} z ${F.plural(st.openCount, 'faktúry', 'faktúr', 'faktúr').replace(/^1 faktúry/, '1 faktúry')}. Všetko v termíne.` : 'Všetko je zaplatené. Pekná práca.'}</div></div>
    <div class="acts"><a href="#/expenses?scan=1" class="btn btn-ghost">${ic('cam')} Skenovať bloček</a><a href="#/invoices/new" class="btn btn-primary">${ic('plus')} Nová faktúra</a></div></div>
  <form class="aibar" data-form="aibar"><span class="spark">${ic('ai')}</span><input name="q" placeholder="Vyfakturuj Kaviareň Mlyn 6 hodín konzultácie po 45 €…" autocomplete="off"><button class="btn btn-lime">Vytvoriť faktúru</button></form>
  <div class="sugg">${['Vyfakturuj Mlyn 6 hodín konzultácie po 45 €', `Faktúra pre ${S.clients[1]?.name || 'Novák s.r.o.'}: web 1 800 €, splatnosť 30 dní`, 'Koľko si mám odkladať na dane?'].map((s) => `<button data-act="sugg" data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div>
  <div class="kpis">
    ${kpi('Vyfakturované tento mesiac', eur(st.thisM, 0), delta(st.momGrowth), 'dark')}
    ${kpi('Čaká na úhradu', eur(st.openSum, 0), `<span class="muted">${F.plural(st.openCount, 'faktúra', 'faktúry', 'faktúr')}</span>`)}
    ${kpi('Po splatnosti', `<span style="color:${st.overdueSum ? 'var(--coral)' : 'inherit'}">${eur(st.overdueSum, 0)}</span>`, st.overdueCount ? `<a href="#/invoices?f=overdue" style="color:var(--coral);font-weight:600">${F.plural(st.overdueCount, 'faktúra', 'faktúry', 'faktúr')} → riešiť</a>` : '<span class="up">všetko v poriadku</span>')}
    ${kpi('Zisk od začiatku roka', eur(st.profitYtd, 0), `<span class="muted">príjmy ${eur(st.incomeYtd, 0)} − výdavky ${eur(st.expYtd, 0)}</span>`)}
  </div>
  <div class="dash">
    <div>
      <div class="card"><div class="card-h"><h3>Cashflow za 12 mesiacov</h3><div class="legend"><span><i style="background:var(--ink)"></i>vyfakturované</span><span><i style="background:var(--lime-2)"></i>prijaté</span></div></div><div class="chart">${barChart(st.byMonth)}</div></div>
      <div class="card"><div class="card-h"><h3>Treba riešiť</h3><a href="#/invoices" class="btn btn-quiet btn-sm">Všetky faktúry</a></div>
        <div class="rows">${todo.length ? todo.map(({ i, k }) => `<div class="rowi">${clientAv(i.client.name)}<div class="t"><b>${esc(i.client.name)}</b><span>${esc(i.number)} · ${k === 'draft' ? 'koncept' : (k === 'overdue' ? `${-diffDays(i.dueDate, today())} dní po splatnosti` : `splatná ${fmtD(i.dueDate)}`)}</span></div><b class="mono">${eur(totals(i).total)}</b>${k === 'draft' ? `<a href="#/invoices/${i.id}/edit" class="btn btn-ghost btn-sm">Dokončiť</a>` : k === 'overdue' ? `<button class="btn btn-ai btn-sm" data-act="remind" data-id="${i.id}">${ic('ai')} Pripomenúť</button>` : `<a href="#/invoices/${i.id}" class="btn btn-ghost btn-sm">Detail</a>`}</div>`).join('') : `<div class="empty"><div class="serif">Čisto.</div>Nič nečaká na vašu pozornosť.</div>`}</div></div>
    </div>
    <div>
      <div class="card"><div class="card-h"><h3 style="display:flex;gap:8px;align-items:center"><span class="chip ai">AI</span> Postrehy pre vás</h3><button class="btn btn-quiet btn-sm" data-act="insights">Obnoviť</button></div><div id="insights"><div class="insight"><div class="k shimmer"></div><div style="flex:1"><div class="shimmer" style="height:14px;border-radius:6px;width:60%"></div><div class="shimmer" style="height:12px;border-radius:6px;margin-top:8px"></div></div></div></div></div>
      ${done < cl.length ? `<div class="card"><div class="card-h"><h3>Rozbehnite sa naplno</h3><span class="mono muted" style="font-size:13px">${done}/${cl.length}</span></div><div style="padding:14px 22px 4px"><div class="progress"><i style="width:${(done / cl.length) * 100}%"></i></div></div>${cl.map((c) => `<a href="${c[2]}" class="check ${c[3] ? 'done' : ''}"><span class="bx">${c[3] ? ic('check', 'width="13" stroke-width="3"') : ''}</span>${c[1]}</a>`).join('')}</div>` : ''}
      <div class="card"><div class="card-h"><h3>Najbližšie termíny</h3><a href="#/taxes" class="btn btn-quiet btn-sm">Daňový radar</a></div>${F.deadlines().slice(0, 4).map(dl).join('')}</div>
    </div>
  </div>`;
}
const dl = (d) => { const dt = F.parseD(d.date); const left = diffDays(d.date, today()); return `<div class="deadline"><div class="dt"><b>${dt.getDate()}</b><span>${MONTHS[dt.getMonth()]}</span></div><div style="flex:1"><b style="font-size:14px">${esc(d.title)}</b><div class="muted" style="font-size:12.5px">${esc(d.sub)}</div></div><span class="chip ${left <= 3 ? 'due' : 'draft'} plain">${left === 0 ? 'dnes' : `o ${left} d`}</span></div>`; };
const INS_COLORS = { cash: 'var(--mint)', risk: 'var(--coral)', tax: 'var(--amber)', growth: 'var(--violet)' };
let insightsCache = null;
async function loadInsights(force) {
  const box = $('#insights'); if (!box) return;
  const st = F.stats();
  const statsLite = { ytd: Math.round(st.billedYtd), thisMonth: Math.round(st.thisM), lastMonth: Math.round(st.lastM), momGrowth: +st.momGrowth.toFixed(2), openSum: Math.round(st.openSum), overdueSum: Math.round(st.overdueSum), overdueCount: st.overdueCount, topClient: st.topClient, topClientShare: +st.topClientShare.toFixed(2), avgPayDays: +st.avgPayDays.toFixed(1), vatPayer: st.vatPayer, turnover12: Math.round(st.turnover12), vatThresholdPct: +st.vatThresholdPct.toFixed(2), vatEta: st.vatEta, monthlyReserve: Math.round(st.monthlyReserve), expensesYtd: Math.round(st.expYtd) };
  let data, src = 'local';
  if (force) { const r = await runAI('insights', { stats: statsLite }); if (!r) return; data = r.data; src = r.source; insightsCache = { data, src, at: Date.now() }; }
  else if (insightsCache) ({ data, src } = insightsCache);
  else data = F.LOCAL.insights({ stats: statsLite });
  const b = $('#insights'); if (!b) return;
  b.innerHTML = (data.insights || []).map((x) => `<div class="insight"><div class="k" style="background:${INS_COLORS[x.kind] || 'var(--ink)'}"></div><div><b>${esc(x.title)}</b><p>${esc(x.body)}</p></div></div>`).join('') + `<div style="padding:8px 22px 12px;font-size:11.5px" class="muted">${src === 'ai' ? '✦ Vygenerované AI z vašich dát' : 'Pravidlá eFakturko · kliknite Obnoviť pre AI analýzu'}</div>`;
}

/* ================= INVOICES ================= */
function vInvoices() {
  const [, id, sub] = ROUTE.parts;
  if (id === 'new') return vEditor(null);
  if (id && sub === 'edit') return vEditor(id);
  if (id) return vDetail(id);
  const f = ROUTE.q.get('f') || 'all', q = (ROUTE.q.get('q') || '').toLowerCase();
  const all = S.invoices;
  const cnt = (k) => all.filter((i) => k === 'all' || status(i) === k || (k === 'open' && ['sent', 'due', 'overdue'].includes(status(i)))).length;
  const list = all.filter((i) => (f === 'all' || status(i) === f || (f === 'open' && ['sent', 'due', 'overdue'].includes(status(i)))) && (!q || (i.number + ' ' + i.client.name).toLowerCase().includes(q)));
  const sum = list.reduce((s, i) => s + totals(i).total, 0);
  const tabs = [['all', 'Všetky'], ['draft', 'Koncepty'], ['open', 'Neuhradené'], ['overdue', 'Po splatnosti'], ['paid', 'Zaplatené']];
  return `
  <div class="page-h"><div><h1>Faktúry</h1><div class="sub">${F.plural(list.length, 'faktúra', 'faktúry', 'faktúr')} · spolu <b class="mono">${eur(sum)}</b></div></div><div class="acts"><button class="btn btn-ghost" data-act="exportCsv">${ic('dl')} Export CSV</button><a href="#/invoices/new" class="btn btn-primary">${ic('plus')} Nová faktúra</a></div></div>
  <div class="toolbar"><div class="tabs">${tabs.map(([k, l]) => `<button class="${f === k ? 'on' : ''}" data-act="filter" data-f="${k}">${l}<span class="n">${cnt(k)}</span></button>`).join('')}</div>
    <div class="search">${ic('search')}<input class="input" placeholder="Hľadať číslo alebo klienta" value="${esc(q)}" data-act-input="searchInv"></div></div>
  <div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Číslo</th><th>Klient</th><th class="hide-m">Vystavená</th><th>Splatnosť</th><th class="r">Suma</th><th>Stav</th></tr></thead><tbody>
    ${list.map((i) => `<tr class="click" data-href="#/invoices/${i.id}${i.status === 'draft' ? '/edit' : ''}"><td class="mono"><b>${esc(i.number)}</b>${i.recurringId ? ` <span title="Opakovaná" style="color:var(--violet)">↻</span>` : ''}</td><td><div style="display:flex;gap:10px;align-items:center">${clientAv(i.client.name, 30)}<span>${esc(i.client.name)}</span></div></td><td class="mono muted hide-m">${fmtD(i.issueDate)}</td><td class="mono">${fmtD(i.dueDate)}</td><td class="r mono"><b>${eur(totals(i).total)}</b></td><td>${chip(status(i))}</td></tr>`).join('') || `<tr><td colspan="6"><div class="empty"><div class="serif">Zatiaľ nič.</div>Vytvorte prvú faktúru — s AI to trvá 10 sekúnd.<br><br><a href="#/invoices/new" class="btn btn-primary">${ic('plus')} Nová faktúra</a></div></td></tr>`}
  </tbody></table></div></div>`;
}

/* ---------- editor ---------- */
let ED = null;
function vEditor(id) {
  const existing = id ? S.invoices.find((i) => i.id === id) : null;
  if (!existing && !id) {
    const qi = F.quota('invoices');
    if (qi.left <= 0) { setTimeout(() => paywall('invoices'), 50); return `<div class="locked"><div class="blur">${'<div class="card card-pad" style="height:200px;margin-bottom:14px"></div>'.repeat(2)}</div><div class="over"><div class="lock-card"><div class="serif" style="font-size:34px;line-height:1">Limit 5 faktúr <em>vyčerpaný</em></div><p class="muted" style="margin:10px 0 18px">V pláne Štart máte 5 faktúr mesačne. Nový mesiac začína 1. ${MONTHS[(new Date().getMonth() + 1) % 12]}.</p><button class="btn btn-lime btn-lg" data-act="upgrade">Odomknúť neobmedzené faktúry</button></div></div></div>`; }
  }
  if (!ED || ED._for !== (id || 'new') || ROUTE.q.get('fresh')) {
    if (existing) ED = JSON.parse(JSON.stringify(existing));
    else {
      const t = today(); const { number } = F.nextNumber(t);
      const pre = window.__draft; window.__draft = null;
      const cid = ROUTE.q.get('client');
      const c = S.clients.find((x) => x.id === cid);
      ED = { id: null, number, vs: number, clientId: c?.id || '', client: c ? F.snap(c) : null, issueDate: t, deliveryDate: t, dueDate: addDays(t, S.settings.dueDays), items: [{ id: uid('l'), desc: '', qty: 1, unit: 'ks', price: 0, vat: S.company?.vatPayer ? 23 : 0 }], note: S.settings.note || '', status: 'draft', ai: false };
      if (pre) applyDraft(pre.data, pre.source);
    }
    ED._for = id || 'new';
    if (ROUTE.q.get('fresh')) { const q = new URLSearchParams(ROUTE.q); q.delete('fresh'); history.replaceState(null, '', '#/invoices/new' + (q.toString() ? '?' + q : '')); ROUTE.q = q; }
  }
  onMount(() => { updateTotals(); if (!ED.items[0].desc && !existing) $('#aiDraft')?.focus(); });
  const vp = !!S.company?.vatPayer;
  return `
  <div class="page-h"><div><a href="#/invoices" class="muted" style="font-size:13px">← Faktúry</a><h1 style="margin-top:6px">${existing ? 'Úprava faktúry' : 'Nová faktúra'} <span class="mono" style="font-size:22px;color:var(--muted)">${esc(ED.number)}</span></h1></div>
    <div class="acts"><button class="btn btn-ghost" data-act="saveInv" data-mode="draft">Uložiť koncept</button><button class="btn btn-primary" data-act="saveInv" data-mode="send">${ic('send')} Uložiť a odoslať</button></div></div>
  <form class="ai-box" data-form="aidraft"><span class="spark" style="width:30px;height:30px;border-radius:10px;background:linear-gradient(135deg,#7C3AED,#C026D3);display:grid;place-items:center;color:#fff;flex:none">${ic('ai', 'width="16"')}</span><input id="aiDraft" name="q" placeholder="Popíšte faktúru vetou — napr. „Mlyn: 6 hodín konzultácie po 45 €, splatnosť 7 dní“" autocomplete="off"><button class="btn btn-ai btn-sm">Vyplniť s AI</button></form>
  <div class="editor">
    <div style="display:flex;flex-direction:column;gap:18px">
      <div class="card card-pad">
        <div class="grid-2">
          <div class="field"><label>Odberateľ</label><div class="inline"><select class="select" data-f="clientId"><option value="">— vyberte klienta —</option>${S.clients.map((c) => `<option value="${c.id}" ${c.id === ED.clientId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select><button type="button" class="btn btn-ghost" data-act="newClient" data-from="editor" title="Nový klient">${ic('plus')}</button></div></div>
          <div class="field"><label>Variabilný symbol</label><input class="input mono" data-f="vs" value="${esc(ED.vs)}"></div>
        </div>
        <div id="clientCard" style="margin-top:12px">${ED.client ? clientMini(ED.client) : ''}</div>
        <div class="grid-3" style="margin-top:14px">
          <div class="field"><label>Dátum vystavenia</label><input type="date" class="input" data-f="issueDate" value="${ED.issueDate}"></div>
          <div class="field"><label>Dátum dodania</label><input type="date" class="input" data-f="deliveryDate" value="${ED.deliveryDate}"></div>
          <div class="field"><label>Splatnosť</label><input type="date" class="input" data-f="dueDate" value="${ED.dueDate}"></div>
        </div>
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">${[7, 14, 30].map((d) => `<button type="button" class="btn btn-quiet btn-sm" data-act="dueIn" data-d="${d}">+${d} dní</button>`).join('')}</div>
      </div>
      <div class="card card-pad">
        <div class="table-wrap"><table class="items"><thead><tr><th style="min-width:200px">Popis</th><th style="width:80px">Množ.</th><th style="width:80px">MJ</th><th style="width:120px">Cena/MJ</th>${vp ? '<th style="width:86px">DPH</th>' : ''}<th style="width:110px;text-align:right">Spolu</th><th></th></tr></thead><tbody id="itemsBody">${itemsRows()}</tbody></table></div>
        <button type="button" class="btn btn-ghost btn-sm" data-act="addItem" style="margin-top:10px">${ic('plus')} Pridať položku</button>
        <div class="field" style="margin-top:18px"><label>Poznámka na faktúre</label><textarea class="textarea" data-f="note" placeholder="Napr. Ďakujeme za spoluprácu.">${esc(ED.note)}</textarea></div>
      </div>
    </div>
    <div class="sticky"><div class="card card-pad" id="sumCard"></div></div>
  </div>`;
}
const clientMini = (c) => `<div style="display:flex;gap:12px;align-items:center;background:var(--paper);border-radius:12px;padding:10px 12px">${clientAv(c.name, 34)}<div style="font-size:13px;line-height:1.4"><b>${esc(c.name)}</b><div class="muted">${esc(c.address || 'bez adresy')} · IČO ${esc(c.ico || '—')}${c.icdph ? ' · ' + esc(c.icdph) : ''}</div></div></div>`;
function itemsRows() {
  const vp = !!S.company?.vatPayer;
  return ED.items.map((it, k) => `<tr>
    <td><input class="input" data-it="${k}" data-k="desc" value="${esc(it.desc)}" placeholder="Popis položky"></td>
    <td><input class="input num" data-it="${k}" data-k="qty" value="${it.qty}" inputmode="decimal"></td>
    <td><select class="select" data-it="${k}" data-k="unit">${['ks', 'hod', 'deň', 'mes', 'km', 'm2', 'bal'].map((u) => `<option ${u === it.unit ? 'selected' : ''}>${u}</option>`).join('')}</select></td>
    <td><input class="input num" data-it="${k}" data-k="price" value="${it.price}" inputmode="decimal"></td>
    ${vp ? `<td><select class="select" data-it="${k}" data-k="vat">${VAT_RATES.map((r) => `<option value="${r}" ${+it.vat === r ? 'selected' : ''}>${r} %</option>`).join('')}</select></td>` : ''}
    <td class="mono" style="text-align:right;padding-top:13px" data-line="${k}">${nf(round2(it.qty * it.price))}</td>
    <td><button type="button" class="rm" data-act="rmItem" data-k="${k}" aria-label="Odstrániť">${ic('x', 'width="15"')}</button></td></tr>`).join('');
}
function updateTotals() {
  const t = totals(ED); const box = $('#sumCard'); if (!box) return;
  ED.items.forEach((it, k) => { const c = $(`[data-line="${k}"]`); if (c) c.textContent = nf(round2(it.qty * it.price)); });
  const vp = !!S.company?.vatPayer;
  box.innerHTML = `<div class="lbl" style="margin-bottom:10px">Súhrn</div>
    <div class="sum-row"><span class="muted">Základ</span><b class="mono">${eur(t.base)}</b></div>
    ${vp ? t.groups.map((g) => `<div class="sum-row"><span class="muted">DPH ${g.rate} % z ${eur(g.base)}</span><b class="mono">${eur(g.vat)}</b></div>`).join('') : `<div class="sum-row"><span class="muted">DPH</span><span class="muted" style="font-size:12.5px">nie ste platiteľ</span></div>`}
    <div class="sum-row total"><span>K úhrade</span><span class="mono">${eur(t.total)}</span></div>
    <div class="divider"></div>
    <div style="display:flex;gap:10px;align-items:center;font-size:13px" class="muted">${ic('money', 'width="16"')} <span>QR PAY by square sa pridá automaticky${F.ibanValid(S.company?.iban) ? '' : ' — <a href="#/settings" style="color:var(--coral)">doplňte IBAN</a>'}</span></div>
    ${!F.has('nobrand') ? `<div style="display:flex;gap:10px;align-items:center;font-size:13px;margin-top:8px" class="muted">${ic('lock', 'width="16"')} <span>Pätička „Vystavené cez eFakturko“ · <a href="#" data-act="upgrade" style="color:var(--ink);font-weight:600">odstrániť</a></span></div>` : ''}`;
}
function applyDraft(d, source) {
  if (!d) return;
  let c = S.clients.find((x) => x.name === d.clientName) || S.clients.find((x) => F.norm(x.name).includes(F.norm(d.clientName)) && d.clientName);
  if (!c && d.clientName) { c = { id: uid('c'), name: d.clientName, ico: '', dic: '', icdph: '', address: '', email: '', createdAt: Date.now() }; S.clients.push(c); toast(`Nový klient „${esc(d.clientName)}“ pridaný — doplňte IČO`, 'ai'); }
  if (c) { ED.clientId = c.id; ED.client = F.snap(c); }
  if (d.items?.length) ED.items = d.items.map((it) => ({ id: uid('l'), desc: it.description, qty: +it.quantity || 1, unit: it.unit || 'ks', price: +it.unitPrice || 0, vat: S.company?.vatPayer ? (VAT_RATES.includes(+it.vatRate) ? +it.vatRate : 23) : 0 }));
  if (d.dueDays) ED.dueDate = addDays(ED.issueDate, +d.dueDays);
  if (d.note) ED.note = d.note;
  ED.ai = true; ED.aiSource = source;
}
function saveInvoice(mode) {
  if (!ED.clientId) return toast('Vyberte odberateľa', 'err');
  const items = ED.items.filter((i) => i.desc.trim() || +i.price);
  if (!items.length) return toast('Pridajte aspoň jednu položku', 'err');
  if (items.some((i) => !i.desc.trim())) return toast('Každá položka potrebuje popis', 'err');
  const c = S.clients.find((x) => x.id === ED.clientId);
  const isNew = !ED.id;
  if (isNew) {
    const qi = F.quota('invoices'); if (qi.left <= 0) return paywall('invoices');
    const { y, n, number } = F.nextNumber(ED.issueDate);
    if (ED.number !== number) { ED.number = number; if (/^\d+$/.test(ED.vs)) ED.vs = number; }
    F.commitNumber(y, n);
  }
  const inv = { ...ED, items, client: F.snap(c) };
  delete inv._for;
  if (isNew) { inv.id = uid('i'); inv.createdAt = Date.now(); inv.events = [{ at: Date.now(), text: inv.ai ? 'Faktúra vytvorená s pomocou AI' : 'Faktúra vytvorená' }]; inv.reminders = []; S.invoices.unshift(inv); S.usage.invoices++; F.track('invoice_create'); if (inv.ai) F.track('invoice_ai'); }
  else { const k = S.invoices.findIndex((i) => i.id === inv.id); inv.events = [...(inv.events || []), { at: Date.now(), text: 'Faktúra upravená' }]; S.invoices[k] = inv; }
  if (mode === 'send' && inv.status === 'draft') { inv.status = 'sent'; inv.sentAt = Date.now(); inv.events.push({ at: Date.now(), text: `Odoslaná na ${inv.client.email || 'e‑mail klienta'}` }); F.track('invoice_send'); }
  S.invoices.sort((a, b) => b.issueDate.localeCompare(a.issueDate) || b.number.localeCompare(a.number));
  F.save(); ED = null;
  toast(mode === 'send' ? `Faktúra ${inv.number} odoslaná${inv.client.email ? ' na ' + esc(inv.client.email) : ''}` : 'Koncept uložený');
  if (isNew && S.usage.invoices === 1 && S.invoices.length === 1) setTimeout(() => celebrate(), 300);
  go('#/invoices/' + inv.id);
}
function celebrate() {
  modal(`<div class="modal-b" style="text-align:center;padding:40px 28px"><div style="font-size:54px">🎉</div><h2 class="serif" style="font-size:40px;line-height:1;margin-top:8px">Prvá faktúra <em>vonku!</em></h2><p class="muted" style="margin:10px 0 22px">Keď klient zaplatí, označte ju jedným klikom. Ak bude meškať, eFakturko mu slušne pripomenie.</p><button class="btn btn-primary btn-lg" data-act="close">Super</button></div>`);
}

/* ---------- detail ---------- */
function vDetail(id) {
  const inv = S.invoices.find((i) => i.id === id);
  if (!inv) return `<div class="empty"><div class="serif">Faktúra neexistuje.</div><a href="#/invoices" class="btn btn-ghost">Späť na faktúry</a></div>`;
  const st = status(inv); const t = totals(inv);
  const late = st === 'overdue' ? -diffDays(inv.dueDate, today()) : 0;
  return `
  <div class="page-h"><div><a href="#/invoices" class="muted" style="font-size:13px">← Faktúry</a><h1 style="margin-top:6px">Faktúra <span class="mono" style="font-size:30px">${esc(inv.number)}</span></h1><div class="sub" style="display:flex;gap:10px;align-items:center">${chip(st)} ${late ? `<span style="color:var(--coral);font-weight:600">${late} dní po splatnosti</span>` : ''}</div></div>
    <div class="acts">
      ${inv.status !== 'paid' ? `<button class="btn btn-lime" data-act="markPaid" data-id="${inv.id}">${ic('check')} Označiť ako zaplatenú</button>` : `<button class="btn btn-ghost" data-act="markUnpaid" data-id="${inv.id}">Zrušiť úhradu</button>`}
      ${inv.status === 'draft' ? `<button class="btn btn-primary" data-act="send" data-id="${inv.id}">${ic('send')} Odoslať</button>` : ''}
      <button class="btn btn-ghost" data-act="print">${ic('print')} PDF</button>
    </div></div>
  <div class="detail">
    <div>${paper(inv)}</div>
    <div style="display:flex;flex-direction:column;gap:14px" class="sticky">
      <div class="card card-pad" style="display:flex;flex-direction:column;gap:8px">
        <div class="lbl" style="margin-bottom:4px">Akcie</div>
        ${['overdue', 'due', 'sent'].includes(st) ? `<button class="btn btn-ai btn-block" data-act="remind" data-id="${inv.id}">${ic('ai')} Napísať upomienku s AI</button>` : ''}
        <button class="btn btn-ghost btn-block" data-act="mail" data-id="${inv.id}">${ic('mail')} Poslať e‑mailom</button>
        <button class="btn btn-ghost btn-block" data-act="ubl" data-id="${inv.id}">${ic('xml')} e‑Faktúra (UBL XML) ${F.has('ubl') ? '' : '<span class="tag-plan pro" style="margin-left:auto">Pro</span>'}</button>
        <a class="btn btn-ghost btn-block" href="#/invoices/${inv.id}/edit">${ic('edit')} Upraviť</a>
        <button class="btn btn-ghost btn-block" data-act="dup" data-id="${inv.id}">${ic('copy')} Duplikovať</button>
        <button class="btn btn-ghost btn-block" data-act="toRecurring" data-id="${inv.id}">${ic('rep')} Opakovať mesačne ${F.has('recurring') ? '' : '<span class="tag-plan pro" style="margin-left:auto">Pro</span>'}</button>
        <button class="btn btn-quiet btn-block" data-act="delInv" data-id="${inv.id}" style="color:var(--coral)">${ic('trash')} Zmazať</button>
      </div>
      <div class="card"><div class="card-h"><h3>Súhrn</h3></div><div style="padding:14px 22px"><div class="kv"><span class="muted">Suma</span><b>${eur(t.total)}</b></div><div class="kv"><span class="muted">Splatnosť</span><b>${fmtD(inv.dueDate)}</b></div>${inv.paidAt ? `<div class="kv"><span class="muted">Zaplatená</span><b>${fmtD(inv.paidAt)}</b></div>` : ''}<div class="kv"><span class="muted">Upomienky</span><b>${(inv.reminders || []).length}/3</b></div></div></div>
      <div class="card"><div class="card-h"><h3>História</h3></div><div class="timeline">${[...(inv.events || [])].reverse().map((e) => `<div class="tl"><i></i><div>${esc(e.text)}<span>${new Date(e.at).toLocaleString('sk-SK', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div></div>`).join('')}</div></div>
    </div>
  </div>`;
}
function paper(inv) {
  const c = S.company || {}; const t = totals(inv); const vp = !!c.vatPayer;
  const qr = F.qrSvg(inv);
  return `<div class="paper" style="--accent:${esc(S.settings.accent || '#2E1065')}">
    ${inv.status === 'paid' ? '<div class="paid-stamp">ZAPLATENÉ</div>' : ''}
    <div class="ph"><div class="brand"><div class="lg">${esc(initials(c.name))}</div><div><b style="font-size:15px">${esc(c.name)}</b><div class="muted" style="font-size:12px">${esc(c.email || '')}${c.phone ? ' · ' + esc(c.phone) : ''}</div></div></div>
      <div style="text-align:right"><div class="muted" style="font-size:10px;text-transform:uppercase;letter-spacing:.14em">Faktúra</div><h2>${esc(inv.number)}</h2></div></div>
    <div class="parties">
      <div><div class="lb">Dodávateľ</div><b>${esc(c.name)}</b><div>${esc(c.address)}</div><div style="margin-top:6px" class="mono">IČO: ${esc(c.ico)}${c.dic ? '<br>DIČ: ' + esc(c.dic) : ''}${c.icdph ? '<br>IČ DPH: ' + esc(c.icdph) : ''}</div>${c.register ? `<div class="muted" style="font-size:11px;margin-top:6px">${esc(c.register)}</div>` : ''}</div>
      <div><div class="lb">Odberateľ</div><b>${esc(inv.client.name)}</b><div>${esc(inv.client.address)}</div><div style="margin-top:6px" class="mono">${inv.client.ico ? 'IČO: ' + esc(inv.client.ico) : ''}${inv.client.dic ? '<br>DIČ: ' + esc(inv.client.dic) : ''}${inv.client.icdph ? '<br>IČ DPH: ' + esc(inv.client.icdph) : ''}</div></div>
    </div>
    <div class="meta"><div><div class="lb">Vystavená</div><b>${fmtD(inv.issueDate)}</b></div><div><div class="lb">Dodanie</div><b>${fmtD(inv.deliveryDate)}</b></div><div><div class="lb">Splatnosť</div><b>${fmtD(inv.dueDate)}</b></div><div><div class="lb">Var. symbol</div><b>${esc(inv.vs)}</b></div></div>
    <table><thead><tr><th>Popis</th><th class="r">Množstvo</th><th class="r">Cena/MJ</th>${vp ? '<th class="r">DPH</th>' : ''}<th class="r">Spolu${vp ? ' bez DPH' : ''}</th></tr></thead><tbody>
      ${inv.items.map((it) => `<tr><td>${esc(it.desc)}</td><td class="r mono">${nf(it.qty, it.qty % 1 ? 2 : 0)} ${esc(it.unit)}</td><td class="r mono">${nf(it.price)}</td>${vp ? `<td class="r mono">${it.vat} %</td>` : ''}<td class="r mono">${nf(round2(it.qty * it.price))}</td></tr>`).join('')}
    </tbody></table>
    <div class="foot">
      <div class="qrbox">${qr ? `${qr}<div class="pbs">PAY by square</div>` : `<div style="width:130px;height:130px;border:1px dashed var(--line-2);border-radius:8px;display:grid;place-items:center;padding:10px">Doplňte IBAN pre QR platbu</div>`}</div>
      <div>
        <div class="mono" style="font-size:12px;line-height:1.7"><span class="muted">IBAN</span> ${esc(F.ibanFmt(c.iban))}${F.bankOf(c.iban) ? ` <span class="muted">· ${esc(F.bankOf(c.iban))}</span>` : ''}<br><span class="muted">Spôsob úhrady</span> bankový prevod · <span class="muted">KS</span> 0308</div>
        <div style="margin-top:10px">${vp ? t.groups.map((g) => `<div class="kv"><span class="muted">Základ ${g.rate} %</span><b>${eur(g.base)}</b></div><div class="kv"><span class="muted">DPH ${g.rate} %</span><b>${eur(g.vat)}</b></div>`).join('') : ''}</div>
        <div class="grand"><span>K úhrade</span><b>${eur(t.total)}</b></div>
      </div>
    </div>
    <div class="note">${vp ? '' : 'Dodávateľ nie je platiteľ DPH. '}${esc(inv.note || '')}<br>Vyhotovil(a): ${esc(c.person || S.user?.name || '')}</div>
    ${F.has('nobrand') ? '' : '<div class="wm">Vystavené cez <b>eFakturko</b> — fakturácia s AI · efakturko.netlify.app</div>'}
  </div>`;
}

/* ---------- reminder (AI dunning) ---------- */
async function remindFlow(id) {
  const inv = S.invoices.find((i) => i.id === id); if (!inv) return;
  const level = Math.min(3, (inv.reminders || []).length + 1);
  const m = modal(`${mh('Upomienka s AI', `${esc(inv.number)} · ${esc(inv.client.name)}`)}<div class="modal-b">
    <div class="tabs" style="margin-bottom:14px">${[1, 2, 3].map((l) => `<button data-lv="${l}" class="${l === level ? 'on' : ''}">${['Priateľská', 'Vecná', 'Posledná výzva'][l - 1]}</button>`).join('')}</div>
    <div class="field"><label>Predmet</label><input class="input" id="dSub"></div>
    <div class="field" style="margin-top:12px"><label>Text e‑mailu</label><textarea class="textarea" id="dBody" style="min-height:240px"></textarea></div>
    <div style="display:flex;gap:8px;justify-content:space-between;margin-top:16px;flex-wrap:wrap"><button class="btn btn-ghost" id="dRe">${ic('ai')} Prepísať s AI</button><button class="btn btn-primary" id="dSend">${ic('send')} Odoslať upomienku</button></div>
    ${!F.has('dunning') ? `<div style="margin-top:14px;background:var(--paper);border-radius:12px;padding:12px;font-size:13px">💡 S plánom Pro odchádzajú upomienky automaticky v deň 1, 7 a 14 po splatnosti. <a href="#" data-act="upgrade" style="font-weight:700">Zapnúť</a></div>` : ''}
  </div>`);
  let lv = level;
  const fill = (d) => { $('#dSub', m).value = d.subject; $('#dBody', m).value = d.body; };
  const inp = () => ({ level: lv, invoice: { number: inv.number, dueDate: inv.dueDate, total: totals(inv).total, vs: inv.vs, client: inv.client.name, daysLate: Math.max(0, -diffDays(inv.dueDate, today())) }, company: { name: S.company.name, iban: S.company.iban } });
  fill(F.LOCAL.dunning(inp()));
  m.addEventListener('click', (e) => { const b = e.target.closest('[data-lv]'); if (b) { lv = +b.dataset.lv; $$('[data-lv]', m).forEach((x) => x.classList.toggle('on', x === b)); fill(F.LOCAL.dunning(inp())); } });
  $('#dRe', m).onclick = async () => { const b = $('#dRe', m); b.innerHTML = '<span class="spinner"></span> Píšem…'; $('#dBody', m).classList.add('shimmer'); const r = await runAI('dunning', inp()); $('#dBody', m)?.classList.remove('shimmer'); if (!$('#dRe', m)) return; b.innerHTML = `${ic('ai')} Prepísať s AI`; if (r) fill(r.data); };
  $('#dSend', m).onclick = () => {
    inv.reminders = [...(inv.reminders || []), { level: lv, at: Date.now(), subject: $('#dSub', m).value }];
    inv.events.push({ at: Date.now(), text: `Upomienka ${lv}/3 odoslaná${inv.client.email ? ' na ' + inv.client.email : ''}` });
    F.track('dunning_manual'); F.save(); closeModal();
    if (inv.client.email) { const a = document.createElement('a'); a.href = `mailto:${encodeURIComponent(inv.client.email)}?subject=${encodeURIComponent($('#dSub', m).value)}&body=${encodeURIComponent($('#dBody', m).value)}`; a.click(); }
    toast('Upomienka odoslaná'); render();
  };
}

/* ================= CLIENTS ================= */
function vClients() {
  const q = (ROUTE.q.get('q') || '').toLowerCase();
  const rows = S.clients.filter((c) => !q || (c.name + c.ico).toLowerCase().includes(q)).map((c) => {
    const inv = S.invoices.filter((i) => i.clientId === c.id && i.status !== 'draft');
    const billed = inv.reduce((s, i) => s + totals(i).total, 0);
    const open = inv.filter((i) => i.status !== 'paid').reduce((s, i) => s + totals(i).total, 0);
    const lates = inv.filter((i) => i.paidAt).map((i) => diffDays(i.paidAt, i.dueDate));
    const avg = lates.length ? lates.reduce((a, b) => a + b, 0) / lates.length : null;
    return { c, billed, open, avg, n: inv.length };
  }).sort((a, b) => b.billed - a.billed);
  return `
  <div class="page-h"><div><h1>Klienti</h1><div class="sub">${S.clients.length} klientov · platobná morálka počítaná z histórie</div></div><div class="acts"><button class="btn btn-primary" data-act="newClient">${ic('plus')} Nový klient</button></div></div>
  <div class="toolbar"><div class="search">${ic('search')}<input class="input" placeholder="Hľadať názov alebo IČO" value="${esc(q)}" data-act-input="searchCli"></div></div>
  <div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Klient</th><th class="hide-m">IČO</th><th class="r">Vyfakturované</th><th class="r">Neuhradené</th><th>Platobná morálka</th><th></th></tr></thead><tbody>
  ${rows.map(({ c, billed, open, avg, n }) => `<tr><td><div style="display:flex;gap:10px;align-items:center">${clientAv(c.name, 34)}<div><b>${esc(c.name)}</b><div class="muted" style="font-size:12.5px">${esc(c.email || 'bez e‑mailu')} · ${n} faktúr</div></div></div></td><td class="mono hide-m">${esc(c.ico || '—')}</td><td class="r mono">${eur(billed, 0)}</td><td class="r mono" style="color:${open ? 'var(--ink)' : 'var(--muted)'}">${eur(open, 0)}</td>
    <td>${avg === null ? '<span class="muted">—</span>' : avg <= 1 ? '<span class="chip paid">platí včas</span>' : avg <= 7 ? `<span class="chip due">+${Math.round(avg)} dní</span>` : `<span class="chip overdue">+${Math.round(avg)} dní</span>`}</td>
    <td style="white-space:nowrap;text-align:right"><a class="btn btn-ghost btn-sm" href="#/invoices/new?client=${c.id}&fresh=1">Fakturovať</a> <button class="btn btn-quiet btn-sm" data-act="editClient" data-id="${c.id}">${ic('edit', 'width="15"')}</button></td></tr>`).join('') || `<tr><td colspan="6"><div class="empty"><div class="serif">Žiadni klienti.</div>Pridajte klienta podľa IČO — údaje doplníme z registra.</div></td></tr>`}
  </tbody></table></div></div>`;
}
function clientForm(c, from) {
  const isNew = !c; c = c || { name: '', ico: '', dic: '', icdph: '', address: '', email: '' };
  const m = modal(`${mh(isNew ? 'Nový klient' : 'Upraviť klienta', 'Zadajte IČO a údaje doplníme z obchodného registra')}<div class="modal-b"><form id="cf" style="display:flex;flex-direction:column;gap:12px">
    <div class="field"><label>IČO</label><div class="inline"><input class="input mono" name="ico" value="${esc(c.ico)}" placeholder="12345678" inputmode="numeric" autofocus><button type="button" class="btn btn-ghost" id="lk">${ic('search')} Načítať</button></div></div>
    <div class="field"><label>Názov</label><input class="input" name="name" value="${esc(c.name)}" required></div>
    <div class="field"><label>Adresa</label><input class="input" name="address" value="${esc(c.address)}"></div>
    <div class="grid-2"><div class="field"><label>DIČ</label><input class="input mono" name="dic" value="${esc(c.dic)}"></div><div class="field"><label>IČ DPH</label><input class="input mono" name="icdph" value="${esc(c.icdph)}"></div></div>
    <div class="field"><label>E‑mail pre faktúry</label><input class="input" type="email" name="email" value="${esc(c.email)}"></div>
    <div style="display:flex;justify-content:space-between;gap:8px;margin-top:6px">${!isNew ? `<button type="button" class="btn btn-quiet" id="del" style="color:var(--coral)">${ic('trash')} Zmazať</button>` : '<span></span>'}<button class="btn btn-primary">${isNew ? 'Pridať klienta' : 'Uložiť'}</button></div>
  </form></div>`);
  const f = $('#cf', m);
  $('#lk', m).onclick = async () => { const b = $('#lk', m); b.innerHTML = '<span class="spinner"></span>'; const r = await F.lookupIco(f.ico.value); b.innerHTML = `${ic('search')} Načítať`; if (!r) return toast('Firmu sa nepodarilo nájsť — vyplňte ručne', 'err'); f.name.value = r.name; f.address.value = r.address; if (r.dic) f.dic.value = r.dic; if (r.icdph) f.icdph.value = r.icdph; toast('Údaje načítané z registra'); };
  const del = $('#del', m); if (del) del.onclick = async () => { if (await confirmBox('Zmazať klienta?', 'Faktúry klienta zostanú zachované.', 'Zmazať', true)) { S.clients = S.clients.filter((x) => x.id !== c.id); F.save(); render(); } };
  f.onsubmit = (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f)); if (!d.name.trim()) return;
    if (isNew) { const nc = { id: uid('c'), createdAt: Date.now(), ...d }; S.clients.push(nc); F.track('client_create'); if (from === 'editor' && ED) { ED.clientId = nc.id; ED.client = F.snap(nc); } }
    else Object.assign(S.clients.find((x) => x.id === c.id), d);
    F.save(); closeModal(); toast(isNew ? 'Klient pridaný' : 'Uložené');
    if (from === 'editor') { const sel = $('[data-f="clientId"]'); if (sel) { sel.innerHTML = `<option value="">— vyberte klienta —</option>` + S.clients.map((x) => `<option value="${x.id}" ${x.id === ED.clientId ? 'selected' : ''}>${esc(x.name)}</option>`).join(''); if (ED.client) $('#clientCard').innerHTML = clientMini(ED.client); } }
    else render();
  };
}

/* ================= EXPENSES ================= */
function vExpenses() {
  const y = today().slice(0, 4);
  const list = [...S.expenses].sort((a, b) => b.date.localeCompare(a.date));
  const ytd = list.filter((e) => e.date.startsWith(y));
  const byCat = {}; ytd.forEach((e) => (byCat[e.category] = (byCat[e.category] || 0) + +e.total));
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]); const tot = ytd.reduce((s, e) => s + +e.total, 0);
  if (ROUTE.q.get('scan')) onMount(() => $('#scanFile')?.click());
  return `
  <div class="page-h"><div><h1>Výdavky</h1><div class="sub">Tento rok <b class="mono">${eur(tot)}</b> · ${ytd.length} dokladov</div></div><div class="acts"><button class="btn btn-ghost" data-act="newExpense">${ic('plus')} Pridať ručne</button><label class="btn btn-ai" style="cursor:pointer">${ic('cam')} Skenovať bloček s AI<input type="file" id="scanFile" accept="image/*" capture="environment" hidden></label></div></div>
  <div class="dash">
    <div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Dátum</th><th>Dodávateľ</th><th class="hide-m">Kategória</th><th class="r">Suma</th><th></th></tr></thead><tbody>
      ${list.map((e) => `<tr><td class="mono muted">${fmtD(e.date)}</td><td><b>${esc(e.vendor)}</b>${e.ai ? ' <span class="chip ai plain" style="height:20px;font-size:10.5px">AI</span>' : ''}${e.description ? `<div class="muted" style="font-size:12.5px">${esc(e.description)}</div>` : ''}</td><td class="hide-m"><span class="chip draft plain">${esc(e.category)}</span></td><td class="r mono"><b>${eur(e.total)}</b></td><td style="text-align:right"><button class="btn btn-quiet btn-sm" data-act="editExpense" data-id="${e.id}">${ic('edit', 'width="15"')}</button></td></tr>`).join('') || `<tr><td colspan="5"><div class="empty"><div class="serif">Žiadne výdavky.</div>Odfoťte bloček — AI vyčíta sumu, DPH aj kategóriu.</div></td></tr>`}
    </tbody></table></div></div>
    <div><div class="card"><div class="card-h"><h3>Podľa kategórií · ${y}</h3></div><div style="padding:14px 22px">${cats.map(([k, v]) => `<div class="feat-bar"><span>${esc(k)}</span><div class="progress"><i style="width:${(v / (cats[0][1] || 1)) * 100}%"></i></div><b>${eur(v, 0)}</b></div>`).join('') || '<div class="muted">Zatiaľ bez dát</div>'}</div></div></div>
  </div>`;
}
const EXP_CATS = ['Kancelária', 'Software', 'Cestovné', 'Pohonné hmoty', 'Telefón a internet', 'Marketing', 'Materiál', 'Strava', 'Vzdelávanie', 'Iné'];
function expenseForm(e, { scanned, preview } = {}) {
  const isNew = !e?.id; e = { vendor: '', category: 'Iné', total: '', vatAmount: '', vatRate: 23, date: today(), description: '', ...(e || {}) };
  const m = modal(`${mh(isNew ? (scanned ? 'Skontrolujte výdavok' : 'Nový výdavok') : 'Upraviť výdavok', scanned ? (scanned === 'ai' ? '✦ Vyčítané AI z bločku — overte údaje' : 'AI je offline — doplňte údaje ručne') : '')}<div class="modal-b">
    ${preview ? `<img src="${preview}" alt="Bloček" style="max-height:160px;border-radius:12px;margin:0 auto 14px;border:1px solid var(--line)">` : ''}
    <form id="ef" style="display:flex;flex-direction:column;gap:12px">
      <div class="grid-2"><div class="field"><label>Dodávateľ</label><input class="input" name="vendor" value="${esc(e.vendor)}" required autofocus></div><div class="field"><label>Dátum</label><input class="input" type="date" name="date" value="${esc(e.date)}"></div></div>
      <div class="grid-3"><div class="field"><label>Suma s DPH</label><input class="input num" name="total" value="${esc(e.total)}" inputmode="decimal" required></div><div class="field"><label>Z toho DPH</label><input class="input num" name="vatAmount" value="${esc(e.vatAmount)}" inputmode="decimal"></div><div class="field"><label>Kategória</label><select class="select" name="category">${EXP_CATS.map((c) => `<option ${c === e.category ? 'selected' : ''}>${c}</option>`).join('')}</select></div></div>
      <div class="field"><label>Popis</label><input class="input" name="description" value="${esc(e.description)}"></div>
      <div style="display:flex;justify-content:space-between;gap:8px">${!isNew ? `<button type="button" class="btn btn-quiet" id="del" style="color:var(--coral)">${ic('trash')} Zmazať</button>` : '<span></span>'}<button class="btn btn-primary">Uložiť výdavok</button></div>
    </form></div>`);
  const f = $('#ef', m);
  const del = $('#del', m); if (del) del.onclick = () => { S.expenses = S.expenses.filter((x) => x.id !== e.id); F.save(); closeModal(); render(); };
  f.onsubmit = (ev) => {
    ev.preventDefault(); const d = Object.fromEntries(new FormData(f));
    d.total = +String(d.total).replace(',', '.') || 0; d.vatAmount = +String(d.vatAmount).replace(',', '.') || 0;
    if (isNew) { S.expenses.unshift({ id: uid('e'), createdAt: Date.now(), ai: scanned === 'ai', ...d }); F.track('expense_create'); } else Object.assign(S.expenses.find((x) => x.id === e.id), d);
    F.save(); closeModal(); toast('Výdavok uložený'); render();
  };
}
async function scanReceipt(file) {
  if (!file) return;
  const dataUrl = await shrink(file);
  modal(`<div class="modal-b" style="text-align:center;padding:40px"><img src="${dataUrl}" style="max-height:200px;margin:0 auto 18px;border-radius:12px" alt=""><div style="display:flex;gap:10px;justify-content:center;align-items:center;color:var(--violet);font-weight:600"><span class="spinner"></span> AI číta bloček…</div></div>`);
  const r = await runAI('receipt_scan', { image: dataUrl });
  if (!r) return closeModal();
  const d = r.data;
  expenseForm({ vendor: d.vendor, date: d.date || today(), total: d.total || '', vatAmount: d.vatAmount || '', category: d.category || 'Iné', description: d.description || '' }, { scanned: r.source, preview: dataUrl });
}
function shrink(file, max = 1400) {
  return new Promise((res, rej) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)); const cv = document.createElement('canvas'); cv.width = img.width * k; cv.height = img.height * k; cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url); res(cv.toDataURL('image/jpeg', 0.85)); };
    img.onerror = rej; img.src = url;
  });
}

/* ================= RECURRING ================= */
function vRecurring() {
  const locked = !F.has('recurring');
  const body = `
  <div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Klient</th><th>Položky</th><th class="r">Suma</th><th>Ďalšia faktúra</th><th>Odoslanie</th><th>Aktívna</th><th></th></tr></thead><tbody>
  ${S.recurring.map((r) => { const c = S.clients.find((x) => x.id === r.clientId) || r.client; const t = totals({ items: r.items }); return `<tr><td><b>${esc(c?.name)}</b></td><td class="muted">${esc(r.items.map((i) => i.desc).join(', '))}</td><td class="r mono"><b>${eur(t.total)}</b></td><td class="mono">${fmtD(r.nextDate)}<div class="muted" style="font-size:12px">každý ${r.every === 1 ? 'mesiac' : r.every + '. mesiac'}</div></td><td>${r.autoSend ? '<span class="chip sent">automaticky</span>' : '<span class="chip draft">ako koncept</span>'}</td><td><label class="switch"><input type="checkbox" data-act-change="recToggle" data-id="${r.id}" ${r.active ? 'checked' : ''}><span></span></label></td><td style="white-space:nowrap;text-align:right"><button class="btn btn-ghost btn-sm" data-act="recRun" data-id="${r.id}">${ic('play', 'width="13"')} Vystaviť teraz</button> <button class="btn btn-quiet btn-sm" data-act="recDel" data-id="${r.id}">${ic('trash', 'width="15"')}</button></td></tr>`; }).join('') || `<tr><td colspan="7"><div class="empty"><div class="serif">Žiadne opakované faktúry.</div>Otvorte ľubovoľnú faktúru a zvoľte „Opakovať mesačne“.</div></td></tr>`}
  </tbody></table></div></div>`;
  return `<div class="page-h"><div><h1>Opakované <em>faktúry</em></h1><div class="sub">Paušály a predplatné sa vystavia a odošlú samé — vy len sledujete platby.</div></div><div class="acts"><button class="btn btn-primary" data-act="newRec">${ic('plus')} Nová opakovaná</button></div></div>
  ${locked ? lockWrap(body, 'recurring') : body}`;
}
function lockWrap(inner, feature) {
  const f = FEATURES[feature];
  return `<div class="locked"><div class="blur">${inner}</div><div class="over"><div class="lock-card"><span class="tag-plan ${f.plan}">${PLANS[f.plan].name}</span><div class="serif" style="font-size:32px;line-height:1.05;margin:12px 0 8px">${esc(f.name)}</div><p class="muted" style="margin-bottom:18px">${esc(f.pitch)}</p><button class="btn btn-lime btn-lg" data-act="paywall" data-f="${feature}">Odomknúť</button>${!S.billing.trialUsed ? `<div style="margin-top:10px"><button class="btn btn-quiet btn-sm" data-act="trial">Vyskúšať 14 dní zadarmo</button></div>` : ''}</div></div></div>`;
}
function recForm(fromInv) {
  if (!gate('recurring')) return;
  const m = modal(`${mh('Nová opakovaná faktúra')}<div class="modal-b"><form id="rf" style="display:flex;flex-direction:column;gap:12px">
    <div class="field"><label>Klient</label><select class="select" name="clientId" required>${S.clients.map((c) => `<option value="${c.id}" ${fromInv?.clientId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
    <div class="grid-2"><div class="field"><label>Popis</label><input class="input" name="desc" value="${esc(fromInv?.items[0]?.desc || 'Mesačný paušál')}" required></div><div class="field"><label>Suma bez DPH</label><input class="input num" name="price" value="${fromInv ? totals(fromInv).base : ''}" required inputmode="decimal"></div></div>
    <div class="grid-2"><div class="field"><label>Prvá faktúra</label><input type="date" class="input" name="nextDate" value="${addMonths(today(), 1)}"></div><div class="field"><label>Opakovať</label><select class="select" name="every"><option value="1">každý mesiac</option><option value="3">štvrťročne</option><option value="12">ročne</option></select></div></div>
    <label style="display:flex;gap:10px;align-items:center;font-size:14px"><label class="switch"><input type="checkbox" name="autoSend" checked><span></span></label> Automaticky odoslať klientovi e‑mailom</label>
    <button class="btn btn-primary">Vytvoriť</button></form></div>`);
  $('#rf', m).onsubmit = (e) => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); const c = S.clients.find((x) => x.id === d.clientId);
    S.recurring.push({ id: uid('r'), clientId: c.id, client: F.snap(c), items: [{ desc: d.desc, qty: 1, unit: 'mes', price: +String(d.price).replace(',', '.') || 0, vat: S.company?.vatPayer ? 23 : 0 }], every: +d.every, nextDate: d.nextDate, dueDays: S.settings.dueDays, autoSend: !!d.autoSend, active: true, note: '' });
    F.track('recurring_create'); F.save(); closeModal(); toast('Opakovaná faktúra nastavená'); go('#/recurring');
  };
}

/* ================= TAXES ================= */
function vTaxes() {
  F.track('view_taxes');
  const st = F.stats(); const tx = st.tax; const P2 = tx.projected; const best = P2[P2.best];
  const y = today().slice(0, 4);
  const vatPct = Math.min(100, st.vatThresholdPct * 100);
  const col = (k, lbl) => { const v = P2[k]; return `<div class="${P2.best === k ? 'best' : ''}"><div style="display:flex;justify-content:space-between;align-items:center"><b>${lbl}</b>${P2.best === k ? '<span class="chip paid plain">výhodnejšie</span>' : ''}</div><div class="kv" style="margin-top:8px"><span class="muted">Výdavky</span><b>${eur(v.exp, 0)}</b></div><div class="kv"><span class="muted">Sociálne</span><b>${eur(v.social, 0)}</b></div><div class="kv"><span class="muted">Zdravotné</span><b>${eur(v.health, 0)}</b></div><div class="kv"><span class="muted">Daň z príjmov</span><b>${eur(v.tax, 0)}</b></div><div class="kv" style="border-top:1px solid var(--line);margin-top:6px;padding-top:8px"><span>Čistý príjem</span><b>${eur(v.net, 0)}</b></div></div>`; };
  const body = `
  <div class="kpis">
    ${kpi(`Príjmy ${y} (zaplatené)`, eur(st.incomeYtd, 0), `<span class="muted">projekcia na rok ${eur(P2.income, 0)}</span>`, 'dark')}
    ${kpi('Odkladajte si mesačne', eur(best.totalBurden / 12, 0), '<span class="muted">na daň a odvody</span>')}
    ${kpi('Odhad dane za rok', eur(best.tax, 0), `<span class="muted">${P2.income <= F.TAXP.lowTurnover ? 'sadzba 15 %' : 'sadzba 19/25 %'}</span>`)}
    ${kpi('Odvody za rok', eur(best.social + best.health, 0), '<span class="muted">sociálne + zdravotné</span>')}
  </div>
  <div class="dash">
    <div>
      <div class="card card-pad"><div style="display:flex;justify-content:space-between;align-items:baseline"><h3>Paušálne vs. skutočné výdavky</h3><span class="muted" style="font-size:12.5px">projekcia na celý rok</span></div>
        <div class="cmp" style="margin-top:14px">${col('flat', 'Paušálne 60 %')}${col('actual', 'Skutočné výdavky')}</div>
        <p class="muted" style="font-size:12.5px;margin-top:12px">Rozdiel: <b style="color:var(--ink)">${eur(Math.abs(P2.flat.net - P2.actual.net), 0)}</b> v prospech ${P2.best === 'flat' ? 'paušálnych' : 'skutočných'} výdavkov.</p></div>
      ${!st.vatPayer ? `<div class="card card-pad"><h3>Hranica registrácie pre DPH</h3><p class="muted" style="font-size:13.5px;margin-top:4px">Obrat za posledných 12 mesiacov: <b class="mono" style="color:var(--ink)">${eur(st.turnover12, 0)}</b> z 50 000 €</p>
        <div class="gauge"><i style="width:${vatPct}%"></i><div class="mk" style="left:80%"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:12px" class="muted"><span>0 €</span><span>${Math.round(vatPct)} %${st.vatEta ? ` · prekročenie ~ ${st.vatEta}` : ''}</span><span>50 000 €</span></div></div>` : ''}
      <div class="card card-pad"><h3>Predpoklady výpočtu</h3><p class="muted" style="font-size:13px;margin-top:6px;line-height:1.6">Orientačný odhad pre SZČO, nie daňové poradenstvo. Paušálne výdavky ${F.TAXP.flatPct * 100} % (max. ${eur(F.TAXP.flatMax, 0)}), nezdaniteľná časť ${eur(F.TAXP.nczd)}, sadzba 15 % pri príjmoch do ${eur(F.TAXP.lowTurnover, 0)}, sociálne ${nf(F.TAXP.socPct * 100)} % a zdravotné ${F.TAXP.healthPct * 100} % z vymeriavacieho základu (príjmy − výdavky) / ${F.TAXP.vzDivisor}. Sociálne odvody sa reálne platia až od nasledujúceho roka po prekročení hranice príjmu.</p></div>
    </div>
    <div>
      <div class="card"><div class="card-h"><h3>Daňový kalendár</h3></div>${F.deadlines().map(dl).join('')}</div>
      <div class="card card-pad" style="background:var(--violet-bg);border-color:#DCD2FF"><span class="chip ai">AI</span><h3 style="margin:10px 0 6px">Opýtajte sa na dane</h3><p class="muted" style="font-size:13.5px;margin-bottom:12px">„Oplatí sa mi stať platiteľom DPH dobrovoľne?“</p><a href="#/ai" class="btn btn-ai btn-sm">Otvoriť AI asistenta</a></div>
    </div>
  </div>`;
  return `<div class="page-h"><div><h1>Daňový <em>radar</em></h1><div class="sub">Viete, koľko vám zostane — v reálnom čase, nie v marci.</div></div></div>${F.has('tax') ? body : lockWrap(body, 'tax')}`;
}

/* ================= AI ASSISTANT ================= */
let CHAT = [];
function vAI() {
  const qa = F.quota('ai');
  if (!CHAT.length) CHAT.push({ who: 'ai', text: `Ahoj ${(S.user.name || '').split(' ')[0]}! Som eFakturko AI. Viem:\n• vystaviť faktúru z jednej vety („Vyfakturuj Mlyn 6 hodín po 45 €“)\n• odpovedať na otázky o DPH, paušáloch, odvodoch a e‑faktúre\n• analyzovať vaše podnikanie\n\nČo pre vás môžem urobiť?` });
  onMount(() => { const c = $('#chat'); if (c) c.scrollTop = c.scrollHeight; $('#chatIn')?.focus(); });
  return `<div class="page-h"><div><h1>AI <em>asistent</em></h1><div class="sub">${qa.lim === Infinity ? 'Neobmedzené AI akcie' : `Zostáva ${qa.left} z ${qa.lim} AI akcií tento mesiac`}</div></div></div>
  <div class="dash"><div class="card"><div class="chat" id="chat">${CHAT.map((m) => `<div class="msg ${m.who}">${esc(m.text)}${m.src ? `<span class="src">${m.src === 'ai' ? '✦ eFakturko AI' : 'offline znalostná báza'}</span>` : ''}${m.action ? `<div style="margin-top:10px"><a href="${m.action.href}" class="btn btn-primary btn-sm">${m.action.label}</a></div>` : ''}</div>`).join('')}</div>
    <form class="chat-in" data-form="chat"><input class="input" id="chatIn" name="q" placeholder="Napíšte otázku alebo zadanie faktúry…" autocomplete="off"><button class="btn btn-ai">${ic('send')}</button></form></div>
  <div><div class="card"><div class="card-h"><h3>Skúste</h3></div><div style="padding:12px 18px;display:flex;flex-direction:column;gap:8px">${['Vyfakturuj Mlyn 6 hodín konzultácie po 45 €', 'Oplatia sa mi paušálne výdavky?', 'Kedy musím byť platiteľ DPH?', 'Čo prináša e‑faktúra od 2027?', 'Ako napísať upomienku?', 'Analyzuj moje podnikanie'].map((s) => `<button class="btn btn-ghost" style="justify-content:flex-start;height:auto;padding:10px 12px;white-space:normal;text-align:left" data-act="chatSugg" data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div></div></div></div>`;
}
async function chatSend(q) {
  q = q.trim(); if (!q) return;
  CHAT.push({ who: 'me', text: q });
  const isInvoice = /vyfakturuj|faktúr[au] pre|\d\s*(€|eur)/i.test(q) && !/\?$/.test(q);
  const isAnalyze = /analyz|postreh|ako mi ide/i.test(q);
  render(); const c = $('#chat'); c.insertAdjacentHTML('beforeend', '<div class="msg ai shimmer" id="typing">…</div>'); c.scrollTop = c.scrollHeight;
  if (isInvoice) {
    const r = await runAI('invoice_draft', { text: q, clients: S.clients.map((x) => ({ name: x.name, ico: x.ico })), today: today(), vatPayer: !!S.company?.vatPayer });
    if (!r) { CHAT.pop(); return render(); }
    window.__draft = r; const d = r.data;
    const total = (d.items || []).reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    CHAT.push({ who: 'ai', src: r.source, text: d.items?.length ? `Pripravil som návrh faktúry pre ${d.clientName || 'klienta'}:\n${d.items.map((i) => `• ${i.description} — ${nf(i.quantity, i.quantity % 1 ? 2 : 0)} ${i.unit} × ${eur(i.unitPrice)}`).join('\n')}\nSpolu bez DPH: ${eur(total)} · splatnosť ${d.dueDays} dní` : 'Nepodarilo sa mi rozpoznať položky. Skúste napr. „Vyfakturuj Mlyn 6 hodín konzultácie po 45 €“.', action: d.items?.length ? { href: '#/invoices/new?fresh=1', label: 'Otvoriť a skontrolovať faktúru →' } : null });
  } else if (isAnalyze) {
    const st = F.stats();
    const r = await runAI('insights', { stats: { ytd: Math.round(st.billedYtd), overdueSum: Math.round(st.overdueSum), overdueCount: st.overdueCount, topClient: st.topClient, topClientShare: +st.topClientShare.toFixed(2), avgPayDays: +st.avgPayDays.toFixed(1), vatPayer: st.vatPayer, turnover12: Math.round(st.turnover12), vatThresholdPct: +st.vatThresholdPct.toFixed(2), vatEta: st.vatEta, monthlyReserve: Math.round(st.monthlyReserve), momGrowth: +st.momGrowth.toFixed(2) } });
    if (!r) { CHAT.pop(); return render(); }
    CHAT.push({ who: 'ai', src: r.source, text: r.data.insights.map((x) => `▸ ${x.title}\n${x.body}`).join('\n\n') });
  } else {
    const st = F.stats();
    const r = await runAI('ask', { question: q, context: { type: S.company?.type, vatPayer: !!S.company?.vatPayer, incomeYtd: Math.round(st.incomeYtd), expensesYtd: Math.round(st.expYtd), turnover12: Math.round(st.turnover12) } });
    if (!r) { CHAT.pop(); return render(); }
    CHAT.push({ who: 'ai', src: r.source, text: r.data.answer });
  }
  if (ROUTE.parts[0] === 'ai') render();
}

/* ================= NOTIFICATIONS ================= */
const NI = { overdue: ['bell', 'var(--coral-bg)', '#B3260E'], due: ['cal', 'var(--amber-bg)', '#9A5B00'], dunning: ['send', 'var(--sky-bg)', '#1D4ED8'], recurring: ['rep', 'var(--violet-bg)', '#5B3BE0'], tax: ['tax', 'var(--amber-bg)', '#9A5B00'], billing: ['card', 'var(--violet-bg)', 'var(--violet)'], digest: ['dash', 'var(--paper-2)', 'var(--ink)'], tip: ['ai', 'var(--violet-bg)', '#5B3BE0'] };
const notifRow = (n) => { const [i, bg, fg] = NI[n.type] || NI.tip; return `<div class="notif ${n.read ? '' : 'unread'}" data-act="openNotif" data-id="${n.id}"><span class="ic" style="background:${bg};color:${fg}">${ic(i)}</span><div style="flex:1;min-width:0"><b>${esc(n.title)}</b><p>${esc(n.body)}</p><span>${ago(n.at)}</span></div></div>`; };
function vNotifications() {
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  return `<div class="page-h"><div><h1>Upozornenia</h1><div class="sub">eFakturko stráži splatnosti, termíny a platby za vás.</div></div><div class="acts"><button class="btn btn-ghost" data-act="readAll">Označiť všetko ako prečítané</button></div></div>
  <div class="dash"><div class="card">${S.notifications.map(notifRow).join('') || `<div class="empty"><div class="serif">Ticho.</div>Keď sa niečo stane, dáme vedieť.</div>`}</div>
  <div><div class="card card-pad" style="display:flex;flex-direction:column;gap:16px"><h3>Nastavenia upozornení</h3>
    ${toggleRow('push', 'Push upozornenia v prehliadači', perm === 'denied' ? 'Zablokované v prehliadači' : perm === 'unsupported' ? 'Prehliadač nepodporuje' : 'Splatnosti, platby a termíny aj keď je eFakturko zatvorený')}
    ${toggleRow('digest', 'Týždenný prehľad v pondelok', 'Súhrn neuhradených faktúr a cashflow')}
    ${toggleRow('autoDunning', 'Automatické upomienky klientom', F.has('dunning') ? 'Deň 1, 7 a 14 po splatnosti' : 'Dostupné v pláne Pro')}
    <button class="btn btn-ghost btn-sm" data-act="testPush" style="align-self:flex-start">Poslať testovacie upozornenie</button>
  </div></div></div>`;
}
const toggleRow = (k, t, d) => `<label style="display:flex;gap:14px;align-items:center;cursor:pointer"><div style="flex:1"><b style="font-size:14px">${t}</b><div class="muted" style="font-size:12.5px">${d}</div></div><span class="switch"><input type="checkbox" data-act-change="setting" data-k="${k}" ${S.settings[k] ? 'checked' : ''}><span></span></span></label>`;

/* ================= BILLING ================= */
function vBilling() {
  const pl = F.plan(); const qi = F.quota('invoices'), qa = F.quota('ai');
  const trial = S.billing.trialEnds ? Math.max(0, Math.ceil((S.billing.trialEnds - Date.now()) / 864e5)) : null;
  const card = (p) => { const P0 = PLANS[p]; const cur = pl.id === p; return `<div class="card card-pad" style="${cur ? 'border-color:var(--violet);box-shadow:0 0 0 3px var(--violet-bg)' : ''};display:flex;flex-direction:column;gap:6px"><span class="tag-plan ${p}">${P0.name}</span><div class="mono" style="font-size:28px;font-weight:700;margin-top:6px">${nf(P0.price)} €<span class="muted" style="font-size:13px;font-weight:400"> / mes</span></div><div class="muted" style="font-size:12.5px;min-height:36px">${p === 'free' ? '5 faktúr, 3 AI akcie mesačne' : p === 'pro' ? 'Neobmedzené faktúry, 100 AI, upomienky, daňový radar, e‑faktúra' : p === 'business' ? 'Všetko z Pro, neobmedzené AI, 10 firiem, 3 používatelia' : '50 firiem, 6 používateľov, 50 GB'}</div>${cur && trial === null ? '<button class="btn btn-ghost btn-block" disabled>Aktuálny plán</button>' : p === 'free' ? (pl.id !== 'free' ? '<button class="btn btn-ghost btn-block" data-act="cancelSub">Prejsť na Štart</button>' : '') : `<button class="btn ${p === 'pro' ? 'btn-lime' : 'btn-primary'} btn-block" data-act="checkout" data-p="${p}">${cur ? 'Aktivovať platbou' : PLANS[p].price > pl.price ? 'Upgrade' : 'Zmeniť'}</button>`}</div>`; };
  const meter = (l, x) => `<div><div style="display:flex;justify-content:space-between;font-size:13.5px"><span>${l}</span><b class="mono">${x.lim === Infinity ? x.used + ' / ∞' : x.used + ' / ' + x.lim}</b></div><div class="progress" style="margin-top:6px"><i style="width:${x.lim === Infinity ? 4 : x.pct}%;${x.pct >= 100 ? 'background:var(--coral)' : ''}"></i></div></div>`;
  return `<div class="page-h"><div><h1>Predplatné</h1><div class="sub">${trial !== null ? `Skúšobné obdobie ${pl.name} — zostáva <b>${trial} dní</b>` : S.billing.paidUntil ? `Plán ${pl.name} · obnoví sa ${fmtD(F.iso(new Date(S.billing.paidUntil)))}` : `Plán ${pl.name}`}</div></div></div>
  <div class="dash"><div>
    <div class="grid-2">${['free', 'pro', 'business', 'max'].map(card).join('')}</div>
    <div class="card" style="margin-top:18px"><div class="card-h"><h3>Faktúry za predplatné</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Číslo</th><th>Dátum</th><th>Popis</th><th>Karta</th><th class="r">Suma</th></tr></thead><tbody>${S.billing.history.map((h) => `<tr><td class="mono">${esc(h.id)}</td><td class="mono">${new Date(h.at).toLocaleDateString('sk-SK')}</td><td>${esc(h.desc)}</td><td class="mono muted">${esc(h.card)}</td><td class="r mono"><b>${eur(h.total)}</b></td></tr>`).join('') || '<tr><td colspan="5" class="muted" style="text-align:center;padding:24px">Zatiaľ žiadne platby</td></tr>'}</tbody></table></div></div>
  </div><div>
    <div class="card card-pad" style="display:flex;flex-direction:column;gap:14px"><h3>Využitie · ${F.MONTHS_FULL[new Date().getMonth()]}</h3>${meter('Faktúry', qi)}${meter('AI akcie', qa)}</div>
    <div class="card card-pad" style="background:var(--ink);color:#fff;border-color:var(--ink)"><span class="chip plain" style="background:#fff;color:var(--violet)">Partneri</span><h3 style="margin:10px 0 6px">Odporučte eFakturko, zarobte 30 %</h3><p style="color:#C4B5FD;font-size:13.5px">Váš kód pre kolegov: <b class="mono" style="color:#C4B5FD">PARTNER1</b> — 2 mesiace Pro za 1 €.</p></div>
  </div></div>`;
}
async function cancelFlow() {
  const m = modal(`${mh('Je nám to ľúto')}<div class="modal-b"><p style="color:#34433C">Predtým, než odídete — čo keby ste ostali za polovicu? Ponúkame <b>2 mesiace s 50 % zľavou</b>.</p>
    <div style="background:var(--paper);border-radius:14px;padding:14px;margin:16px 0;font-size:13.5px">Pri prechode na Štart stratíte: automatické upomienky (${S.invoices.filter((i) => (i.reminders || []).some((r) => r.auto)).length} odoslaných), opakované faktúry (${S.recurring.length}), daňový radar a e‑faktúru 2027.</div>
    <div style="display:flex;gap:8px;flex-direction:column"><button class="btn btn-lime btn-lg" id="stay">Ostať so zľavou 50 %</button><button class="btn btn-quiet" id="leave">Aj tak prejsť na Štart</button></div></div>`);
  $('#stay', m).onclick = () => { S.billing.coupon = 'ZOSTAN50'; F.track('retention_accept'); F.save(); checkout(S.user.plan === 'free' ? 'pro' : S.user.plan); };
  $('#leave', m).onclick = () => { S.user.plan = 'free'; S.billing.paidUntil = null; S.billing.trialEnds = null; F.track('churn'); F.save(); closeModal(); toast('Prešli ste na plán Štart'); render(); };
}

/* ================= SETTINGS ================= */
function vSettings() {
  const c = S.company || {};
  return `<div class="page-h"><div><h1>Nastavenia</h1><div class="sub">Údaje firmy sa zobrazujú na každej faktúre.</div></div></div>
  <div class="dash"><div>
    <form class="card card-pad" data-form="company" style="display:flex;flex-direction:column;gap:14px"><h3>Firma</h3>
      <div class="field"><label>IČO</label><div class="inline"><input class="input mono" name="ico" value="${esc(c.ico)}"><button type="button" class="btn btn-ghost" data-act="lookupCompany">${ic('search')} Načítať</button></div></div>
      <div class="field"><label>Obchodné meno</label><input class="input" name="name" value="${esc(c.name)}"></div>
      <div class="field"><label>Sídlo</label><input class="input" name="address" value="${esc(c.address)}"></div>
      <div class="grid-2"><div class="field"><label>DIČ</label><input class="input mono" name="dic" value="${esc(c.dic)}"></div><div class="field"><label>IČ DPH</label><input class="input mono" name="icdph" value="${esc(c.icdph)}"></div></div>
      <label style="display:flex;gap:10px;align-items:center;font-size:14px"><span class="switch"><input type="checkbox" name="vatPayer" ${c.vatPayer ? 'checked' : ''}><span></span></span> Som platiteľ DPH</label>
      <div class="field"><label>IBAN</label><input class="input mono" name="iban" value="${esc(F.ibanFmt(c.iban))}" data-act-input="iban"><span class="muted" style="font-size:12px" id="ibanInfo">${c.iban ? (F.ibanValid(c.iban) ? '✓ ' + (F.bankOf(c.iban) || 'platný IBAN') : '✗ neplatný IBAN') : ''}</span></div>
      <div class="grid-2"><div class="field"><label>E‑mail</label><input class="input" name="email" value="${esc(c.email)}"></div><div class="field"><label>Telefón</label><input class="input" name="phone" value="${esc(c.phone)}"></div></div>
      <div class="field"><label>Zápis v registri</label><input class="input" name="register" value="${esc(c.register)}" placeholder="Zapísaný v živnostenskom registri OÚ …"></div>
      <button class="btn btn-primary" style="align-self:flex-start">Uložiť údaje</button></form>
  </div><div>
    <form class="card card-pad" data-form="prefs" style="display:flex;flex-direction:column;gap:14px"><h3>Faktúry</h3>
      <div class="field"><label>Predvolená splatnosť (dni)</label><input class="input num" name="dueDays" value="${S.settings.dueDays}" inputmode="numeric"></div>
      <div class="field"><label>Predvolená poznámka</label><input class="input" name="note" value="${esc(S.settings.note)}"></div>
      <div class="field"><label>Farba faktúry</label><div style="display:flex;gap:8px">${['#2E1065', '#1D4ED8', '#7C3AED', '#B3260E', '#0F7A52', '#9A5B00'].map((x) => `<label style="cursor:pointer"><input type="radio" name="accent" value="${x}" ${S.settings.accent === x ? 'checked' : ''} hidden><span style="display:block;width:32px;height:32px;border-radius:10px;background:${x};${S.settings.accent === x ? 'box-shadow:0 0 0 3px #fff,0 0 0 5px ' + x : ''}"></span></label>`).join('')}</div></div>
      <div class="lbl" style="margin-top:4px">Automatické upomienky ${F.has('dunning') ? '' : '<span class="tag-plan pro">Pro</span>'}</div>
      ${[['d0', '1 deň po splatnosti — priateľská'], ['d7', '7 dní — vecná upomienka'], ['d14', '14 dní — posledná výzva']].map(([k, l]) => `<label style="display:flex;gap:10px;align-items:center;font-size:14px"><span class="switch"><input type="checkbox" name="r_${k}" ${S.settings.remind[k] ? 'checked' : ''}><span></span></span>${l}</label>`).join('')}
      <button class="btn btn-primary" style="align-self:flex-start">Uložiť</button></form>
    <div class="card card-pad" style="display:flex;flex-direction:column;gap:10px"><h3>Dáta</h3>
      <button class="btn btn-ghost" data-act="backup">${ic('dl')} Stiahnuť zálohu (JSON)</button>
      <label class="btn btn-ghost" style="cursor:pointer">${ic('up')} Obnoviť zo zálohy<input type="file" accept="application/json" id="restoreFile" hidden></label>
      <button class="btn btn-quiet" data-act="logout">${ic('out')} Odhlásiť sa</button>
      <button class="btn btn-quiet" data-act="wipe" style="color:var(--coral)">${ic('trash')} Zmazať účet a všetky dáta</button></div>
  </div></div>`;
}

/* ================= ONBOARDING ================= */
let OB = { step: 1, d: {} };
function vOnboarding() {
  if (S.user && S.user.onboarded && ROUTE.parts[0] === 'onboarding' && !ROUTE.q.get('force')) return go('#/dashboard');
  const pq = ROUTE.q.get('plan'); if (pq && !OB.d.plan) OB.d.plan = pq; if (ROUTE.q.get('cycle')) OB.d.cycle = ROUTE.q.get('cycle'); if (ROUTE.q.get('partner')) OB.d.partner = true;
  const s = OB.step, d = OB.d;
  const left = [
    ['Faktúry, ktoré sa <em>zaplatia samé.</em>', 'Za 2 minúty máte účet, firmu aj prvú faktúru.'],
    ['Údaje doplníme <em>z registra.</em>', 'Stačí IČO. Názov, sídlo aj DIČ načítame za vás.'],
    ['QR platba na <em>každej faktúre.</em>', 'PAY by square — klient zaplatí jedným skenom v bankovej aplikácii.'],
    ['Vyberte si, <em>koľko chcete.</em>', 'Začnite zadarmo alebo si vyskúšajte Pro na 14 dní bez karty.'],
  ][s - 1];
  const forms = {
    1: `<h2>Vytvorte si účet</h2><p class="muted">Bez karty. Zrušíte kedykoľvek.</p>
      <div class="field"><label>Meno a priezvisko</label><input class="input" name="name" value="${esc(d.name || '')}" required autofocus autocomplete="name"></div>
      <div class="field"><label>E‑mail</label><input class="input" type="email" name="email" value="${esc(d.email || '')}" required autocomplete="email"></div>
      <div class="field"><label>Heslo</label><input class="input" type="password" name="pw" minlength="8" required autocomplete="new-password" placeholder="aspoň 8 znakov"></div>
      <button class="btn btn-primary btn-lg">Pokračovať ${ic('arrow')}</button>
      <p class="muted" style="font-size:13px;text-align:center">Už máte účet? <a href="#/login" style="color:var(--ink);font-weight:600">Prihláste sa</a> · <a href="#/demo" style="color:var(--ink);font-weight:600">Pozrieť demo</a></p>`,
    2: `<h2>Vaša firma</h2>
      <div class="seg"><label><input type="radio" name="type" value="szco" ${d.type !== 'sro' ? 'checked' : ''}><b>Živnostník</b><span>SZČO</span></label><label><input type="radio" name="type" value="sro" ${d.type === 'sro' ? 'checked' : ''}><b>Firma</b><span>s.r.o., a.s.</span></label></div>
      <div class="field"><label>IČO</label><div class="inline"><input class="input mono" name="ico" value="${esc(d.ico || '')}" placeholder="12345678" inputmode="numeric" autofocus><button type="button" class="btn btn-ghost" data-act="obLookup">${ic('search')} Načítať</button></div><span class="muted" style="font-size:12px">Tip: skúste 52418337</span></div>
      <div class="field"><label>Obchodné meno</label><input class="input" name="cname" value="${esc(d.cname || d.name || '')}" required></div>
      <div class="field"><label>Sídlo</label><input class="input" name="address" value="${esc(d.address || '')}" required placeholder="Ulica číslo, PSČ Mesto"></div>
      <div class="grid-2"><div class="field"><label>DIČ</label><input class="input mono" name="dic" value="${esc(d.dic || '')}"></div><div class="field"><label>IČ DPH</label><input class="input mono" name="icdph" value="${esc(d.icdph || '')}" placeholder="ak ste platiteľ"></div></div>
      <label style="display:flex;gap:10px;align-items:center;font-size:14px"><span class="switch"><input type="checkbox" name="vatPayer" ${d.vatPayer ? 'checked' : ''}><span></span></span> Som platiteľ DPH</label>
      <div style="display:flex;gap:8px"><button type="button" class="btn btn-ghost btn-lg" data-act="obBack">Späť</button><button class="btn btn-primary btn-lg" style="flex:1">Pokračovať ${ic('arrow')}</button></div>`,
    3: `<h2>Kam vám majú platiť?</h2>
      <div class="field"><label>IBAN</label><input class="input mono" name="iban" value="${esc(d.iban || '')}" placeholder="SK00 0000 0000 0000 0000 0000" required autofocus data-act-input="iban"><span class="muted" style="font-size:12px" id="ibanInfo"></span></div>
      <div class="grid-2"><div class="field"><label>E‑mail na faktúre</label><input class="input" name="cemail" value="${esc(d.cemail || d.email || '')}"></div><div class="field"><label>Telefón</label><input class="input" name="phone" value="${esc(d.phone || '')}"></div></div>
      <div class="field"><label>Splatnosť faktúr</label><div class="seg" style="grid-template-columns:repeat(3,1fr)">${[7, 14, 30].map((n) => `<label style="text-align:center"><input type="radio" name="due" value="${n}" ${(d.due || 14) == n ? 'checked' : ''}><b>${n} dní</b></label>`).join('')}</div></div>
      <div style="display:flex;gap:8px"><button type="button" class="btn btn-ghost btn-lg" data-act="obBack">Späť</button><button class="btn btn-primary btn-lg" style="flex:1">Pokračovať ${ic('arrow')}</button></div>`,
    4: `<h2>Vyberte plán</h2>
      <div class="plan-pick">${[['free', 'Štart', '5 faktúr a 3 AI akcie mesačne', '0 €'], ['pro', 'Pro — 14 dní zadarmo', 'Neobmedzené faktúry, upomienky, daňový radar', `${nf(PLANS.pro.price)} €`], ['business', 'Business — 14 dní zadarmo', 'Viac firiem, neobmedzené AI, predikcia', `${nf(PLANS.business.price)} €`], ['max', 'Max — 14 dní zadarmo', '50 firiem, 6 používateľov, 50 GB', `${nf(PLANS.max.price)} €`]].map(([k, n, ds, pr]) => `<label><input type="radio" name="plan" value="${k}" ${(d.plan || 'pro') === k ? 'checked' : ''}><div><b>${n}</b><div class="muted" style="font-size:12.5px">${ds}</div></div><span class="pr">${pr}</span></label>`).join('')}</div>
      <label style="display:flex;gap:10px;align-items:center;font-size:14px"><span class="switch"><input type="checkbox" name="demo" ${d.demo ? 'checked' : ''}><span></span></span> Naplniť ukážkovými klientmi a faktúrami</label>
      <div style="display:flex;gap:8px"><button type="button" class="btn btn-ghost btn-lg" data-act="obBack">Späť</button><button class="btn btn-lime btn-lg" style="flex:1">Vstúpiť do aplikácie eFakturko ${ic('arrow')}</button></div>`,
  };
  app.innerHTML = `<div class="ob"><div class="ob-l"><a href="./" class="logo">${LOGO}</a><h1>${left[0]}</h1><p>${left[1]}</p><div class="ob-steps">${[1, 2, 3, 4].map((k) => `<i class="${k <= s ? 'on' : ''}"></i>`).join('')}</div></div>
    <div class="ob-r"><form class="ob-form" data-form="ob" novalidate>${forms[s]}</form></div></div>`;
  setTimeout(() => $('.ob-form [autofocus]')?.focus(), 30);
}
function obSubmit(f) {
  const fd = new FormData(f); const d = OB.d;
  for (const [k, v] of fd) d[k] = v;
  if (OB.step === 1) { if (!d.name?.trim() || !/^\S+@\S+\.\S+$/.test(d.email || '')) return toast('Vyplňte meno a platný e‑mail', 'err'); if ((d.pw || '').length < 8) return toast('Heslo musí mať aspoň 8 znakov', 'err'); delete d.pw; }
  if (OB.step === 2) { d.vatPayer = fd.has('vatPayer'); if (!d.cname?.trim() || !d.address?.trim()) return toast('Vyplňte názov a sídlo', 'err'); if (d.ico && !/^\d{8}$/.test(d.ico.replace(/\s/g, ''))) return toast('IČO má 8 číslic', 'err'); }
  if (OB.step === 3) { if (!F.ibanValid(d.iban)) return toast('Skontrolujte IBAN', 'err'); }
  if (OB.step === 4) { d.demo = fd.has('demo'); return obFinish(); }
  OB.step++; vOnboarding();
}
function obFinish() {
  const d = OB.d;
  F.reset();
  S.user = { name: d.name.trim(), email: d.email.trim(), plan: d.plan || 'free', createdAt: Date.now(), onboarded: true, partner: !!d.partner };
  S.company = { type: d.type || 'szco', name: d.cname.trim(), person: d.name.trim(), ico: (d.ico || '').replace(/\s/g, ''), dic: d.dic || '', icdph: d.icdph || '', vatPayer: !!d.vatPayer, address: d.address, iban: F.ibanClean(d.iban), email: d.cemail || d.email, phone: d.phone || '', register: '' };
  S.settings.dueDays = +d.due || 14;
  if (d.plan && d.plan !== 'free') { S.billing.trialEnds = Date.now() + 14 * 864e5; S.billing.trialUsed = true; S.billing.cycle = d.cycle || 'm'; }
  if (d.partner) S.billing.coupon = 'PARTNER1';
  S.analytics.sessions = 1; F.track('signup'); F.track('signup_plan_' + (d.plan || 'free'));
  if (d.demo) { const keep = { ...S.company }; F.seedDemo({ trial: false }); S.company = keep; S.user.demo = false; }
  F.notify('welcome-' + Date.now(), { type: 'tip', title: `Vitajte v aplikácii eFakturko, ${d.name.split(' ')[0]}!`, body: 'Vytvorte prvú faktúru — stačí napísať jednu vetu do AI riadku na prehľade.', href: '#/invoices/new' });
  if (S.billing.trialEnds) F.notify('trial-start', { type: 'billing', title: `${PLANS[S.user.plan].name} na 14 dní zadarmo`, body: 'Všetky funkcie sú odomknuté. Pripomenieme sa 3 dni pred koncom.', href: '#/billing' });
  F.save(); OB = { step: 1, d: {} };
  const A = F.adminData(); A.log.unshift({ at: Date.now(), who: 'system', text: `Nová registrácia: ${S.user.email} (${PLANS[S.user.plan].name})` }); F.saveAdmin(A);
  go('#/dashboard');
  setTimeout(() => toast('Účet vytvorený. Poďme na prvú faktúru!'), 200);
}
async function startDemo() {
  if (S.user && !S.user.demo) {
    app.innerHTML = '';
    const ok = await confirmBox('Otvoriť demo?', 'Demo nahradí dáta vo vašom prehliadači. Ak chcete pokračovať vo svojom účte, zrušte.', 'Otvoriť demo', true);
    if (!ok) return go('#/dashboard');
  }
  F.reset(); F.seedDemo(); S.user.demo = true; F.save();
  go('#/dashboard');
}
function vLogin() {
  app.innerHTML = `<div class="ob"><div class="ob-l"><a href="./" class="logo">${LOGO}</a><h1>Vitajte <em>späť.</em></h1><p>Vaše faktúry na vás čakajú.</p></div>
    <div class="ob-r"><form class="ob-form" data-form="login"><h2>Prihlásenie</h2>
      <div class="field"><label>E‑mail</label><input class="input" type="email" name="email" required autofocus autocomplete="email"></div>
      <div class="field"><label>Heslo</label><input class="input" type="password" name="pw" required autocomplete="current-password"></div>
      <button class="btn btn-primary btn-lg">Prihlásiť sa</button>
      <p class="muted" style="font-size:13px;text-align:center">Nemáte účet? <a href="#/onboarding" style="color:var(--ink);font-weight:600">Registrácia</a> · <a href="#/demo" style="color:var(--ink);font-weight:600">Demo účet</a></p>
    </form></div></div>`;
}

/* ================= ADMIN ================= */
let ADM = { tab: 'overview', q: '', plan: 'all', sort: 'createdAt' };
function vAdmin() {
  let authed = false; try { authed = sessionStorage.getItem('faktum:admin') === '1'; } catch {}
  if (!authed) {
    app.innerHTML = `<div class="ob"><div class="ob-l"><a href="./" class="logo">${LOGO}</a><h1>Admin <em>konzola.</em></h1><p>Správa používateľov, predplatných a analytika používania.</p></div>
      <div class="ob-r"><form class="ob-form" data-form="admin"><span class="badge-admin" style="align-self:flex-start">ADMIN</span><h2>Prístup pre tím</h2><div class="field"><label>Prístupový PIN</label><input class="input mono" type="password" name="pin" autofocus inputmode="numeric" placeholder="••••"></div><button class="btn btn-primary btn-lg">Vstúpiť</button><p class="muted" style="font-size:12.5px">Demo PIN: <span class="mono">2027</span></p></form></div></div>`;
    return;
  }
  const A = F.adminData();
  const live = F.liveUser();
  const users = [...(live ? [live] : []), ...A.users];
  const paying = users.filter((u) => u.plan !== 'free' && u.status === 'active');
  const price = (u) => (u.cycle === 'y' ? PLANS[u.plan].yprice : PLANS[u.plan].price);
  const mrr = paying.reduce((s, u) => s + price(u), 0);
  const active30 = users.filter((u) => Date.now() - u.lastSeen < 30 * 864e5).length;
  const signups30 = users.filter((u) => Date.now() - u.createdAt < 30 * 864e5).length;
  const churned = users.filter((u) => u.churnedFrom).length;
  const conv = paying.length / users.length;
  const weeks = Array.from({ length: 26 }, (_, k) => { const end = Date.now() - (25 - k) * 7 * 864e5; return users.filter((u) => u.createdAt <= end && u.createdAt > end - 7 * 864e5).length; });
  const mrrHist = Array.from({ length: 12 }, (_, k) => { const at = Date.now() - (11 - k) * 30 * 864e5; return paying.filter((u) => u.createdAt <= at).reduce((s, u) => s + price(u), 0); });
  const dist = ['free', 'pro', 'business', 'max'].map((p) => users.filter((u) => u.plan === p).length);
  const feats = [['dunning', 'Auto‑upomienky'], ['recurring', 'Opakované faktúry'], ['scan', 'Sken bločkov'], ['tax', 'Daňový radar'], ['ubl', 'e‑Faktúra UBL']].map(([k, l]) => [l, users.filter((u) => u.features?.[k]).length / users.length]);
  const aiTotal = users.reduce((s, u) => s + (u.ai || 0), 0), invTotal = users.reduce((s, u) => s + (u.invoices || 0), 0);
  const mini = (arr, fmt) => { const mx = Math.max(1, ...arr); return `<div class="mini">${arr.map((v) => `<i style="height:${(v / mx) * 100}%" title="${fmt(v)}"></i>`).join('')}</div>`; };
  const donut = () => { const tot = dist.reduce((a, b) => a + b, 0); let acc = 0; const cols = ['#DDD6FE', '#A78BFA', '#7C3AED', 'var(--ink)']; return `<svg viewBox="0 0 42 42" width="120" height="120" style="transform:rotate(-90deg)">${dist.map((v, i) => { const p = (v / tot) * 100; const s = `<circle cx="21" cy="21" r="15.9" fill="none" stroke="${cols[i]}" stroke-width="6" stroke-dasharray="${p} ${100 - p}" stroke-dashoffset="${-acc}"/>`; acc += p; return s; }).join('')}</svg>`; };
  let list = users.filter((u) => (ADM.plan === 'all' || u.plan === ADM.plan) && (!ADM.q || (u.name + u.email + u.trade + u.city).toLowerCase().includes(ADM.q.toLowerCase())));
  list.sort((a, b) => (ADM.sort === 'mrr' ? (b.plan === 'free' ? 0 : price(b)) - (a.plan === 'free' ? 0 : price(a)) : ADM.sort === 'invoices' ? b.invoices - a.invoices : ADM.sort === 'lastSeen' ? b.lastSeen - a.lastSeen : b.createdAt - a.createdAt));
  list = [...list.filter((u) => u.live), ...list.filter((u) => !u.live)];
  const ev = live ? Object.entries(S.analytics.events).sort((a, b) => b[1] - a[1]).slice(0, 10) : [];
  app.innerHTML = `
  <div class="admin-top"><a href="./" class="logo">${LOGO}</a><span class="badge-admin">ADMIN</span><div class="tabs hide-m" style="background:var(--ink-2);margin-left:12px">${[['overview', 'Prehľad'], ['users', 'Používatelia'], ['log', 'Udalosti']].map(([k, l]) => `<button class="${ADM.tab === k ? 'on' : ''}" data-act="admTab" data-t="${k}" style="${ADM.tab === k ? '' : 'color:#C4B5FD'}">${l}</button>`).join('')}</div><div style="margin-left:auto;display:flex;gap:8px"><a href="#/dashboard" class="btn btn-sm" style="color:#fff;border:1px solid var(--ink-3)">Do aplikácie</a><button class="btn btn-sm" style="color:#fff;border:1px solid var(--ink-3)" data-act="admOut">${ic('out')}</button></div></div>
  <main class="page">
    <div class="tabs" style="margin-bottom:16px;display:none" id="admTabsM">${[['overview', 'Prehľad'], ['users', 'Používatelia'], ['log', 'Udalosti']].map(([k, l]) => `<button class="${ADM.tab === k ? 'on' : ''}" data-act="admTab" data-t="${k}">${l}</button>`).join('')}</div>
    ${ADM.tab === 'overview' ? `
    <div class="page-h"><div><h1>Biznis <em>prehľad</em></h1><div class="sub">${users.length} používateľov · aktualizované ${new Date().toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}</div></div></div>
    <div class="kpis">${kpi('MRR', eur(mrr, 0), `<span class="up">ARR ${eur(mrr * 12, 0)}</span>`, 'dark')}${kpi('Platiaci zákazníci', paying.length, `<span class="muted">konverzia ${(conv * 100).toFixed(1)} %</span>`)}${kpi('Aktívni (30 dní)', active30, `<span class="muted">${Math.round((active30 / users.length) * 100)} % všetkých</span>`)}${kpi('Nové registrácie (30 d)', signups30, `<span class="muted">churn ${((churned / Math.max(1, paying.length + churned)) * 100).toFixed(1)} %</span>`)}</div>
    <div class="kpis">${kpi('ARPU platiacich', eur(mrr / Math.max(1, paying.length)), '')}${kpi('Faktúry v systéme', invTotal.toLocaleString('sk-SK'), '')}${kpi('AI akcie', aiTotal.toLocaleString('sk-SK'), `<span class="muted">${(aiTotal / Math.max(1, invTotal)).toFixed(2)} na faktúru</span>`)}${kpi('Partnerskí klienti', users.filter((u) => u.partner).length, '<span class="muted">cez účtovníkov</span>')}</div>
    <div class="dash"><div>
      <div class="card card-pad"><div style="display:flex;justify-content:space-between"><h3>MRR za 12 mesiacov</h3><b class="mono">${eur(mrr, 0)}</b></div><div style="margin-top:14px">${mini(mrrHist, (v) => eur(v, 0))}</div></div>
      <div class="card card-pad"><div style="display:flex;justify-content:space-between"><h3>Registrácie po týždňoch</h3><span class="muted" style="font-size:13px">26 týždňov</span></div><div style="margin-top:14px">${mini(weeks, (v) => v + ' registrácií')}</div></div>
    </div><div>
      <div class="card card-pad"><h3>Rozdelenie plánov</h3><div class="donut" style="margin-top:14px">${donut()}<div style="display:flex;flex-direction:column;gap:8px;font-size:13.5px">${['Štart', 'Pro', 'Business', 'Max'].map((l, i) => `<div><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${['#DDD6FE', '#A78BFA', '#7C3AED', 'var(--ink)'][i]};margin-right:6px"></i>${l} <b class="mono">${dist[i]}</b></div>`).join('')}</div></div></div>
      <div class="card card-pad"><h3>Adopcia funkcií</h3><div style="margin-top:10px">${feats.map(([l, v]) => `<div class="feat-bar"><span>${l}</span><div class="progress"><i style="width:${v * 100}%"></i></div><b>${Math.round(v * 100)} %</b></div>`).join('')}</div></div>
      ${ev.length ? `<div class="card card-pad"><h3>Udalosti tohto účtu (live)</h3><div style="margin-top:10px">${ev.map(([k, v]) => `<div class="kv"><span class="mono" style="font-size:12.5px">${esc(k)}</span><b>${v}</b></div>`).join('')}</div></div>` : ''}
    </div></div>` : ''}
    ${ADM.tab === 'users' ? `
    <div class="page-h"><div><h1>Používatelia</h1><div class="sub">${list.length} z ${users.length}</div></div><div class="acts"><button class="btn btn-ghost" data-act="admCsv">${ic('dl')} Export CSV</button></div></div>
    <div class="toolbar"><div class="tabs">${[['all', 'Všetci'], ['free', 'Štart'], ['pro', 'Pro'], ['business', 'Business'], ['max', 'Max']].map(([k, l]) => `<button class="${ADM.plan === k ? 'on' : ''}" data-act="admPlan" data-p="${k}">${l}</button>`).join('')}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><select class="select" style="width:auto" data-act-change="admSort">${[['createdAt', 'Najnovší'], ['lastSeen', 'Naposledy aktívni'], ['mrr', 'Podľa MRR'], ['invoices', 'Podľa faktúr']].map(([k, l]) => `<option value="${k}" ${ADM.sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select><div class="search">${ic('search')}<input class="input" placeholder="Meno, e‑mail, mesto…" value="${esc(ADM.q)}" data-act-input="admQ"></div></div></div>
    <div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Používateľ</th><th class="hide-m">Profil</th><th>Plán</th><th class="r">Faktúry</th><th class="r hide-m">AI</th><th class="hide-m">Registrácia</th><th>Aktivita</th><th>Stav</th><th></th></tr></thead><tbody>
    ${list.slice(0, 120).map((u) => `<tr style="${u.live ? 'background:#F5F1FF' : ''}"><td><b>${esc(u.name)}</b>${u.live ? ' <span class="chip paid plain" style="height:20px;font-size:10.5px">LIVE · vy</span>' : ''}<div class="muted" style="font-size:12px">${esc(u.email)}</div></td><td class="muted hide-m" style="font-size:13px">${esc(u.trade)} · ${esc(u.city)}${u.partner ? `<div style="font-size:11.5px;color:var(--violet)">partner: ${esc(u.partner)}</div>` : ''}</td><td><span class="tag-plan ${u.plan}">${PLANS[u.plan].name}</span>${u.plan !== 'free' ? `<div class="muted mono" style="font-size:11px">${nf(price(u))} €${u.cycle === 'y' ? ' · ročne' : ''}</div>` : u.churnedFrom ? '<div style="font-size:11px;color:var(--coral)">churn</div>' : ''}</td><td class="r mono">${u.invoices}</td><td class="r mono hide-m">${u.ai}${u.credits ? `<span style="color:var(--violet)"> +${u.credits}</span>` : ''}</td><td class="mono muted hide-m" style="font-size:12.5px">${new Date(u.createdAt).toLocaleDateString('sk-SK')}</td><td class="muted" style="font-size:12.5px">${ago(u.lastSeen)}</td><td>${u.status === 'active' ? '<span class="chip paid">aktívny</span>' : '<span class="chip overdue">pozastavený</span>'}</td>
      <td><select class="select" style="height:32px;width:auto;font-size:12.5px" data-act-change="admUser" data-id="${u.id}"><option value="">Akcia…</option><option value="plan:free">→ Štart</option><option value="plan:pro">→ Pro</option><option value="plan:business">→ Business</option><option value="plan:max">→ Max</option><option value="credits">+50 AI kreditov</option><option value="${u.status === 'active' ? 'suspend' : 'activate'}">${u.status === 'active' ? 'Pozastaviť' : 'Aktivovať'}</option>${u.live ? '' : '<option value="delete">Zmazať</option>'}</select></td></tr>`).join('')}
    </tbody></table></div></div>` : ''}
    ${ADM.tab === 'log' ? `<div class="page-h"><div><h1>Udalosti</h1><div class="sub">Audit log administrátorských zásahov a systémových udalostí</div></div></div>
    <div class="card"><div class="timeline" style="padding:16px 22px">${A.log.slice(0, 80).map((l) => `<div class="tl"><i></i><div>${esc(l.text)}<span>${new Date(l.at).toLocaleString('sk-SK')} · ${esc(l.who)}</span></div></div>`).join('')}</div></div>` : ''}
  </main>`;
  if (matchMedia('(max-width:860px)').matches) $('#admTabsM').style.display = 'flex';
}
async function admUser(id, action) {
  if (!action) return;
  const A = F.adminData();
  const isLive = id === 'live';
  const u = isLive ? F.liveUser() : A.users.find((x) => x.id === id);
  if (!u) return;
  const [a, arg] = action.split(':');
  if (a === 'delete' && !(await confirmBox('Zmazať používateľa?', `${esc(u.email)} bude nenávratne odstránený.`, 'Zmazať', true))) return vAdmin();
  let text = '';
  if (a === 'plan') { text = `Plán ${u.email}: ${PLANS[u.plan].name} → ${PLANS[arg].name}`; if (isLive) { S.user.plan = arg; S.billing.trialEnds = null; if (arg !== 'free') S.billing.paidUntil = Date.now() + 30 * 864e5; F.notify('admin-plan-' + Date.now(), { type: 'billing', title: `Váš plán bol zmenený na ${PLANS[arg].name}`, body: 'Zmenu vykonal tím eFakturko.', href: '#/billing' }); F.save(); } else u.plan = arg; }
  if (a === 'credits') { text = `+50 AI kreditov pre ${u.email}`; if (isLive) { S.usage.ai = Math.max(0, S.usage.ai - 50); S.user.aiCredits = (S.user.aiCredits || 0) + 50; F.save(); } else u.credits = (u.credits || 0) + 50; }
  if (a === 'suspend' || a === 'activate') { text = `${a === 'suspend' ? 'Pozastavený' : 'Aktivovaný'} účet ${u.email}`; if (isLive) { S.user.status = a === 'suspend' ? 'suspended' : 'active'; F.save(); } else u.status = a === 'suspend' ? 'suspended' : 'active'; }
  if (a === 'delete') { text = `Zmazaný účet ${u.email}`; A.users = A.users.filter((x) => x.id !== id); }
  A.log.unshift({ at: Date.now(), who: 'admin', text }); F.saveAdmin(A);
  toast(text); vAdmin();
}

/* ================= COMMAND PALETTE ================= */
function cmdk() {
  const items = [['Nová faktúra', '#/invoices/new?fresh=1', 'plus'], ['Faktúry po splatnosti', '#/invoices?f=overdue', 'inv'], ['Klienti', '#/clients', 'users'], ['Skenovať bloček', '#/expenses?scan=1', 'cam'], ['Daňový radar', '#/taxes', 'tax'], ['AI asistent', '#/ai', 'ai'], ['Predplatné', '#/billing', 'card'], ['Nastavenia', '#/settings', 'gear']];
  const m = modal(`<div class="modal-b" style="padding:14px"><form data-form="cmd" style="display:flex;gap:10px;align-items:center;border-bottom:1px solid var(--line);padding:4px 6px 12px">${ic('ai', 'width="20" style="color:var(--violet)"')}<input name="q" autofocus autocomplete="off" placeholder="Vyfakturuj… alebo hľadajte" style="flex:1;border:0;outline:none;font-size:17px;height:36px"><span class="kbd">Enter</span></form><div id="cmdList" style="padding-top:8px"></div></div>`);
  const draw = (q) => {
    const ql = q.toLowerCase();
    const nav = items.filter(([l]) => !ql || l.toLowerCase().includes(ql));
    const inv = ql ? S.invoices.filter((i) => (i.number + ' ' + i.client.name).toLowerCase().includes(ql)).slice(0, 4) : [];
    $('#cmdList', m).innerHTML = (q && /\d/.test(q) || /vyfakt/i.test(q) ? `<a class="nav-i" style="color:var(--ink)" href="#" data-act="cmdAi">${ic('ai')} Vytvoriť faktúru s AI: „${esc(q)}“</a>` : '') + inv.map((i) => `<a class="nav-i" style="color:var(--ink)" href="#/invoices/${i.id}">${ic('inv')} ${esc(i.number)} · ${esc(i.client.name)} <span class="muted mono" style="margin-left:auto">${eur(totals(i).total)}</span></a>`).join('') + nav.map(([l, h, i]) => `<a class="nav-i" style="color:var(--ink)" href="${h}">${ic(i)} ${l}</a>`).join('');
  };
  draw('');
  const input = $('input', m); input.oninput = () => draw(input.value);
}
async function aiInvoice(q, btn) {
  if (!q.trim()) return;
  if (F.quota('invoices').left <= 0) return paywall('invoices');
  const old = btn?.innerHTML; if (btn) { btn.innerHTML = '<span class="spinner"></span> AI pracuje…'; btn.disabled = true; }
  const r = await runAI('invoice_draft', { text: q, clients: S.clients.map((x) => ({ name: x.name, ico: x.ico })), today: today(), vatPayer: !!S.company?.vatPayer });
  if (btn) { btn.innerHTML = old; btn.disabled = false; }
  if (!r) return;
  if (!r.data.items?.length) return toast('AI nerozpoznala položky — skúste „6 hodín konzultácie po 45 €“', 'err');
  window.__draft = r; ED = null; closeModal();
  go('#/invoices/new?fresh=1');
  setTimeout(() => toast(`✦ Návrh pripravený${r.data.clientMatchedExisting ? '' : ''} — skontrolujte a uložte`, 'ai'), 150);
}

/* ================= EVENTS ================= */
const ACT = {
  close: () => closeModal(),
  menu: () => { $('#side')?.classList.toggle('open'); $('#scrim')?.classList.toggle('open'); },
  cmdk,
  upgrade: (el, e) => { e.preventDefault(); paywall('invoices', S.user?.plan === 'pro' ? 'pro' : 'pro'); },
  paywall: (el) => paywall(el.dataset.f),
  trial: () => startTrial('pro'),
  checkout: (el) => checkout(el.dataset.p),
  cancelSub: () => cancelFlow(),
  sugg: (el) => { const q = el.dataset.q; if (/\?$/.test(q)) { CHAT = []; go('#/ai'); setTimeout(() => chatSend(q), 50); } else aiInvoice(q, el); },
  insights: () => { $('#insights').innerHTML = '<div class="insight"><div class="k shimmer"></div><div style="flex:1"><div class="shimmer" style="height:14px;border-radius:6px;width:60%"></div><div class="shimmer" style="height:12px;border-radius:6px;margin-top:8px"></div></div></div>'; loadInsights(true); },
  remind: (el) => remindFlow(el.dataset.id),
  filter: (el) => go('#/invoices' + (el.dataset.f === 'all' ? '' : '?f=' + el.dataset.f)),
  newClient: (el) => clientForm(null, el.dataset.from),
  editClient: (el) => clientForm(S.clients.find((c) => c.id === el.dataset.id)),
  addItem: () => { ED.items.push({ id: uid('l'), desc: '', qty: 1, unit: 'ks', price: 0, vat: S.company?.vatPayer ? 23 : 0 }); $('#itemsBody').innerHTML = itemsRows(); updateTotals(); $$('#itemsBody tr:last-child input')[0]?.focus(); },
  rmItem: (el) => { ED.items.splice(+el.dataset.k, 1); if (!ED.items.length) ED.items.push({ id: uid('l'), desc: '', qty: 1, unit: 'ks', price: 0, vat: 0 }); $('#itemsBody').innerHTML = itemsRows(); updateTotals(); },
  dueIn: (el) => { ED.dueDate = addDays(ED.issueDate, +el.dataset.d); $('[data-f="dueDate"]').value = ED.dueDate; },
  saveInv: (el) => saveInvoice(el.dataset.mode),
  markPaid: (el) => { const i = S.invoices.find((x) => x.id === el.dataset.id); i.status = 'paid'; i.paidAt = today(); i.events.push({ at: Date.now(), text: 'Označená ako zaplatená' }); F.track('invoice_paid'); F.save(); toast(`${i.number} zaplatená · ${eur(totals(i).total)}`); render(); },
  markUnpaid: (el) => { const i = S.invoices.find((x) => x.id === el.dataset.id); i.status = 'sent'; delete i.paidAt; i.events.push({ at: Date.now(), text: 'Úhrada zrušená' }); F.save(); render(); },
  send: (el) => { const i = S.invoices.find((x) => x.id === el.dataset.id); i.status = 'sent'; i.sentAt = Date.now(); i.events.push({ at: Date.now(), text: `Odoslaná na ${i.client.email || 'e‑mail klienta'}` }); F.track('invoice_send'); F.save(); toast('Faktúra odoslaná'); render(); },
  print: () => { F.track('pdf'); window.print(); },
  mail: (el) => { const i = S.invoices.find((x) => x.id === el.dataset.id); const t = totals(i); const body = `Dobrý deň,\n\nv prílohe posielam faktúru č. ${i.number} na sumu ${eur(t.total)} so splatnosťou ${fmtD(i.dueDate)}.\n\nIBAN: ${F.ibanFmt(S.company.iban)}\nVS: ${i.vs}\n\nĎakujem a prajem pekný deň,\n${S.company.person || S.company.name}`; location.href = `mailto:${encodeURIComponent(i.client.email || '')}?subject=${encodeURIComponent('Faktúra ' + i.number)}&body=${encodeURIComponent(body)}`; if (i.status === 'draft') { i.status = 'sent'; i.sentAt = Date.now(); } i.events.push({ at: Date.now(), text: 'E‑mail pripravený v poštovom klientovi' }); F.save(); },
  ubl: (el) => { if (!gate('ubl')) return; const i = S.invoices.find((x) => x.id === el.dataset.id); F.download(`faktura-${i.number}.xml`, F.ubl(i), 'application/xml'); F.track('ubl_export'); toast('e‑Faktúra (Peppol UBL) stiahnutá'); },
  dup: (el) => { const i = S.invoices.find((x) => x.id === el.dataset.id); if (F.quota('invoices').left <= 0) return paywall('invoices'); const t = today(); window.__draft = null; ED = { ...JSON.parse(JSON.stringify(i)), id: null, number: F.nextNumber(t).number, vs: F.nextNumber(t).number, issueDate: t, deliveryDate: t, dueDate: addDays(t, diffDays(i.dueDate, i.issueDate)), status: 'draft', paidAt: null, reminders: [], events: [], _for: 'new' }; go('#/invoices/new'); },
  toRecurring: (el) => recForm(S.invoices.find((x) => x.id === el.dataset.id)),
  delInv: async (el) => { if (await confirmBox('Zmazať faktúru?', 'Táto akcia sa nedá vrátiť. Zvážte radšej dobropis.', 'Zmazať', true)) { S.invoices = S.invoices.filter((x) => x.id !== el.dataset.id); F.save(); toast('Faktúra zmazaná'); go('#/invoices'); } },
  newExpense: () => expenseForm(null),
  editExpense: (el) => expenseForm(S.expenses.find((x) => x.id === el.dataset.id)),
  newRec: () => recForm(null),
  recRun: (el) => { if (!gate('recurring')) return; const r = S.recurring.find((x) => x.id === el.dataset.id); const inv = F.createInvoiceFromTemplate(r, today()); F.save(); toast(`Faktúra ${inv.number} vystavená`); go('#/invoices/' + inv.id + '/edit'); },
  recDel: async (el) => { if (await confirmBox('Zrušiť opakovanú faktúru?', 'Už vystavené faktúry zostanú.', 'Zrušiť', true)) { S.recurring = S.recurring.filter((x) => x.id !== el.dataset.id); F.save(); render(); } },
  chatSugg: (el) => chatSend(el.dataset.q),
  bell: () => { const host = $('#dropHost'); if (host.innerHTML) { host.innerHTML = ''; return; } host.innerHTML = `<div class="drop"><div class="card-h"><h3>Upozornenia</h3><a href="#/notifications" class="btn btn-quiet btn-sm">Všetky</a></div><div style="max-height:420px;overflow:auto">${S.notifications.slice(0, 6).map(notifRow).join('') || '<div class="empty">Nič nové</div>'}</div></div>`; },
  openNotif: (el) => { const n = S.notifications.find((x) => x.id === el.dataset.id); if (!n) return; n.read = true; F.save(); $('#dropHost') && ($('#dropHost').innerHTML = ''); go(n.href || '#/notifications'); },
  readAll: () => { S.notifications.forEach((n) => (n.read = true)); F.save(); render(); },
  testPush: async () => { if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission(); if ('Notification' in window && Notification.permission === 'granted') { new Notification('eFakturko · Test', { body: 'Upozornenia fungujú. Dáme vedieť, keď klient zaplatí alebo mešká.' }); } else toast('Upozornenia sú v prehliadači zablokované', 'err'); F.notify(null, { type: 'tip', title: 'Testovacie upozornenie', body: 'Takto vás budeme informovať o splatnostiach a platbách.', href: '#/notifications' }); F.save(); render(); },
  usermenu: () => { const m = modal(`${mh(esc(S.user.name), esc(S.user.email))}<div class="modal-b" style="display:flex;flex-direction:column;gap:8px"><a class="btn btn-ghost" href="#/settings">${ic('gear')} Nastavenia</a><a class="btn btn-ghost" href="#/billing">${ic('card')} Predplatné · ${F.plan().name}</a><a class="btn btn-ghost" href="#/admin">${ic('shield')} Admin konzola</a><a class="btn btn-ghost" href="./">Webstránka eFakturko</a><button class="btn btn-quiet" data-act="logout">${ic('out')} Odhlásiť</button></div>`); void m; },
  logout: () => { try { sessionStorage.removeItem('faktum:admin'); } catch {} location.href = './'; },
  wipe: async () => { if (await confirmBox('Zmazať účet?', 'Všetky faktúry, klienti a výdavky budú nenávratne zmazané z tohto zariadenia. Odporúčame najprv stiahnuť zálohu.', 'Zmazať všetko', true)) { F.reset(); location.href = './'; } },
  backup: () => { F.download(`faktum-zaloha-${today()}.json`, JSON.stringify(S, null, 2), 'application/json'); toast('Záloha stiahnutá'); },
  exportCsv: () => { const rows = [['cislo', 'klient', 'ico', 'vystavena', 'splatnost', 'zaklad', 'dph', 'spolu', 'stav']].concat(S.invoices.map((i) => { const t = totals(i); return [i.number, i.client.name, i.client.ico, i.issueDate, i.dueDate, t.base, t.vat, t.total, F.STATUS[status(i)]]; })); F.download(`faktury-${today()}.csv`, '﻿' + rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n'), 'text/csv'); },
  lookupCompany: async () => { const f = $('[data-form="company"]'); const r = await F.lookupIco(f.ico.value); if (!r) return toast('Firmu sa nepodarilo nájsť', 'err'); f.name.value = r.name; f.address.value = r.address; if (r.dic) f.dic.value = r.dic; if (r.icdph) f.icdph.value = r.icdph; toast('Načítané z registra'); },
  obLookup: async (el) => { const f = el.closest('form'); el.innerHTML = '<span class="spinner"></span>'; const r = await F.lookupIco(f.ico.value); el.innerHTML = `${ic('search')} Načítať`; if (!r) return toast('Firmu sa nepodarilo nájsť — vyplňte ručne', 'err'); f.cname.value = r.name; f.address.value = r.address; f.dic.value = r.dic || ''; f.icdph.value = r.icdph || ''; if (r.icdph) f.vatPayer.checked = true; toast('Údaje načítané z registra'); },
  obBack: () => { const f = $('.ob-form'); for (const [k, v] of new FormData(f)) OB.d[k] = v; OB.step = Math.max(1, OB.step - 1); vOnboarding(); },
  cmdAi: (el, e) => { e.preventDefault(); const q = $('[data-form="cmd"] input').value; aiInvoice(q); },
  admTab: (el) => { ADM.tab = el.dataset.t; vAdmin(); },
  admPlan: (el) => { ADM.plan = el.dataset.p; vAdmin(); },
  admOut: () => { try { sessionStorage.removeItem('faktum:admin'); } catch {} vAdmin(); },
  admCsv: () => { const A = F.adminData(); const users = [F.liveUser(), ...A.users].filter(Boolean); F.download('faktum-users.csv', '﻿' + [['id', 'meno', 'email', 'plan', 'cyklus', 'faktury', 'ai', 'registracia', 'stav'].join(';'), ...users.map((u) => [u.id, u.name, u.email, u.plan, u.cycle, u.invoices, u.ai, new Date(u.createdAt).toISOString().slice(0, 10), u.status].join(';'))].join('\n'), 'text/csv'); },
};
document.addEventListener('click', (e) => {
  const href = e.target.closest('tr[data-href]'); if (href && !e.target.closest('a,button,select,input')) { go(href.dataset.href); return; }
  const a = e.target.closest('[data-act]');
  if (a && ACT[a.dataset.act]) { if (a.tagName === 'A' && a.getAttribute('href') === '#') e.preventDefault(); ACT[a.dataset.act](a, e); return; }
  if (!e.target.closest('.drop, [data-act="bell"]')) { const h = $('#dropHost'); if (h) h.innerHTML = ''; }
  if (e.target.closest('.side a')) { $('#side')?.classList.remove('open'); $('#scrim')?.classList.remove('open'); }
});
let searchT;
document.addEventListener('input', (e) => {
  const el = e.target;
  if (ED && el.dataset.f && el.closest('.editor, .page')) { ED[el.dataset.f] = el.value; if (el.dataset.f === 'issueDate' && el.value) { ED.dueDate = addDays(el.value, S.settings.dueDays); const d = $('[data-f="dueDate"]'); if (d) d.value = ED.dueDate; } }
  if (ED && el.dataset.it !== undefined) { const it = ED.items[+el.dataset.it]; const k = el.dataset.k; it[k] = ['qty', 'price', 'vat'].includes(k) ? +String(el.value).replace(',', '.').replace(/\s/g, '') || 0 : el.value; updateTotals(); }
  const ai = el.dataset.actInput;
  if (ai === 'iban') { const info = $('#ibanInfo'); if (info) { const v = F.ibanClean(el.value); info.textContent = v.length < 15 ? '' : F.ibanValid(v) ? '✓ ' + (F.bankOf(v) || 'platný IBAN') : '✗ neplatný IBAN'; info.style.color = F.ibanValid(v) ? '#0F7A52' : 'var(--coral)'; } }
  if (ai === 'searchInv' || ai === 'searchCli') { clearTimeout(searchT); const v = el.value; searchT = setTimeout(() => { const base = ai === 'searchInv' ? '#/invoices' : '#/clients'; const q = new URLSearchParams(ROUTE.q); v ? q.set('q', v) : q.delete('q'); history.replaceState(null, '', base + (q.toString() ? '?' + q : '')); render(); const i = $(`[data-act-input="${ai}"]`); if (i) { i.focus(); i.setSelectionRange(v.length, v.length); } }, 250); }
  if (ai === 'admQ') { clearTimeout(searchT); ADM.q = el.value; searchT = setTimeout(() => { vAdmin(); const i = $('[data-act-input="admQ"]'); if (i) { i.focus(); i.setSelectionRange(ADM.q.length, ADM.q.length); } }, 250); }
});
document.addEventListener('change', async (e) => {
  const el = e.target;
  if (ED && el.dataset.f === 'clientId') { const c = S.clients.find((x) => x.id === el.value); ED.clientId = el.value; ED.client = c ? F.snap(c) : null; $('#clientCard').innerHTML = c ? clientMini(ED.client) : ''; }
  if (ED && el.dataset.it !== undefined && el.tagName === 'SELECT') { ED.items[+el.dataset.it][el.dataset.k] = el.dataset.k === 'vat' ? +el.value : el.value; updateTotals(); }
  const a = el.dataset.actChange;
  if (a === 'recToggle') { const r = S.recurring.find((x) => x.id === el.dataset.id); r.active = el.checked; F.save(); toast(r.active ? 'Obnovené' : 'Pozastavené'); }
  if (a === 'setting') {
    const k = el.dataset.k;
    if (k === 'autoDunning' && el.checked && !F.has('dunning')) { el.checked = false; return paywall('dunning'); }
    if (k === 'push' && el.checked) { if (!('Notification' in window)) { el.checked = false; return toast('Prehliadač nepodporuje upozornenia', 'err'); } const p = await Notification.requestPermission(); if (p !== 'granted') { el.checked = false; return toast('Upozornenia boli zamietnuté', 'err'); } }
    S.settings[k] = el.checked; F.track('setting_' + k); F.save(); toast('Uložené');
  }
  if (a === 'admSort') { ADM.sort = el.value; vAdmin(); }
  if (a === 'admUser') admUser(el.dataset.id, el.value);
  if (el.id === 'scanFile') scanReceipt(el.files[0]);
  if (el.id === 'restoreFile' && el.files[0]) { try { const d = JSON.parse(await el.files[0].text()); if (!d.user || !Array.isArray(d.invoices)) throw 0; F.setS(d); toast('Dáta obnovené'); render(); } catch { toast('Neplatný súbor zálohy', 'err'); } }
});
document.addEventListener('submit', (e) => {
  const f = e.target; const k = f.dataset.form; if (!k) return;
  e.preventDefault();
  const q = f.q?.value || '';
  if (k === 'aibar') { if (/\?$/.test(q.trim())) { CHAT = []; go('#/ai'); setTimeout(() => chatSend(q), 50); } else aiInvoice(q, f.querySelector('button')); }
  if (k === 'aidraft') { (async () => { const btn = f.querySelector('button'); const old = btn.innerHTML; btn.innerHTML = '<span class="spinner"></span>'; const r = await runAI('invoice_draft', { text: q, clients: S.clients.map((x) => ({ name: x.name, ico: x.ico })), today: today(), vatPayer: !!S.company?.vatPayer }); btn.innerHTML = old; if (!r) return; if (!r.data.items?.length) return toast('AI nerozpoznala položky', 'err'); applyDraft(r.data, r.source); F.save(); render(); toast('✦ Faktúra vyplnená — skontrolujte', 'ai'); })(); }
  if (k === 'chat') chatSend(q);
  if (k === 'cmd') { if (/\d|vyfakt/i.test(q)) aiInvoice(q); else { const first = $('#cmdList a[href^="#/"]'); if (first) { closeModal(); location.hash = first.getAttribute('href'); } } }
  if (k === 'ob') obSubmit(f);
  if (k === 'login') { const em = f.email.value.trim().toLowerCase(); if (S.user && S.user.email.toLowerCase() === em) { go('#/dashboard'); toast(`Vitajte späť, ${esc(S.user.name.split(' ')[0])}`); } else toast('Účet s týmto e‑mailom v tomto prehliadači neexistuje', 'err'); }
  if (k === 'admin') { if (f.pin.value === '2027') { try { sessionStorage.setItem('faktum:admin', '1'); } catch {} F.adminData(); vAdmin(); } else toast('Nesprávny PIN', 'err'); }
  if (k === 'company') { const d = Object.fromEntries(new FormData(f)); Object.assign(S.company, d, { vatPayer: !!d.vatPayer, iban: F.ibanClean(d.iban) }); if (d.iban && !F.ibanValid(d.iban)) toast('IBAN je neplatný — QR kód sa nevygeneruje', 'err'); else toast('Údaje firmy uložené'); F.save(); render(); }
  if (k === 'prefs') { const d = Object.fromEntries(new FormData(f)); S.settings.dueDays = Math.max(0, +d.dueDays || 14); S.settings.note = d.note; S.settings.accent = d.accent || S.settings.accent; S.settings.remind = { d0: !!d.r_d0, d7: !!d.r_d7, d14: !!d.r_d14 }; F.save(); toast('Nastavenia uložené'); render(); }
});
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && S.user && !['onboarding', 'login', 'admin'].includes(ROUTE.parts[0])) { e.preventDefault(); cmdk(); }
  if (e.key === 'Escape') closeModal();
});
window.addEventListener('hashchange', () => { if (!location.hash.includes('/invoices/new') && !/\/edit/.test(location.hash)) ED = null; render(); });
setInterval(() => { if (S.user && !$('.modal-bg') && document.visibilityState === 'visible') { const before = F.unread(); F.engine(); if (F.unread() > before && !['onboarding', 'admin'].includes(ROUTE.parts[0])) { const b = $('[data-act="bell"]'); if (b) b.innerHTML = ic('bell') + `<span class="dot">${F.unread()}</span>`; } } }, 60000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.user) { S.analytics.sessions++; S.analytics.lastSeen = Date.now(); F.save(); } });

render();
})();
