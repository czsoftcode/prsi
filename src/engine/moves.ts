// Základní tah Prší — čisté funkce nad GameState, bez speciálních efektů karet.

import {
  type Card,
  type GameState,
  type Player,
  type Rng,
  type Suit,
  shuffle,
} from "./cards";

/** Vrátí vrchní (aktuální) kartu odhazovací hromádky. */
function topOfDiscard(state: GameState): Card {
  const top = state.discardPile[state.discardPile.length - 1];
  if (!top) {
    throw new Error("topOfDiscard: odhazovací hromádka je prázdná");
  }
  return top;
}

/** Ruka daného hráče. */
function handOf(state: GameState, player: Player): Card[] {
  return player === "player" ? state.playerHand : state.aiHand;
}

/**
 * Lze danou kartu zahrát? Shoda barvy (proti aktuální požadované barvě) nebo
 * hodnoty (proti vrchní kartě hromádky). Bez efektů speciálních karet.
 */
export function isPlayable(card: Card, topCard: Card, currentSuit: Suit): boolean {
  return card.suit === currentSuit || card.rank === topCard.rank;
}

/** Vrátí z ruky jen karty, které lze aktuálně zahrát. */
export function playableCards(
  hand: readonly Card[],
  topCard: Card,
  currentSuit: Suit,
): Card[] {
  return hand.filter((card) => isPlayable(card, topCard, currentSuit));
}

/** Identita karty pro porovnání (karty jsou hodnotové, ne referenční). */
function sameCard(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

/**
 * Vyloží kartu z ruky hráče na vrch hromádky a nastaví aktuální barvu na barvu
 * zahrané karty. Vyhodí Error, když hráč kartu nemá nebo ji nelze zahrát.
 * Čistá funkce — vrací nový stav, vstup nemění. Bez efektů speciálních karet.
 */
export function playCard(state: GameState, player: Player, card: Card): GameState {
  const hand = handOf(state, player);
  const index = hand.findIndex((c) => sameCard(c, card));
  if (index === -1) {
    throw new Error(`playCard: hráč "${player}" nemá kartu ${card.suit}-${card.rank}`);
  }
  if (!isPlayable(card, topOfDiscard(state), state.currentSuit)) {
    throw new Error(`playCard: kartu ${card.suit}-${card.rank} nelze zahrát`);
  }

  const newHand = hand.slice();
  newHand.splice(index, 1);

  return {
    playerHand: player === "player" ? newHand : state.playerHand.slice(),
    aiHand: player === "ai" ? newHand : state.aiHand.slice(),
    drawPile: state.drawPile.slice(),
    discardPile: [...state.discardPile, card],
    currentSuit: card.suit,
  };
}

/**
 * Líznutí jedné karty hráči. Když je lízací balíček prázdný, nejprve se
 * odhazovací hromádka (bez vrchní karty) zamíchá zpět do balíčku přes injektovaný
 * RNG a teprve pak se líže. Není-li co míchat ani líznout, vrátí stav beze změny.
 * Čistá funkce — vrací nový stav, vstup nemění.
 */
export function drawCard(state: GameState, player: Player, rng: Rng): GameState {
  let drawPile = state.drawPile;
  let discardPile = state.discardPile;

  if (drawPile.length === 0) {
    // K remíchání je potřeba aspoň jedna karta pod vrchní.
    if (discardPile.length <= 1) {
      return state;
    }
    const top = discardPile[discardPile.length - 1]!;
    const rest = discardPile.slice(0, -1);
    drawPile = shuffle(rest, rng);
    discardPile = [top];
  }

  const drawn = drawPile[drawPile.length - 1]!;
  const newDrawPile = drawPile.slice(0, -1);
  const hand = handOf(state, player);
  const newHand = [...hand, drawn];

  return {
    playerHand: player === "player" ? newHand : state.playerHand.slice(),
    aiHand: player === "ai" ? newHand : state.aiHand.slice(),
    drawPile: newDrawPile,
    discardPile: discardPile === state.discardPile ? discardPile.slice() : discardPile,
    currentSuit: state.currentSuit,
  };
}
