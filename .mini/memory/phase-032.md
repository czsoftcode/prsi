# Phase 32 — Uvolnit style-src na unsafe-inline

**Goal:** V <meta> CSP v index.html přidat do style-src klíčové slovo 'unsafe-inline' (a upravit komentář: dynamické inline styly animací karet + Vite dev klient; nonce/hash nejsou na GitHub Pages proveditelné). Cíl: odstranit porušení 'Applying inline style violates style-src self'. script-src zůstává přísný (vlastní smysl SEC-2). Ověřit v dev i produkčním buildu, že konzole je bez CSP chyb a animace fungují. (Oprava regrese z fáze 31 / SEC-2.)

## Steps
- [done] Přidat 'unsafe-inline' do style-src
- [done] Ověřit CSP hodnotu v produkčním buildu
- [skipped] Ověřit v prohlížeči bez CSP chyb (dev + prod)
- [done] Regrese: testy a build

## Auto-commit
- Phase 32: Uvolnit style-src na unsafe-inline

## Run report
---
phase: 32
verdict: done
steps:
  - title: "Přidat 'unsafe-inline' do style-src"
    status: done
  - title: "Ověřit CSP hodnotu v produkčním buildu"
    status: done
  - title: "Ověřit v prohlížeči bez CSP chyb (dev + prod)"
    status: skipped
  - title: "Regrese: testy a build"
    status: done
verify:
  - title: "Konzole bez CSP chyb v dev i produkci, animace karet fungují"
    detail: "Nemohl jsem ověřit sám — připojený Chrome nedosáhne na localhost tohoto shellu. Spusť `npm run dev` a otevři hru: v konzoli už nesmí být 'Applying inline style violates ... style-src'. Pak po deployi totéž na produkci (F12 → Console). Vizuálně potvrď, že animace zahrání i líznutí karty proběhnou."
---

# Phase 32 — report z auto session

## Co se udělalo
V `<meta>` CSP v `index.html` rozšířeno `style-src 'self'` → `style-src 'self' 'unsafe-inline'`. Komentář u CSP doplněn o důvod (dynamické inline styly animací přes `element.style.*` + Vite dev klient; nonce neproveditelný na GitHub Pages, hash kvůli měnícím se `transform` hodnotám taky ne). `script-src` a ostatní direktivy beze změny.

## Jak ověřeno (mechanicky)
- **CSP v produkčním buildu:** `npm run build` → `dist/index.html` má `style-src 'self' 'unsafe-inline'`, `script-src` zůstal přísný (`'self'` + plausible host + SHA-256 hash), žádná jiná direktiva se nezměnila.
- **Regrese:** `npm test` → 388 testů prošlo; build bez chyby.

## Co zůstává na člověka (krok 3 = todo)
Živé ověření v prohlížeči jsem znovu nemohl provést — připojený Chrome je na jiném hostu a nevidí `localhost` shellu. Krok 3 nechávám `todo` a zároveň jako `verify` položku: po `npm run dev` (a po deployi na produkci) zkontrolovat, že v konzoli zmizela hláška „Applying inline style violates … style-src" a že animace karet fungují.

## Pozn. k mé předchozí chybě
Ve fázi 31 jsem tvrdil, že `style-src 'self'` hru nerozbije, protože stylování jde přes CSSOM (`element.style.*`). To bylo prakticky nesprávné — prohlížeč inline styly blokoval (uživatel doložil chybou z `npm run dev`, `client:1102` = Vite dev klient). `'unsafe-inline'` pro styly je vědomý ústupek; bezpečnostní jádro SEC-2 (přísný `script-src` proti spuštění cizího JS) zůstává zachované.
