/* ==========================================================================
   FAKTUM core — state, plans & paywall, invoice math, AI client with local
   fallbacks, notification/retention engine, Peppol UBL export, admin data.
   Exposes everything on window.F for app.js (views).
   ========================================================================== */
(() => {
'use strict';

/* ---------------- utils ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = (p = '') => p + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
const round2 = (n) => Math.round((+n + Number.EPSILON) * 100) / 100;
const eur = (n, dec = 2) => new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR', minimumFractionDigits: dec, maximumFractionDigits: dec }).format(+n || 0);
const nf = (n, dec = 2) => new Intl.NumberFormat('sk-SK', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(+n || 0);
const pad = (n) => String(n).padStart(2, '0');
const iso = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => iso();
const parseD = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return iso(d); };
const addMonths = (s, n) => { const d = parseD(s); const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(day, last)); return iso(d); };
const diffDays = (a, b) => Math.round((parseD(a) - parseD(b)) / 864e5);
const fmtD = (s) => { if (!s) return '—'; const d = parseD(s); return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`; };
const ym = (s = today()) => s.slice(0, 7);
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'máj', 'jún', 'júl', 'aug', 'sep', 'okt', 'nov', 'dec'];
const MONTHS_FULL = ['január', 'február', 'marec', 'apríl', 'máj', 'jún', 'júl', 'august', 'september', 'október', 'november', 'december'];
const ago = (t) => { const s = (Date.now() - t) / 1000; if (s < 60) return 'práve teraz'; if (s < 3600) return `pred ${Math.floor(s / 60)} min`; if (s < 86400) return `pred ${Math.floor(s / 3600)} h`; const d = Math.floor(s / 86400); return d === 1 ? 'včera' : `pred ${d} dňami`; };
const initials = (n) => String(n || '?').replace(/s\.r\.o\.|a\.s\.|–|-/gi, ' ').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const hue = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const avatarBg = (s) => `hsl(${hue(s)} 70% 86%)`;
const plural = (n, one, few, many) => `${n} ${n === 1 ? one : n >= 2 && n <= 4 ? few : many}`;

/* ---------------- plans & paywall ---------------- */
const PLANS = {
  free: { id: 'free', name: 'Štart', price: 0, yprice: 0, invoices: 5, ai: 3, features: [] },
  pro: { id: 'pro', name: 'Pro', price: 14.7, yprice: 11.8, invoices: Infinity, ai: 100, features: ['recurring', 'dunning', 'ubl', 'tax', 'nobrand'] },
  business: { id: 'business', name: 'Business', price: 47.7, yprice: 38.2, invoices: Infinity, ai: Infinity, features: ['recurring', 'dunning', 'ubl', 'tax', 'nobrand', 'forecast', 'team', 'api'] },
  max: { id: 'max', name: 'Max', price: 104.7, yprice: 83.8, invoices: Infinity, ai: Infinity, features: ['recurring', 'dunning', 'ubl', 'tax', 'nobrand', 'forecast', 'team', 'api'] },
};
const FEATURES = {
  recurring: { name: 'Opakované faktúry', plan: 'pro', pitch: 'Paušály a mesačné služby sa vystavia a odošlú samé.' },
  dunning: { name: 'Automatické upomienky', plan: 'pro', pitch: 'Upomienky odídu samé v deň 1, 7 a 14 po splatnosti.' },
  ubl: { name: 'e‑Faktúra (Peppol UBL)', plan: 'pro', pitch: 'Od 1. 1. 2027 povinná pre platiteľov DPH.' },
  tax: { name: 'Daňový radar', plan: 'pro', pitch: 'Viete, koľko si odkladať na daň a odvody — každý mesiac.' },
  nobrand: { name: 'Faktúry bez loga eFakturko', plan: 'pro', pitch: 'Vaša značka, nie naša.' },
  forecast: { name: 'Cashflow predikcia 90 dní', plan: 'business', pitch: 'Vidíte, kedy príde peňažná diera — skôr, než príde.' },
  team: { name: 'Tím a prístup účtovníka', plan: 'business', pitch: 'Až 5 používateľov a účtovník s vlastným prístupom.' },
  api: { name: 'API a webhooky', plan: 'business', pitch: 'Napojte e‑shop alebo CRM.' },
  invoices: { name: 'Neobmedzené faktúry', plan: 'pro', pitch: 'V pláne Štart máte 5 faktúr mesačne.' },
  ai: { name: 'Viac AI akcií', plan: 'pro', pitch: 'Pro má 100 AI akcií mesačne, Business neobmedzene.' },
};

/* ---------------- state ---------------- */
const KEY = 'faktum:v1';
const ADMIN_KEY = 'faktum:admin:v1';
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
const blank = () => ({
  v: 1, user: null, company: null, clients: [], invoices: [], expenses: [], recurring: [], notifications: [],
  counters: {}, usage: { month: ym(), invoices: 0, ai: 0 },
  settings: { dueDays: 14, note: '', accent: '#2E1065', remind: { d0: true, d7: true, d14: true }, push: false, digest: true, autoDunning: true },
  billing: { cycle: 'm', trialEnds: null, paidUntil: null, history: [], coupon: null },
  analytics: { events: {}, firstSeen: Date.now(), lastSeen: Date.now(), sessions: 0 },
  checklist: {},
});
const S = Object.assign(blank(), store.get(KEY) || {});
const save = () => store.set(KEY, S);
const replaceS = (n) => { for (const k of Object.keys(S)) delete S[k]; Object.assign(S, blank(), n); save(); };
const reset = () => replaceS({});
const getS = () => S;
const setS = (n) => replaceS(n || {});

const plan = () => PLANS[S.user?.plan || 'free'];
const has = (f) => plan().features.includes(f);
const rollUsage = () => { if (S.usage.month !== ym()) S.usage = { month: ym(), invoices: 0, ai: 0 }; };
const track = (ev, n = 1) => { S.analytics.events[ev] = (S.analytics.events[ev] || 0) + n; S.analytics.lastSeen = Date.now(); };
const quota = (kind) => { rollUsage(); const lim = plan()[kind]; const used = S.usage[kind]; return { used, lim, left: lim === Infinity ? Infinity : Math.max(0, lim - used), pct: lim === Infinity ? 0 : Math.min(100, (used / lim) * 100) }; };

/* ---------------- money / invoice math ---------------- */
const VAT_RATES = [23, 19, 5, 0];
function totals(inv) {
  const groups = {};
  let base = 0;
  for (const it of inv.items || []) {
    const b = round2((+it.qty || 0) * (+it.price || 0));
    const r = S.company?.vatPayer ? +it.vat || 0 : 0;
    groups[r] = groups[r] || { rate: r, base: 0, vat: 0 };
    groups[r].base = round2(groups[r].base + b);
    base = round2(base + b);
  }
  let vat = 0;
  for (const g of Object.values(groups)) { g.vat = round2((g.base * g.rate) / 100); vat = round2(vat + g.vat); }
  return { base, vat, total: round2(base + vat), groups: Object.values(groups).sort((a, b) => b.rate - a.rate) };
}
function status(inv) {
  if (inv.status === 'paid') return 'paid';
  if (inv.status === 'draft') return 'draft';
  const d = diffDays(inv.dueDate, today());
  if (d < 0) return 'overdue';
  if (d <= 3) return 'due';
  return 'sent';
}
const STATUS = { paid: 'Zaplatená', draft: 'Koncept', overdue: 'Po splatnosti', due: 'Blíži sa splatnosť', sent: 'Odoslaná' };
const chip = (st) => `<span class="chip ${st}">${STATUS[st]}</span>`;
function nextNumber(dateStr = today()) {
  const y = dateStr.slice(0, 4);
  const n = (S.counters[y] || 0) + 1;
  return { y, n, number: `${y}${String(n).padStart(4, '0')}` };
}
function commitNumber(y, n) { S.counters[y] = Math.max(S.counters[y] || 0, n); }

/* ---------------- banks / IBAN ---------------- */
const BANKS = { '0200': 'VÚB banka', '0900': 'Slovenská sporiteľňa', '1100': 'Tatra banka', '7500': 'ČSOB', '5600': 'Prima banka', '6500': '365.bank', '3100': '365.bank', '8360': 'mBank', '8330': 'Fio banka', '1111': 'UniCredit Bank', '5200': 'OTP Banka', '5900': 'Prima banka', '7300': 'ING Bank', '8180': 'Štátna pokladnica' };
const ibanClean = (s) => String(s || '').replace(/\s+/g, '').toUpperCase();
const ibanFmt = (s) => ibanClean(s).replace(/(.{4})/g, '$1 ').trim();
function ibanValid(s) {
  const v = ibanClean(s);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(v)) return false;
  const r = (v.slice(4) + v.slice(0, 4)).replace(/[A-Z]/g, (c) => c.charCodeAt(0) - 55);
  let m = 0; for (const ch of r) m = (m * 10 + +ch) % 97;
  return m === 1;
}
const bankOf = (s) => { const v = ibanClean(s); return v.startsWith('SK') ? BANKS[v.slice(4, 8)] || '' : ''; };

/* ---------------- company register lookup ---------------- */
// Built-in sample register for the demo + a best-effort call to the public RPO API.
const REGISTER = {
  '52418337': { name: 'Kaviareň Mlyn s.r.o.', address: 'Hlavná 12, 917 01 Trnava', dic: '2121034567', icdph: 'SK2121034567' },
  '47112233': { name: 'Novák & partneri s.r.o.', address: 'Mlynské nivy 5, 821 09 Bratislava', dic: '2023456789', icdph: 'SK2023456789' },
  '50987654': { name: 'Horská chata Tatry s.r.o.', address: 'Starý Smokovec 41, 062 01 Vysoké Tatry', dic: '2120987654', icdph: '' },
  '45678901': { name: 'Studio Pixel a.s.', address: 'Štúrova 18, 040 01 Košice', dic: '2022678901', icdph: 'SK2022678901' },
};
async function lookupIco(ico) {
  const k = String(ico || '').replace(/\D/g, '');
  if (k.length !== 8) return null;
  if (REGISTER[k]) return { ico: k, ...REGISTER[k], source: 'register' };
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 4000);
    const r = await fetch(`https://api.statistics.sk/rpo/v1/search?identifier=${k}`, { signal: ctl.signal });
    clearTimeout(t);
    if (!r.ok) return null;
    const j = await r.json();
    const e = j?.results?.[0];
    if (!e) return null;
    const name = e.fullNames?.[0]?.value || '';
    const a = e.addresses?.[0] || {};
    const address = [[a.street, a.buildingNumber || a.regNumber].filter(Boolean).join(' '), [a.postalCodes?.[0], a.municipality?.value].filter(Boolean).join(' ')].filter(Boolean).join(', ');
    return name ? { ico: k, name, address, dic: '', icdph: '', source: 'rpo' } : null;
  } catch { return null; }
}

/* ---------------- AI client with local fallbacks ---------------- */
const AI_URL = '/.netlify/functions/faktum-ai';
async function ai(action, payload, { count = true } = {}) {
  if (count) {
    const q = quota('ai');
    if (q.left <= 0) { const err = new Error('quota'); err.code = 'quota'; throw err; }
    S.usage.ai += 1; track('ai_' + action); save();
  }
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 45000);
    const r = await fetch(AI_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, payload }), signal: ctl.signal });
    clearTimeout(t);
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.ok) return { data: j.data, source: 'ai' };
  } catch {}
  return { data: LOCAL[action](payload), source: 'local' };
}

// --- local heuristics: keep every AI feature useful offline ---
function parseNum(s) { return parseFloat(String(s).replace(/\s/g, '').replace(',', '.')) || 0; }
const LOCAL = {
  invoice_draft({ text, clients = [], vatPayer }) {
    const raw = String(text || '');
    const t = norm(raw);
    let clientName = '', matched = false;
    let best = 0;
    for (const c of clients) {
      const words = norm(c.name).split(' ').filter((w) => w.length > 2 && !['sro', 'spol', 'partneri'].includes(w));
      const hit = words.filter((w) => t.includes(w)).length;
      if (hit > best) { best = hit; clientName = c.name; matched = true; }
    }
    if (!matched) {
      const m = raw.match(/(?:vyfakturuj|faktúr[au]? (?:pre|pre firmu)|pre)\s+([^:,\n]+?)(?:\s*[:,]|\s+\d|$)/i);
      if (m) clientName = m[1].trim();
    }
    const dueM = raw.match(/splatnos\S*\s*(\d{1,3})/i) || raw.match(/(\d{1,3})\s*dn[íi]/i);
    const body = raw.replace(/splatnos\S*\s*\d{1,3}\s*\S*/gi, '').replace(/^[^:]*:/, (m0) => (m0.length < 60 ? '' : m0));
    const parts = [];
    for (const s0 of body.replace(/(\d)\s(?=\d{3}\b)/g, '$1').split(/[;\n]|,(?!\d)|\s+a\s+(?=\d|[a-zá-ž]+\s+\d)/i).map((s) => s.trim()).filter(Boolean)) {
      if (/^\d[\d.,]*\s*(?:€|eur)$/i.test(s0) && parts.length && !/\d\s*(?:€|eur)/i.test(parts[parts.length - 1])) parts[parts.length - 1] += ' ' + s0; else parts.push(s0);
    }
    const items = [];
    for (const p of parts) {
      let m = p.match(/(\d+(?:[.,]\d+)?)\s*(hod(?:ín|iny|ina)?|h|ks|x|dní|dni|deň|m2|km|mes(?:iac|iace|iacov)?)\.?\s+(.+?)\s+(?:po|à|a|za)\s+(\d[\d\s]*(?:[.,]\d+)?)\s*(?:€|eur)/i);
      if (m) { const u = m[2].toLowerCase(); items.push({ description: cap(m[3]), quantity: parseNum(m[1]), unit: /^h/.test(u) ? 'hod' : /^d/.test(u) ? 'deň' : /^mes/.test(u) ? 'mes' : u === 'x' ? 'ks' : u, unitPrice: parseNum(m[4]), vatRate: vatPayer ? 23 : 0 }); continue; }
      m = p.match(/(.+?)\s+(\d[\d\s]*(?:[.,]\d+)?)\s*(?:€|eur)/i);
      if (m) {
        const desc = m[1].replace(/^(?:vyfakturuj|faktúra)\s+[^:]+:\s*/i, '').replace(new RegExp(clientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '').trim();
        if (desc) { items.push({ description: cap(desc), quantity: 1, unit: 'ks', unitPrice: parseNum(m[2]), vatRate: vatPayer ? 23 : 0 }); }
      }
    }
    return { clientName, clientMatchedExisting: matched, items, dueDays: dueM ? +dueM[1] : 14, note: '', confidence: items.length ? 0.6 : 0.2 };
  },
  receipt_scan() { return { vendor: '', vendorIco: '', date: today(), total: 0, vatAmount: 0, vatRate: 23, category: 'Iné', description: '' }; },
  dunning({ level, invoice, company }) {
    const L = {
      1: { s: `Priateľská pripomienka – faktúra ${invoice.number}`, o: `dovoľujem si Vám pripomenúť faktúru č. ${invoice.number}, ktorej splatnosť bola ${fmtD(invoice.dueDate)}. Možno len zapadla medzi e‑mailmi — nič sa nedeje.` },
      2: { s: `Upomienka – neuhradená faktúra ${invoice.number}`, o: `podľa našej evidencie zostáva faktúra č. ${invoice.number} so splatnosťou ${fmtD(invoice.dueDate)} stále neuhradená. Prosím o úhradu v najbližších dňoch.` },
      3: { s: `Posledná výzva na úhradu – faktúra ${invoice.number}`, o: `napriek predchádzajúcim upomienkam evidujeme faktúru č. ${invoice.number} ako neuhradenú už ${Math.max(0, -diffDays(invoice.dueDate, today()))} dní po splatnosti. Ak nebude uhradená do 7 dní, budeme nútení postupovať podľa § 369 Obchodného zákonníka a uplatniť úrok z omeškania a náklady spojené s vymáhaním.` },
    }[level] || {};
    return { subject: L.s, body: `Dobrý deň,\n\n${L.o}\n\nSuma na úhradu: ${eur(invoice.total)}\nIBAN: ${ibanFmt(company.iban)}\nVariabilný symbol: ${invoice.vs}\n\nAk ste už platbu odoslali, považujte túto správu za bezpredmetnú.\n\nS pozdravom\n${company.name}` };
  },
  insights({ stats }) {
    const out = [];
    if (stats.overdueSum > 0) out.push({ title: `${eur(stats.overdueSum, 0)} po splatnosti`, body: `${plural(stats.overdueCount, 'faktúra čaká', 'faktúry čakajú', 'faktúr čaká')} na úhradu. Zapnite automatické upomienky, aby ste ich nemuseli naháňať ručne.`, kind: 'cash' });
    if (stats.topClientShare > 0.4) out.push({ title: `Závislosť na jednom klientovi`, body: `${stats.topClient} tvorí ${Math.round(stats.topClientShare * 100)} % vašich tržieb. Pri strate klienta by príjem klesol na ${eur(stats.ytd * (1 - stats.topClientShare), 0)} ročne.`, kind: 'risk' });
    if (!stats.vatPayer && stats.vatThresholdPct > 0.5) out.push({ title: `${Math.round(stats.vatThresholdPct * 100)} % hranice pre DPH`, body: `Obrat za 12 mesiacov je ${eur(stats.turnover12, 0)} z 50 000 €. Pri súčasnom tempe ${stats.vatEta ? 'hranicu prekročíte okolo ' + stats.vatEta : 'sa k hranici blížite'}.`, kind: 'tax' });
    if (stats.avgPayDays > 3) out.push({ title: `Klienti platia v priemere o ${Math.round(stats.avgPayDays)} dní neskôr`, body: `Skráťte splatnosť na 7 dní pre nových klientov alebo pýtajte zálohu 30 % pri väčších zákazkách.`, kind: 'cash' });
    if (stats.momGrowth > 0.05) out.push({ title: `Tržby rastú o ${Math.round(stats.momGrowth * 100)} %`, body: `Tento mesiac ste vyfakturovali viac ako minulý. Je čas zvážiť zvýšenie hodinovej sadzby o 10 %.`, kind: 'growth' });
    out.push({ title: 'Odkladajte si na dane', body: `Pri vašich príjmoch si odkladajte približne ${eur(stats.monthlyReserve, 0)} mesačne na daň a odvody.`, kind: 'tax' });
    return { insights: out.slice(0, 3) };
  },
  ask({ question }) {
    const q = norm(question);
    const A = [
      [/pausal|vydav/, 'Paušálne výdavky si SZČO môže uplatniť vo výške 60 % z príjmov, najviac 20 970 € ročne. Výhodné sú, ak sú vaše skutočné výdavky nižšie. eFakturko ich porovnáva v Daňovom radare.'],
      [/dph|registr/, 'Povinnosť registrovať sa za platiteľa DPH vzniká po prekročení obratu 50 000 € za kalendárny rok; pri prekročení 62 500 € vzniká okamžite. eFakturko stráži obrat priebežne.'],
      [/e.?faktur|peppol|2027/, 'Od 1. 1. 2027 budú platitelia DPH vystavovať štruktúrované e‑faktúry cez sieť Peppol. eFakturko exportuje UBL XML podľa Peppol BIS Billing 3.0 (plán Pro a Business).'],
      [/odvod|socialn|zdravot/, 'SZČO platí sociálne odvody, ak príjmy za predchádzajúci rok prekročili zákonnú hranicu. Zdravotné odvody platí vždy (minimálne preddavky). Presné sumy nájdete v Daňovom radare — sú orientačné.'],
      [/nalezitost|co musi|obsahovat/, 'Faktúra musí obsahovať: údaje dodávateľa a odberateľa (názov, adresa, IČO, DIČ, prípadne IČ DPH), poradové číslo, dátum vyhotovenia a dodania, popis plnenia, základ dane, sadzbu a výšku DPH (u platiteľov) a celkovú sumu.'],
      [/upomien|nezaplat|mesk/, 'Pri omeškaní môžete účtovať úrok z omeškania a paušálnu náhradu 40 € (B2B). Odporúčame 3 kroky: priateľská pripomienka, vecná upomienka po 7 dňoch, posledná výzva po 14 dňoch — eFakturko to robí automaticky.'],
      [/priznan|termin|kedy/, 'Daňové priznanie typu B treba podať do 31. marca (s možnosťou odkladu o 3 alebo 6 mesiacov). Platitelia DPH podávajú priznanie do 25. dňa po skončení obdobia.'],
    ];
    const hit = A.find(([re]) => re.test(q));
    return { answer: hit ? hit[1] : 'Na túto otázku teraz v offline režime neviem odpovedať presne. Skúste sa opýtať na paušálne výdavky, DPH, e‑faktúru, odvody, náležitosti faktúry alebo upomienky.' };
  },
};
function cap(s) { s = String(s || '').trim(); return s.charAt(0).toUpperCase() + s.slice(1); }

/* ---------------- business stats (for dashboard, insights, tax) ---------------- */
function stats() {
  const t = today();
  const y = t.slice(0, 4);
  const issued = S.invoices.filter((i) => i.status !== 'draft');
  const tot = (i) => totals(i).total;
  const base = (i) => totals(i).base;
  const byMonth = Array.from({ length: 12 }, (_, k) => { const d = parseD(t); d.setDate(1); d.setMonth(d.getMonth() - 11 + k); return { key: iso(d).slice(0, 7), label: MONTHS[d.getMonth()], billed: 0, paid: 0 }; });
  for (const i of issued) { const m = byMonth.find((b) => b.key === ym(i.issueDate)); if (m) m.billed += tot(i); }
  for (const i of S.invoices.filter((x) => x.status === 'paid')) { const m = byMonth.find((b) => b.key === ym(i.paidAt || i.issueDate)); if (m) m.paid += tot(i); }
  const thisM = byMonth[11].billed, lastM = byMonth[10].billed;
  const open = issued.filter((i) => i.status !== 'paid');
  const overdue = open.filter((i) => status(i) === 'overdue');
  const dueSoon = open.filter((i) => status(i) === 'due');
  const paidYtd = S.invoices.filter((i) => i.status === 'paid' && (i.paidAt || i.issueDate).startsWith(y));
  const incomeYtd = paidYtd.reduce((s, i) => s + base(i), 0); // income = base without VAT
  const billedYtd = issued.filter((i) => i.issueDate.startsWith(y)).reduce((s, i) => s + base(i), 0);
  const expYtd = S.expenses.filter((e) => e.date.startsWith(y)).reduce((s, e) => s + (S.company?.vatPayer ? +e.total - (+e.vatAmount || 0) : +e.total), 0);
  const turnover12 = issued.filter((i) => diffDays(t, i.issueDate) <= 365).reduce((s, i) => s + base(i), 0);
  const byClient = {};
  for (const i of issued.filter((x) => x.issueDate.startsWith(y))) byClient[i.client?.name || '?'] = (byClient[i.client?.name || '?'] || 0) + base(i);
  const topClient = Object.entries(byClient).sort((a, b) => b[1] - a[1])[0] || ['', 0];
  const lates = S.invoices.filter((i) => i.status === 'paid' && i.paidAt).map((i) => diffDays(i.paidAt, i.dueDate));
  const avgPayDays = lates.length ? lates.reduce((a, b) => a + b, 0) / lates.length : 0;
  const dayOfYear = diffDays(t, `${y}-01-01`) + 1;
  const perDay = turnover12 / 365;
  const vatEta = perDay > 0 && turnover12 < 50000 ? (() => { const d = parseD(t); d.setDate(d.getDate() + Math.ceil((50000 - turnover12) / perDay)); return `${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`; })() : '';
  const tx = taxCalc(incomeYtd, expYtd, dayOfYear);
  return {
    byMonth, thisM, lastM, momGrowth: lastM ? (thisM - lastM) / lastM : 0,
    openSum: open.reduce((s, i) => s + tot(i), 0), openCount: open.length,
    overdue, overdueSum: overdue.reduce((s, i) => s + tot(i), 0), overdueCount: overdue.length, dueSoon,
    incomeYtd, billedYtd, expYtd, profitYtd: incomeYtd - expYtd, turnover12, ytd: billedYtd,
    topClient: topClient[0], topClientShare: billedYtd ? topClient[1] / billedYtd : 0, byClient,
    avgPayDays, vatThresholdPct: turnover12 / 50000, vatEta, vatPayer: !!S.company?.vatPayer,
    tax: tx, monthlyReserve: tx.projected.totalBurden / 12,
  };
}

/* ---------------- Slovak SZČO tax estimate (orientačný) ---------------- */
// Parameters for 2026 — indicative, shown to the user as assumptions.
const TAXP = { flatPct: 0.6, flatMax: 20970, nczd: 5966.73, rateLow: 0.15, lowTurnover: 60000, rate19: 0.19, rate25: 0.25, band25: 48441.43, socPct: 0.3315, healthPct: 0.16, vzDivisor: 1.486, minHealthMonthly: 106.06, socThresholdYear: 8124 };
function taxCalc(income, actualExp, dayOfYear = 365) {
  const f = 365 / Math.max(1, dayOfYear);
  const one = (inc, exp) => {
    const flat = Math.min(inc * TAXP.flatPct, TAXP.flatMax);
    const calc = (e) => {
      const vz = Math.max(0, (inc - e) / TAXP.vzDivisor);
      const social = inc > TAXP.socThresholdYear ? vz * TAXP.socPct : 0;
      const health = Math.max(vz * TAXP.healthPct, TAXP.minHealthMonthly * 12);
      const base = Math.max(0, inc - e - social - health - TAXP.nczd);
      const tax = inc <= TAXP.lowTurnover ? base * TAXP.rateLow : Math.min(base, TAXP.band25) * TAXP.rate19 + Math.max(0, base - TAXP.band25) * TAXP.rate25;
      return { exp: e, social, health, base, tax, totalBurden: tax + social + health, net: inc - exp - tax - social - health };
    };
    const a = calc(flat), b = calc(exp);
    return { income: inc, flat: a, actual: b, best: a.net >= b.net ? 'flat' : 'actual', totalBurden: Math.min(a.totalBurden, b.totalBurden) };
  };
  return { ytd: one(income, actualExp), projected: one(income * f, actualExp * f) };
}

/* ---------------- deadlines ---------------- */
function deadlines() {
  const t = today(); const d = parseD(t); const out = [];
  const add = (date, title, sub, kind) => { if (diffDays(date, t) >= 0) out.push({ date, title, sub, kind }); };
  for (let k = 0; k < 3; k++) {
    const m = new Date(d.getFullYear(), d.getMonth() + k, 1);
    add(iso(new Date(m.getFullYear(), m.getMonth(), 8)), 'Odvody do Sociálnej poisťovne', 'splatnosť preddavku za predchádzajúci mesiac', 'soc');
    add(iso(new Date(m.getFullYear(), m.getMonth(), 8)), 'Preddavok na zdravotné poistenie', 'splatnosť za predchádzajúci mesiac', 'health');
    if (S.company?.vatPayer) add(iso(new Date(m.getFullYear(), m.getMonth(), 25)), 'DPH priznanie a kontrolný výkaz', 'za predchádzajúce obdobie', 'vat');
  }
  const y = d.getMonth() > 2 ? d.getFullYear() + 1 : d.getFullYear();
  add(`${y}-03-31`, 'Daňové priznanie typu B', `za rok ${y - 1} · možnosť odkladu`, 'tax');
  if (S.company?.vatPayer) add('2027-01-01', 'Štart povinnej e‑faktúry (Peppol)', 'pre platiteľov DPH', 'einv');
  return out.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
}

/* ---------------- notifications & retention engine ---------------- */
function notify(key, n) {
  if (key && S.notifications.some((x) => x.key === key)) return false;
  const item = { id: uid('n'), key, at: Date.now(), read: false, ...n };
  S.notifications.unshift(item);
  S.notifications = S.notifications.slice(0, 120);
  if (S.settings.push && 'Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
    try { new Notification('eFakturko · ' + n.title, { body: n.body, tag: key || item.id }); } catch {}
  }
  return true;
}
const unread = () => S.notifications.filter((n) => !n.read).length;

function engine() {
  if (!S.user) return { created: 0 };
  rollUsage();
  const t = today(); let created = 0;
  // 1) trial expiry
  if (S.billing.trialEnds && !S.billing.paidUntil && Date.now() > S.billing.trialEnds) {
    S.user.plan = 'free'; S.billing.trialEnds = null;
    notify('trial-end', { type: 'billing', title: 'Skúšobné obdobie Pro skončilo', body: 'Prešli ste na plán Štart. Faktúry aj dáta zostávajú — upgradom si vrátite upomienky a daňový radar.', href: '#/billing' });
  } else if (S.billing.trialEnds && !S.billing.paidUntil) {
    const left = Math.ceil((S.billing.trialEnds - Date.now()) / 864e5);
    if (left <= 3) notify('trial-left-' + left, { type: 'billing', title: `Pro skúška končí o ${left} ${left === 1 ? 'deň' : 'dni'}`, body: 'Pridajte kartu a ponechajte si automatické upomienky, opakované faktúry a e‑faktúru.', href: '#/billing' });
  }
  // 2) recurring invoices
  if (has('recurring')) {
    for (const r of S.recurring.filter((x) => x.active)) {
      let guard = 0;
      while (r.nextDate <= t && guard++ < 12) {
        const inv = createInvoiceFromTemplate(r, r.nextDate);
        if (r.autoSend) { inv.status = 'sent'; inv.sentAt = Date.now(); inv.events.push({ at: Date.now(), text: 'Automaticky odoslaná klientovi' }); }
        notify('rec-' + r.id + '-' + r.nextDate, { type: 'recurring', title: `Vystavená opakovaná faktúra ${inv.number}`, body: `${inv.client.name} · ${eur(totals(inv).total)}${r.autoSend ? ' · odoslaná' : ' · čaká na odoslanie'}`, href: '#/invoices/' + inv.id });
        r.nextDate = addMonths(r.nextDate, r.every || 1); created++;
      }
    }
  }
  // 3) due / overdue + auto-dunning
  for (const inv of S.invoices.filter((i) => i.status === 'sent')) {
    const d = diffDays(inv.dueDate, t);
    const total = totals(inv).total;
    if (d >= 0 && d <= 3) notify('due-' + inv.id, { type: 'due', title: `Faktúra ${inv.number} je splatná ${d === 0 ? 'dnes' : 'o ' + d + ' ' + (d === 1 ? 'deň' : 'dni')}`, body: `${inv.client.name} · ${eur(total)}`, href: '#/invoices/' + inv.id });
    if (d < 0) {
      notify('over-' + inv.id, { type: 'overdue', title: `Faktúra ${inv.number} je po splatnosti`, body: `${inv.client.name} · ${eur(total)} · ${-d} ${-d === 1 ? 'deň' : 'dní'}${has('dunning') ? '' : ' · zapnite automatické upomienky (Pro)'}`, href: '#/invoices/' + inv.id });
      if (has('dunning') && S.settings.autoDunning) {
        const steps = [[1, 'd0', 1], [2, 'd7', 7], [3, 'd14', 14]];
        for (const [level, key, after] of steps) {
          if (!S.settings.remind[key] || -d < after) continue;
          if ((inv.reminders || []).some((x) => x.level === level)) continue;
          const msg = LOCAL.dunning({ level, invoice: { number: inv.number, dueDate: inv.dueDate, total, vs: inv.vs }, company: S.company });
          inv.reminders = [...(inv.reminders || []), { level, at: Date.now(), subject: msg.subject, auto: true }];
          inv.events.push({ at: Date.now(), text: `Automatická upomienka ${level}/3 odoslaná na ${inv.client.email || 'e‑mail klienta'}` });
          notify(`dun-${inv.id}-${level}`, { type: 'dunning', title: `Odoslaná upomienka ${level}/3`, body: `${inv.number} · ${inv.client.name}`, href: '#/invoices/' + inv.id });
          track('auto_dunning');
        }
      }
    }
  }
  // 4) deadlines (7 days ahead)
  for (const dl of deadlines()) { const d = diffDays(dl.date, t); if (d <= 5) notify('dl-' + dl.kind + dl.date, { type: 'tax', title: `${dl.title} — ${d === 0 ? 'dnes' : 'o ' + d + ' dní'}`, body: `${fmtD(dl.date)} · ${dl.sub}`, href: '#/taxes' }); }
  // 5) quota nudges
  const qi = quota('invoices'); if (qi.lim !== Infinity && qi.used >= qi.lim - 1) notify('quota-inv-' + ym(), { type: 'billing', title: qi.left ? 'Zostáva vám posledná faktúra tento mesiac' : 'Vyčerpali ste 5 faktúr tento mesiac', body: 'S plánom Pro fakturujete bez limitu.', href: '#/billing' });
  // 6) VAT threshold
  if (!S.company?.vatPayer) { const st = stats(); if (st.turnover12 >= 40000) notify('vat80-' + t.slice(0, 4), { type: 'tax', title: `Obrat ${eur(st.turnover12, 0)} — ${Math.round(st.vatThresholdPct * 100)} % hranice DPH`, body: 'Po prekročení 50 000 € sa musíte registrovať za platiteľa DPH. Pozrite si Daňový radar.', href: '#/taxes' }); }
  // 7) weekly digest (Mondays)
  if (S.settings.digest && parseD(t).getDay() === 1) { const st = stats(); notify('digest-' + t, { type: 'digest', title: 'Váš týždenný prehľad', body: `Neuhradené: ${eur(st.openSum, 0)} · po splatnosti: ${st.overdueCount} · tento mesiac: ${eur(st.thisM, 0)}`, href: '#/dashboard' }); }
  // 8) win-back nudge if no invoice in 21 days
  const last = S.invoices.map((i) => i.createdAt || 0).sort((a, b) => b - a)[0];
  if (last && Date.now() - last > 21 * 864e5) notify('idle-' + ym(), { type: 'tip', title: 'Dlho ste nefakturovali', body: 'Skúste: „Vyfakturuj [klient] 10 hodín práce po 40 €“ — hotové za 10 sekúnd.', href: '#/ai' });
  save();
  return { created };
}

function createInvoiceFromTemplate(r, date) {
  const c = S.clients.find((x) => x.id === r.clientId) || r.client;
  const { y, n, number } = nextNumber(date);
  commitNumber(y, n);
  const inv = {
    id: uid('i'), number, vs: number, clientId: c.id, client: snap(c), issueDate: date, deliveryDate: date, dueDate: addDays(date, r.dueDays || S.settings.dueDays),
    items: r.items.map((it) => ({ ...it, id: uid('l') })), note: r.note || '', status: 'draft', createdAt: Date.now(), recurringId: r.id, reminders: [],
    events: [{ at: Date.now(), text: 'Vystavená automaticky z opakovanej faktúry' }],
  };
  S.invoices.unshift(inv); track('invoice_recurring');
  return inv;
}
const snap = (c) => ({ id: c.id, name: c.name, ico: c.ico || '', dic: c.dic || '', icdph: c.icdph || '', address: c.address || '', email: c.email || '' });

/* ---------------- Peppol BIS 3.0 UBL export ---------------- */
function ubl(inv) {
  const c = S.company, t = totals(inv), x = (v) => esc(v);
  const vatPayer = !!c.vatPayer;
  const cat = (r) => (!vatPayer ? 'O' : r === 0 ? 'Z' : 'S');
  const party = (p, isSeller) => `
    <cac:Party>
      <cbc:EndpointID schemeID="9950">${x((p.icdph || p.dic || p.ico || '').replace(/\s/g, ''))}</cbc:EndpointID>
      <cac:PartyIdentification><cbc:ID>${x(p.ico)}</cbc:ID></cac:PartyIdentification>
      <cac:PostalAddress><cbc:StreetName>${x(p.address)}</cbc:StreetName><cac:Country><cbc:IdentificationCode>SK</cbc:IdentificationCode></cac:Country></cac:PostalAddress>${p.icdph ? `
      <cac:PartyTaxScheme><cbc:CompanyID>${x(p.icdph)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : ''}
      <cac:PartyLegalEntity><cbc:RegistrationName>${x(p.name)}</cbc:RegistrationName><cbc:CompanyID>${x(p.ico)}</cbc:CompanyID></cac:PartyLegalEntity>${isSeller && p.email ? `
      <cac:Contact><cbc:ElectronicMail>${x(p.email)}</cbc:ElectronicMail></cac:Contact>` : ''}
    </cac:Party>`;
  const sub = t.groups.map((g) => `
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="EUR">${g.base.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="EUR">${g.vat.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory><cbc:ID>${cat(g.rate)}</cbc:ID>${vatPayer ? `<cbc:Percent>${g.rate}</cbc:Percent>` : '<cbc:TaxExemptionReason>Dodávateľ nie je platiteľ DPH</cbc:TaxExemptionReason>'}<cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory>
    </cac:TaxSubtotal>`).join('');
  const lines = inv.items.map((it, k) => `
  <cac:InvoiceLine>
    <cbc:ID>${k + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${({ hod: 'HUR', 'deň': 'DAY', mes: 'MON', km: 'KMT', m2: 'MTK' })[it.unit] || 'C62'}">${+it.qty}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">${round2(it.qty * it.price).toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item><cbc:Name>${x(it.desc)}</cbc:Name><cac:ClassifiedTaxCategory><cbc:ID>${cat(vatPayer ? +it.vat : 0)}</cbc:ID>${vatPayer ? `<cbc:Percent>${+it.vat}</cbc:Percent>` : ''}<cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory></cac:Item>
    <cac:Price><cbc:PriceAmount currencyID="EUR">${(+it.price).toFixed(2)}</cbc:PriceAmount></cac:Price>
  </cac:InvoiceLine>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>${x(inv.number)}</cbc:ID>
  <cbc:IssueDate>${inv.issueDate}</cbc:IssueDate>
  <cbc:DueDate>${inv.dueDate}</cbc:DueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>${inv.note ? `
  <cbc:Note>${x(inv.note)}</cbc:Note>` : ''}
  <cbc:TaxPointDate>${inv.deliveryDate || inv.issueDate}</cbc:TaxPointDate>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  <cbc:BuyerReference>${x(inv.vs)}</cbc:BuyerReference>
  <cac:AccountingSupplierParty>${party(c, true)}
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>${party(inv.client, false)}
  </cac:AccountingCustomerParty>
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>58</cbc:PaymentMeansCode>
    <cbc:PaymentID>${x(inv.vs)}</cbc:PaymentID>
    <cac:PayeeFinancialAccount><cbc:ID>${x(ibanClean(c.iban))}</cbc:ID><cbc:Name>${x(c.name)}</cbc:Name></cac:PayeeFinancialAccount>
  </cac:PaymentMeans>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="EUR">${t.vat.toFixed(2)}</cbc:TaxAmount>${sub}
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="EUR">${t.base.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">${t.base.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">${t.total.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="EUR">${t.total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>${lines}
</Invoice>`;
}
function download(name, text, type = 'application/octet-stream') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ---------------- PAY by square QR ---------------- */
function qrSvg(inv) {
  try {
    if (!window.FaktumQR || !ibanValid(S.company?.iban)) return '';
    const code = window.FaktumQR.payBySquare({ amount: totals(inv).total, iban: S.company.iban, vs: inv.vs, name: S.company.name, note: `Faktura ${inv.number}` });
    return window.FaktumQR.svg(code);
  } catch { return ''; }
}

/* ---------------- demo seed ---------------- */
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function seedDemo(opts = {}) {
  const R = rng(42);
  const t = today();
  S.company = S.company || { type: 'szco', name: 'Jana Nováková – Ateliér Nova', person: 'Jana Nováková', ico: '53912345', dic: '1087654321', icdph: '', vatPayer: false, address: 'Panenská 7, 811 03 Bratislava', iban: 'SK9611000000002918599669', email: 'jana@ateliernova.sk', phone: '+421 905 123 456', register: 'Zapísaná v živnostenskom registri OÚ Bratislava, č. 110-312345' };
  if (!S.user) S.user = { name: 'Jana Nováková', email: 'jana@ateliernova.sk', plan: 'pro', createdAt: Date.now() - 300 * 864e5, onboarded: true };
  const clients = [
    { name: 'Kaviareň Mlyn s.r.o.', ico: '52418337', dic: '2121034567', icdph: 'SK2121034567', address: 'Hlavná 12, 917 01 Trnava', email: 'ucty@kaviarenmlyn.sk', rate: 45, pay: 9 },
    { name: 'Novák & partneri s.r.o.', ico: '47112233', dic: '2023456789', icdph: 'SK2023456789', address: 'Mlynské nivy 5, 821 09 Bratislava', email: 'fakturacia@novakpartneri.sk', rate: 60, pay: 2 },
    { name: 'Horská chata Tatry s.r.o.', ico: '50987654', dic: '2120987654', icdph: '', address: 'Starý Smokovec 41, 062 01 Vysoké Tatry', email: 'info@chatatatry.sk', rate: 40, pay: 15 },
    { name: 'Studio Pixel a.s.', ico: '45678901', dic: '2022678901', icdph: 'SK2022678901', address: 'Štúrova 18, 040 01 Košice', email: 'ap@studiopixel.sk', rate: 55, pay: 0 },
    { name: 'Pekáreň u Žofie', ico: '51234987', dic: '1078123456', icdph: '', address: 'Námestie SNP 3, 974 01 Banská Bystrica', email: 'zofia@pekarenzofia.sk', rate: 35, pay: 4 },
  ].map((c) => ({ id: uid('c'), createdAt: Date.now() - 280 * 864e5, ...c }));
  S.clients = clients;
  const work = [['Grafický dizajn', 'hod'], ['Brand identita – logo a farby', 'ks'], ['Webdizajn – podstránky', 'ks'], ['Konzultácia', 'hod'], ['Sociálne siete – mesačná správa', 'mes'], ['Tlačové podklady', 'ks'], ['UX audit e‑shopu', 'ks'], ['Ilustrácie', 'ks']];
  S.invoices = []; S.counters = {};
  for (let k = 0; k < 34; k++) {
    const daysAgo = Math.floor(330 - k * 9.6 - R() * 4);
    const issue = addDays(t, -Math.max(0, daysAgo));
    const c = clients[Math.floor(R() * clients.length)];
    const nItems = 1 + Math.floor(R() * 3);
    const items = Array.from({ length: nItems }, () => { const w = work[Math.floor(R() * work.length)]; const hourly = w[1] === 'hod'; return { id: uid('l'), desc: w[0], qty: hourly ? 4 + Math.floor(R() * 14) : 1, unit: w[1], price: hourly ? c.rate : Math.round((150 + R() * 900) / 10) * 10, vat: 0 }; });
    const { y, n, number } = nextNumber(issue); commitNumber(y, n);
    const due = addDays(issue, 14);
    const inv = { id: uid('i'), number, vs: number, clientId: c.id, client: snap(c), issueDate: issue, deliveryDate: issue, dueDate: due, items, note: '', status: 'sent', createdAt: parseD(issue).getTime(), reminders: [], events: [{ at: parseD(issue).getTime(), text: 'Faktúra vytvorená' }, { at: parseD(issue).getTime() + 36e5, text: `Odoslaná na ${c.email}` }] };
    const payDay = addDays(due, c.pay + Math.floor(R() * 6) - 2);
    if (payDay <= t && daysAgo > 12) { inv.status = 'paid'; inv.paidAt = payDay; inv.events.push({ at: parseD(payDay).getTime(), text: 'Platba prijatá a spárovaná podľa VS' }); }
    S.invoices.unshift(inv);
  }
  // guaranteed scenarios: one overdue, one due soon, one draft
  const mk = (c, daysAgo, items, st) => { const issue = addDays(t, -daysAgo); const { y, n, number } = nextNumber(issue); commitNumber(y, n); const inv = { id: uid('i'), number, vs: number, clientId: c.id, client: snap(c), issueDate: issue, deliveryDate: issue, dueDate: addDays(issue, 14), items: items.map((i) => ({ id: uid('l'), vat: 0, ...i })), note: '', status: st, createdAt: Date.now() - daysAgo * 864e5, reminders: [], events: [{ at: Date.now() - daysAgo * 864e5, text: 'Faktúra vytvorená' }] }; if (st === 'sent') inv.events.push({ at: Date.now() - daysAgo * 864e5 + 36e5, text: `Odoslaná na ${c.email}` }); S.invoices.unshift(inv); return inv; };
  mk(clients[2], 26, [{ desc: 'Fotografie interiéru a web', qty: 1, unit: 'ks', price: 1180 }], 'sent');
  mk(clients[0], 12, [{ desc: 'Menu dizajn – zimná ponuka', qty: 1, unit: 'ks', price: 480 }, { desc: 'Konzultácia', qty: 3, unit: 'hod', price: 45 }], 'sent');
  mk(clients[3], 0, [{ desc: 'UX audit e‑shopu', qty: 1, unit: 'ks', price: 1450 }], 'draft');
  S.invoices.sort((a, b) => b.issueDate.localeCompare(a.issueDate) || b.number.localeCompare(a.number));
  const cats = [['Adobe Creative Cloud', 'Software', 72.57], ['Orange – paušál', 'Telefón a internet', 25], ['Shell', 'Pohonné hmoty', 61.3], ['Alza.sk – monitor', 'Kancelária', 289], ['Meta Ads', 'Marketing', 120], ['Papiernictvo', 'Materiál', 18.4], ['Udemy kurz', 'Vzdelávanie', 14.99], ['Figma', 'Software', 15]];
  S.expenses = Array.from({ length: 22 }, (_, k) => { const c = cats[Math.floor(R() * cats.length)]; return { id: uid('e'), vendor: c[0], category: c[1], total: c[2], vatAmount: round2(c[2] - c[2] / 1.23), vatRate: 23, date: addDays(t, -Math.floor(k * 14 + R() * 10)), description: '', ai: R() > .5, createdAt: Date.now() }; });
  S.recurring = [
    { id: uid('r'), clientId: clients[4].id, client: snap(clients[4]), items: [{ desc: 'Sociálne siete – mesačná správa', qty: 1, unit: 'mes', price: 350, vat: 0 }], every: 1, nextDate: addMonths(t.slice(0, 8) + '01', 1), dueDays: 14, autoSend: true, active: true, note: '' },
    { id: uid('r'), clientId: clients[1].id, client: snap(clients[1]), items: [{ desc: 'Správa webu – paušál', qty: 1, unit: 'mes', price: 190, vat: 0 }], every: 1, nextDate: addDays(t, 6), dueDays: 14, autoSend: false, active: true, note: '' },
  ];
  S.checklist = { company: true, iban: true, client: true, invoice: true };
  S.notifications = [];
  notify('welcome', { type: 'tip', title: 'Vitajte v demo účte eFakturko', body: 'Všetko je klikateľné. Skúste AI príkaz hore: „Vyfakturuj Mlyn 6 hodín konzultácie po 45 €“.', href: '#/dashboard' });
  if (opts.trial !== false && S.user.plan === 'pro' && !S.billing.paidUntil) S.billing.trialEnds = Date.now() + 14 * 864e5;
  track('demo_seed');
  save();
}

/* ---------------- admin data (synthetic cohort + this live account) ---------------- */
const FIRST = ['Peter', 'Martin', 'Lucia', 'Jana', 'Tomáš', 'Zuzana', 'Michal', 'Katarína', 'Juraj', 'Eva', 'Marek', 'Simona', 'Lukáš', 'Veronika', 'Andrej', 'Monika', 'Ján', 'Barbora', 'Filip', 'Ivana'];
const LAST = ['Horváth', 'Kováč', 'Varga', 'Tóth', 'Nagy', 'Baláž', 'Szabó', 'Molnár', 'Novák', 'Polák', 'Kollár', 'Lukáč', 'Hudák', 'Mráz', 'Bielik', 'Šimko', 'Kráľ', 'Hrnčiar'];
const TRADES = ['grafik', 'IT konzultant', 'kaderníčka', 'stavebné práce', 'účtovníčka', 'fotograf', 'elektrikár', 'copywriter', 'tlmočníčka', 'masér', 'vývojár', 'architekt', 'kozmetička', 'tréner'];
const CITIES = ['Bratislava', 'Košice', 'Žilina', 'Nitra', 'Prešov', 'Banská Bystrica', 'Trnava', 'Trenčín', 'Martin', 'Poprad'];
function adminData() {
  let A = store.get(ADMIN_KEY);
  if (!A || A.v !== 2) {
    const R = rng(2027);
    const users = [];
    for (let k = 0; k < 186; k++) {
      const fn = FIRST[Math.floor(R() * FIRST.length)], ln = LAST[Math.floor(R() * LAST.length)];
      const female = /a$/.test(fn) || ['Eva', 'Ivana', 'Simona', 'Monika', 'Barbora', 'Veronika', 'Katarína', 'Zuzana', 'Lucia', 'Jana'].includes(fn);
      const lname = female && !/[áo]$/.test(ln) ? (ln.endsWith('ý') ? ln.slice(0, -1) + 'á' : ln + 'ová') : ln;
      const age = Math.floor(Math.pow(R(), 1.25) * 360);
      const p = R(); const planId = p < 0.62 ? 'free' : p < 0.9 ? 'pro' : 'business';
      const churned = planId !== 'free' && R() < 0.06;
      const inv = Math.floor((planId === 'free' ? 3 : planId === 'pro' ? 14 : 38) * (0.4 + R()) * Math.min(1, age / 60 + 0.2));
      users.push({
        id: 'u' + (1000 + k), name: `${fn} ${lname}`, email: `${norm(fn)}.${norm(lname)}${k}@${R() > .5 ? 'gmail.com' : 'azet.sk'}`.replace(/ /g, ''),
        trade: TRADES[Math.floor(R() * TRADES.length)], city: CITIES[Math.floor(R() * CITIES.length)], plan: churned ? 'free' : planId, churnedFrom: churned ? planId : null,
        cycle: R() < 0.35 ? 'y' : 'm', createdAt: Date.now() - age * 864e5, lastSeen: Date.now() - Math.floor(Math.pow(R(), 2) * Math.min(age, 60)) * 864e5,
        invoices: inv, ai: Math.floor(inv * (0.5 + R() * 2.5)), status: R() < 0.015 ? 'suspended' : 'active', partner: R() < 0.08 ? 'Účtovníctvo Kráľ' : '', credits: 0,
        features: { dunning: planId !== 'free' && R() < 0.7, recurring: planId !== 'free' && R() < 0.45, scan: R() < 0.4, ubl: planId !== 'free' && R() < 0.3, tax: planId !== 'free' && R() < 0.6 },
      });
    }
    A = { v: 2, users, log: [{ at: Date.now() - 864e5, who: 'system', text: 'Admin konzola inicializovaná' }] };
    store.set(ADMIN_KEY, A);
  }
  return A;
}
const saveAdmin = (A) => store.set(ADMIN_KEY, A);
function liveUser() {
  if (!S.user) return null;
  return { id: 'live', live: true, name: S.user.name, email: S.user.email, trade: S.company?.type === 'sro' ? 's.r.o.' : 'SZČO', city: (S.company?.address || '').split(' ').pop() || '—', plan: S.user.plan, cycle: S.billing.cycle, createdAt: S.user.createdAt, lastSeen: Date.now(), invoices: S.invoices.length, ai: Object.entries(S.analytics.events).filter(([k]) => k.startsWith('ai_')).reduce((s, [, v]) => s + v, 0), status: S.user.status || 'active', partner: '', credits: S.user.aiCredits || 0, features: { dunning: has('dunning') && S.settings.autoDunning, recurring: S.recurring.length > 0, scan: (S.analytics.events.ai_receipt_scan || 0) > 0, ubl: (S.analytics.events.ubl_export || 0) > 0, tax: (S.analytics.events.view_taxes || 0) > 0 } };
}

window.F = {
  $, $$, esc, uid, round2, eur, nf, pad, iso, today, parseD, addDays, addMonths, diffDays, fmtD, ym, MONTHS, MONTHS_FULL, ago, initials, norm, avatarBg, cap, plural,
  PLANS, FEATURES, VAT_RATES, STATUS, chip, getS, setS, save, reset, plan, has, quota, track, rollUsage,
  totals, status, nextNumber, commitNumber, snap, ibanClean, ibanFmt, ibanValid, bankOf, lookupIco,
  ai, LOCAL, stats, taxCalc, TAXP, deadlines, notify, unread, engine, createInvoiceFromTemplate, ubl, download, qrSvg, seedDemo,
  adminData, saveAdmin, liveUser, store, KEY, ADMIN_KEY,
};
})();
