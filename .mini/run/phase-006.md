---
phase: 6
verdict: done
steps:
  - title: "cardSrc helper + unit testy"
    status: done
  - title: "Kostra render(state, root) + struktura stolu"
    status: done
  - title: "Vykresleni rukou a hromadek"
    status: done
  - title: "Indikatory barvy a sedem"
    status: done
  - title: "CSS layout + zapojeni do main.ts"
    status: done
  - title: "jsdom smoke test renderu"
    status: done
verify:
  - title: "Vizuální rozvržení stolu v prohlížeči (npm run dev)"
    detail: "Mechanicky ověřeno: build prochází, 74 testů zelených, všech 33 PNG existuje. Lidským okem ověřit jen vzhled — rozmístění 3 zón, čitelnost karet, že indikátor barvy (miniatura esa) nesplývá s odhazovací hromádkou, a responzivitu na úzkém/dotykovém displeji."
---

# Phase 6 — report z auto session

Vykreslovací vrstva hotová podle plánu, čistě read-only (žádná interakce — to je fáze 7).

## Co vzniklo
- `src/ui/assets.ts` — `cardSrc(card)` + `RUB_SRC`. Mapování názvů s nulováním
  jednociferných ranků (7→07), pojmenované ranky 1:1. Pure, testovatelné bez DOM.
- `src/ui/render.ts` — `render(state, root)`. Full re-render z kořene přes
  `replaceChildren()` (idempotentní), tři zóny: AI nahoře (ruby dle `aiHand.length`),
  střed (indikátory + lízací balíček s počtem / placeholder když prázdný + vrchní karta
  odhazovací hromádky), hráč dole (ruka lícem dle `playerHand`). Indikátor barvy = miniatura
  esa dané barvy s popiskem „Barva:", indikátor sedem skrytý při 0, indikátor tahu.
- `src/ui/style.css` — grid 3 zón, responzivní šířka karet přes `clamp()`, felt pozadí.
- `src/ui/main.ts` — placeholder nahrazen voláním `render(deal(createDeck()), app)`.
- Testy: `assets.test.ts` (4) + `render.test.ts` (6, jsdom přes per-file
  `// @vitest-environment jsdom`, aby engine testy zůstaly v node).

## Ověřeno mechanicky
- `tsc --noEmit` čistý, `vite build` prochází, `vitest run` = 74/74 zelených.
- Cross-module kontrakt: skript ověřil, že **všech 32** cest z `cardSrc` + `rub.png`
  reálně existuje v `public/cards/` (0 chybějících). Test má zuby — kontroluje, že
  výstup neobsahuje holý jednociferný rank (`-[7-9].png`), takže naivní šablonování spadne.
- Idempotence renderu ověřena testem (dvě volání → shodný `innerHTML`).

## Poznámky / kompromisy
- jsdom přidán jako devDependency (`^29`). Engine testy záměrně neběží v jsdom — prostředí
  se přepíná jen pro `render.test.ts`, suite tím nezpomalil výrazně.
- `render.test.ts` ověřuje strukturu (počty elementů, src cesty, třídy), ne vizuál.
  Skutečný vzhled je na lidskou kontrolu — viz `verify`.
- Žádné rozhodnutí hodné ADR (alternativy padly už v `discuss`: full re-render, miniatura
  barvy, úroveň testů).
