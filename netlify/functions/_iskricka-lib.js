// Zdieľané pomocné funkcie pre Iskričku (nie je to samostatný endpoint).
// Úložisko: Netlify Blobs (bez externej databázy). Kľúče:
//   users/<userId>  -> JSON profil používateľky, tarif, AI počítadlo
//   days/<YYYY-MM-DD> -> denné počty udalostí a aktívni používatelia
const { getStore, connectLambda } = require('@netlify/blobs');

const FREE_AI_PER_MONTH = 10;

function store(event) {
  try { connectLambda(event); } catch (e) { /* lokálne / novšie prostredie */ }
  return getStore('iskricka');
}

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(body),
});

const monthKey = () => new Date().toISOString().slice(0, 7);
const dayKey = () => new Date().toISOString().slice(0, 10);
const cleanId = (id) => String(id || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64);

async function getUser(s, id) {
  if (!id) return null;
  return (await s.get('users/' + id, { type: 'json' })) || null;
}
async function saveUser(s, u) { await s.setJSON('users/' + u.id, u); return u; }

function isPremium(u) {
  return !!u && u.tier === 'premium' && (!u.premiumUntil || new Date(u.premiumUntil) > new Date());
}

// Verejný (bezpečný) pohľad na používateľku pre klienta
function clientView(u) {
  if (!u) return null;
  const prem = isPremium(u);
  return {
    tier: prem ? 'premium' : 'free',
    premiumUntil: prem ? u.premiumUntil || null : null,
    trialUsed: !!u.trialUsed,
    aiMonth: u.aiMonth || monthKey(),
    aiCount: u.aiMonth === monthKey() ? u.aiCount || 0 : 0,
    billing: prem ? u.billing || null : null,
    blocked: !!u.blocked,
  };
}

async function bumpDay(s, userId, counts) {
  const key = 'days/' + dayKey();
  const d = (await s.get(key, { type: 'json' })) || { date: dayKey(), events: {}, users: [], signups: 0 };
  for (const [k, v] of Object.entries(counts)) {
    if (k === 'signup') d.signups = (d.signups || 0) + v;
    d.events[k] = (d.events[k] || 0) + v;
  }
  if (userId && !d.users.includes(userId)) d.users.push(userId);
  await s.setJSON(key, d);
}

module.exports = { store, json, monthKey, dayKey, cleanId, getUser, saveUser, isPremium, clientView, bumpDay, FREE_AI_PER_MONTH };
