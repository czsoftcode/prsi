# Phase 3 — Engine: základní tah

**Goal:** Validace platnosti tahu (shoda barvy nebo hodnoty), vyložení karty na hromádku, líznutí 1 karty když není co hrát, a remíchání odhazovací hromádky zpět do balíčku když dojde — jako čisté funkce pokryté unit testy.

## Steps
- [done] Stav currentSuit a úprava deal
- [done] Validace tahu: isPlayable + playableCards
- [done] Vyložení karty: playCard(state, player, card)
- [done] Líznutí + remíchání: drawCard(state, player, rng)
- [done] Unit testy základního tahu

## Auto-commit
- Phase 3: Engine: základní tah

## Discussion
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

## Run report
---
phase: 3
verdict: done
steps:
  - title: "Stav currentSuit a úprava deal"
    status: done
  - title: "Validace tahu: isPlayable + playableCards"
    status: done
  - title: "Vyložení karty: playCard(state, player, card)"
    status: done
  - title: "Líznutí + remíchání: drawCard(state, player, rng)"
    status: done
  - title: "Unit testy základního tahu"
    status: done
---

# Phase 3 — report z auto session

Hotovo, ověřeno mechanicky: `npx tsc --noEmit` projde, `npm test` → 27 testů zeleně (3 soubory).

## Co vzniklo / změnilo se
- `src/engine/cards.ts` — `GameState` rozšířen o `currentSuit: Suit`, přidán typ `Player = "player" | "ai"`,
  `deal()` inicializuje `currentSuit` na barvu úvodní odhazovací karty.
- `src/engine/moves.ts` (nový) — `isPlayable`, `playableCards`, `playCard`, `drawCard`. Vše čisté funkce.
- `src/engine/moves.test.ts` (nový) — 15 testů.

## Implementační poznámky
- **`playCard`** validuje (kontrola, že hráč kartu má + že je hratelná), jinak vyhodí Error.
  Nastaví `currentSuit` na barvu zahrané karty. Bez efektů speciálních karet (sedma/eso/svršek
  zatím jako obyčejné karty — fáze 4).
- **`drawCard`** líže z konce `drawPile`. Při prázdném balíčku zamíchá `discardPile` bez vrchní karty
  zpět (přes injektovaný `Rng`) a pak líže. Když není co míchat ani líznout (`drawPile` prázdný a
  `discardPile` má jen vrchní kartu), vrací **přesně tentýž objekt stavu** (`next === state`) — tím
  jde okrajový stav snadno detekovat.
- Všechny funkce kopírují pole, vstupní stav nemodifikují (ověřeno testy).

## Pozn.
Nic blokujícího, nic pro lidské ověření (žádné UI). ADR netřeba — návrh byl odsouhlasen v discuss,
žádná zamítnutá alternativa navíc.
