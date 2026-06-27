# Phase 27 — Registr motivů: validace kompletní sady

**Goal:** themesRegistry().scan() přijme motiv jen když NN je dvojciferné a složka cards_NN obsahuje všech 32 líců, rub.png i 4 suit-* ikony (vedle páru dashboardů); neúplná nebo chybně pojmenovaná sada se do THEMES nedostane a je to pokryto testem unhappy path.

## Steps
- [done] Sdílený pure modul názvů assetů motivu
- [done] Refaktor assets.ts na sdílený modul
- [done] Zpřísnit scan() v vite.config.ts
- [done] Test unhappy path nad reálným predikátem
- [done] Zelená regrese

## Auto-commit
- Phase 27: Registr motivů: validace kompletní sady

## Run report
---
phase: 27
verdict: done
steps:
  - title: "Sdílený pure modul názvů assetů motivu"
    status: done
  - title: "Refaktor assets.ts na sdílený modul"
    status: done
  - title: "Zpřísnit scan() v vite.config.ts"
    status: done
  - title: "Test unhappy path nad reálným predikátem"
    status: done
  - title: "Zelená regrese"
    status: done
---

# Phase 27 — report z auto session

## Co se udělalo
Vytvořen listový modul `src/ui/theme-assets.ts` jako jediná pravda o názvech assetů
motivu: `rankSlug`, `cardFileName`, `suitIconFileName`, `RUB_FILE`,
`REQUIRED_THEME_FILES` (37 souborů = 32 líců + rub + 4 ikony), `isValidThemeId`
(`/^\d{2}$/`), `dashboardFileNames`, `hasAllRequiredCardFiles`. Importuje jen čisté
`SUITS`/`RANKS` z enginu — žádné `import.meta`/`theme.ts`, takže ho `vite.config.ts`
bezpečně importuje v Node při startu.

`assets.ts` zbaven vlastní kopie `rankSlug` i literálu `dashboard_` — vše jede přes
sdílený modul. `scan()` ve `vite.config.ts` nově vyřadí motiv, pokud NN není
dvojciferné nebo složce `cards_NN` chybí kterýkoli z 37 povinných souborů (vedle
páru dashboardů). Reálné motivy 01–05 (každý přesně 37 souborů + oba dashboardy)
zůstávají v `THEMES`.

## Self-review (nezávislý sub-agent) — zapracováno
Sub-agent odhalil tři reálné slabiny a všechny jsem opravil ještě před reportem:
- **Tautologický test** (REQUIRED vs REQUIRED) smazán.
- **Vlastní logika `scan()` bez zubů** — subset-check vytažen do reálné funkce
  `hasAllRequiredCardFiles`, kterou volá `scan()` i test (ne reimplementace inline).
  Mutace `.every`→`.some` ověřeně shodí unhappy-path test.
- **Druhá pravda u názvu dashboardu** — literál `dashboard_NN.{webp,jpg}` sjednocen
  do `dashboardFileNames`; runtime `tableBgImageSet` i validace teď čerpají odtud,
  pokryto kontrakt testem.

## Verifikace
Mechanicky ověřeno: `npm test` 388/388 zelené (vč. 200 E2E simulací), `npm run build`
(tsc --noEmit + vite build) zelený, mutační test potvrdil zuby contract i predikát
testů. Projekt nemá `lint` skript — typecheck běží uvnitř buildu. Pro člověka nezbylo
nic vizuálního k ověření (změna je čistě build-time validace + interní refaktor cest,
beze změny chování pro existující kompletní motivy).
