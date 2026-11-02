/* Iskrička — statické dáta: témy, oblasti ŠVP, knižnica inšpirácií, plány predplatného */
window.ISK = window.ISK || {};

ISK.PLANS = {
  free: {
    name: 'Zadarmo', aiPerMonth: 10, libraryMax: 15,
    games: ['pexeso', 'pocitanie', 'farby'],
  },
  premium: {
    name: 'Premium', priceMonth: 6.9, priceYear: 59, aiPerMonth: Infinity, libraryMax: Infinity,
  },
};

ISK.PREMIUM_FEATURES = [
  ['✨', 'Neobmedzené AI prípravy', 'Denné prípravy, ranné kruhy aj týždenné projekty bez limitu'],
  ['🎮', 'Všetkých 7 interaktívnych hier', 'Vrátane hlások, postupností, tieňov a „Čo sem nepatrí“'],
  ['🪄', 'AI hry na mieru', 'Napíšte akúkoľvek tému a Iskrička z nej vytvorí hernú sadu'],
  ['📅', 'AI naplnenie celého týždňa', 'Jedným klikom kompletný týždenný plán podľa ŠVP'],
  ['💌', 'Správy pre rodičov', 'Týždenný list rodičom a individuálne zhrnutia o deťoch'],
  ['📚', 'Neobmedzená knižnica', 'Ukladajte a tlačte bez obmedzení, bez vodoznaku'],
];

ISK.AREAS = [
  { id: 'jazyk', name: 'Jazyk a komunikácia', short: 'Jazyk', color: '#FF6B6B', icon: '💬' },
  { id: 'matematika', name: 'Matematika a práca s informáciami', short: 'Matematika', color: '#5B8DEF', icon: '🔢' },
  { id: 'priroda', name: 'Človek a príroda', short: 'Príroda', color: '#3DBE8B', icon: '🌿' },
  { id: 'spolocnost', name: 'Človek a spoločnosť', short: 'Spoločnosť', color: '#F4A261', icon: '🤝' },
  { id: 'praca', name: 'Človek a svet práce', short: 'Svet práce', color: '#8D6E63', icon: '🔧' },
  { id: 'umenie', name: 'Umenie a kultúra', short: 'Umenie', color: '#9B5DE5', icon: '🎨' },
  { id: 'pohyb', name: 'Zdravie a pohyb', short: 'Pohyb', color: '#00BBD3', icon: '🤸' },
];

ISK.PLAN_TYPES = [
  { id: 'denna', name: 'Denná príprava', icon: '📝' },
  { id: 'kruh', name: 'Ranný kruh', icon: '☀️' },
  { id: 'pohyb', name: 'Pohybová hra', icon: '🏃' },
  { id: 'vytvarna', name: 'Výtvarná aktivita', icon: '🖍️' },
  { id: 'projekt', name: 'Týždenný projekt', icon: '🗂️', premium: true },
];

ISK.AGES = [
  { id: '3-4', name: '3 – 4 roky' },
  { id: '4-5', name: '4 – 5 rokov' },
  { id: '5-6', name: '5 – 6 rokov (predškoláci)' },
  { id: 'mix', name: 'Zmiešaná trieda' },
];

ISK.DURATIONS = ['15 min', '30 min', '45 min', 'Celé dopoludnie'];

ISK.AVATARS = ['🦊', '🐻', '🐰', '🐼', '🦁', '🐸', '🐨', '🐯', '🐷', '🐵', '🦄', '🐞', '🐝', '🐢', '🐬', '🦉', '🐙', '🐥', '🦋', '🐶', '🐱', '🦔'];

/* Tematické sady pre hry aj šablóny — slovenské slová, aby fungovala hra s hláskami */
ISK.THEMES = [
  { id: 'jesen', name: 'Jeseň', icon: '🍂', color: '#F4A261', items: [
    ['🍂', 'list'], ['🍄', 'huba'], ['🌰', 'gaštan'], ['🎃', 'tekvica'], ['🍎', 'jablko'], ['🦔', 'ježko'],
    ['🐿️', 'veverička'], ['☔', 'dáždnik'], ['🍐', 'hruška'], ['🪁', 'šarkan'], ['🌧️', 'dážď'], ['🥾', 'čižmy']] ,
    poem: 'Padá lístok žltý, červený,\nvietor si ho berie do zeme.\nJežko nesie jabĺčko,\nzohrej nás už, slniečko!' },
  { id: 'zima', name: 'Zima', icon: '⛄', color: '#5B8DEF', items: [
    ['⛄', 'snehuliak'], ['❄️', 'vločka'], ['🧤', 'rukavice'], ['🧣', 'šál'], ['🛷', 'sane'], ['⛸️', 'korčule'],
    ['🎄', 'stromček'], ['🎁', 'darček'], ['🍪', 'koláčik'], ['🔔', 'zvonček'], ['🦌', 'jeleň'], ['🧦', 'ponožky']],
    poem: 'Biela vločka z neba letí,\nraduje sa kopa detí.\nSnehuliak má nos z mrkvičky,\nčervené má líčka.' },
  { id: 'jar', name: 'Jar', icon: '🌷', color: '#3DBE8B', items: [
    ['🌷', 'tulipán'], ['🌼', 'kvet'], ['🐝', 'včela'], ['🦋', 'motýľ'], ['🐣', 'kuriatko'], ['🌈', 'dúha'],
    ['🐞', 'lienka'], ['🪺', 'hniezdo'], ['🐌', 'slimák'], ['🌱', 'klíčok'], ['🥚', 'vajíčko'], ['🐰', 'zajko']],
    poem: 'Prišla jar, je všade krajšie,\nkvety dvíhajú svoje hlávky.\nLienka letí, včielka bzučí,\njar nás pekne veľa učí.' },
  { id: 'leto', name: 'Leto', icon: '☀️', color: '#FFC93C', items: [
    ['☀️', 'slnko'], ['🍉', 'melón'], ['🍦', 'zmrzlina'], ['🏖️', 'pláž'], ['⛱️', 'slnečník'], ['🐚', 'mušľa'],
    ['🩴', 'žabky'], ['🕶️', 'okuliare'], ['⛵', 'loďka'], ['🍓', 'jahoda'], ['🏐', 'lopta'], ['🌻', 'slnečnica']],
    poem: 'Slniečko nás hreje,\nkaždý sa dnes smeje.\nZmrzlina a voda,\nletná je to pohoda!' },
  { id: 'zvierata', name: 'Zvieratká na farme', icon: '🐮', color: '#E07A5F', items: [
    ['🐮', 'krava'], ['🐷', 'prasiatko'], ['🐔', 'sliepka'], ['🐴', 'kôň'], ['🐑', 'ovečka'], ['🐐', 'koza'],
    ['🦆', 'kačka'], ['🐶', 'pes'], ['🐱', 'mačka'], ['🐰', 'zajac'], ['🦃', 'moriak'], ['🐓', 'kohút']],
    poem: 'Kohút kikirikí volá,\nkravička bú, už je hore.\nPrasiatko sa v blate máča,\na mačička mňau, už skáča.' },
  { id: 'les', name: 'Lesné zvieratá', icon: '🦊', color: '#2A9D8F', items: [
    ['🦊', 'líška'], ['🐻', 'medveď'], ['🦉', 'sova'], ['🐺', 'vlk'], ['🦌', 'jeleň'], ['🐗', 'diviak'],
    ['🦔', 'jež'], ['🐿️', 'veverička'], ['🦡', 'jazvec'], ['🐸', 'žaba'], ['🌲', 'smrek'], ['🍄', 'hríb']],
    poem: 'Líška beží lesom tíško,\nveverička skáče vysoko.\nSova v noci hú-hú volá,\nmedveď spinká, nič ho nebolí.' },
  { id: 'ovocie', name: 'Ovocie a zelenina', icon: '🍓', color: '#FF6B6B', items: [
    ['🍎', 'jablko'], ['🍌', 'banán'], ['🍇', 'hrozno'], ['🍓', 'jahoda'], ['🍒', 'čerešne'], ['🍋', 'citrón'],
    ['🥕', 'mrkva'], ['🥒', 'uhorka'], ['🍅', 'paradajka'], ['🌽', 'kukurica'], ['🥔', 'zemiak'], ['🧅', 'cibuľa']],
    poem: 'Jabĺčko a hruška,\nmrkva aj petržlen,\nkto vitamíny papá,\nje zdravý celý deň!' },
  { id: 'doprava', name: 'Doprava', icon: '🚗', color: '#00BBD3', items: [
    ['🚗', 'auto'], ['🚌', 'autobus'], ['🚂', 'vlak'], ['✈️', 'lietadlo'], ['🚲', 'bicykel'], ['🚀', 'raketa'],
    ['🚑', 'sanitka'], ['🚒', 'hasiči'], ['🚜', 'traktor'], ['⛵', 'loď'], ['🚁', 'vrtuľník'], ['🚦', 'semafor']],
    poem: 'Červená stoj, zelená choď,\ncez cestu len s mamou poď.\nAuto trúbi tú-tú-tú,\nbezpečne sa chodí tu.' },
  { id: 'vesmir', name: 'Vesmír', icon: '🚀', color: '#9B5DE5', items: [
    ['🚀', 'raketa'], ['🌙', 'mesiac'], ['⭐', 'hviezda'], ['☀️', 'slnko'], ['🪐', 'planéta'], ['👽', 'mimozemšťan'],
    ['🛸', 'ufo'], ['🌍', 'zem'], ['☄️', 'kométa'], ['🔭', 'ďalekohľad'], ['👨‍🚀', 'kozmonaut'], ['🛰️', 'družica']],
    poem: 'Raketa letí do výšky,\nponad mraky, ponad vrchy.\nTri, dva, jedna, štart,\nvesmír je náš kamarát!' },
  { id: 'more', name: 'More', icon: '🐳', color: '#277DA1', items: [
    ['🐳', 'veľryba'], ['🐬', 'delfín'], ['🐙', 'chobotnica'], ['🦀', 'krab'], ['🐠', 'rybka'], ['🦈', 'žralok'],
    ['🐢', 'korytnačka'], ['🦑', 'kalmár'], ['🐚', 'mušľa'], ['⚓', 'kotva'], ['🦞', 'homár'], ['🪸', 'koral']],
    poem: 'Rybička pláva v mori,\ndelfín skáče, nie je chorý.\nChobotnica osem rúk má,\nmorské dno už každý pozná.' },
];

ISK.COLORS = [
  { id: 'cervena', name: 'červený', fem: 'červenú', hex: '#EF4444' },
  { id: 'modra', name: 'modrý', fem: 'modrú', hex: '#3B82F6' },
  { id: 'zlta', name: 'žltý', fem: 'žltú', hex: '#FACC15' },
  { id: 'zelena', name: 'zelený', fem: 'zelenú', hex: '#22C55E' },
  { id: 'fialova', name: 'fialový', fem: 'fialovú', hex: '#A855F7' },
  { id: 'oranzova', name: 'oranžový', fem: 'oranžovú', hex: '#F97316' },
];
ISK.SHAPES = [
  { id: 'kruh', name: 'kruh', gender: 'm' },
  { id: 'stvorec', name: 'štvorec', gender: 'm' },
  { id: 'trojuholnik', name: 'trojuholník', gender: 'm' },
  { id: 'hviezda', name: 'hviezdu', gender: 'f' },
  { id: 'srdce', name: 'srdce', gender: 'n' },
];

ISK.GAMES = [
  { id: 'pexeso', name: 'Pexeso', icon: '🃏', color: '#FF6B6B', skill: 'Pamäť a pozornosť', area: 'matematika', desc: 'Nájdi dvojice rovnakých kartičiek.' },
  { id: 'pocitanie', name: 'Počítame', icon: '🔢', color: '#5B8DEF', skill: 'Počet do 10', area: 'matematika', desc: 'Koľko je obrázkov? Ťukni na správne číslo.' },
  { id: 'farby', name: 'Farby a tvary', icon: '🔺', color: '#FFC93C', skill: 'Farby a geometrické tvary', area: 'matematika', desc: 'Nájdi tvar správnej farby.' },
  { id: 'hlasky', name: 'Prvá hláska', icon: '🔤', color: '#9B5DE5', skill: 'Fonematické uvedomovanie', area: 'jazyk', desc: 'Na akú hlásku sa začína slovo?' },
  { id: 'nepatri', name: 'Čo sem nepatrí?', icon: '🧐', color: '#3DBE8B', skill: 'Triedenie a logika', area: 'priroda', desc: 'Jeden obrázok je navyše — ktorý?' },
  { id: 'postupnost', name: 'Postupnosti', icon: '🔁', color: '#00BBD3', skill: 'Vzory a rytmus', area: 'matematika', desc: 'Čo príde v rade ako ďalšie?' },
  { id: 'tiene', name: 'Tieňové páry', icon: '👤', color: '#F4A261', skill: 'Zrakové vnímanie', area: 'jazyk', desc: 'Ku ktorému tieňu patrí obrázok?' },
];

ISK.ACHIEVEMENTS = [
  { id: 'first_plan', icon: '📝', name: 'Prvá príprava', desc: 'Vygenerovala si prvú prípravu' },
  { id: 'plans5', icon: '🏅', name: 'Pripravená na všetko', desc: '5 vygenerovaných príprav' },
  { id: 'first_game', icon: '🎮', name: 'Hravá trieda', desc: 'Deti odohrali prvú hru' },
  { id: 'games20', icon: '🏆', name: 'Herná šampiónka', desc: '20 odohraných hier' },
  { id: 'week_full', icon: '📅', name: 'Týždeň v suchu', desc: 'Naplánovaný celý týždeň (5 dní)' },
  { id: 'class10', icon: '👧', name: 'Plná trieda', desc: 'Pridaných 10 detí' },
  { id: 'streak3', icon: '🔥', name: 'Tri dni v rade', desc: 'Iskričku si otvorila 3 dni po sebe' },
  { id: 'streak7', icon: '💎', name: 'Týždenná iskra', desc: '7 dní po sebe' },
  { id: 'observer', icon: '🔍', name: 'Pozorná učiteľka', desc: '10 zapísaných pozorovaní' },
];

/* Kurátorská knižnica — dostupná hneď po registrácii */
ISK.INSPIRATIONS = [
  { id: 'ins1', type: 'kruh', theme: 'Jeseň', title: 'Ranný kruh: Čo nám priniesla jeseň', areas: ['jazyk', 'priroda'], duration: '15 min', age: '4-5',
    summary: 'Košík s jesennými plodmi, hmatové hádanky a rozprávanie o počasí.',
    steps: [
      { time: '3 min', title: 'Privítanie', text: 'Pozdravíme sa básničkou a každé dieťa povie, aké je dnes počasie za oknom.' },
      { time: '5 min', title: 'Čarovný košík', text: 'Deti so zaviazanými očami hmatom hádajú gaštan, šišku, jablko, list.' },
      { time: '4 min', title: 'Rozhovor', text: 'Čo robia zvieratká na jeseň? Kto sa ukladá na zimný spánok?' },
      { time: '3 min', title: 'Rozlúčka', text: 'Spoločne zatlieskame slová po slabikách: gaš-tan, ja-bl-ko, tek-vi-ca.' }],
    materials: ['košík', 'jesenné plody', 'šatka na oči'] },
  { id: 'ins2', type: 'pohyb', theme: 'Lesné zvieratá', title: 'Pohybová hra: Líška a zajace', areas: ['pohyb', 'spolocnost'], duration: '15 min', age: 'mix',
    summary: 'Naháňačka s pravidlami — rozvoj reakcie, rýchlosti a dodržiavania pravidiel.',
    steps: [
      { time: '3 min', title: 'Rozcvička', text: 'Skáčeme ako zajačiky, plížime sa ako líška, kráčame ako medveď.' },
      { time: '9 min', title: 'Hra', text: 'Zajace sú v nore (kruh z lana). Na signál „Líška ide!“ utekajú do nory, koho líška chytí, stáva sa líškou.' },
      { time: '3 min', title: 'Upokojenie', text: 'Zajačiky spia — ľahneme si, dýchame pomaly a počúvame tichú hudbu.' }],
    materials: ['lano alebo obruče', 'čelenka s ušami líšky'] },
  { id: 'ins3', type: 'vytvarna', theme: 'Zima', title: 'Výtvarná aktivita: Snehuliak z vatových tampónov', areas: ['umenie', 'praca'], duration: '30 min', age: '3-4',
    summary: 'Lepenie a dotváranie snehuliaka — jemná motorika a práca s lepidlom.',
    steps: [
      { time: '5 min', title: 'Motivácia', text: 'Hádanka o snehuliakovi, prezrieme si obrázok.' },
      { time: '20 min', title: 'Tvorenie', text: 'Lepíme tampóny do tvaru troch gúľ, dokreslíme oči, nos a gombíky.' },
      { time: '5 min', title: 'Výstava', text: 'Deti ukážu dielo a povedia, ako sa ich snehuliak volá.' }],
    materials: ['modrý papier', 'vatové tampóny', 'lepidlo', 'pastelky'] },
  { id: 'ins4', type: 'denna', theme: 'Doprava', title: 'Denná príprava: Semafor nás chráni', areas: ['spolocnost', 'matematika', 'pohyb'], duration: '45 min', age: '5-6',
    summary: 'Dopravná výchova: farby semafora, bezpečné prechádzanie, triedenie dopravných prostriedkov.',
    steps: [
      { time: '5 min', title: 'Motivácia', text: 'Na koberci stojí semafor z papiera, ktorý „sa pokazil“ — deti mu pomôžu poradiť farby.' },
      { time: '15 min', title: 'Hlavná časť', text: 'Triedime dopravné prostriedky: po zemi / vo vzduchu / na vode. Počítame kolesá.' },
      { time: '15 min', title: 'Pohybová hra', text: 'Semafor: červená — stoj, oranžová — drep, zelená — choď.' },
      { time: '10 min', title: 'Reflexia', text: 'Čo si zapamätám, keď idem s mamou cez cestu?' }],
    materials: ['papierový semafor', 'obrázky dopravných prostriedkov', 'tri obruče'] },
  { id: 'ins5', type: 'kruh', theme: 'Emócie', title: 'Ranný kruh: Teplomer nálad', areas: ['spolocnost', 'jazyk'], duration: '15 min', age: 'mix',
    summary: 'Deti si vyberú smajlíka podľa nálady a učia sa pomenovať emócie.',
    steps: [
      { time: '5 min', title: 'Teplomer', text: 'Každé dieťa pripne kolíček k smajlíkovi, ktorý vystihuje jeho náladu.' },
      { time: '7 min', title: 'Rozhovor', text: 'Čo ma poteší? Čo urobím, keď som nahnevaný? Ukážeme tvárou emócie.' },
      { time: '3 min', title: 'Objatie', text: 'Pošleme si stisk rúk dookola kruhu.' }],
    materials: ['smajlíky', 'kolíčky'] },
  { id: 'ins6', type: 'pohyb', theme: 'Vesmír', title: 'Pohybová hra: Let na Mesiac', areas: ['pohyb', 'matematika'], duration: '15 min', age: '4-5',
    summary: 'Odpočítavanie, pohyb v priestore a skoky z kameňa na kameň (z obruče do obruče).',
    steps: [
      { time: '3 min', title: 'Štart', text: 'Spoločne odpočítame 10 až 0 v drepe, pri „štart“ vyskočíme.' },
      { time: '9 min', title: 'Krátery', text: 'Skáčeme po obručiach (kráteroch), v každom splníme úlohu z kartičky.' },
      { time: '3 min', title: 'Pristátie', text: 'Pomalý let späť na Zem — plávame v stave beztiaže.' }],
    materials: ['obruče', 'kartičky s úlohami'] },
  { id: 'ins7', type: 'denna', theme: 'Ovocie a zelenina', title: 'Denná príprava: Ochutnávka vitamínov', areas: ['priroda', 'jazyk', 'pohyb'], duration: '45 min', age: '3-4',
    summary: 'Zmyslové spoznávanie ovocia a zeleniny, triedenie podľa farby.',
    steps: [
      { time: '10 min', title: 'Ochutnávka', text: 'Deti so zatvorenými očami ochutnajú kúsok jablka, mrkvy, banánu.' },
      { time: '15 min', title: 'Triedenie', text: 'Triedime plastové ovocie do košíkov podľa farby.' },
      { time: '10 min', title: 'Pieseň', text: 'Spievame „Jablko, hruška, slivka“ s pohybmi.' },
      { time: '10 min', title: 'Kresba', text: 'Nakreslím svoje obľúbené ovocie.' }],
    materials: ['ovocie a zelenina', 'košíky', 'papier, pastelky'] },
  { id: 'ins8', type: 'vytvarna', theme: 'Jar', title: 'Výtvarná aktivita: Odtlačky dlaní — tulipány', areas: ['umenie'], duration: '30 min', age: 'mix',
    summary: 'Farebné tulipány z odtlačkov dlaní, stonky maľované štetcom.',
    steps: [
      { time: '5 min', title: 'Motivácia', text: 'Prinesieme skutočný tulipán, opisujeme farbu, vôňu, tvar.' },
      { time: '20 min', title: 'Tvorba', text: 'Odtlačíme dlaň (kvet), štetcom dokreslíme stonku a list.' },
      { time: '5 min', title: 'Upratovanie', text: 'Umyjeme si ruky a spoločne upraceme stoly.' }],
    materials: ['temperové farby', 'výkres', 'štetce', 'mokré obrúsky'] },
];

ISK.SHOP_URL = '/#produkty';
