// Iskrička — admin API (chránené premennou prostredia ADMIN_TOKEN)
const crypto = require('crypto');
const L = require('./_iskricka-lib');

function authorized(event) {
  const expected = process.env.ADMIN_TOKEN || '';
  const got = event.headers['x-admin-token'] || '';
  if (!expected || expected.length < 8) return false;
  const a = Buffer.from(expected), b = Buffer.from(got);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return L.json(405, { error: 'Method not allowed' });
  if (!process.env.ADMIN_TOKEN) return L.json(503, { error: 'ADMIN_TOKEN nie je nastavený v Netlify' });
  if (!authorized(event)) return L.json(401, { error: 'Neautorizované' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return L.json(400, { error: 'Neplatná požiadavka.' }); }
  const s = L.store(event);

  try {
    if (body.action === 'overview') {
      const { blobs } = await s.list({ prefix: 'users/' });
      const users = (await Promise.all(blobs.slice(0, 2000).map((b) => s.get(b.key, { type: 'json' })))).filter(Boolean)
        .map((u) => Object.assign({}, u, { aiCount: u.aiMonth === L.monthKey() ? u.aiCount || 0 : 0 }));
      const days = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
        const d = (await s.get('days/' + date, { type: 'json' })) || { events: {}, users: [], signups: 0 };
        days.push({ date, events: d.events || {}, active: (d.users || []).length, signups: d.signups || 0 });
      }
      return L.json(200, { users, days });
    }

    if (body.action === 'update') {
      const id = L.cleanId(body.userId);
      const u = await L.getUser(s, id);
      if (!u) return L.json(404, { error: 'Používateľka neexistuje.' });
      switch (body.op) {
        case 'premium30':
        case 'premium365': {
          const days = body.op === 'premium30' ? 30 : 365;
          const base = L.isPremium(u) && u.premiumUntil ? new Date(u.premiumUntil).getTime() : Date.now();
          Object.assign(u, { tier: 'premium', premiumUntil: new Date(base + days * 864e5).toISOString(), billing: u.billing === 'month' || u.billing === 'year' ? u.billing : 'admin' });
          break;
        }
        case 'free': Object.assign(u, { tier: 'free', premiumUntil: null, billing: null }); break;
        case 'resetai': u.aiCount = 0; break;
        case 'block': u.blocked = true; break;
        case 'unblock': u.blocked = false; break;
        case 'delete': await s.delete('users/' + id); return L.json(200, { ok: true, deleted: true });
        default: return L.json(400, { error: 'Neznáma operácia.' });
      }
      await L.saveUser(s, u);
      return L.json(200, { ok: true, user: u });
    }

    return L.json(400, { error: 'Neznáma akcia.' });
  } catch (err) {
    console.error('admin error', err);
    return L.json(500, { error: 'Chyba servera: ' + (err.message || err) });
  }
};
