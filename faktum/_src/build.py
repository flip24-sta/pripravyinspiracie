#!/usr/bin/env python3
"""Builds the eFakturko official site: wraps each page body in _src/ with the shared head, header and footer.

Run from anywhere:  python3 faktum/_src/build.py
Page bodies live in _src/<page>.html. A body may include blocks from the home page with
{{BLOCK:<id>}}, where <id> is the id of an element in _src/index.html marked <!--block:id--> ... <!--/block:id-->.
"""
import pathlib, re

SRC = pathlib.Path(__file__).resolve().parent
OUT = SRC.parent
SITE = 'https://efakturko.netlify.app'

PAGES = {
    'index':                   ('eFakturko', 'eFakturko je fakturácia s umelou inteligenciou pre živnostníkov a malé firmy na Slovensku. Faktúra za pár sekúnd, PAY by square QR, automatické upomienky a pripravenosť na e‑faktúru 2027.'),
    'funkcie':                 ('Funkcie · eFakturko', 'Faktúra z jednej vety, PAY by square, automatické upomienky, opakované faktúry, sken bločkov, daňový radar a e‑faktúra Peppol.'),
    'e-faktura-2027':          ('e‑Faktúra 2027 · eFakturko', 'Od 1. januára 2027 je e‑faktúra na Slovensku povinná pre platiteľov DPH. Čo sa mení, koho sa to týka a ako sa pripraviť.'),
    'cennik':                  ('Cenník · eFakturko', 'Plány Štart zadarmo, Pro a Business. Porovnanie funkcií a otázky k platbám.'),
    'partneri':                ('Pre účtovníkov a partnerov · eFakturko', 'Partnerský program eFakturko: doživotná provízia 30 až 40 % z platieb klientov, ktorých privediete.'),
    'kontakt':                 ('Kontakt · eFakturko', 'Napíšte nám otázku, požiadajte o ukážku alebo nahláste problém.'),
    'obchodne-podmienky':      ('Obchodné podmienky · eFakturko', 'Všeobecné obchodné podmienky služby eFakturko.'),
    'ochrana-osobnych-udajov': ('Ochrana osobných údajov · eFakturko', 'Zásady ochrany osobných údajov služby eFakturko.'),
    '404':                     ('Stránka nenájdená · eFakturko', 'Táto stránka neexistuje.'),
}
NAV = [('funkcie', 'Funkcie'), ('e-faktura-2027', 'e‑Faktúra 2027'), ('cennik', 'Cenník'), ('partneri', 'Pre účtovníkov'), ('kontakt', 'Kontakt')]
LOGO = '<span class="logo-mark"><svg viewBox="0 0 24 24"><text x="12" y="17.6" text-anchor="middle" font-size="18" font-weight="800" font-family="Plus Jakarta Sans,Arial,sans-serif" fill="currentColor">e</text></svg></span><span>eFakturko</span>'


def href(page):
    return './' if page == 'index' else f'{page}.html'


def layout(page, title, desc, body):
    nav = ''.join(f'<a href="{href(p)}"{" class=\"on\" aria-current=\"page\"" if p == page else ""}>{label}</a>' for p, label in NAV)
    mnav = ''.join(f'<a href="{href(p)}">{label}</a>' for p, label in NAV)
    canon = SITE + ('/' if page == 'index' else f'/{page}.html')
    robots = '<meta name="robots" content="noindex">\n' if page == '404' else ''
    return f'''<!DOCTYPE html>
<html lang="sk">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{desc}">
{robots}<link rel="canonical" href="{canon}">
<meta property="og:type" content="website">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{canon}">
<meta property="og:locale" content="sk_SK">
<meta name="theme-color" content="#7C3AED">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='10' fill='%237C3AED'/%3E%3Ctext x='16' y='23' text-anchor='middle' font-size='22' font-weight='800' font-family='Arial' fill='%23fff'%3Ee%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="faktum.css">
<link rel="stylesheet" href="site.css">
</head>
<body>
<header class="nav"><div class="wrap"><div class="nav-card">
  <a href="./" class="logo">{LOGO}</a>
  <nav class="nav-links" aria-label="Hlavná navigácia">{nav}</nav>
  <div class="nav-cta"><a href="app.html#/login" class="link-login top"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>Prihlásenie</a><a href="app.html#/onboarding" class="btn btn-primary">Registrácia</a>
  <button class="burger" id="burger" aria-label="Menu" aria-expanded="false" aria-controls="mnav"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button></div>
</div>
<nav class="mnav" id="mnav" hidden>{mnav}<a href="app.html#/login">Prihlásenie</a></nav>
</div></header>

<main>
{body}
</main>

<footer><div class="wrap">
  <div class="foot">
    <div><a href="./" class="logo" style="color:#fff"><span class="logo-mark" style="background:#fff;color:var(--violet)"><svg viewBox="0 0 24 24"><text x="12" y="17.6" text-anchor="middle" font-size="18" font-weight="800" font-family="Plus Jakarta Sans,Arial,sans-serif" fill="currentColor">e</text></svg></span><span>eFakturko</span></a><p style="margin-top:12px;max-width:300px">Fakturácia s AI pre živnostníkov a firmy na Slovensku.</p></div>
    <div><h4>Produkt</h4><nav><a href="funkcie.html">Funkcie</a><a href="cennik.html">Cenník</a><a href="e-faktura-2027.html">e‑Faktúra 2027</a><a href="app.html#/demo">Živé demo</a></nav></div>
    <div><h4>Spoločnosť</h4><nav><a href="partneri.html">Pre účtovníkov</a><a href="kontakt.html">Kontakt</a><a href="app.html#/onboarding">Registrácia</a></nav></div>
    <div><h4>Právne informácie</h4><nav><a href="obchodne-podmienky.html">Obchodné podmienky</a><a href="ochrana-osobnych-udajov.html">Ochrana osobných údajov</a></nav></div>
  </div>
  <div class="foot-b"><span>© <span id="yr"></span> eFakturko</span><span>Všetky ceny sú uvedené bez DPH</span></div>
</div></footer>
<script src="site.js" defer></script>
</body>
</html>
'''


def main():
    home = (SRC / 'index.html').read_text(encoding='utf-8')
    blocks = dict(re.findall(r'<!--block:([\w-]+)-->(.*?)<!--/block:\1-->', home, re.S))
    for page, (title, desc) in PAGES.items():
        body = (SRC / f'{page}.html').read_text(encoding='utf-8')
        body = re.sub(r'\{\{BLOCK:([\w-]+)\}\}', lambda m: blocks[m.group(1)], body)
        (OUT / f'{page}.html').write_text(layout(page, title, desc, body.strip()), encoding='utf-8')
        print('built', f'{page}.html')
    urls = ''.join(f'<url><loc>{SITE}{"/" if p == "index" else "/" + p + ".html"}</loc></url>' for p in PAGES if p != '404')
    (OUT / 'sitemap.xml').write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n', encoding='utf-8')
    (OUT / 'robots.txt').write_text(f'User-agent: *\nDisallow: /app.html\nSitemap: {SITE}/sitemap.xml\n', encoding='utf-8')


if __name__ == '__main__':
    main()
