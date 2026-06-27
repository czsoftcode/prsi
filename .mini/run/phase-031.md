---
phase: 31
verdict: done
steps:
  - title: "Zmapovat zdroje pro CSP z buildu"
    status: done
  - title: "Spočítat SHA-256 hash inline bootstrap skriptu"
    status: done
  - title: "Přidat <meta> CSP do index.html"
    status: done
  - title: "Ověřit produkční build bez CSP porušení"
    status: done
  - title: "Regresní kontrola: testy a build"
    status: done
verify:
  - title: "Živé načtení nasazené hry v prohlížeči — konzole bez CSP porušení"
    detail: "Připojený Chrome (Browser 1) nevidí localhost tohoto shellu, takže jsem hru přes vite preview v reálném prohlížeči nenačetl (curl ze shellu vrací 200 + CSP, ale extension je na jiném hostu). Ověření CSP jsem proto udělal staticky (viz níže). Po deployi otevři produkci, dej F12 → Console a potvrď: žádné 'Refused to … violates the … Content Security Policy', načte se skript Plausible a odešle se event (Network: požadavek na plausible.softcode.cz/api/event), zobrazí se karty, pozadí, přehraje se zvuk a hra je hratelná."
---

# Phase 31 — report z auto session

## Co se udělalo
Do `index.html` přidán `<meta http-equiv="Content-Security-Policy">` (+ vysvětlující komentář, proč meta a ne hlavička — GitHub Pages hlavičky neumí). Politika:

```
default-src 'self';
script-src 'self' https://plausible.softcode.cz 'sha256-s3GjtVo80AO5y21xNb09L193qY2mDVWzcLbCiBHrn4s=';
connect-src 'self' https://plausible.softcode.cz;
img-src 'self'; media-src 'self'; style-src 'self';
object-src 'none'; base-uri 'self'
```

Inline bootstrap Plausible (`plausible.init()`) je povolen přes SHA-256 hash spočítaný z přesných bajtů obsahu `<script>` (node + crypto). SRI na loader Plausible se záměrně nepřidává — skript se na serveru mění a pevný hash by hru rozbil při aktualizaci.

## Jak ověřeno (mechanicky)
- **Mapa zdrojů z buildu:** `dist/index.html` linkuje JS i CSS jako externí `'self'` soubory (žádný inline `<style>`/`<script>` kromě bootstrapu). CSS nemá žádné `url()` ani `data:` URI. Produkční kód nepoužívá `innerHTML`/`document.write`/`fetch`/`XHR` (jen v testech).
- **Hash sedí na obsah:** počítán ze stejných bajtů, které jsou v HTML.
- **`style-src 'self'` hru nerozbije:** veškeré stylování běží přes `element.style.*` (CSSOM) a `.animate()` (WAAPI), což CSP **neomezuje**. Nikde není `setAttribute('style', …)` ani `.cssText` (to by markup-style-atribut blokoval). Žádné `eval`/`new Function` (takže netřeba `unsafe-eval`).
- **CSP je v buildu:** `npm run build` ji přenese do `dist/index.html`.
- **Regrese:** `npm test` → 388 testů prošlo; `npm run build` bez chyby.

## Co se nepovedlo ověřit
Živé načtení v reálném prohlížeči — připojený Chrome je na jiném hostu a nedosáhne na `localhost:4317` tohoto shellu (curl ze shellu přitom vrací 200 + CSP). Statická analýza výše silně predikuje nula CSP porušení, ale potvrzení v konzoli/Network nechávám na člověka po deployi (viz `verify`).

## Pozn. / trade-off
- **Meta-CSP** je slabší než hlavička: nepodporuje `frame-ancestors` ani reporting a aplikuje se o chlup později. Je to daň za hosting na GitHub Pages.
- **Hash je křehký na úpravy:** kdokoli sáhne na inline `plausible.init()` snippet (i jen whitespace), musí přepočítat `sha256-…`, jinak se analytics tiše přestane načítat. Komentář u CSP na to upozorňuje.
