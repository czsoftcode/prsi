# Phase 24 — Eso: přebití a stání

## Intent
Eso dnes jen nechá tah stejnému hráči (`playCard`: `newCurrentPlayer = player`), soupeř nedostane šanci reagovat. Nově eso vytvoří čekací stav předaný soupeři (obdoba `pendingSevens`): soupeř buď přebije vlastním esem (řetězení tam a zpět), nebo stojí = přijde o tah bez líznutí. V čekacím stavu je hratelné jen eso a dobrovolné líznutí (z fáze 23) je zakázané.

## Key decisions
- **Stav = `pendingAces: number`** (count, ne boolean) — symetrie s `pendingSevens` a umožní UI ukázat počet nakupených es. Stání count vynuluje.
- **Stání = samostatná pure funkce** `standAce(state, player)` (předá tah, vynuluje `pendingAces`). NEpřetěžovat `drawCard` — todo říká „nelze líznout", slévání by mátlo sémantiku.
- **Hráč smí stát i s esem v ruce** (eso nepovinné, konzistentní s nepovinnou sedmou z fáze 23). Akce stání je dostupná vždy, když `pendingAces > 0`.
- **AI: vždy přebije, když eso má** (`RANK_PRIORITY` už dává esu top → `pickCard` ho vybere), jinak vrátí `stand`. Záměrně hloupé, žádné šetření esa. `AiMove` dostane variant `{ type: "stand" }`.
- **UI:** indikátor počtu nakupených es (obdoba indikátoru sedem) + tlačítko „Stojím" pod hromádky (navázat na pattern z fáze 21).

## Watch out for
- **Eso jako poslední karta** → `winnerOf` má přednost před efektem; čekací stav se neuplatní (zachovat pořadí kontroly výhry).
- **`isPat`** — stání je vždy platný tah, takže `pendingAces > 0` nikdy nesmí hlásit pat. Doplnit do `isPat` (a `advanceAi` smyčky).
- **`advanceAi`** — nová akce `stand` v AiMove → ošetřit ve smyčce (volá `standAce`); pozor na stall/guard.
- **`isPlayable`** dostane param pro pendingAce (analogicky pendingSevens): při `pendingAces > 0` je hratelné jen eso. Aktualizovat všechny callery (`playableCards`, `game.ts`, `ai.ts`, `isPat`).
- **`simulation.test.ts` (E2E)** — změna eso sémantiky nejspíš rozbije stávající simulaci, bude potřeba aktualizovat.
- **`playerDraw` (game.ts)** — v čekacím stavu (`pendingAces > 0`) vrátit `null` (dobrovolné líznutí z fáze 23 se neuplatní).
