# ✨ Iskrička — prípravy za 30 sekúnd, hry z ktorých deti iskria

Webová aplikácia (PWA) pre učiteľky materských škôl od **Prípravy Inšpirácie**. Beží na `/app/`
ako súčasť tohto Netlify webu, bez build kroku.

## Značka
- **Názov:** Iskrička · **Tagline:** „Prípravy za 30 sekúnd. Hry, z ktorých deti iskria.“
- **Farby:** Slniečko `#FFC93C`, Jahoda `#FF6B6B`, Mäta `#4ECDC4`, Obloha `#5B8DEF`, Slivka `#9B5DE5`, Krém `#FFF9EE`, Atrament `#2B2D42`
- **Písmo:** Baloo 2 (nadpisy) + Nunito (text) · **Logo:** usmiata hviezdička (`app/icon.svg`)

## Funkcie
| Funkcia | Kde | Free | Premium |
|---|---|---|---|
| AI prípravy podľa ŠVP (denná, ranný kruh, pohyb, výtvarná, týždenný projekt) | `#/pripravy` | 10/mesiac | ∞ + projekty |
| 7 interaktívnych hier pre deti (pexeso, počítanie, farby a tvary, prvá hláska, čo sem nepatrí, postupnosti, tiene) s hlasom a zvukmi | `#/hry` | 3 hry | 7 hier + AI sady na akúkoľvek tému |
| Týždenný plán (drag & drop, tlač, AI naplnenie, list rodičom) | `#/tyzden` | ručne | AI |
| Trieda: deti, pozorovania podľa oblastí ŠVP, pokrok z hier, zhrnutie pre rodiča | `#/trieda` | ✔ | + AI zhrnutia |
| Knižnica: uložené prípravy + kurátorské inšpirácie, obľúbené, hľadanie | `#/kniznica` | 15 položiek | ∞ |
| AI asistentka (chat) | `#/asistent` | v rámci limitu | ∞ |
| Upozornenia, séria dní, odznaky | zvonček, `#/profil` | ✔ | ✔ |
| Admin konzola | `#/admin` | — | — |

Bez nastaveného AI kľúča aplikácia funguje v **offline režime** (šablónové generátory), takže žiadny krok nie je rozbitý.

## Nasadenie (Netlify → Site settings → Environment variables)
| Premenná | Účel |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API pre AI funkcie (`netlify/functions/ai.js`) |
| `AI_MODEL` | voliteľné, predvolene `claude-haiku-5-5` (rýchly, zmestí sa do 10 s limitu funkcie). Pri predĺženom timeoute funkcií môžete použiť `claude-sonnet-5-5`. |
| `ADMIN_TOKEN` | heslo do admin konzoly (min. 8 znakov) |
| `STRIPE_SECRET_KEY` / `TEST_KEY` | už existujú pre e-shop, používajú sa aj pre predplatné |
| `STRIPE_PRICE_MONTH`, `STRIPE_PRICE_YEAR` | voliteľné ID cien zo Stripe; inak sa ceny (6,90 €/mes., 59 €/rok) vytvoria automaticky |
| `STRIPE_WEBHOOK_SECRET` | existujúci webhook — v Stripe k nemu pridajte udalosti `customer.subscription.updated` a `customer.subscription.deleted` (obnovenia a zrušenia predplatného) |

Dáta používateliek a analytika sa ukladajú do **Netlify Blobs** (store `iskricka`), netreba žiadnu databázu.
Mená detí a pozorovania zostávajú iba v zariadení učiteľky (localStorage) a na server sa posielajú len
jednorazovo pri generovaní AI zhrnutia.

## Architektúra
```
app/index.html          shell + PWA manifest, service worker (offline, klik na notifikáciu)
app/js/data.js          témy, oblasti ŠVP, hry, odznaky, knižnica inšpirácií
app/js/store.js         stav, localStorage, API klient, analytika, séria, notifikácie
app/js/ai.js            AI pipeline (server → fallback na lokálne šablóny)
app/js/games.js         herný engine (WebAudio zvuky, slovenský hlas, konfety)
app/js/app.js           router, onboarding, obrazovky, paywall, plánovač pripomienok
app/js/admin.js         admin konzola (KPI, MRR, lievik, používateľky, tarify, CSV)
netlify/functions/ai.js                         Claude API + limity podľa tarifu
netlify/functions/track.js                      registrácia, udalosti, 7-dňová skúšobná verzia
netlify/functions/admin.js                      admin API (ADMIN_TOKEN)
netlify/functions/create-subscription-session.js Stripe Checkout (predplatné)
netlify/functions/verify-subscription.js        aktivácia Premium po platbe
netlify/functions/stripe-webhook.js             + obnovy/zrušenia predplatného Iskričky
```

## Lokálne spustenie
`netlify dev` (s funkciami) alebo len statický server `python3 -m http.server` a otvoriť `/app/` (offline režim, admin v lokálnom režime).
