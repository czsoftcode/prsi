---
phase: 14
verdict: done
steps:
  - title: "Helper pro náhledové cesty motivu (assets.ts)"
    status: done
  - title: "Export seznamu motivů (theme.ts)"
    status: done
  - title: "Overlay výběru motivu (overlay.ts)"
    status: done
  - title: "Tlačítko Motiv ve stolu (render.ts)"
    status: done
  - title: "Napojení výběru v main.ts"
    status: done
  - title: "CSS overlaye motivů (style.css)"
    status: done
  - title: "Ověřit zelený build + testy"
    status: done
verify:
  - title: "Vizuální přepnutí motivu ve hře"
    detail: "Mechanicky ověřeno, že re-render přepočítá cesty (testy + logika assets.ts). Lidským okem zkontrolovat, že po kliku na motiv v overlayi reálně probliknou nové karty/rub/pozadí a overlay se zavře — to JS test neověří (jen DOM, ne načtené obrázky)."
  - title: "Vzhled overlaye výběru motivu na mobilu i desktopu"
    detail: "CSS (grid náhledů, mini karty clamp, zvýraznění aktivního) ověřeno jen staticky. Zkontrolovat zalomení mřížky a velikost náhledů na úzkém displeji a že tlačítko Motiv vedle indikátorů nezalamuje stůl ošklivě."
---

# Phase 14 — report z auto session

Hotovo, všech 7 kroků. 320 testů zelených (`vitest run`), `tsc --noEmit` + `vite build` bez chyb.

## Co se udělalo
- **assets.ts**: `themePreviewSrcs(themeId)` vrací náhled konkrétního motivu (1 karta z každé barvy při pevném ranku „kral" + rub), nezávisle na aktivním motivu. Refaktor `cardsDir()` → deleguje na nové `cardsDirOf(themeId)` (DRY, žádná změna chování stávajících cest).
- **theme.ts**: `listThemes()` enkapsuluje registr `virtual:themes` — overlay už neimportuje virtuální modul přímo.
- **overlay.ts**: `chooseTheme(): Promise<string|null>` stejným vzorem jako `chooseSuit` (do document.body, resolvuje vždy, klik mimo box = null). Aktivní motiv zvýrazněn.
- **render.ts**: tlačítko `Motiv` (`data-action="theme"`) v bloku indikátorů, přežije re-render.
- **main.ts**: delegovaný listener → `onChooseTheme()`; locked se drží během overlaye, ve `finally` se vždy uvolní. Po výběru `setActiveTheme()+draw()` = re-render bez reloadu.
- **style.css**: styl overlaye motivů + tlačítka Motiv.

## Adversariální self-review (nezávislý sub-agent, čerstvý kontext)
Fáze sahá na vstupní bod (main.ts) i kontrakt assets↔theme↔overlay, proto proběhl nezávislý review. **Žádný self-catchable nález.** Ověřeno: zámek se nemůže zaseknout ani předčasně odemknout během AI prodlevy/po konci hry (tlačítko je v těch stavech nedosažitelné — `locked`/end-overlay); re-render reálně přepočítá cesty (assets čte `getActiveTheme()` za běhu, nikde se necachuje); testy mají zuby; `vi.resetModules` v main.test.ts korektně re-bootstrapuje proti čerstvému #app.

## Známá omezení (ne regrese této fáze)
- Náhled bere pevný rank a předpokládá kompletní sadu karet v `cards_NN`; registr validuje jen existenci složky + dashboardů, ne každý jednotlivý soubor → teoretický 404 u neúplné sady (dokumentováno už ve vite.config.ts).
- Overlay nemá klávesovou obsluhu (Esc/focus trap) — konzistentní s `chooseSuit`, mimo rozsah.
