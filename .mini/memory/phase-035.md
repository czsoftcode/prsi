# Phase 35 — UI: výběr úrovně obtížnosti

**Goal:** Přidat perzistentní volbu úrovně AI (difficulty.ts dle vzoru hint.ts — best-effort localStorage, default dospělý) a cyklující tlačítko v hlavičce pro přepínání mezi dítě/dospělý/expert. Zvolená úroveň se propíše do chooseAiMove v game.ts a uplatní se až od nové partie (změna uprostřed rozehrané hry neovlivní běžící partii). Pokrýt testy modulu (perzistence, default, cyklus) i propojení herní smyčky.

## Steps
- [done] Modul difficulty.ts (perzistence úrovně AI)
- [done] Testy modulu difficulty.ts
- [done] Parametrizovat advanceAi o úroveň
- [done] Tlačítko obtížnosti v hlavičce
- [done] Propojení kliku a herní smyčky v main.ts
- [done] Regrese

## Auto-commit
- Phase 35: UI: výběr úrovně obtížnosti

## Discussion
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

## Run report
---
phase: 35
verdict: done
steps:
  - title: "Modul difficulty.ts (perzistence úrovně AI)"
    status: done
  - title: "Testy modulu difficulty.ts"
    status: done
  - title: "Parametrizovat advanceAi o úroveň"
    status: done
  - title: "Tlačítko obtížnosti v hlavičce"
    status: done
  - title: "Propojení kliku a herní smyčky v main.ts"
    status: done
  - title: "Regrese"
    status: done
verify:
  - title: "Vizuál a chování tlačítka obtížnosti v prohlížeči"
    detail: "Mechanicky ověřeno: ikona 🧒/🧑/🎓, aria-label/title, cyklus dítě→dospělý→expert→dítě, perzistence do localStorage. Lidským okem zkontrolovat, že tlačítko v řadě indikátorů vypadá konzistentně s hudbou/nápovědou (touch i myš) a že 🎓 (expert) je čitelný na pozadí stolu."
  - title: "Okamžitý dopad změny úrovně na hru"
    detail: "Logika ověřena testem (advanceAi předá level do chooseAiMove, dítě vs expert volí jiný tah). V reálné hře subjektivně potvrdit, že přepnutí na expert během partie znatelně přitvrdí AI hned na další tah AI."
---

# Phase 35 — report z auto session

## Co je hotové
- **`src/ui/difficulty.ts`** — perzistence úrovně AI dle vzoru `hint.ts`: líná init z localStorage
  (klíč `prsi.difficulty`), best-effort try/catch, default `dospely`. API `getAiLevel` /
  `setAiLevel` / `cycleAiLevel`. Navíc oproti `hint` (boolean) je hodnota enum → type guard
  `isAiLevel` validuje uloženou hodnotu, poškozená/neznámá padá na default.
- **`advanceAi(state, rng, level = "dospely")`** v `game.ts` předá úroveň do `chooseAiMove`.
  Default zachoval zpětnou kompatibilitu — stávající volání v `game.test.ts` (5×) se neměnila.
- **`renderDifficultyButton()`** v `render.ts` — cyklující tlačítko vedle hudby/nápovědy,
  `data-action="difficulty"`, ikona+popisek z tabulky `DIFFICULTY_DISPLAY`.
- **`main.ts`** — klik na `data-action="difficulty"` (řešený PŘED zámkem `locked`, jako hint)
  zavolá `cycleAiLevel()` + `draw()`; volání `advanceAi` předává `getAiLevel()`.
- **CSS** — `.indicator--difficulty` přidán do reset+hover skupiny tlačítek.

## Odchylka od původního cíle fáze (vědomá)
Cíl fáze v zadání zněl „uplatní se až od nové partie". V `/mini:discuss` jsme to **přehodnotili
na okamžitou aplikaci** (rozhodnutí uživatele: jednodušší, méně matoucí — žádný snapshot při
`newGame()`). Implementace tedy úroveň čte při každém tahu AI přes `getAiLevel()`. Pokud chce
uživatel zaznamenat to „proč", hodí se před `/mini:done` spustit `/mini:decision`.

## Testy (zuby, ne mock)
- `difficulty.test.ts` (7): default, set→get perzistence, čtení nové instance z localStorage,
  poškozená hodnota → default, plný cyklus + wrap, no-throw při nedostupném getItem/setItem.
- `game.test.ts`: nový test ověřuje reálný rozdíl tahu `dite` vs `expert` ve stejném stavu
  (expert vrhne eso → `pendingAces=1`, dítě drží eso a zahraje obyčejnou) — dokazuje, že se
  `level` skutečně propíše do `chooseAiMove`, ne že jen existuje parametr.
- `render.test.ts`: tlačítko reflektuje úroveň (ikona+aria-label pro expert i dítě).
- `main.test.ts`: klik cykluje úroveň, překreslí popisek a uloží do localStorage.

## Regrese
`npm run build` (tsc --noEmit + vite build) zelené, celá sada **405 testů** prošla.
Jeden zádrhel po cestě: `noUncheckedIndexedAccess` hlásil `AiLevel | undefined` u indexace
`LEVEL_CYCLE` — vyřešeno `!` s komentářem (index je díky modulu vždy v rozsahu).

## Poznámka k údržbě (mimo rozsah fáze)
`.indicator--hint` nikdy nedostal button-reset (color/font/border/cursor), který mají
theme/music — pravděpodobně přehlédnutí z fáze 22. Tlačítko nápovědy tak může mít nativní
rámeček/font. Nesahal jsem na to (mimo rozsah), ale stojí za zvážení sjednotit.
