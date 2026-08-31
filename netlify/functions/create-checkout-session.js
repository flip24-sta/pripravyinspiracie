const Stripe = require('stripe');

// Server-side price table — never trust the price sent from the browser.
// Keep these numbers in sync with getPrice() in index.html.
function priceForCategory(category) {
  if (category === 'Písomné prípravy') return 1400;
  if (category === 'Megasúbory') return 500;
  if (category === 'Pohybové hry') return 600;
  if (category === 'Pracovné listy') return 500;
  return 700;
}

const BALIK_PRICES_CENTS = {
  'balik-small': 4000,
  'balik-medium': 6900,
  'balik-large': 11900,
  'balik-premium': 14900,
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Platobná brána nie je nakonfigurovaná (chýba STRIPE_SECRET_KEY).' }) };
  }
  const stripe = Stripe(stripeSecretKey);

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Neplatná požiadavka.' }) };
  }

  const { items, deliveryEmail } = payload;
  if (!Array.isArray(items) || items.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Košík je prázdny.' }) };
  }

  const line_items = items.map((it) => {
    const unitAmount = BALIK_PRICES_CENTS[it.key] || priceForCategory(it.category);
    const qty = Math.max(1, parseInt(it.qty, 10) || 1);
    return {
      price_data: {
        currency: 'eur',
        unit_amount: unitAmount,
        product_data: {
          name: String(it.name || 'Produkt').slice(0, 250),
          metadata: { key: String(it.key || '').slice(0, 500) },
        },
      },
      quantity: qty,
    };
  });

  const origin = event.headers.origin || `https://${event.headers.host}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      customer_email: deliveryEmail || undefined,
      success_url: `${origin}/?payment=success`,
      cancel_url: `${origin}/?payment=cancelled`,
      locale: 'sk',
    });
    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Platbu sa nepodarilo spustiť.' }) };
  }
};
