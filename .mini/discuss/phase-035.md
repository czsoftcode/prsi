# Phase 35 — UI: výběr úrovně obtížnosti

## Intent
Engine už umí tři deterministické úrovně (`chooseAiMove(state, level)` v `src/engine/ai.ts`,
typ `AiLevel = "dite" | "dospely" | "expert"`, default `"dospely"`), ale UI je nevolá
s parametrem — `advanceAi` v `src/ui/game.ts:131` volá `chooseAiMove(cur)` natvrdo.
Fáze přidá perzistentní volbu úrovně a cyklující tlačítko v hlavičce, propojené do herní smyčky.

## Key decisions
- **Změna se uplatní OKAMŽITĚ**, ne až od nové partie. Rozhodnutí uživatele: jednodušší
  a méně matoucí (klik = okamžitý efekt na další tah AI). Žádný snapshot úrovně při `newGame()`.
- `difficulty.ts` podle vzoru `src/ui/hint.ts`: best-effort localStorage (try/catch),
  líná inicializace, default `"dospely"`. Klíč `"prsi.difficulty"`. API: `getAiLevel(): AiLevel`,
  `setAiLevel(level: AiLevel): void`, `cycleAiLevel(): AiLevel` (cyklus dítě→dospělý→expert→dítě).
  Pozor: na rozdíl od `hint` (boolean) je hodnota enum → při čtení validovat uloženou hodnotu
  proti `AiLevel`, neznámou/poškozenou → default.
- `advanceAi(state, rng, level)` dostane úroveň PARAMETREM (zůstává čistá, testovatelná bez globálu).
  `getAiLevel()` čte až `main.ts` a předá dovnitř — engine ani game.ts nesahá na localStorage.
- Tlačítko v hlavičce vedle hudby/nápovědy (render v `src/ui/render.ts`, vzor `renderHintButton`),
  `data-action="difficulty"`, delegovaný listener v `main.ts` (vzor klik na `data-action='hint'`,
  řešit klidně PŘED `locked`, ať jde přepnout i v okně AI prodlevy). Po kliku `cycleAiLevel()` + `draw()`.
- Vizuál (nízká sázka, lze upravit při plánu): ikony 🧒/🧑/🎓, `aria-label`/`title`
  „Obtížnost: dítě|dospělý|expert".

## Watch out for
- `advanceAi` má dvě stávající volání (game.ts a testy game.test.ts) — přidání parametru je
  breaking; projít všechna místa, kde se `advanceAi` volá (main.ts onPlayCard/onDraw/onStand smyčka).
- Testy modulu `difficulty.ts`: perzistence (set→get), default při prázdném/poškozeném úložišti,
  cyklus přes všechny tři úrovně a wrap zpět. localStorage v testech mockovat (jsdom) podobně
  jako u hint/audio testů.
- Test propojení: že `advanceAi` skutečně předá `level` do `chooseAiMove` (ne jen mock) —
  např. ověřit, že na úrovni `dite` vs `expert` AI v reprodukovatelném stavu zvolí jiný tah.
- Self-check enginu: změna úrovně uprostřed partie nesmí rozbít invariant pořadí/vítěze
  (advanceAi guard zůstává), jen ovlivní výběr tahu AI.
