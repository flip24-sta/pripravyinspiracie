/* Iskrička — AI pipeline: serverová AI (Claude cez Netlify Function) + lokálne šablóny ako záloha */
(function () {
  const S = () => ISK.state;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  ISK.shuffle = shuffle; ISK.pick = pick;

  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  ISK.findTheme = function (name) {
    const n = norm(name);
    if (!n) return null;
    return ISK.THEMES.find((t) => norm(t.name).includes(n) || n.includes(norm(t.name).split(' ')[0]) || t.items.some((i) => n.includes(norm(i[1])))) || null;
  };

  class QuotaError extends Error { constructor() { super('quota'); this.quota = true; } }
  ISK.QuotaError = QuotaError;

  /* Hlavný vstupný bod */
  async function run(task, input) {
    if (ISK.aiLeft() <= 0) throw new QuotaError();
    const p = S().profile;
    try {
      const data = await ISK.api('ai', {
        task, input, userId: S().userId,
        context: { age: p.age, className: p.className, school: p.school, kids: p.kids, teacher: p.name },
      }, { timeout: task === 'week' ? 45000 : 30000 });
      if (!data || !data.result) throw new Error('empty');
      if (data.user) ISK.applyServerUser(data.user);
      S().usage.ai += data.user ? 0 : 1; // server už započítal, ak vrátil user
      if (data.user && typeof data.user.aiCount === 'number') S().usage.ai = data.user.aiCount;
      S().stats.aiCalls++;
      ISK.save();
      // serverová AI udalosť započítava priamo funkcia ai.js
      return { result: data.result, source: 'ai' };
    } catch (e) {
      if (e.status === 402) throw new QuotaError();
      if (e.status === 403) throw e;
      // Záloha: lokálne šablóny, aby aplikácia fungovala vždy (aj offline)
      const result = LOCAL[task](input || {});
      ISK.track('tpl_' + task);
      return { result, source: 'template' };
    }
  }

  /* ---------------- Lokálne generátory ---------------- */
  const AREA_GOALS = {
    jazyk: ['rozvíjať slovnú zásobu k téme „{t}“', 'správne vyslovovať slová a vytlieskať slabiky', 'opísať obrázok celou vetou', 'zapamätať si a predniesť krátku básničku'],
    matematika: ['počítať predmety v obore do {n}', 'porovnať skupiny — viac, menej, rovnako', 'triediť predmety podľa jedného znaku', 'pokračovať v jednoduchej postupnosti'],
    priroda: ['pomenovať typické znaky témy „{t}“', 'pozorovať a skúmať prírodniny všetkými zmyslami', 'rozlíšiť živú a neživú prírodu'],
    spolocnost: ['spolupracovať vo dvojici a v skupine', 'dodržiavať dohodnuté pravidlá hry', 'vyjadriť svoje pocity a rešpektovať pocity iných'],
    praca: ['manipulovať s pomôckami a náradím bezpečne', 'skladať a konštruovať podľa predlohy', 'upratať si pracovné miesto'],
    umenie: ['experimentovať s farbou a výtvarným materiálom', 'rytmizovať riekanku hrou na telo', 'vyjadriť náladu pohybom na hudbu'],
    pohyb: ['rozvíjať hrubú motoriku — beh, skok, plazenie', 'reagovať na zvukový a vizuálny signál', 'uvoľniť sa pri relaxačnom cvičení'],
  };

  function ageN(age) { return age === '3-4' ? 5 : age === '4-5' ? 6 : 10; }

  LOCAL_plan.templateSteps = function (type, t, items, durMin) {
    const [a, b, c, d] = items;
    const tm = (frac) => Math.max(2, Math.round(durMin * frac)) + ' min';
    const T = {
      kruh: [
        ['Privítanie', `Sadneme si do kruhu, pozdravíme sa riekankou a posielame si ${a[0]} ${a[1]} — kto ho drží, povie svoje meno a ako sa dnes cíti.`, 0.2],
        ['Čarovné vrecúško', `Vo vrecúšku sú predmety k téme „${t}“. Deti ich hmatom hádajú a opisujú: aké je? (${b[1]}, ${c[1]}...)`, 0.35],
        ['Rozhovor', `Čo vieme o téme „${t}“? Kde to môžeme vidieť? Učiteľka zapisuje nápady detí obrázkami na flipchart.`, 0.25],
        ['Básnička a rozlúčka', 'Naučíme sa prvé dva verše básničky s pohybmi a rozlúčime sa potleskom.', 0.2],
      ],
      pohyb: [
        ['Rozcvička', `Pohybujeme sa ako ${a[1]}, ${b[1]} a ${c[1]} — deti vymýšľajú, ako by sa hýbali.`, 0.2],
        ['Hlavná hra', `Hra „${cap(a[1])} a ${b[1]}“: na signál bubienka deti utekajú do domčekov (obručí). Kto nestihne, pomáha pri ďalšom kole vyvolávať.`, 0.5],
        ['Variácia', `Pridáme pravidlo: pri obrázku ${c[0]} zastaneme ako socha, pri ${d[0]} skáčeme znožmo.`, 0.15],
        ['Relaxácia', 'Ležíme na chrbte, dýchame do bruška, počúvame tichú hudbu.', 0.15],
      ],
      vytvarna: [
        ['Motivácia', `Prezrieme si obrázky a skutočné predmety k téme „${t}“. Čo majú spoločné? Aké majú farby?`, 0.15],
        ['Ukážka techniky', 'Učiteľka ukáže postup krok za krokom, deti opakujú pohyby „vo vzduchu“.', 0.15],
        ['Tvorenie', `Deti vytvárajú vlastný obrázok „${t}“ — ${b[1]} alebo ${c[1]} — technikou podľa výberu (odtláčanie, lepenie, maľba prstami).`, 0.55],
        ['Výstava a hodnotenie', 'Diela vystavíme na nástenku, každé dieťa povie jednu vetu o svojom obrázku.', 0.15],
      ],
      denna: [
        ['Motivácia', `Do triedy „pricestuje“ ${a[1]} ${a[0]} s listom: potrebuje pomoc detí, aby sa naučil všetko o téme „${t}“.`, 0.12],
        ['Jazyková časť', `Prezeráme obrázky ${a[0]} ${b[0]} ${c[0]} ${d[0]}, pomenúvame ich, vytlieskame slabiky a hľadáme prvú hlásku.`, 0.22],
        ['Matematická časť', `Počítame obrázky na koberci, porovnávame skupiny (kde je ich viac?) a triedime podľa farby.`, 0.22],
        ['Pohybová chvíľka', 'Hráme pohybovú hru podľa pokynov z obrázkových kartičiek.', 0.16],
        ['Tvorivá časť', `Pracovný list / tvorenie na tému „${t}“ v skupinách.`, 0.18],
        ['Reflexia', 'Čo sme sa dnes naučili? Deti ukážu palec hore/dole podľa toho, ako sa im darilo.', 0.1],
      ],
      projekt: [
        ['Pondelok — objavujeme', `Úvod do témy „${t}“, ranný kruh s predmetmi a otázky detí „Čo chceme vedieť?“`, 0.2],
        ['Utorok — skúmame', 'Pokus alebo pozorovanie, triedenie a počítanie.', 0.2],
        ['Streda — tvoríme', 'Výtvarná a pracovná činnosť, spoločné dielo do triedy.', 0.2],
        ['Štvrtok — hýbeme sa', 'Pohybové hry a hudobno-pohybová aktivita k téme.', 0.2],
        ['Piatok — prezentujeme', 'Výstava, opakovanie básničky, hry na tablete v Iskričke.', 0.2],
      ],
    };
    return (T[type] || T.denna).map(([title, text, f]) => ({ time: type === 'projekt' ? '1 deň' : tm(f), title, text }));
  };
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function LOCAL_plan(input) {
    const theme = ISK.findTheme(input.theme) || pick(ISK.THEMES);
    const t = input.theme || theme.name;
    const type = input.type || 'denna';
    const items = shuffle(theme.items);
    const durMin = { '15 min': 15, '30 min': 30, '45 min': 45 }[input.duration] || 60;
    const areas = (input.areas && input.areas.length ? input.areas : ['jazyk', 'matematika', 'pohyb']);
    const n = ageN(input.age || S().profile.age);
    const goals = areas.slice(0, 4).map((a) => pick(AREA_GOALS[a] || AREA_GOALS.jazyk).replace('{t}', t).replace('{n}', n));
    const typeName = (ISK.PLAN_TYPES.find((x) => x.id === type) || {}).name || 'Príprava';
    return {
      title: `${typeName}: ${cap(t)}`,
      summary: `Hravá aktivita na tému „${t}“ pre vek ${input.age || '4-6'} rokov, zameraná na ${areas.map((a) => (ISK.AREAS.find((x) => x.id === a) || {}).short).join(', ').toLowerCase()}.`,
      goals,
      materials: [`obrázky: ${items.slice(0, 4).map((i) => i[1]).join(', ')}`, 'obruče alebo kruhy z lana', 'bubienok / tamburína', 'výkresy, pastelky, lepidlo'],
      motivation: `Hádanka: „${riddle(items[0][1])}“ — deti hádajú a učiteľka vytiahne z krabice ${items[0][0]}.`,
      steps: LOCAL_plan.templateSteps(type, t, items, durMin),
      poem: { title: cap(t), text: theme.poem },
      movementGame: { name: `${cap(items[1][1])} hľadá domček`, rules: `Deti behajú po triede, na zvuk bubienka každý rýchlo nájde obruč — svoj domček. V každom kole jedna obruč ubudne, no deti sa môžu do domčeka zmestiť spolu, nik nevypadáva.` },
      differentiation: {
        younger: 'Menej obrázkov (do 3), viac opakovania a pohybových ukážok, pracovať vo dvojici s učiteľkou.',
        older: `Počítanie do ${n + 5}, určovanie prvej aj poslednej hlásky, vlastné vymýšľanie pravidiel hry.`,
      },
      evaluation: 'Pozorovanie: zapájanie sa do rozhovoru, správne pomenovanie obrázkov, spolupráca v hre. Zapíšte si postrehy v sekcii Trieda.',
      parentTip: `Doma sa s dieťaťom porozprávajte, čo nové sa dozvedelo o téme „${t}“, a skúste spolu nájsť ${items[2][1]} na prechádzke alebo v knihe.`,
    };
  }
  function riddle(word) {
    const R = {
      ježko: 'Pichľavý som ako kefa, jabĺčko si nesiem na chrbáti.', tekvica: 'Okrúhla som, oranžová, na Halloween mám svietiacu hlavu.',
      snehuliak: 'Mám nos z mrkvy, hrniec na hlave a na slnku sa roztopím.', raketa: 'Letím až ku hviezdam, keď odpočítaš tri, dva, jedna.',
      líška: 'Ryšavá som, chvost mám dlhý, v lese sliepky rada vidím.', jablko: 'Červené som, guľaté, s ohryzkom v strede.',
    };
    return R[word] || `Hádaj, hádaj, hádači — čo sa skrýva v krabici? Začína sa na hlásku „${word.charAt(0).toUpperCase()}“.`;
  }

  function LOCAL_game(input) {
    const theme = ISK.findTheme(input.theme);
    const base = theme || pick(ISK.THEMES);
    return {
      name: cap(input.theme || base.name),
      icon: base.icon,
      items: base.items.map(([e, w]) => [e, w]),
      note: theme ? '' : 'Pre túto tému nemám offline sadu — použila som najbližšiu dostupnú.',
    };
  }

  function LOCAL_week(input) {
    const theme = ISK.findTheme(input.theme) || pick(ISK.THEMES);
    const t = input.theme || theme.name;
    const it = shuffle(theme.items);
    const plan = [
      ['Ranný kruh: Čo vieme o téme „' + t + '“', 'kruh', 'Rozhovor, otázky detí, čarovné vrecúško.'],
      ['Matematika: Počítame obrázky ' + it[0][0], 'denna', 'Počítanie a triedenie obrázkov, hra Počítame v Iskričke.'],
      ['Výtvarná dielňa: ' + cap(it[1][1]), 'vytvarna', 'Odtláčanie a lepenie, spoločný obraz na nástenku.'],
      ['Pohybová hra: ' + cap(it[2][1]) + ' hľadá domček', 'pohyb', 'Hra s obručami a signálom bubienka.'],
      ['Jazyk: Básnička a prvá hláska', 'denna', 'Nácvik básničky, hra Prvá hláska na tablete.'],
      ['Pokus a pozorovanie: ' + cap(it[3][1]), 'denna', 'Skúmame lupou, kreslíme, čo sme videli.'],
      ['Hudobno-pohybová chvíľka', 'pohyb', 'Pieseň s pohybmi k téme, hra na telo.'],
      ['Pexeso a hry v Iskričke', 'denna', 'Tematické pexeso a Čo sem nepatrí — v skupinkách.'],
      ['Pracovný list: ' + cap(it[4][1]), 'vytvarna', 'Grafomotorika — obťahovanie a vyfarbovanie.'],
      ['Záverečná výstava', 'kruh', 'Deti prezentujú svoje diela a hodnotia týždeň smajlíkmi.'],
    ];
    const days = ISK.DAYS.map(([k, name], i) => ({ day: k, focus: ['Objavujeme', 'Skúmame', 'Tvoríme', 'Hýbeme sa', 'Prezentujeme'][i], activities: plan.slice(i * 2, i * 2 + 2).map(([title, type, text]) => ({ title, type, text })) }));
    return { theme: cap(t), days };
  }

  function LOCAL_parents(input) {
    const p = S().profile;
    const acts = (input.activities || []).slice(0, 8);
    const list = acts.length ? acts.map((a) => '• ' + a).join('\n') : '• ranné kruhy, pohybové hry a tvorivé dielne';
    return {
      subject: `Čo sme zažili tento týždeň${input.theme ? ' — ' + input.theme : ''}`,
      body: `Milí rodičia,\n\ntento týždeň sme sa v triede ${p.className || ''} venovali téme „${input.theme || 'našej týždennej témy'}“. Deti boli zvedavé, tvorivé a veľmi šikovné. Spolu sme zažili:\n\n${list}\n\nTip na doma: opýtajte sa detí, ktorú hru si najviac užili, a poproste ich, nech vám zarecitujú našu novú básničku.\n\nĎakujeme za spoluprácu a prajeme pekný víkend!\n\n${p.name || 'Vaša pani učiteľka'}`,
    };
  }

  function LOCAL_child(input) {
    const c = input.child || {};
    const obs = (c.observations || []).slice(0, 5).map((o) => '– ' + o.text).join('\n');
    const games = Object.entries(c.games || {}).map(([g, s]) => `${(ISK.GAMES.find((x) => x.id === g) || {}).name}: ${s.plays}× (${s.stars} ⭐)`).join(', ');
    return `${c.name} sa v poslednom období aktívne zapája do činností v triede.\n\nČo sme pozorovali:\n${obs || '– zatiaľ bez zapísaných pozorovaní'}\n\nHry v Iskričke: ${games || 'zatiaľ neodohral(a) žiadnu hru'}.\n\nOdporúčanie na doma: pokračujte v spoločnom čítaní a hrách na počítanie pri bežných činnostiach (schody, príbor, hračky).`;
  }

  function LOCAL_chat(input) {
    const q = norm(input.message);
    if (/basn|riekank/.test(q)) { const th = ISK.findTheme(input.message) || pick(ISK.THEMES); return `Tu je básnička na tému ${th.name}:\n\n${th.poem}\n\nTip: pridajte ku každému veršu pohyb, deti si ju zapamätajú rýchlejšie.`; }
    if (/hra|pohyb/.test(q)) return 'Skúste hru „Farebné domčeky“: rozložte obruče rôznych farieb, deti behajú pri hudbe a keď stíchne, učiteľka ukáže farbu — všetci musia nájsť obruč tej farby. Starší môžu dostať úlohu „nájdi obruč a skoč do nej po jednej nohe“.';
    if (/nepokoj|hluk|disciplin|pravidl/.test(q)) return 'Na upokojenie triedy pomáha: 1) tichý signál (zdvihnutá ruka, zvonček), 2) „dychová hviezdička“ — 5 pomalých nádychov, 3) jasné obrázkové pravidlá na stene, 4) pochvala konkrétneho správania („vidím, že Miško čaká, ďakujem“).';
    if (/rodic/.test(q)) return 'Pri komunikácii s rodičmi pomáha pravidlo „sendvič“: začnite pozitívnym postrehom, potom konkrétna situácia a návrh riešenia, a zakončite spoločným cieľom. V Iskričke vám zhrnutie pre rodiča vygenerujem v sekcii Trieda.';
    return 'Som Iskrička, vaša asistentka pre materskú školu. Môžem pomôcť s nápadmi na aktivity, básničkami, pohybovými hrami, komunikáciou s rodičmi aj plánovaním podľa ŠVP. Napíšte mi tému alebo situáciu. (Momentálne odpovedám v offline režime — plná AI sa zapne po nastavení servera.)';
  }

  const LOCAL = { plan: LOCAL_plan, game: LOCAL_game, week: LOCAL_week, parents: LOCAL_parents, child: LOCAL_child, chat: LOCAL_chat };
  ISK.ai = { run, local: LOCAL };
})();
