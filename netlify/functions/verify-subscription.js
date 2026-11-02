// Iskrička — overenie platby po návrate zo Stripe Checkout a aktivácia Premium
const Stripe = require('stripe');
const L = require('./_iskricka-lib');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return L.json(405, { error: 'Method not allowed' });
  const key = process.env.TEST_KEY || process.env.STRIPE_SECRET_KEY;
  if (!key) return L.json(500, { error: 'Platobná brána nie je nakonfigurovaná.' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return L.json(400, { error: 'Neplatná požiadavka.' }); }
  if (!body.sessionId) return L.json(400, { error: 'Chýba session.' });

  const stripe = Stripe(key);
  try {
    const session = await stripe.checkout.sessions.retrieve(body.sessionId, { expand: ['subscription'] });
    const userId = L.cleanId(session.client_reference_id || (session.metadata || {}).userId);
    if (!userId || userId !== L.cleanId(body.userId)) return L.json(403, { error: 'Platba nepatrí tomuto účtu.' });
    const paid = session.status === 'complete' && (session.payment_status === 'paid' || session.payment_status === 'no_payment_required');
    if (!paid) return L.json(200, { premium: false });

    const sub = session.subscription;
    const plan = (session.metadata || {}).plan || 'month';
    const periodEnd = sub && (sub.current_period_end || (sub.items && sub.items.data[0] && sub.items.data[0].current_period_end));
    const premiumUntil = periodEnd ? new Date((periodEnd + 3 * 86400) * 1000).toISOString() : new Date(Date.now() + (plan === 'year' ? 368 : 33) * 864e5).toISOString();

    await activate(event, userId, { plan, premiumUntil, customer: session.customer, subscription: sub && sub.id });
    return L.json(200, { premium: true, premiumUntil, plan });
  } catch (err) {
    return L.json(500, { error: err.message || 'Overenie zlyhalo.' });
  }
};

async function activate(event, userId, { plan, premiumUntil, customer, subscription }) {
  try {
    const s = L.store(event);
    const u = (await L.getUser(s, userId)) || { id: userId, createdAt: new Date().toISOString() };
    const isNew = !subscription || u.stripeSubscription !== subscription;
    Object.assign(u, { tier: 'premium', premiumUntil, billing: plan, stripeCustomer: customer || u.stripeCustomer, stripeSubscription: subscription || u.stripeSubscription });
    await L.saveUser(s, u);
    if (isNew) await L.bumpDay(s, userId, { purchase: 1 });
  } catch (e) { console.error('activate premium failed', e); }
}
module.exports.activate = activate;
