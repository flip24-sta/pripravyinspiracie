const Stripe = require('stripe');
const { Resend } = require('resend');
const { fulfillmentLinks } = require('./fulfillment-links');

// TODO: switch back to 'Prípravy Inšpirácie <predaj@pripravyinspiracie.info>' once the
// domain status in Resend (Domains) shows "Verified" instead of "Pending".
const FROM_EMAIL = 'Prípravy Inšpirácie <onboarding@resend.dev>';
const OWNER_EMAIL = 'filiphacko2@gmail.com';

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function customerEmailHtml({ items, orderNo, total }) {
  const rows = items
    .map((p) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #F1E2D5;">
          <div style="font-weight:700;color:#241F1D;font-size:15px;">${esc(p.name)}${p.qty > 1 ? ` (${p.qty}×)` : ''}</div>
          ${p.link
            ? `<a href="${esc(p.link)}" style="display:inline-block;margin-top:8px;background:#E39A8D;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:10px 20px;border-radius:999px;">Stiahnuť materiál (PDF)</a>`
            : `<div style="margin-top:6px;color:#894E44;font-size:14px;">Tento materiál vám pošleme samostatným e-mailom čo najskôr.</div>`}
        </td>
      </tr>`)
    .join('');
  return `
  <div style="background:#FFF8F0;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #F1E2D5;">
      <div style="background:#FEF1EE;padding:28px 28px 22px;text-align:center;">
        <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#E39A8D;font-weight:700;">Prípravy Inšpirácie</div>
        <h1 style="margin:10px 0 6px;font-size:24px;color:#894E44;">Ďakujeme za objednávku!</h1>
        <div style="color:#9C8983;font-size:14px;">Platba bola úspešne prijatá.${orderNo ? ` Číslo objednávky: <strong style="color:#241F1D;">${esc(orderNo)}</strong>` : ''}</div>
      </div>
      <div style="padding:8px 28px 24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">${rows}</table>
        ${total ? `<div style="text-align:right;margin-top:14px;font-size:16px;color:#241F1D;">Spolu zaplatené: <strong>${esc(total)}</strong></div>` : ''}
        <p style="color:#5f5450;font-size:14px;line-height:1.6;margin:22px 0 0;">Materiály sú vo formáte PDF. Po kliknutí na tlačidlo sa súbor otvorí na Google Disku, kde si ho stiahnete ikonou šípky (Stiahnuť). Súbory sú veľké, sťahovanie môže chvíľu trvať.</p>
        <p style="color:#5f5450;font-size:14px;line-height:1.6;">Materiály sú určené na opakovanú tlač pre vlastnú triedu, školu alebo domácnosť. Ich ďalšie šírenie alebo predaj nie je povolený.</p>
        <p style="color:#5f5450;font-size:14px;line-height:1.6;">Ak by sa vám niečo nedarilo otvoriť, stačí odpovedať na tento e-mail alebo napísať na <a href="mailto:${OWNER_EMAIL}" style="color:#894E44;">${OWNER_EMAIL}</a>.</p>
      </div>
      <div style="background:#FEF1EE;padding:16px;text-align:center;color:#9C8983;font-size:12px;">Prípravy Inšpirácie · www.pripravyinspiracie.info</div>
    </div>
  </div>`;
}

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
    const orderNo = String(session.id || '').slice(-8).toUpperCase();
    const total = typeof session.amount_total === 'number'
      ? (session.amount_total / 100).toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
      : '';

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: customerEmail,
        replyTo: OWNER_EMAIL,
        subject: `Potvrdenie objednávky ${orderNo} — Prípravy Inšpirácie`,
        html: customerEmailHtml({ items: withLinks, orderNo, total }),
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
