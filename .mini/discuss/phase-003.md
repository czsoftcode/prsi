# Phase 3 — Engine: základní tah

## Intent
Přidat do enginu čisté funkce pro jeden tah Prší bez speciálních efektů (sedma/eso/svršek
se chovají jako obyčejné karty — jejich efekty řeší až fáze 4):
- validace platnosti tahu (shoda barvy nebo hodnoty s vrchní kartou),
- vyložení karty na odhazovací hromádku,
- líznutí 1 karty, když hráč nemá co hrát,
- remíchání odhazovací hromádky zpět do lízacího balíčku, když balíček dojde.
Vše pokryté unit testy, navazuje na datový model z fáze 2.

## Key decisions
- **`currentSuit` přidat do `GameState`** (typ `Suit`). Po rozdání = barva vrchní karty hromádky.
  Shoda tahu = `karta.suit === currentSuit || karta.rank === topCard.rank`. Díky tomu svršek ve
  fázi 4 jen přepíše `currentSuit` a logika matchingu se nemění.
  → Nutné drobně upravit `deal()` z fáze 2, aby `currentSuit` inicializoval (= suit úvodní karty).
- **Bezstavové funkce na parametru hráče** — žádný `currentPlayer` ve stavu v této fázi.
  Přepínání kdo je na tahu je orchestrace (AI smyčka + UI), patří do pozdější fáze. Engine teď jen
  transformuje stav. Navrhovaná signatura: `playCard(state, player, card)` / `drawCard(state, player, rng)`,
  kde `Player = "player" | "ai"`.
- **Validace přes `isPlayable` / `playableCards`** jako veřejná pojistka pro UI/AI (UI nechá klikat
  jen na hratelné karty — "děti hážou cokoliv" se řeší tam, ne v enginu).
- **Neplatný tah → `playCard` vyhodí `Error`** (konzistentní s `deal` z fáze 2; signalizuje chybu volajícího).
- **Líznutí používá injektovaný `Rng`** (stejně jako `shuffle` ve fázi 2) kvůli deterministickým testům.

## Watch out for
- **Remíchání zachová vrchní kartu**: při prázdném `drawPile` se do balíčku zamíchá `discardPile` BEZ
  jeho vrchní karty (ta zůstává jako aktuální). Po remíchání se teprve líže.
- **Okrajový stav: není co líznout** — `drawPile` prázdný a v `discardPile` je jen vrchní karta
  (nic k remíchání). `drawCard` v tom případě vrátí stav beze změny (nevyhazuje Error) — je to
  legitimní vzácný stav, ne chyba volajícího.
- Funkce musí zůstat čisté: nemodifikovat vstupní stav, vracet nový `GameState` (kopie polí).
- Nezavádět zde efekty speciálních karet — pozor, ať `playCard` jen vyloží kartu a nastaví `currentSuit`
  na barvu zahrané karty; žádné "ber 2", "stůj", výběr barvy svrškem (to je fáze 4).
