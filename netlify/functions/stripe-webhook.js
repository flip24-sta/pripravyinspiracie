const Stripe = require('stripe');
const { Resend } = require('resend');
const { fulfillmentLinks } = require('./fulfillment-links');

// TODO: switch back to 'Prípravy Inšpirácie <predaj@pripravyinspiracie.info>' once the
// domain status in Resend (Domains) shows "Verified" instead of "Pending".
const FROM_EMAIL = 'Prípravy Inšpirácie <onboarding@resend.dev>';
const OWNER_EMAIL = 'filiphacko2@gmail.com';
// All addresses that get notified about a new order. Each one is sent separately so that
// a rejection for one address (e.g. while the Resend domain is unverified) doesn't block the others.
const NOTIFY_EMAILS = ['filiphacko2@gmail.com', 'predaj@pripravyinspiracie.info'];

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

    const ownerSubject = `Nová platba: ${customerEmail}${allLinked ? '' : ' (vyžaduje ručné doplnenie)'}`;
    const ownerHtml = `
          <p>Zákazník: ${customerEmail}</p>
          <ul>${withLinks.map((p) => `<li>${p.name} (${p.qty}×)${p.link ? '' : ' — chýba odkaz na materiál, doplňte ho ručne!'}</li>`).join('')}</ul>
        `;
    for (const to of NOTIFY_EMAILS) {
      try {
        const { error } = await resend.emails.send({
          from: FROM_EMAIL,
          to,
          replyTo: customerEmail,
          subject: ownerSubject,
          html: ownerHtml,
        });
        if (error) console.error(`Resend send to ${to} failed:`, error.message || error);
      } catch (err) {
        console.error(`Resend send to ${to} failed:`, err.message || err);
      }
    }
  } else {
    console.error('Skipped sending emails: missing RESEND_API_KEY or customerEmail', { hasResendKey: !!resendApiKey, customerEmail });
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
