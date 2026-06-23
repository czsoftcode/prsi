---
phase: 2
verdict: done
steps:
  - title: "Typy Card/Suit/Rank a konstanty"
    status: done
  - title: "Tvorba balíčku 32 karet"
    status: done
  - title: "Zamíchání s injektovaným RNG"
    status: done
  - title: "Rozdání a počáteční stav hry"
    status: done
  - title: "Unit testy datového modelu"
    status: done
---

# Phase 2 — report z auto session

Hotovo, vše ověřeno mechanicky (`npx tsc --noEmit` projde, `npm test` → 12 testů zeleně).

## Co vzniklo
- `src/engine/cards.ts` — typy `Suit`, `Rank`, `Card`, konstanty `SUITS`/`RANKS`/`HAND_SIZE`, typ `Rng`, typ `GameState` a čisté funkce `createDeck()`, `shuffle(deck, rng)`, `deal(deck)`.
- `src/engine/cards.test.ts` — 11 testů (balíček, míchání, rozdání), plus stávající smoke test.

## Designová rozhodnutí
- **RNG injektovaný parametrem** (`Rng = () => number`), ne `Math.random` uvnitř — kvůli deterministickým testům míchání. Test používá vlastní mulberry32 se seedem.
- **Konvence balíčků:** vrchní karta je vždy poslední prvek pole (`drawPile` se líže z konce, `discardPile` má top jako poslední). Tohle si pohlídej v dalších fázích, ať je to konzistentní s logikou tahu.
- **`deal` rozdá 5+5**, první kartu z balíčku jako úvodní odhazovací **bez filtru** funkčních karet (dle dohody). Pokud později budeme chtít funkční úvodní kartu řešit, je to čistá funkce, takže se to ošetří ve fázi speciálních karet, ne tady.
- Kvůli `noUncheckedIndexedAccess` v strict tsconfigu jsou na dvou místech non-null assertions (`!`), kde je index prokazatelně v rozsahu.

## Pozn.
Nic blokujícího, nic pro lidské ověření (žádné UI v této fázi). ADR netřeba — žádné zamítnuté zásadní alternativy.
