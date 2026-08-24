function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Neplatné dáta.' }) };
  }

  const {
    firstName, lastName, email, phone,
    billFirst, billLast, street, city, zip, country,
    deliveryEmail, payment, note, items, total, newsletter,
  } = data;

  if (!firstName || !lastName || !email || !billFirst || !billLast ||
      !street || !city || !zip || !country || !deliveryEmail ||
      !Array.isArray(items) || items.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Chýbajú povinné údaje.' }) };
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY env var');
    return { statusCode: 500, body: JSON.stringify({ error: 'E-mailová služba nie je nastavená.' }) };
  }
  const OWNER_EMAIL = process.env.OWNER_EMAIL || 'filiphacko2@gmail.com';
  const FROM_EMAIL = process.env.RESEND_FROM || 'Prípravy Inšpirácie <onboarding@resend.dev>';

  const orderNumber = 'OBJ-' + Date.now();
  const orderDate = new Date().toLocaleString('sk-SK', { timeZone: 'Europe/Bratislava' });

  const itemsRowsText = items.map(it => `- ${it.name} x ${it.qty} (${it.price} / ks)`).join('\n');
  const itemsRowsHtml = items.map(it => `
    <tr>
      <td style="padding:6px 10px;border-bottom:1px solid #f1e2d5;">${escapeHtml(it.name)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #f1e2d5;text-align:center;">${escapeHtml(String(it.qty))}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #f1e2d5;text-align:right;">${escapeHtml(it.price)}</td>
    </tr>`).join('');

  const customerHtml = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#241F1D;">
      <h2 style="color:#894E44;">Ďakujeme za objednávku, ${escapeHtml(firstName)}!</h2>
      <p>Číslo objednávky: <strong>${orderNumber}</strong><br>Dátum: ${orderDate}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead>
          <tr>
            <th style="text-align:left;padding:6px 10px;border-bottom:2px solid #E39A8D;">Produkt</th>
            <th style="padding:6px 10px;border-bottom:2px solid #E39A8D;">Ks</th>
            <th style="text-align:right;padding:6px 10px;border-bottom:2px solid #E39A8D;">Cena</th>
          </tr>
        </thead>
        <tbody>${itemsRowsHtml}</tbody>
      </table>
      <p style="text-align:right;font-size:1.2rem;font-weight:bold;">Spolu: ${escapeHtml(total)}</p>
      <p>Fakturačné údaje:<br>${escapeHtml(billFirst)} ${escapeHtml(billLast)}<br>${escapeHtml(street)}, ${escapeHtml(zip)} ${escapeHtml(city)}<br>${escapeHtml(country)}</p>
      <p>Spôsob platby: ${escapeHtml(payment)}</p>
      <p>PDF materiály vám pošleme na e-mail <strong>${escapeHtml(deliveryEmail)}</strong> zvyčajne do 24–48 hodín od prijatia platby.</p>
      ${note ? `<p>Vaša poznámka: ${escapeHtml(note)}</p>` : ''}
      <p style="margin-top:24px;">S pozdravom,<br>Prípravy ♥ Inšpirácie</p>
    </div>
  `;

  const ownerHtml = `
    <div style="font-family:Arial,sans-serif;">
      <h2>Nová objednávka ${orderNumber}</h2>
      <p><strong>Zákazník:</strong> ${escapeHtml(firstName)} ${escapeHtml(lastName)} (${escapeHtml(email)}${phone ? ', tel: ' + escapeHtml(phone) : ''})</p>
      <p><strong>Fakturačné údaje:</strong> ${escapeHtml(billFirst)} ${escapeHtml(billLast)}, ${escapeHtml(street)}, ${escapeHtml(zip)} ${escapeHtml(city)}, ${escapeHtml(country)}</p>
      <p><strong>E-mail na doručenie PDF:</strong> ${escapeHtml(deliveryEmail)}</p>
      <p><strong>Spôsob platby:</strong> ${escapeHtml(payment)}</p>
      <table style="border-collapse:collapse;">${itemsRowsHtml}</table>
      <p><strong>Spolu: ${escapeHtml(total)}</strong></p>
      ${note ? `<p><strong>Poznámka:</strong> ${escapeHtml(note)}</p>` : ''}
      <p>Newsletter súhlas: ${newsletter ? 'áno' : 'nie'}</p>
    </div>
  `;

  async function sendEmail({ to, replyTo, subject, html, text }) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], reply_to: replyTo, subject, html, text }),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Resend API error (${res.status}): ${errBody}`);
    }
    return res.json();
  }

  try {
    await sendEmail({
      to: deliveryEmail,
      replyTo: OWNER_EMAIL,
      subject: `Potvrdenie objednávky ${orderNumber} — Prípravy Inšpirácie`,
      html: customerHtml,
      text: `Ďakujeme za objednávku ${orderNumber}.\n\n${itemsRowsText}\n\nSpolu: ${total}`,
    });

    await sendEmail({
      to: OWNER_EMAIL,
      replyTo: email,
      subject: `Nová objednávka ${orderNumber}`,
      html: ownerHtml,
      text: `Nová objednávka ${orderNumber}\n${firstName} ${lastName}, ${email}\n\n${itemsRowsText}\n\nSpolu: ${total}`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, orderNumber }),
    };
  } catch (err) {
    console.error('Order email error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Nepodarilo sa odoslať e-mail. Skúste to prosím neskôr.' }),
    };
  }
};
