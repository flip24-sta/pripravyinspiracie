// Iskrička — AI pipeline (Claude API). Generuje prípravy, týždenné plány, herné sady,
// správy pre rodičov, zhrnutia o deťoch a odpovede asistentky.
// Premenné prostredia: ANTHROPIC_API_KEY (povinné), AI_MODEL (voliteľné).
const L = require('./_iskricka-lib');

const MODEL = process.env.AI_MODEL || 'claude-haiku-5-5';
const PREMIUM_TASKS = new Set(['week', 'parents', 'child', 'game']);

const BASE = `Si Iskrička — skúsená slovenská učiteľka materskej školy a metodička. Píšeš výhradne spisovnou slovenčinou, vecne, vrúcne a prakticky.
Riadiš sa Štátnym vzdelávacím programom pre predprimárne vzdelávanie (oblasti: Jazyk a komunikácia; Matematika a práca s informáciami; Človek a príroda; Človek a spoločnosť; Človek a svet práce; Umenie a kultúra; Zdravie a pohyb).
Aktivity musia byť bezpečné, primerané veku, realizovateľné v bežnej triede s bežnými pomôckami. Ciele formuluj ako výkonové štandardy („dieťa vie…“). Nikdy nepíš nič mimo požadovaného formátu.`;

const AREA_NAMES = { jazyk: 'Jazyk a komunikácia', matematika: 'Matematika a práca s informáciami', priroda: 'Človek a príroda', spolocnost: 'Človek a spoločnosť', praca: 'Človek a svet práce', umenie: 'Umenie a kultúra', pohyb: 'Zdravie a pohyb' };
const TYPE_NAMES = { denna: 'denná príprava (komplexná vzdelávacia aktivita)', kruh: 'ranný kruh', pohyb: 'pohybová hra / pohybová aktivita', vytvarna: 'výtvarná aktivita', projekt: 'týždenný projekt (5 dní, krok = jeden deň)' };

const s = (v, n = 200) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').slice(0, n);

function buildPrompt(task, input, ctx) {
  const age = s(input.age || ctx.age, 10);
  switch (task) {
    case 'plan':
      return {
        max: 2600,
        json: true,
        user: `Vytvor ${TYPE_NAMES[input.type] || TYPE_NAMES.denna} na tému „${s(input.theme, 80)}“.
Vek detí: ${age} rokov. Dĺžka: ${s(input.duration, 20)}. Počet detí v triede: ${Number(ctx.kids) || 20}.
Vzdelávacie oblasti: ${(input.areas || []).map((a) => AREA_NAMES[a]).filter(Boolean).join(', ') || 'podľa témy'}.
${input.notes ? 'Poznámka učiteľky: ' + s(input.notes, 400) : ''}
Vráť IBA platný JSON s presne touto štruktúrou:
{"title":"krátky pútavý názov","summary":"1–2 vety o aktivite","goals":["3–5 cieľov"],"materials":["pomôcky"],"motivation":"konkrétna motivácia (hádanka, postava, príbeh)","steps":[{"time":"napr. 5 min","title":"názov kroku","text":"podrobný opis, čo robí učiteľka a deti"}],"poem":{"title":"názov","text":"pôvodná rýmovaná básnička 4–8 veršov, verše oddeľ \\n"},"movementGame":{"name":"názov hry","rules":"pravidlá"},"differentiation":{"younger":"úprava pre mladšie/pomalšie deti","older":"rozšírenie pre staršie/šikovnejšie"},"evaluation":"ako overiť splnenie cieľov","parentTip":"jedna veta tip pre rodičov"}
Krokov 4–6, časy nech spolu sedia s dĺžkou.`,
      };
    case 'week':
      return {
        max: 2400,
        json: true,
        user: `Navrhni týždenný plán (pondelok–piatok) na tému „${s(input.theme, 80)}“ pre deti vo veku ${age} rokov.
${input.focus && input.focus.length ? 'Dôraz na oblasti: ' + input.focus.map((a) => AREA_NAMES[a]).filter(Boolean).join(', ') + '.' : ''}
Každý deň 2–3 aktivity, rôzne typy, pokrytie všetkých oblastí ŠVP počas týždňa.
Vráť IBA JSON: {"theme":"názov témy","days":[{"day":"Pondelok","focus":"zameranie dňa","activities":[{"title":"krátky názov","type":"kruh|denna|pohyb|vytvarna","text":"1 veta čo sa robí"}]}]} — presne 5 dní.`,
      };
    case 'game':
      return {
        max: 900,
        json: true,
        user: `Vytvor hernú sadu pre deti v MŠ na tému „${s(input.theme, 60)}“. Potrebujem 12 rôznych pojmov, ktoré sa dajú zobraziť JEDNÝM štandardným emoji (Unicode) a pomenovať jedným jednoduchým slovenským podstatným menom v 1. páde, malými písmenami.
Každé emoji iné, slovo musí presne zodpovedať obrázku. Vráť IBA JSON: {"name":"názov sady (max 3 slová)","icon":"jedno emoji","items":[["🚒","hasiči"], ...]}`,
      };
    case 'parents':
      return {
        max: 1200,
        json: true,
        user: `Napíš krátky, milý týždenný list rodičom detí z triedy ${s(ctx.className, 60)} (MŠ ${s(ctx.school, 80)}). Téma týždňa: „${s(input.theme, 80)}“.
Aktivity tohto týždňa: ${(input.activities || []).slice(0, 15).map((a) => s(a, 100)).join('; ') || 'rôzne aktivity k téme'}.
Obsah: čo sme zažili, čo sa deti naučili, 1–2 tipy na spoločnú aktivitu doma, poďakovanie. Podpis: ${s(ctx.teacher, 60) || 'pani učiteľka'}. Max 220 slov, vykanie rodičom.
Vráť IBA JSON: {"subject":"predmet e-mailu","body":"text listu s odsekmi oddelenými \\n\\n"}`,
      };
    case 'child': {
      const c = input.child || {};
      const games = Object.entries(c.games || {}).map(([g, v]) => `${g}: ${Number(v.plays) || 0}x, najlepšie ${Number(v.best) || 0}/3 hviezdy`).join('; ');
      return {
        max: 900,
        json: false,
        user: `Napíš láskavé, profesionálne a konkrétne zhrnutie pokrokov dieťaťa pre rodičov (vek ${age}).
Meno: ${s(c.name, 40)}.
Pozorovania učiteľky: ${(c.observations || []).slice(0, 15).map((o) => `[${s(o.date, 10)}, ${s(o.area, 40)}] ${s(o.text, 300)}`).join(' | ') || 'žiadne'}.
Výsledky v edukačných hrách: ${games || 'žiadne'}.
Štruktúra: silné stránky, v čom rastie, 2 konkrétne tipy na doma. Bez diagnóz a nálepiek, max 180 slov, čistý text bez markdownu.`,
      };
    }
    case 'chat':
      return {
        max: 900,
        json: false,
        chat: true,
        user: s(input.message, 1000),
        history: (input.history || []).slice(-8).map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: s(m.text, 1500) })),
      };
    default:
      return null;
  }
}

function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI nevrátila JSON');
  return JSON.parse(text.slice(start, end + 1));
}

async function callClaude(system, messages, maxTokens) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data.error && data.error.message) || 'AI chyba ' + res.status);
  return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return L.json(405, { error: 'Method not allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return L.json(503, { error: 'AI nie je nakonfigurovaná' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return L.json(400, { error: 'Neplatná požiadavka.' }); }
  const task = String(body.task || '');
  const input = body.input || {};
  const ctx = body.context || {};
  const userId = L.cleanId(body.userId);
  const spec = buildPrompt(task, input, ctx);
  if (!spec) return L.json(400, { error: 'Neznáma úloha.' });
  if (!userId) return L.json(400, { error: 'Chýba používateľ.' });

  // Limity podľa tarifu (free: X generovaní mesačne, prémiové úlohy len pre Premium)
  let s0, user;
  try {
    s0 = L.store(event);
    user = await L.getUser(s0, userId);
  } catch (e) { s0 = null; }
  if (user && user.blocked) return L.json(403, { error: 'Účet je zablokovaný.' });
  const premium = L.isPremium(user);
  if (PREMIUM_TASKS.has(task) && !premium) return L.json(403, { error: 'Táto funkcia je dostupná v Iskrička Premium.' });
  if (input.type === 'projekt' && !premium) return L.json(403, { error: 'Týždenné projekty sú dostupné v Iskrička Premium.' });
  if (user && user.aiMonth !== L.monthKey()) { user.aiMonth = L.monthKey(); user.aiCount = 0; }
  if (!premium && user && (user.aiCount || 0) >= L.FREE_AI_PER_MONTH) return L.json(402, { error: 'Mesačný limit vyčerpaný.', user: L.clientView(user) });

  try {
    const system = BASE + (ctx.className ? `\nUčiteľka: ${s(ctx.teacher, 60)}, trieda ${s(ctx.className, 60)}, vek detí ${s(ctx.age, 10)}.` : '');
    const messages = spec.chat ? spec.history.concat([{ role: 'user', content: spec.user }]) : [{ role: 'user', content: spec.user }];
    // Správy musia začínať rolou user a striedať sa
    while (messages.length && messages[0].role !== 'user') messages.shift();
    const text = await callClaude(system + (spec.json ? '\nOdpovedaj výhradne platným JSON objektom bez úvodu a bez ```.' : '\nOdpovedaj stručne a prakticky, max 250 slov.'), messages, spec.max);
    let result = spec.json ? extractJson(text) : text;
    if (task === 'game' && result && Array.isArray(result.items)) {
      result.items = result.items.filter((x) => Array.isArray(x) && x[0] && x[1]).slice(0, 12);
    }

    if (user && s0) {
      user.aiCount = (user.aiCount || 0) + 1;
      user.lastSeen = new Date().toISOString();
      await L.saveUser(s0, user).catch(() => {});
    }
    if (s0) await L.bumpDay(s0, userId, { ['ai_' + task]: 1 }).catch(() => {});
    return L.json(200, { result, model: MODEL, user: L.clientView(user) });
  } catch (err) {
    console.error('AI error', task, err.message);
    return L.json(502, { error: 'AI je dočasne nedostupná.' });
  }
};
