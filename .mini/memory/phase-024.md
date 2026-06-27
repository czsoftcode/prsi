# Phase 24 — Eso: přebití a stání

**Goal:** Eso v enginu předá tah soupeři do čekacího stavu (obdoba pendingSevens), kde soupeř buď přebije vlastním esem (řetězení), nebo musí stát a přijít o tah bez líznutí; v tomto stavu je hratelné jen eso a nelze dobrovolně líznout — promítnuto do AI i UI (indikátor + akce stání) a pokryté testy.

## Steps
- [done] GameState: pole pendingAces + init
- [done] moves.ts: efekt esa + funkce standAce
- [done] Testy moves.ts pro eso
- [done] AI: variant stand + chooseAiMove
- [done] game.ts: wiring stání, blok líznutí, isPat, advanceAi
- [done] UI: indikátor nakupených es + tlačítko Stojím
- [done] Zelený build, lint, celá suite + oprava E2E simulace

## Auto-commit
- Phase 24: Eso: přebití a stání

## Discussion
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

## Run report
---
phase: 24
verdict: done
steps:
  - title: "GameState: pole pendingAces + init"
    status: done
  - title: "moves.ts: efekt esa + funkce standAce"
    status: done
  - title: "Testy moves.ts pro eso"
    status: done
  - title: "AI: variant stand + chooseAiMove"
    status: done
  - title: "game.ts: wiring stání, blok líznutí, isPat, advanceAi"
    status: done
  - title: "UI: indikátor nakupených es + tlačítko Stojím"
    status: done
  - title: "Zelený build, lint, celá suite + oprava E2E simulace"
    status: done
verify:
  - title: "Eso flow v prohlížeči (klik na Stojím)"
    detail: "Mechanicky ověřeno enginem i render testy (tlačítko má data-action=stand, viditelnost dle pendingAces+tahu). Neověřeno klikem v reálném prohlížeči: zda onStand skutečně zareaguje, AI dožene tah a indikátory zmizí. Kontrakt data-action='stand' je literál sdílený mezi render.ts a main.ts bez konstanty (jako u draw/theme) — typo by automatický test nechytil."
  - title: "Vzhled indikátoru es a tlačítka Stojím"
    detail: "Modré pozadí (#1a56b3) odlišené od červených sedem; rozložení v řádku indikátorů pod hromádkami na mobilu i desktopu jsem vizuálně neověřoval."
---

# Phase 24 — report z auto session

## Co se udělalo
Eso předělané z „hraju znovu" na skutečný čekací stav `pendingAces` (obdoba `pendingSevens`):
- **Engine:** `GameState.pendingAces`; `isPlayable` při `pendingAces>0` pustí jen eso; `playCard` u esa předá tah soupeři a `pendingAces++`; nová pure funkce `standAce` (předá tah, vynuluje esa, nelíže, throwne při `pendingAces===0`). Sedmy a esa se vzájemně vylučují.
- **AI:** `AiMove` má variant `stand`; `chooseAiMove` pod esy přebije (eso má nejvyšší prioritu), jinak vrátí `stand`.
- **Controller:** `playerStand`, `playerDraw` blokuje líznutí pod esy, `advanceAi` řeší `stand`, `isPat` vrací false pod esy (stání je vždy dostupné).
- **UI:** indikátor počtu nakupených es + tlačítko „Stojím" (viditelné jen na tahu hráče pod esy), napojené přes delegovaný listener.

## Testy
374 testů zelených, build i typecheck OK. Pokryto: efekt esa, řetězení přebití, stání, jen-eso-hratelné, eso jako poslední karta = výhra, blok líznutí, isPat pod esy, AI přebití/stání, drawCard guard, render indikátoru+tlačítka. E2E simulace (200 partií) rozšířena o stání a o invariant „sedmy a esa nikdy oba >0".

## Nezávislý self-review
Pustil jsem adversariálního sub-agenta (čerstvý kontext) na 7 rizikových bodů (zaseknutí, pořadí výhry, vzájemné vyloučení čítačů, smyčka advanceAi, isPat, throw cesty, líznutí). Žádný kritický/střední nález. Dvě drobnosti opraveny: (1) `drawCard` dostal obranný guard `throw` při `pendingAces>0` (dřív se spoléhal jen na disciplínu volajících → riziko tichého porušení pravidla), (2) zastaralý komentář v `runAi` (AI už po esu nehraje víckrát).

## Pozn. k „lint" kroku
Projekt nemá nakonfigurovaný eslint ani `lint` skript — typovou kontrolu dělá `tsc --noEmit` (součást `npm run build`) a ta prošla. „Lint" v názvu kroku je tedy pokrytý typecheckem.

## Rozhodnutí k zaznamenání
Stojí za zvážení `/mini:decision`: vědomé rozhodnutí, že eso předává tah do čekacího stavu (řetězení + stání) místo dřívějšího „hraju znovu", a že stání je samostatná pure funkce (ne přetížený `drawCard`). Důvody jsou v `.mini/discuss/phase-024.md`.
