// eFakturko AI — one endpoint, five pipelines that power the app's core value.
//   invoice_draft : one Slovak sentence  -> structured invoice draft
//   receipt_scan  : photo of a receipt   -> structured expense
//   dunning       : overdue invoice      -> payment reminder email (tone by level)
//   insights      : business stats       -> 3 actionable insights
//   ask           : free question         -> answer about Slovak invoicing / SZČO taxes
// Every pipeline returns JSON constrained by a JSON schema (structured outputs).
// Requires ANTHROPIC_API_KEY in Netlify env. The client falls back to local
// heuristics when this endpoint is unavailable, so the app never dead-ends.

const AnthropicMod = require('@anthropic-ai/sdk');
const Anthropic = AnthropicMod.default || AnthropicMod;

const MODEL = 'claude-opus-5-5';

const SYSTEM = `Si eFakturko AI — asistent fakturačnej aplikácie pre slovenských živnostníkov (SZČO) a malé firmy.
Píšeš po slovensky, vecne a zrozumiteľne. Poznáš slovenskú legislatívu: zákon o DPH (sadzby 23 %, 19 %, 5 %, 0 %),
náležitosti faktúry podľa § 74, PAY by square, paušálne výdavky SZČO (60 %, max. 20 970 € ročne), odvody do Sociálnej
a zdravotnej poisťovne a povinnú e-faktúru (Peppol) od 1. 1. 2027 pre platiteľov DPH.
Pri daňových otázkach uveď, že ide o orientačný odhad a pri nejasnostiach odporuč daňového poradcu.
Nikdy si nevymýšľaj IČO ani iné identifikátory — ak ich nepoznáš, nechaj prázdny reťazec.`;

const S = (props, required = Object.keys(props)) => ({ type: 'object', properties: props, required, additionalProperties: false });
const str = { type: 'string' };
const num = { type: 'number' };

const SCHEMAS = {
  invoice_draft: S({
    clientName: str,
    clientMatchedExisting: { type: 'boolean' },
    items: { type: 'array', items: S({ description: str, quantity: num, unit: str, unitPrice: num, vatRate: num }) },
    dueDays: { type: 'integer' },
    note: str,
    confidence: num,
  }),
  receipt_scan: S({
    vendor: str, vendorIco: str, date: str, total: num, vatAmount: num, vatRate: num,
    category: { type: 'string', enum: ['Kancelária', 'Software', 'Cestovné', 'Pohonné hmoty', 'Telefón a internet', 'Marketing', 'Materiál', 'Strava', 'Vzdelávanie', 'Iné'] },
    description: str,
  }),
  dunning: S({ subject: str, body: str }),
  insights: S({ insights: { type: 'array', items: S({ title: str, body: str, kind: { type: 'string', enum: ['cash', 'risk', 'tax', 'growth'] } }) } }),
  ask: S({ answer: str }),
};

function buildUser(action, p) {
  switch (action) {
    case 'invoice_draft':
      return `Dnes je ${p.today}. Používateľ ${p.vatPayer ? 'JE' : 'NIE JE'} platiteľ DPH${p.vatPayer ? '' : ' (vatRate vždy 0)'}.
Existujúci klienti: ${JSON.stringify(p.clients || [])}.
Ak sa klient zhoduje s existujúcim (aj približne), použi presne jeho názov a clientMatchedExisting=true.
Predvolená jednotka "ks", pre prácu "hod". Predvolená splatnosť 14 dní. Ceny sú bez DPH, ak nie je uvedené inak.
confidence 0–1 = istota, že návrh zodpovedá zadaniu.
Zadanie: """${String(p.text || '').slice(0, 2000)}"""`;
    case 'receipt_scan':
      return 'Vyčítaj z tohto bločku/faktúry výdavok. Dátum vo formáte YYYY-MM-DD. Ak údaj chýba, použi prázdny reťazec alebo 0.';
    case 'dunning':
      return `Napíš e-mail s pripomienkou platby. Úroveň ${p.level}/3 (1 = priateľská pripomienka, 2 = vecná upomienka, 3 = posledná výzva pred vymáhaním).
Faktúra: ${JSON.stringify(p.invoice)}. Dodávateľ: ${JSON.stringify(p.company)}.
Uveď číslo faktúry, sumu, dátum splatnosti, IBAN a variabilný symbol. Bez placeholderov v hranatých zátvorkách. Podpíš sa menom dodávateľa.`;
    case 'insights':
      return `Na základe týchto údajov o podnikaní napíš presne 3 konkrétne, akčné postrehy (každý max. 2 vety, s číslami).
Údaje: ${JSON.stringify(p.stats)}`;
    case 'ask':
      return `Kontext používateľa: ${JSON.stringify(p.context || {})}
Otázka: ${String(p.question || '').slice(0, 2000)}
Odpovedz stručne (max. 120 slov).`;
    default:
      return null;
  }
}

const json = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return json(503, { error: 'AI nie je nakonfigurovaná', fallback: true });

  let req;
  try { req = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Neplatné dáta' }); }
  const { action, payload = {} } = req;
  const schema = SCHEMAS[action];
  const text = buildUser(action, payload);
  if (!schema || !text) return json(400, { error: 'Neznáma akcia' });

  const content = [];
  if (action === 'receipt_scan') {
    const m = /^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/.exec(payload.image || '');
    if (!m) return json(400, { error: 'Chýba obrázok' });
    if (m[2].length > 7_000_000) return json(413, { error: 'Obrázok je príliš veľký' });
    content.push({ type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } });
  }
  content.push({ type: 'text', text });

  const client = new Anthropic();
  try {
    const res = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema } },
      system: SYSTEM,
      messages: [{ role: 'user', content }],
    });
    if (res.stop_reason === 'refusal') return json(422, { error: 'AI požiadavku odmietla', fallback: true });
    const block = res.content.find((b) => b.type === 'text');
    if (!block) return json(502, { error: 'Prázdna odpoveď', fallback: true });
    return json(200, { ok: true, data: JSON.parse(block.text) });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return json(429, { error: 'AI je preťažená, skúste o chvíľu', fallback: true });
    if (err instanceof Anthropic.APIError) { console.error('Anthropic', err.status, err.message); return json(502, { error: 'Chyba AI služby', fallback: true }); }
    console.error(err);
    return json(500, { error: 'Neočakávaná chyba', fallback: true });
  }
};
