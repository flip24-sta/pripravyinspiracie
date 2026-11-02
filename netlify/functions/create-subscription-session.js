// Iskrička Premium — Stripe Checkout v režime predplatného
const Stripe = require('stripe');

const PLANS = {
  month: { amount: 690, interval: 'month', name: 'Iskrička Premium — mesačne' },
  year: { amount: 5900, interval: 'year', name: 'Iskrička Premium — ročne' },
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  const key = process.env.TEST_KEY || process.env.STRIPE_SECRET_KEY;
  if (!key) return { statusCode: 500, body: JSON.stringify({ error: 'Platobná brána nie je nakonfigurovaná.' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return { statusCode: 400, body: JSON.stringify({ error: 'Neplatná požiadavka.' }) }; }
  const plan = PLANS[body.plan] ? body.plan : 'year';
  const userId = String(body.userId || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64);
  if (!userId) return { statusCode: 400, body: JSON.stringify({ error: 'Chýba používateľ.' }) };

  const stripe = Stripe(key);
  const origin = event.headers.origin || `https://${event.headers.host}`;
  const p = PLANS[plan];
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{
        quantity: 1,
        // Ak máte v Stripe vytvorené ceny, nastavte STRIPE_PRICE_MONTH / STRIPE_PRICE_YEAR
        ...(process.env[plan === 'month' ? 'STRIPE_PRICE_MONTH' : 'STRIPE_PRICE_YEAR']
          ? { price: process.env[plan === 'month' ? 'STRIPE_PRICE_MONTH' : 'STRIPE_PRICE_YEAR'] }
          : { price_data: { currency: 'eur', unit_amount: p.amount, recurring: { interval: p.interval }, product_data: { name: p.name } } }),
      }],
      customer_email: body.email || undefined,
      client_reference_id: userId,
      metadata: { app: 'iskricka', userId, plan },
      subscription_data: { metadata: { app: 'iskricka', userId, plan } },
      allow_promotion_codes: true,
      success_url: `${origin}/app/?upgrade=success&session_id={CHECKOUT_SESSION_ID}#/domov`,
      cancel_url: `${origin}/app/?upgrade=cancel#/domov`,
      locale: 'sk',
    });
    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Platbu sa nepodarilo spustiť.' }) };
  }
};
