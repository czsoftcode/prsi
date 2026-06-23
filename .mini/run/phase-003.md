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
