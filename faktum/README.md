# Faktum — fakturácia s AI pre SZČO a firmy

- `index.html` — landing page (cenník, e‑faktúra 2027, partnerský program)
- `app.html` + `core.js` + `app.js` — aplikácia (hash router, dáta v `localStorage`)
- `vendor/faktum-qr.js` — PAY by square + QR (zbundlované `bysquare` a `qrcode-generator`)
- `../netlify/functions/faktum-ai.js` — AI backend (Claude API)

## Spustenie
Nasadí sa spolu s webom na Netlify na adrese `/faktum/`. Pre AI nastavte v Netlify premennú `ANTHROPIC_API_KEY`.
Bez kľúča appka funguje v offline režime (lokálny parser faktúr, šablóny upomienok, pravidlové postrehy).

- Demo účet: `/faktum/app.html#/demo`
- Admin konzola: `/faktum/app.html#/admin` (demo PIN `2027`)
- Testovacia karta: `4242 4242 4242 4242`, zamietnutá: `4000 0000 0000 0002`; kupóny `PARTNER1`, `FAKTUM20`

## Pred ostrým spustením
Prihlásenie, platby a limity plánov bežia zatiaľ v prehliadači. Pre produkciu treba serverovú databázu a autentifikáciu,
skutočnú platobnú bránu (Stripe je už v projekte), odosielanie e‑mailov (Resend je v projekte), serverové vynútenie
AI kvót a skutočný admin login.
