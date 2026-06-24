# Phase 6 — UI herní stůl: vykreslení stavu

**Goal:** Čistá render funkce, která z aktuálního stavu enginu vykreslí do DOM herní stůl — ruka hráče dole lícem, ruby AI nahoře, lízací balíček a odhazovací hromádka uprostřed, indikátor aktuální barvy a počtu nakupených sedem — s načítáním PNG z public/cards/; zatím jen vykreslení, bez interakce.

## Steps
- [done] cardSrc helper + unit testy
- [done] Kostra render(state, root) + struktura stolu
- [done] Vykresleni rukou a hromadek
- [done] Indikatory barvy a sedem
- [done] CSS layout + zapojeni do main.ts
- [done] jsdom smoke test renderu

## Auto-commit
- Phase 6: UI herní stůl: vykreslení stavu

## Discussion
# Phase 6 — UI herní stůl: vykreslení stavu

## Intent
Zavést první vykreslovací vrstvu: funkce, která z `GameState` (engine) vykreslí do DOM
herní stůl. Pouze čtení/zobrazení, ŽÁDNÁ interakce (klik/dotyk, herní smyčka, AI tahy =
fáze 7). Cíl je mít idempotentní `render(state, root)`, kterou půjde opakovaně volat a
vizuálně i testem ověřit, že odpovídá stavu.

Vykreslit:
- ruka hráče dole lícem (skutečné karty, pořadí = pořadí v `playerHand`)
- ruby AI nahoře (počet rubů = `aiHand.length`, obrázek `rub.png`)
- střed: lízací balíček (rub, příp. počet `drawPile.length`) + odhazovací hromádka
  (vrchní karta = poslední prvek `discardPile`)
- indikátor aktuální barvy `currentSuit`
- indikátor počtu nakupených sedem `pendingSevens`
- (volitelně) vyznačení `currentPlayer`

## Key decisions
- **Render kontrakt: full re-render z kořene.** `render(state, root)` pokaždé přestaví
  celý obsah kontejneru. Idempotentní, jednoduché. (Důsledek pro fázi 7: listenery se
  budou navěšovat po každém renderu znovu — řeší se až tam.)
- **Indikátor barvy: miniatura karty té barvy** (zmenšený obrázek, např. eso dané barvy)
  jako swatch. Bez nového assetu.
- **Testy: pure helpery + jsdom smoke.** Unit testy na čisté helpery (`cardSrc(card)`,
  mapování, počty elementů) + jeden jsdom smoke test, že render z `GameState` vytvoří
  očekávané elementy (počet karet v ruce, počet rubů AI, vrchní karta hromádky, indikátory).
- Tahle fáze zavádí i CSS layout (dosud žádné CSS není; `main.ts` je jen placeholder).

## Watch out for
- **Mapování názvů souborů:** ranky `7/8/9/10` → soubory `07/08/09/10` (nula u
  jednociferných), pojmenované ranky `svrsek/spodek/kral/eso` sedí 1:1. Render MUSÍ mít
  mapovací helper `cardSrc(card)`, ne naivní `${suit}-${rank}.png` (jinak rozbité u 7–9).
  Soubory ověřeny v `public/cards/`, rub = `rub.png`.
- **Indikátor barvy přes „eso té barvy" může u dětí splývat s tím, že je ve hře eso** —
  vizuálně odlišit (popisek „Barva:", jiné umístění/velikost než odhazovací hromádka).
- **jsdom smoke test** vyžaduje `jsdom` jako devDependency a přepnutí prostředí jen pro
  ten soubor (`// @vitest-environment jsdom`), ať engine testy zůstanou v node a nezpomalí.
- Render je side-effect do DOM, není to „pure funkce" v doslovném smyslu — testovatelnost
  zajišťují oddělené pure helpery + jsdom pro DOM výstup.
- Prázdný `drawPile` (po vyčerpání) — zobrazit prázdné místo, ne chybu (logiku remíchání
  řeší engine, UI jen zobrazuje aktuální stav).

## Run report
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
