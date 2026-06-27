# Phase 21 — Popisky a tlačítka pod hromádky

**Goal:** Přesunout blok indikátorů (Na tahu, Barva:, sedmy) a tlačítek (motiv, hudba) ze shora pod lízací balíček a odhazovací hromádku a upravit CSS layout středové zóny tak, aby to fungovalo na desktopu i mobilu.

## Steps
- [done] render.ts: prohodit pořadí ve středové zóně
- [done] CSS: odstup pod balíčky kvůli přesahu počtu
- [done] CSS: ověření a doladění mobilního layoutu
- [done] Test: pořadí DOM ve středové zóně
- [done] Zelený build + ruční ověření

## Auto-commit
- Phase 21: Popisky a tlačítka pod hromádky

## Run report
---
phase: 21
verdict: done
steps:
  - title: "render.ts: prohodit pořadí ve středové zóně"
    status: done
  - title: "CSS: odstup pod balíčky kvůli přesahu počtu"
    status: done
  - title: "CSS: ověření a doladění mobilního layoutu"
    status: done
  - title: "Test: pořadí DOM ve středové zóně"
    status: done
  - title: "Zelený build + ruční ověření"
    status: done
verify:
  - title: "Vizuální umístění bloku pod hromádkami na desktopu i mobilu"
    detail: "Mechanicky ověřeno pořadí DOM a zelený build/testy. Lidským okem zkontroluj, že řádek (Na tahu, Barva:, sedmy, Motiv, Hudba) je čitelně pod balíčky, počet karet v lízacím balíčku se nepřekrývá s tlačítky, a na úzkém/nízkém displeji (např. iPhone SE) zůstane ruka hráče dole dosažitelná."
---

# Phase 21 — report z auto session

## Co se udělalo
- `render.ts` (`renderCenterZone`): prohozeno `zone.append(indicators, piles)` → `zone.append(piles, indicators)`. Blok indikátorů a tlačítek se teď vykresluje pod hromádkami. `.zone--center` je `flex-direction: column`, takže reorder DOM = reorder vizuální.
- `style.css`: `.indicators` dostal `margin-top: clamp(18px, 3vh, 28px)`. Důvod — `.pile__count` (počet karet v lízacím balíčku) je pozicovaný `bottom: -1.4em` a přečuhuje ~1.2em pod balíček; bez odstupu by naboural do přesunutého řádku indikátorů.
- `render.test.ts`: nový test ověřuje, že `.piles` v `.zone--center` v DOM předchází `.indicators` (přes `compareDocumentPosition`). Má zuby — při návratu pořadí test spadne.

## Mobil
Žádný zásah do `@media` nebyl potřeba. `.prsi-table` je grid `auto 1fr auto` — ruka hráče je v samostatné spodní `auto` řadě, takže extra výšku z přesunutého bloku absorbuje flexibilní středová `1fr` zóna a ruka zůstává ukotvená dole. Odstup je `clamp`, takže se na nízkých displejích sám zmenší.

## Ověření
- `npm run build` (tsc --noEmit + vite build): zelený.
- `npx vitest run`: 349/349 prošlo.
- Vizuál na reálném displeji jsem neověřoval — viz `verify`.

## Dodatečné úpravy (na žádost uživatele po prvním průchodu)
- „Na tahu" přesunuto vlevo od lízacího balíčku, „Barva:" vpravo od odhazovací hromádky (oba teď uvnitř `.piles`); ovládací tlačítka a sedmy zůstaly v řádku `.indicators` pod hromádkami. `.piles` má `flex-wrap` kvůli zalomení na úzkém mobilu.
- Indikátor tahu zkrácen na ikonu (🧑/🤖), indikátor barvy je jen symbol v kroužku bez popisku, tlačítka motivu (🎨) a hudby (🔊/🔇) jsou jen ikony. Plné popisky v `title`/`aria-label`. Důvod: uvolnit místo v řádku, do kterého v příští fázi přibude přepínač nápovědy.
- Testy doplněny/upraveny (pořadí a strany indikátorů, ikonové popisky tlačítek). Build + 350 testů zelené.

## Otevřené otázky
Žádné. Bez rozhodnutí hodného ADR — šlo o přímočaré UI změny.
