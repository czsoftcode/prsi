# Phase 7 — UI interakce: herní smyčka + barva

## Intent
Udělat hru hratelnou tah-za-tahem. Engine je pure → UI potřebuje controller držící
měnitelný `GameState`. Tok po akci hráče:
1. klik/dotyk na hratelnou kartu → `playCard(state, "player", card[, chosenSuit])`;
   klik na lízací balíček → `drawCard(state, "player", rng)`,
2. překreslit `render(state, #app)`,
3. pokud `currentPlayer === "ai"`, ve smyčce: `chooseAiMove(state)` → `playCard`/`drawCard`,
   dokud se tah nevrátí hráči (kvůli esu může AI hrát víckrát) nebo dokud není vítěz,
4. překreslit.

Po svršku se před `playCard` musí zobrazit overlay výběru barvy (4 barvy) a zvolená barva
se předá jako `chosenSuit`. BEZ obrazovky konce hry a nové partie — to je fáze 8 (jen
zastavit vstup, až `winnerOf` vrátí vítěze; samotná end-obrazovka + restart později).

Engine API (ověřeno): `playCard(state, player, card, chosenSuit?)`, `drawCard(state, player, rng)`,
`playableCards(hand, topCard, currentSuit, pendingSevens)`, `winnerOf(state)`,
`chooseAiMove(state): {type:"play",card,chosenSuit?} | {type:"draw"}`.

## Key decisions
- **Pravidlo líznutí: jen když nemá co hrát.** Controller ignoruje klik na balíček, pokud
  `playableCards(...)` pro hráče není prázdné. (Pod útokem sedem bez sedmy je playable
  prázdné → líznutí penalty povolené.)
- **Tempo AI: krátká prodleva ~600 ms** mezi tahem hráče a reakcí AI (a mezi řetězenými
  tahy AI). Během prodlevy se vstup zamkne (kliky se ignorují). Není to animace, jen pauza.
- **Zvýraznit hratelné karty:** ano. `render` zvýrazní hratelné karty hráče (přes
  `playableCards`) jen když `currentPlayer === "player"`. Render si playable set spočítá sám
  ze stavu (zůstává `render(state, root)`).
- **Listenery: event delegation** — jeden listener na `#app`, který full re-render nesmaže.
  Karty/balíček dostanou `data-*` (index karty v `playerHand`, `data-action="draw"`); handler
  čte data z `event.target.closest(...)`.
- **Overlay výběru barvy mimo `#app`** (samostatný kontejner / nad stolem), aby ho
  `render()` (dělá `replaceChildren` na `#app`) nesmazal. Overlay je transientní UI mód
  controlleru, NENÍ součástí `GameState`.
- **Controller jako samostatný modul** (`src/ui/game.ts`): čistá-ish orchestrace „proveď
  tah + dožeň AI" oddělená od navěšení DOM listenerů, aby šla testovat.

## Watch out for
- **Zacyklení smyčky AI:** `drawCard` při prázdném balíčku a nemožnosti remíchat
  (`discardPile.length <= 1`) vrací stav BEZE ZMĚNY včetně nezměněného `currentPlayer`.
  Smyčka „dožeň AI dokud currentPlayer===ai" by se zacyklila. Detekovat, že se stav/tah
  neposunul, a smyčku ukončit (patový stav plně řeší fáze 8).
- **Zámek vstupu (re-entrance):** během ~600ms prodlevy a během otevřeného overlay barvy
  musí být kliky na stůl ignorovány, jinak hráč spustí tah nad nekonzistentním stavem.
- **RNG pro `drawCard`:** potřeba zdroj náhody (`Math.random`) — engine ho bere parametrem.
- **Eso:** po zahrání esa zůstává `currentPlayer` stejný → hráč hraje znovu (smyčka AI se
  nespustí), u AI se dožene další tah AI. Žádné prosté střídání.
- **Identita karty z DOM:** index v `playerHand` se po každém re-renderu počítá z aktuálního
  stavu, takže zůstává platný; přesto klik validovat proti aktuálnímu stavu (ne důvěřovat
  jen data-atributu), aby zamčený/zastaralý klik neprošel.
- **Konec hry v této fázi:** jakmile `winnerOf(state) !== null`, zastavit vstup a smyčku;
  nepokoušet se o další tah. Vizuální end-obrazovku neimplementovat (fáze 8).
