// Iskrička — registrácia/synchronizácia používateľky, analytické udalosti, skúšobná verzia
const L = require('./_iskricka-lib');

const ALLOWED_EVENTS = /^[a-z_]{2,32}$/;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return L.json(405, { error: 'Method not allowed' });
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return L.json(400, { error: 'Neplatná požiadavka.' }); }

  let s;
  try { s = L.store(event); } catch (e) { return L.json(503, { error: 'Úložisko nie je dostupné.' }); }

  try {
    if (body.action === 'hello') {
      const p = body.user || {};
      const id = L.cleanId(p.id);
      if (!id) return L.json(400, { error: 'Chýba ID.' });
      const existing = await L.getUser(s, id);
      const now = new Date().toISOString();
      const u = Object.assign(existing || { id, tier: 'free', createdAt: now, aiMonth: L.monthKey(), aiCount: 0 }, {
        name: String(p.name || '').slice(0, 80),
        email: String(p.email || '').slice(0, 120),
        school: String(p.school || '').slice(0, 120),
        className: String(p.className || '').slice(0, 60),
        age: String(p.age || '').slice(0, 8),
        kids: Number(p.kids) || null,
        children: Number(p.children) || 0,
        plans: Number(p.plans) || 0,
        streak: Number(p.streak) || 0,
        stats: p.stats && typeof p.stats === 'object' ? {
          plansGenerated: Number(p.stats.plansGenerated) || 0,
          gamesPlayed: Number(p.stats.gamesPlayed) || 0,
          aiCalls: Number(p.stats.aiCalls) || 0,
          observations: Number(p.stats.observations) || 0,
        } : (existing && existing.stats) || {},
        lastSeen: now,
      });
      if (u.aiMonth !== L.monthKey()) { u.aiMonth = L.monthKey(); u.aiCount = 0; }
      await L.saveUser(s, u);
      await L.bumpDay(s, id, existing ? { hello: 1 } : { hello: 1, signup: 1 });
      return L.json(200, { user: L.clientView(u) });
    }

    if (body.action === 'events') {
      const id = L.cleanId(body.userId);
      const counts = {};
      (Array.isArray(body.events) ? body.events.slice(0, 50) : []).forEach((e) => {
        if (e && ALLOWED_EVENTS.test(e.type) && e.type !== 'signup') counts[e.type] = (counts[e.type] || 0) + 1;
      });
      if (Object.keys(counts).length) await L.bumpDay(s, id, counts);
      if (id) { const u = await L.getUser(s, id); if (u) { u.lastSeen = new Date().toISOString(); await L.saveUser(s, u); } }
      return L.json(200, { ok: true });
    }

    if (body.action === 'trial') {
      const id = L.cleanId(body.userId);
      const u = await L.getUser(s, id);
      if (!u) return L.json(404, { error: 'Používateľka neexistuje.' });
      if (u.trialUsed) return L.json(409, { error: 'Skúšobná verzia už bola využitá.' });
      Object.assign(u, { tier: 'premium', premiumUntil: new Date(Date.now() + 7 * 864e5).toISOString(), trialUsed: true, billing: 'trial' });
      await L.saveUser(s, u);
      await L.bumpDay(s, id, { trial_start: 1 });
      return L.json(200, { user: L.clientView(u) });
    }

    return L.json(400, { error: 'Neznáma akcia.' });
  } catch (err) {
    console.error('track error', err);
    return L.json(500, { error: 'Chyba servera.' });
  }
};
