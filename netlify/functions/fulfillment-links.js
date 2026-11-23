// Maps a cart item "key" (see index.html — product-<name> or balik-<tier>) to a
// Google Drive link for that material. The link is sent to the customer in the
// order confirmation e-mail right after a successful Stripe payment.
//
// Files live in Google Drive → "PRÍPRAVY INŠPIRÁCIE". For the link to work for
// the customer, the file (or its folder) must be shared as
// "Anyone with the link" → Viewer.
//
// How to add a link:
//   1. In Google Drive, right-click the file/folder -> Share -> "Anyone with the link" -> Viewer.
//   2. Copy the link and add it below, e.g. 'product-Názov produktu': 'https://drive.google.com/...'.
//      The name must match the product name in index.html exactly.
//
// Items not listed here still get a valid order confirmation e-mail — it tells the
// customer the material will follow by e-mail, and the owner gets a notice to send it.

const file = (id) => `https://drive.google.com/file/d/${id}/view?usp=sharing`;
const folder = (id) => `https://drive.google.com/drive/folders/${id}?usp=sharing`;

module.exports.fulfillmentLinks = {
  // Výhodné balíky (priečinky)
  'balik-small': folder('1oJ_-u35aYwF7GyfsWG7MxIsR9ZZAyrj6'),
  'balik-medium': folder('1qtQbPXMj366HaeDUSZBm0W69LbXHbJBh'),
  'balik-large': folder('1EqEU-3IuYJtVQ9acWQ92Pw_-d0izVQui'),
  'balik-premium': folder('1pEv2x8VkMMjKC_aqHxPhjLZUmVXQWNXb'),

  // Týždenné projekty
  'product-Doprava a bezpečnosť – Týždenný projekt': file('1Q5tm66JvSq7KySlB1iqxEOKIf9LdvIzx'),
  'product-Telo, zmysly a zdravie – Týždenný projekt': file('1wgy4OaJBuJNsOpZCaVwoItzD3vwq47kr'),
  'product-Les a jeho tajomstvá – Týždenný projekt': file('1lkfiHCp-GzY20VkS3y_VCCobnRnYgwzV'),
  'product-Jeseň na dvorčeku – Týždenný projekt': file('1AD2c55PVbHVxRCKyWSf4yRL7ynMArweV'),
  'product-Ja a moja rodina – Týždenný projekt': file('1SqVrDk2Hq778CgJIGV50QbaVQ2ycaS76'),
  'product-Pracovné profesie – Týždenný projekt': file('1nhAI1wUhMgmLe22gi1VL2f1UTavF_Ajp'),
  'product-Zdravá a nezdravá výživa – Týždenný projekt': file('1heiuc-efKGYzmPgWGamNI-eDdPb9D3Zs'),
  'product-Pravidlá a bezpečnosť v našej škôlke': file('1Y_HQDQjGrvv2RUBoZ4fME058mfcMOVLj'),
  'product-Vitaj v škôlke – Moje prvé dni': file('1oqWWr3CN6kapk0Gtd579XbTgAB5WU7y-'),

  // Rozprávky
  'product-Hurá škôlka volá – rozprávky': file('17orU84zimawgomVVGozW60cM8LjINie0'),
  'product-Čarovná jeseň – rozprávky': file('1XUnOxdVGvkp9WNowk7xs2j9TaUIWzg6g'),
  'product-Medvedík Labka': file('1Tab4TMqbMtXMFXk8eMw6GTOXy1ROrrol'),
  'product-Pán Snehuliak a zimné objavovanie': file('1Dp3wAQqjXXkGMKcTeB9YFwTkAnPyQURT'),
  'product-Vianočné rozprávky': file('1gSDrNbicpY4VnYQuMbstnSpuZ4iGONtt'),
  'product-Ustráchaný astronautík': file('1XWlCP_kcKJ0wtXkd_ZGvudrMK7G9FiXH'),
  'product-Malí knihomoli': file('1GC6eWWxQhxE1zZsjqgbT-o1gXZSPjgsq'),
  'product-Jarné rozprávky': file('173WKsqT2G_grJEBDlhXBWKiilrhZOLii'),
  'product-Veľkonočné príbehy Zajka Hrajka a Zajačice Hopky': file('1kpPGJHk1GT3pVUo1VXQVdYG2iTQwUppK'),
  'product-Hospodárske zvieratká': file('1YpA77wF0CYrZwrY0n0HX6vMSB7GkIrVk'),
  'product-Slovensko – rozprávky': file('1dLZVaApNIbqfNvRqb5yqMD4rxtYD1WgG'),
  'product-Veselé fašiangy': file('1mChOEQANZ63LocpeAWEl9mjZjiq6D0qS'),
  'product-Život pri vode – rozprávky': file('1Agd11RdYmVVUjq-Y8TxacWMJPR7yMWo1'),
  'product-Leto – rozprávky': file('1iNWMSKvvXA8YsFoBWdZV_SR5Eb9G5RYA'),
  'product-Exotické zvieratká – rozprávky': file('1NW_PyzCjpY9Lk3s4XZoln2--xcLcIX6i'),
  'product-Hmyz – rozprávky': file('17xFrWo9H6SKP6VGaQwWbY4hCocYbD-_m'),

  // Megasúbory (priečinok 30 MEGA SÚBOROV)
  'product-Hurááá škôlka volá': file('1Vi4O8G8b7sKRemzOnnu7pVqbGNNEkI4S'),
  'product-Jeseň – Megasúbor': file('1YfxdP11PJnf3vY4Sa7FVhbmc_FqD0BKC'),
  'product-Rodina': file('1rLlNhyGO90L7kkljEQ6_A8x6G6P1uron'),
  'product-Profesie': file('18f-xUVAKBUyDFiOwN6PiSbuSaWJGVJG-'),
  'product-Deň úcty k starším': file('1SQhaV1zRnGXjo9GIcL4CAV6MoL8tVBSe'),
  'product-Zima': file('10oL3-NGZ7eHc80MrfbbO1xnyPTf1pTF1'),
  'product-Jar': file('1isqwX4HLsQKtglPQYtw5jzDiNHdCJABn'),
  'product-Vesmír': file('1H2rhPOOW9wzI8DDY0ZsbJU5xBix3gtvb'),
  'product-Liečivé rastliny': file('1rbXTQonXzhmXskMGXfR-jD9ghon5WDVM'),
  'product-Rozprávky': file('1kbYjBP2jHuoFI7xTR2AheAcgHksSSXcs'),
  'product-Časové vzťahy': file('1Jwg9JQHtqXqStb1qJQeNZ5KXdCyhIPr7'),
  'product-Ľudské telo': file('1L0YPjYWdbpnMkrEaPrb_m9fGuxqphJKC'),
  'product-Svätý Mikuláš': file('1PJ990YHAEKtQInLaj4KD-rnILmmiscsx'),
  'product-Doprava': file('1FHbuhRwbS7DIJpSsdabaz0UewAZRA3iZ'),
  'product-Deň vody': file('181VmrJQaVvEbo3CV-9E7bBr3tg46IEED'),
  'product-Mama': file('1Z5R4tFxVVS16NYotMGL3UDD2bNwb_4KB'),
  'product-Veľká noc': file('1Q3pTsLy0yVuBxpUgTrgIgiU9t0LgfMQL'),
  'product-Pán Perníček': file('1jMFe2F42ougDxTqJ3pCSYiyh3kep68kR'),
  'product-Deň detí – Deti sveta': file('1XCpNfsMdAFIuH5ZvtmOzF7UdG-rwNmkZ'),
  'product-Deň Zeme': file('1FITn8uv_lJGwaNTLvxt5zXxKtw4_Vm2K'),
  'product-Mesto a dedina': file('11v1M_d5XvIQ92z45WemZSxxC_PsTBfo8'),
  'product-Leto a letné športy': file('1KxqbTYfxJiLC4w1bi4UGFMgR9A5lnbRq'),
  'product-Slovensko – Ľudové zvyky a tradície': file('1hRE1O2qgbbpzAITzTLj4z3-D0GMn2Pqz'),
  'product-20 vianočných príbehov pre deti': file('11NJizMAV6PqVav24rqeAJAeFpz7KOYSb'),

  // Pohybové hry
  'product-30 zimných pohybových hier': file('1xCloeKhIxNR2Y2i9S2V-N36p6UmrNDrc'),
  'product-Pohybové hry – 70 aktivít': file('1fVMU9d0ANGoHv5kc4BD7tpkIqaJRLL02'),
  'product-Jarné pohybové hry – 50 hier': file('1HQAPViyyDtXpR5Ms5mFDB7hwjkUfHcOl'),
  'product-Letné pohybové hry – 52 KS': file('1sA-xKwuc1PO2gLpMP91XTkemrTPw-7i0'),

  // Ranné kruhy
  'product-Novembrové ranné kruhy': file('1CSumfstoXGnPB6VfgMgie9w5SH4iGH2G'),
  'product-Októbrové ranné kruhy': file('1_ddtR1zhSWVp1Fq17XNgr3Wy7Qu2nm6n'),
  'product-Ranné kruhy – September': file('1yyZyLJ1qCViR-S95aUyzLIaLGkd0C7tG'),

  // Diplomy, vystrihovačky
  'product-Diplom – Koniec školského roka': file('1GZQ7XeZbVg29_uceGNtiBA-rXiRBywNv'),
  'product-Čarovné zimné okná – 10 zimných a vianočných motívov na okná': file('19tHlk4KyLM5ln4icKMELc_LkxDTwP1YK'),

  // Zatiaľ bez súboru na Disku (doplniť):
  // 'product-24 adventných rozprávok': '',
  // 'product-Vianočné diplomy': '',
  // 'product-Vianočné besiedky': '',
  // 'product-Zimný balík – Písomné prípravy': '',
  // 'product-Jesenný balík – Písomné prípravy': '',
  // 'product-Jarný balík – Písomné prípravy': '',
  // 'product-Marec – Apríl – Písomné prípravy': '',
  // 'product-Máj – Jún balík – Písomné prípravy': '',
  // 'product-Október – December – Písomné prípravy': '',
  // 'product-Časové vzťahy – Týždenný projekt': '',
  // 'product-Veselá škôlka': '',
  // 'product-Les a hmyz – Týždenný projekt': '',
  // 'product-More a voda – Týždenný projekt': '',
  // 'product-Ovocie a leto – Týždenný projekt': '',
  // 'product-Svätý Martin': '',
  // 'product-Deň jablka': '',
  // 'product-Deň mlieka': '',
  // 'product-Hry s padákom': '',
  // 'product-Jarné ranné kruhy': '',
  // 'product-Rozvoj slovnej zásoby': '',
};
