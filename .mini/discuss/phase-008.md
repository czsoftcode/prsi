# Phase 8 — Konec hry, nová partie, pat

## Intent
Uzavřít interakční vrstvu: nahradit minimální textový banner z fáze 7 pořádným overlayem
konce hry (vítěz + tlačítko „Nová partie") a ošetřit patový stav. „Nová partie" rozdá novou
hru bez reloadu stránky. Overlay blokuje vstup do stolu. Tím se uzavře celý herní cyklus
od rozdání po konec a zpět.

Engine/UI stav (z fáze 7, v kódu):
- `game.ts`: `createGame(rng)`, `playerPlay`, `playerDraw`, `advanceAi`, `playerPlayable`,
  `winnerOf`. `drawCard` vrací TENTÝŽ objekt při no-op (prázdný `drawPile` a `discardPile.length<=1`).
- `main.ts`: `startGame(app)` drží v closure měnitelný `state`, `locked`, `banner` (text)
  a jeden delegovaný listener na `#app`; `draw()` překresluje a teď nastavuje text banneru.
- `overlay.ts`: `chooseSuit()` — vzor pro overlay mimo `#app` (Promise).

## Key decisions
- **Detekce patu = čistá funkce `isPat(state)` v `game.ts`:** vrací true, když NENÍ vítěz
  (`winnerOf===null`) A hráč na tahu nemá hratelnou kartu (`playableCards` prázdné) A líznout
  nelze (`drawPile.length===0` a `discardPile.length<=1`, tj. nejde ani remíchat).
  Deterministické, bez RNG → testovatelné přímo (pat stav složit ručně). Chytí i „AI stall"
  z fáze 7: `advanceAi` skončí s `currentPlayer==="ai"` jen při patu nebo výhře.
- **Pat má vlastní hlášku „Remíza"** (odlišenou od výhry), např. „Nikdo nemůže hrát —
  remíza!". Výhra: „Vyhrál jsi!" / „Vyhrál počítač.". Jinak stejný vzhled overlaye.
- **Overlay konce hry mimo `#app`** (jako `chooseSuit`), blokuje vstup. Obsahuje text
  výsledku + tlačítko „Nová partie".
- **Restart = reset stavu v closure, NE druhý `startGame`:** `state = createGame(rng)`,
  zavřít end overlay, `draw()`. Restart spouští callback z end overlaye. Listener i closure
  zůstávají jediné (jinak dvojité navěšení → duplicitní overlaye/tahy).
- **Kde kontrolovat konec:** v `draw()` (nebo po každém update stavu) — pořadí: vítěz →
  overlay výhry; jinak `isPat` → overlay remízy; jinak nic. End overlay nahradí dosavadní
  textový banner.

## Watch out for
- **Dvojitý listener / dvojitý overlay:** restart NESMÍ volat `startGame` znovu. Reset jen
  přepíše closure `state` a překreslí. Pozor i na to, aby se neotevřely dva end overlaye po
  sobě (debounce: než je overlay otevřený, je vstup zamčený / smyčka se nevolá).
- **Pat vs. zámek vstupu:** při patu musí jít otevřít end overlay i když je `currentPlayer
  ==="ai"` (AI stall). `draw()` se volá i po `advanceAi`, takže kontrola tam musí být.
- **Po skončení hry zastavit smyčku i vstup:** `gameOver()`/pat guardy už existují; ověřit,
  že po zobrazení end overlaye žádný zbloudilý `setTimeout` z AI prodlevy neprovede další tah
  (kontrola vítěze/patu na začátku callbacku AI).
- **Reachability patu:** přirozeně skoro nedosažitelný (32 karet), ale `isPat` jde otestovat
  ze složeného stavu. NEspoléhat na ruční hraní pro ověření patu — pokrýt unit testem.
- **`chooseSuit` rozpracovaný při konci:** teoreticky hráč zahraje poslední kartu = svršek a
  vyhraje; výhra má přednost před efektem (winnerOf po `playCard`). Overlay barvy se zavře
  výběrem, pak `playerPlay` → výhra → end overlay. Ověřit, že se nepřekříží dva overlaye.
