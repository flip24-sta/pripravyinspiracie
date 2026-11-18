# eFakturko — fakturácia s AI pre SZČO a firmy

Živý web: https://efakturko.netlify.app (Netlify projekt `efakturko`, samostatný od e‑shopu).
Tento priečinok je koreň webu (`netlify.toml` tu).

## Štruktúra
- `_src/` — obsah stránok; `python3 _src/build.py` z nich vygeneruje `index.html`, `funkcie.html`, `e-faktura-2027.html`, `cennik.html`, `partneri.html`, `kontakt.html`, právne stránky, `404.html`, `sitemap.xml`, `robots.txt`. HTML v koreni needitujte ručne, upravte `_src/` a spustite build.
- `faktum.css` (dizajn systém), `site.css` + `site.js` (web), `app.html` + `core.js` + `app.js` (aplikácia), `vendor/faktum-qr.js` (PAY by square).
- `netlify/functions/faktum-ai.js` — AI backend (Claude API). Potrebuje premennú `ANTHROPIC_API_KEY` v Netlify; bez nej aplikácia beží v offline režime.
- Formuláre `kontakt` a `partner` idú cez Netlify Forms (správy v Netlify → Forms).

## Nasadenie
Ručné nasadenie z tohto priečinka (Netlify CLI alebo Netlify MCP). Projekt nie je napojený na Git, push ho neaktualizuje.

## Pred ostrým spustením
- Doplniť žlto označené údaje v obchodných podmienkach a zásadách ochrany osobných údajov a dať ich skontrolovať právnikovi.
- Účty, dáta a platby v aplikácii sú zatiaľ len v prehliadači (localStorage) a platba je simulovaná. Treba serverovú databázu, prihlasovanie, platobnú bránu (Stripe), odosielanie e‑mailov a skutočný admin login (demo PIN `2027`).
