---
phase: 7
verdict: done
steps:
  - title: "Controller: ciste funkce tahu + dohnani AI"
    status: done
  - title: "Render: zvyrazneni hratelnych + data-atributy"
    status: done
  - title: "Zapojeni vstupu: delegace + smycka v main.ts"
    status: done
  - title: "Overlay vyberu barvy po svrskovi"
    status: done
  - title: "Konec hry: zastaveni vstupu"
    status: done
verify:
  - title: "Odehrání několika tahů v prohlížeči (npm run dev)"
    detail: "Mechanicky ověřeno: tsc čistý, 91/91 testů zelených (z toho 13 controller, 8 render), vite build prochází. Lidským okem ověřit hratelnost: klik/dotyk na zvýrazněnou kartu ji zahraje, nehratelná se ignoruje, líznutí jde jen bez hratelné karty, AI reaguje po ~600ms, svršek otevře overlay barvy (klik mimo box = zrušení tahu), eso nechá hráče hrát znovu, po prázdné ruce naskočí banner vítěze a vstup se zastaví."
  - title: "Dotykové ovládání na reálném zařízení"
    detail: "Spoléhá na click event (pokrývá myš i dotyk). Neověřeno na fyzickém dotykovém displeji — zkontrolovat, že karty jsou dost velké a klikací plocha balíčku/overlay funguje prstem."
---

# Phase 7 — report z auto session

Hra je hratelná tah-za-tahem. Engine zůstal pure, veškerá orchestrace je v UI vrstvě.

## Co vzniklo
- `src/ui/game.ts` — controller (čisté funkce, bez DOM): `createGame`, `playerPlay`,
  `playerDraw` (vynucuje „líznout jen bez hratelné karty"), `advanceAi` (dožene tahy AI vč.
  eso-řetězení, končí u hráče / vítěze / stallu), `playerPlayable`, re-export `winnerOf`.
- `src/ui/render.ts` — hratelným kartám hráče přidává `card--playable` (jen když je na tahu)
  a interakční `data-index` na karty ruky, `data-action="draw"` na lízací balíček.
- `src/ui/overlay.ts` — overlay výběru barvy mimo `#app`, 4 ikony barev; Promise resolvne
  vždy (barva, nebo `null` při kliku mimo box = zrušení).
- `src/ui/main.ts` — měnitelný `GameState`, event delegation na `#app` (click = myš i dotyk),
  ~600ms prodleva AI se zámkem vstupu, banner vítěze, zastavení vstupu po konci hry.
- `src/ui/assets.ts` — `SUIT_LABELS` přesunut sem jako sdílená konstanta (render i overlay),
  ať není literál duplikovaný ve dvou modulech.
- CSS pro zvýraznění karet, overlay a banner.

## Ověřeno mechanicky
- `tsc --noEmit` čistý, `vite build` prochází, `vitest run` = 91/91 zelených.
- Controller testy mají zuby: eso-řetězení AI, must-play pravidlo, detekce stallu
  (`advanceAi` vrací `toBe(s)` — kdyby engine přestal vracet tentýž objekt při no-op drawCard,
  test spadne), zastavení u vítěze. Render testy: data-atributy + zvýraznění dle tahu.

## Adversariální self-review (nezávislý sub-agent, čerstvý kontext)
Proběhl, protože fáze sahá na vstupní bod, chybové cesty i kontrakt mezi moduly.
Nálezy a co s nimi:
- **KRITICKÉ (opraveno):** `chooseSuit` neměl cestu pro zrušení ani `try/finally` — zámek
  `locked` stál na neoznačeném předpokladu, že overlay vždy zmizí jen klikem na barvu. Doplněn
  klik mimo box = zrušení (resolve `null`) a `try/finally` v `onPlayCard`, takže zámek se
  uvolní vždy. Vyřešilo i to, že omylem kliknutý svršek nešel vzít zpět.
- **STŘEDNÍ (vědomě odloženo do fáze 8):** terminální pat (vyčerpaný balíček i hromádka,
  nikdo nemůže hrát) zanechá hru viset na „Na tahu: počítač" bez banneru — smyčka se po tahu
  hráče nevolá a hráčovy kliky jsou zablokované guardem. Je to vzácné (32 karet) a spadá do
  zadání fáze 8 (ošetření edge cases + prázdný balíček). `advanceAi` se díky detekci stallu
  a stropu 200 NEzacyklí, jen chybí UI signál patu.
- Ostatní podezření (selektor `data-index` nechytá vrchní kartu hromádky, index mimo rozsah,
  dvojklik, race kolem `await`) reviewer ověřil jako reálně ošetřená.

## Oprava po ručním testu (prázdná zelená obrazovka)
Při prvním spuštění v prohlížeči se nic nevykreslilo. Příčina: v `main.ts` se `startGame(app)`
volalo dřív, než se inicializovaly `const rng` / `const AI_DELAY_MS` (byly pod voláním) →
temporal dead zone → `ReferenceError` ještě před `render()`. Přesunul jsem konstanty nad
volání. Žádný unit test to nechytil, protože netestovaly vstupní bod — přidán `main.test.ts`
(jsdom), který bootstrap modulu reálně spustí a ověří vykreslení stolu (chytí TDZ i podobné
chyby vstupního bodu). Teď 92/92 testů.

## Oprava pravidla svrška (nález z ručního testu)
Při hraní se ukázalo, že svršek šel zahrát „na cokoliv" — a to je SPRÁVNĚ: svršek je
divoká karta (hratelný na libovolnou barvu i hodnotu, mění barvu). Engine ho ale z fáze 4
chybně omezoval na shodu barvy/hodnoty. Bug byl tedy v enginu (`isPlayable`), ne v UI této
fáze. Opraveno: `isPlayable` vrací pro svršek `true` (mimo útok nakupených sedem — ty svršek
neruší, dál je hratelná jen sedma). Doplněny testy v `moves.test.ts` (svršek divoký + svršek
neruší sedmy). UI to dědí automaticky (zvýraznění i validace jdou přes `playableCards`).

## Co je vědomě mimo tuto fázi
- Plná obrazovka konce hry + tlačítko „nová partie" (jen minimální textový banner) → fáze 8.
- Detekce a oznámení patu při vyčerpaných kartách → fáze 8.

## Otevřené k lidskému ověření
Viz `verify` výše — hratelnost v prohlížeči a dotyk na reálném zařízení nejdou ověřit
mechanicky.
