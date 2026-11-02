const Stripe = require('stripe');
const { Resend } = require('resend');
const { fulfillmentLinks } = require('./fulfillment-links');

// TODO: switch back to 'Prípravy Inšpirácie <predaj@pripravyinspiracie.info>' once the
// domain status in Resend (Domains) shows "Verified" instead of "Pending".
const FROM_EMAIL = 'Prípravy Inšpirácie <onboarding@resend.dev>';
const OWNER_EMAIL = 'filiphacko2@gmail.com';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const stripeSecretKey = process.env.TEST_KEY || process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!stripeSecretKey || !webhookSecret) {
    return { statusCode: 500, body: 'Missing Stripe configuration' };
  }
  const stripe = Stripe(stripeSecretKey);

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      event.headers['stripe-signature'],
      webhookSecret
    );
  } catch (err) {
    return { statusCode: 400, body: `Webhook signature verification failed: ${err.message}` };
  }

  // Iskrička Premium (predplatné) — spracuje sa samostatne, bez e-mailov z e-shopu
  const obj = stripeEvent.data.object || {};
  const iskMeta = obj.metadata || (obj.subscription_details && obj.subscription_details.metadata) || (obj.parent && obj.parent.subscription_details && obj.parent.subscription_details.metadata) || {};
  if (iskMeta.app === 'iskricka' || (stripeEvent.type === 'checkout.session.completed' && obj.mode === 'subscription')) {
    await handleIskricka(event, stripe, stripeEvent, obj, iskMeta);
    return { statusCode: 200, body: JSON.stringify({ received: true, app: 'iskricka' }) };
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: 'ignored' };
  }

  const session = stripeEvent.data.object;
  const customerEmail = session.customer_details?.email || session.customer_email;

  let purchased = [];
  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 100,
      expand: ['data.price.product'],
    });
    purchased = lineItems.data.map((li) => ({
      name: li.description || li.price?.product?.name || 'Produkt',
      key: li.price?.product?.metadata?.key || '',
      qty: li.quantity || 1,
    }));
  } catch (err) {
    purchased = [{ name: 'Objednávka', key: '', qty: 1 }];
  }

  const withLinks = purchased.map((p) => ({ ...p, link: fulfillmentLinks[p.key] || null }));
  const allLinked = withLinks.every((p) => p.link);

  if (resendApiKey && customerEmail) {
    const resend = new Resend(resendApiKey);
    const itemsHtml = withLinks
      .map((p) =>
        p.link
          ? `<li><strong>${p.name}</strong> (${p.qty}×) — <a href="${p.link}">Stiahnuť materiál</a></li>`
          : `<li><strong>${p.name}</strong> (${p.qty}×) — materiál vám pošleme e-mailom do 24–48 hodín.</li>`
      )
      .join('');

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: customerEmail,
        subject: 'Vaša objednávka — Prípravy Inšpirácie',
        html: `
          <p>Ďakujeme za vašu objednávku! Platba bola úspešne prijatá.</p>
          <ul>${itemsHtml}</ul>
          <p>Materiály sú vo formáte PDF, určené na opakované vytlačenie pre vlastnú triedu, školu alebo domácnosť.</p>
          <p>V prípade akéhokoľvek problému nás kontaktujte na ${OWNER_EMAIL}.</p>
        `,
      });
    } catch (err) {
      // Email failure shouldn't fail the webhook — Stripe would otherwise retry the whole event.
      console.error('Resend send to customer failed:', err.message || err);
    }

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: OWNER_EMAIL,
        subject: `Nová platba: ${customerEmail}${allLinked ? '' : ' (vyžaduje ručné doplnenie)'}`,
        html: `
          <p>Zákazník: ${customerEmail}</p>
          <ul>${withLinks.map((p) => `<li>${p.name} (${p.qty}×)${p.link ? '' : ' — chýba odkaz na materiál, doplňte ho ručne!'}</li>`).join('')}</ul>
        `,
      });
    } catch (err) {
      console.error('Resend send to owner failed:', err.message || err);
    }
  } else {
    console.error('Skipped sending emails: missing RESEND_API_KEY or customerEmail', { hasResendKey: !!resendApiKey, customerEmail });
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};

async function handleIskricka(event, stripe, stripeEvent, obj, meta) {
  try {
    const L = require('./_iskricka-lib');
    const { activate } = require('./verify-subscription');
    const userId = L.cleanId(meta.userId || obj.client_reference_id);
    if (!userId) return;
    const plan = meta.plan || 'month';
    const until = (ts) => new Date((ts + 3 * 86400) * 1000).toISOString();
    if (stripeEvent.type === 'checkout.session.completed') {
      const sub = obj.subscription ? await stripe.subscriptions.retrieve(obj.subscription) : null;
      const end = sub && (sub.current_period_end || (sub.items && sub.items.data[0] && sub.items.data[0].current_period_end));
      await activate(event, userId, { plan, premiumUntil: end ? until(end) : new Date(Date.now() + 33 * 864e5).toISOString(), customer: obj.customer, subscription: obj.subscription });
    } else if (stripeEvent.type === 'customer.subscription.updated' || stripeEvent.type === 'customer.subscription.created') {
      const end = obj.current_period_end || (obj.items && obj.items.data[0] && obj.items.data[0].current_period_end);
      if (['active', 'trialing', 'past_due'].includes(obj.status) && end) {
        await activate(event, userId, { plan, premiumUntil: until(end), customer: obj.customer, subscription: obj.id });
      }
    } else if (stripeEvent.type === 'customer.subscription.deleted') {
      const s = L.store(event);
      const u = await L.getUser(s, userId);
      if (u) { Object.assign(u, { tier: 'free', premiumUntil: null, billing: null }); await L.saveUser(s, u); await L.bumpDay(s, userId, { churn: 1 }); }
    }
  } catch (err) {
    console.error('Iskrička webhook error:', err.message || err);
  }
}
