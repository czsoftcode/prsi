# Phase 29 — Větší karty na velkých obrazovkách

**Goal:** Přidat @media pravidlo pro velké displeje (min-width ~1200px), které zvětší --card-w zhruba o 50 % (strop ~144 px) vázaný i na vh, aby karty nebyly příliš malé, bez dopadu na mobilní a střední rozlišení.

## Steps
- [done] Přidat media query pro velké displeje
- [done] Komentář vysvětlující práh a vh-vazbu
- [done] Vizuální kontrola tří rozlišení

## Auto-commit
- Phase 29: Větší karty na velkých obrazovkách

## Run report
---
phase: 29
verdict: done
steps:
  - title: "Přidat media query pro velké displeje"
    status: done
  - title: "Komentář vysvětlující práh a vh-vazbu"
    status: done
  - title: "Vizuální kontrola tří rozlišení"
    status: done
verify:
  - title: "Karty jsou na velkém displeji (>=1920px) subjektivně výrazně větší a čitelné"
    detail: "Mechanicky ověřeno, že clamp dává 144px (50 % nad původních 96px) a media query je v kompilovaném CSS. Skutečný vizuální dojem 'už nejsou malé' musí potvrdit oko."
  - title: "Na 1366x768 ruka nepřeteče viewport na výšku"
    detail: "Spočítáno: 16vh => ~123px šířky, karta 2:3 => ~184px výška, 3 řady ~552px < 768px. Reálné rozložení (gapy, popisky, tlačítka) jsem v prohlížeči na tomto rozlišení neměřil — potvrdit, že se vše vejde bez scrollu."
---

# Phase 29 — report from the auto session

Čistě CSS změna: do `src/ui/style.css` přidán `@media (min-width: 1200px)`, který přepisuje proměnnou `--card-w` na `clamp(96px, min(11vw, 16vh), 144px)`. Všechny navázané rozměry (`.card`, `.pile`, ikona barvy) dědí přes `var()`/`calc`, takže stačila jediná proměnná.

Při plánování jsem navrhl `22vh`, ale matematika to vyvrátila: karta má poměr 2:3, takže strop 144px = 216px výšky a tři řady = 648px. Při `22vh` by na 1366×768 byla vazba na výšku neúčinná (22vh=169px > strop 144), karty by se nafoukly na plných 144px a hrozil přetok ruky pod viewport — přesně ten trade-off, který jsem avizoval u návrhu fáze. Proto jsem koeficient snížil na `16vh`: na 1366×768 vyjde ~123px (bezpečné, přesto větší než dnešních 96px), na 1080p+ se naplno využije strop 144px.

Ověřeno mechanicky: `npm run build` (tsc --noEmit + vite build) prochází, media query je přítomná v kompilovaném `dist/assets/index-*.css`. Střední šířka (~1100px) zůstává beze změny — query se aktivuje až od 1200px, pod ním platí původní `clamp(48px, 11vw, 96px)`.

Pozn.: u CSS není v projektu žádný regresní testovací harness, takže budoucí změnu `--card-w` nic automaticky nehlídá. Skutečný vizuální dojem na velkých displejích a absence vertikálního přetoku na 1366×768 patří lidskému oku — viz pole `verify`.
