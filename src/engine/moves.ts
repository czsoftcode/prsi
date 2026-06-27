// Tah Prší — čisté funkce nad GameState včetně efektů speciálních karet
// (sedma, eso, svršek) a detekce výhry.

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

/** Druhý hráč (v 1v1 jediný soupeř). */
function otherPlayer(player: Player): Player {
  return player === "player" ? "ai" : "player";
}

/**
 * Lze danou kartu zahrát? Když na hráče míří nakupená esa (pendingAces > 0), je
 * hratelné POUZE eso (přebití; svršek esa neruší) — jediná alternativa je stání
 * (standAce). Když míří nakupené sedmy (pendingSevens > 0), je hratelná POUZE sedma
 * (svršek sedmy neruší). Jinak je svršek divoká karta — lze ho zahrát na cokoliv
 * (a mění barvu); ostatní karty platí běžné pravidlo: shoda barvy (proti aktuální
 * požadované barvě) nebo hodnoty (proti vrchní kartě hromádky). Jediné místo, kde
 * se rozhoduje o hratelnosti — playableCards i playCard se opírají o tuto funkci.
 * pendingAces a pendingSevens se vzájemně vylučují (oba > 0 nikdy).
 */
export function isPlayable(
  card: Card,
  topCard: Card,
  currentSuit: Suit,
  pendingSevens = 0,
  pendingAces = 0,
): boolean {
  if (pendingAces > 0) {
    return card.rank === "eso";
  }
  if (pendingSevens > 0) {
    return card.rank === "7";
  }
  if (card.rank === "svrsek") {
    return true;
  }
  return card.suit === currentSuit || card.rank === topCard.rank;
}

/** Vrátí z ruky jen karty, které lze aktuálně zahrát. */
export function playableCards(
  hand: readonly Card[],
  topCard: Card,
  currentSuit: Suit,
  pendingSevens = 0,
  pendingAces = 0,
): Card[] {
  return hand.filter((card) => isPlayable(card, topCard, currentSuit, pendingSevens, pendingAces));
}

/** Identita karty pro porovnání (karty jsou hodnotové, ne referenční). */
function sameCard(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

/**
 * Vyloží kartu z ruky hráče na vrch hromádky a aplikuje efekt speciálních karet:
 * - sedma: zvýší pendingSevens (soupeř bude brát 2 × pendingSevens),
 * - eso: zvýší pendingAces a předá tah soupeři (ten musí přebít esem, nebo stát),
 * - svršek: vyžaduje `chosenSuit` a nastaví na něj aktuální barvu,
 * - ostatní: aktuální barva = barva karty, tah přechází na soupeře.
 *
 * `chosenSuit` smí být zadán JEN u svrška (jinak Error) a u svrška je povinný.
 * Vyhodí Error, když hráč kartu nemá nebo ji nelze zahrát. Čistá funkce — vrací
 * nový stav, vstup nemění. Výhru (prázdná ruka) řeší samostatně winnerOf.
 */
export function playCard(
  state: GameState,
  player: Player,
  card: Card,
  chosenSuit?: Suit,
): GameState {
  const hand = handOf(state, player);
  const index = hand.findIndex((c) => sameCard(c, card));
  if (index === -1) {
    throw new Error(`playCard: hráč "${player}" nemá kartu ${card.suit}-${card.rank}`);
  }
  if (
    !isPlayable(card, topOfDiscard(state), state.currentSuit, state.pendingSevens, state.pendingAces)
  ) {
    throw new Error(`playCard: kartu ${card.suit}-${card.rank} nelze zahrát`);
  }

  const isSvrsek = card.rank === "svrsek";
  if (isSvrsek && chosenSuit === undefined) {
    throw new Error("playCard: svršek vyžaduje výběr barvy (chosenSuit)");
  }
  if (!isSvrsek && chosenSuit !== undefined) {
    throw new Error(`playCard: chosenSuit lze zadat jen u svrška, ne u ${card.rank}`);
  }

  const newHand = hand.slice();
  newHand.splice(index, 1);

  // Efekt karty na barvu, nakupené sedmy/esa a tah.
  const newSuit: Suit = isSvrsek ? chosenSuit! : card.suit;
  const newPendingSevens = card.rank === "7" ? state.pendingSevens + 1 : state.pendingSevens;
  // Eso předá tah soupeři a nakupí se (soupeř musí přebít esem, nebo stát). Sedmy a
  // esa se vzájemně vylučují, takže non-eso karta nechává pendingAces beze změny (0).
  const newPendingAces = card.rank === "eso" ? state.pendingAces + 1 : state.pendingAces;
  // Tah vždy přechází na soupeře (efekt esa se uplatní až tím, že soupeř musí reagovat).
  const newCurrentPlayer = otherPlayer(player);

  return {
    playerHand: player === "player" ? newHand : state.playerHand.slice(),
    aiHand: player === "ai" ? newHand : state.aiHand.slice(),
    drawPile: state.drawPile.slice(),
    discardPile: [...state.discardPile, card],
    currentSuit: newSuit,
    currentPlayer: newCurrentPlayer,
    pendingSevens: newPendingSevens,
    pendingAces: newPendingAces,
  };
}

/**
 * Líznutí karet hráči a předání tahu soupeři. Bez nakupených sedem se líže 1 karta,
 * jinak penalta 2 × pendingSevens (a pendingSevens se vynuluje). Když lízací balíček
 * během lízání dojde, odhazovací hromádka (bez vrchní karty) se zamíchá zpět přes
 * injektovaný RNG. Není-li co líznout ani co míchat, vrátí stav beze změny (tah
 * nepřechází). Čistá funkce — vrací nový stav, vstup nemění.
 */
export function drawCard(state: GameState, player: Player, rng: Rng): GameState {
  if (state.pendingAces > 0) {
    // Pod nakupenými esy se nelíže — jedinou alternativou k přebití je stání (standAce).
    // Tichý líz by porušil pravidlo bez signálu, proto raději tvrdě selži.
    throw new Error("drawCard: pod nakupenými esy nelze líznout (jen přebít esem, nebo stát)");
  }
  const count = state.pendingSevens > 0 ? 2 * state.pendingSevens : 1;

  let drawPile = state.drawPile.slice();
  let discardPile = state.discardPile;
  let discardChanged = false;
  const drawn: Card[] = [];

  for (let i = 0; i < count; i++) {
    if (drawPile.length === 0) {
      // K remíchání je potřeba aspoň jedna karta pod vrchní; jinak končíme.
      if (discardPile.length <= 1) {
        break;
      }
      const top = discardPile[discardPile.length - 1]!;
      const rest = discardPile.slice(0, -1);
      drawPile = shuffle(rest, rng);
      discardPile = [top];
      discardChanged = true;
    }
    drawn.push(drawPile.pop()!);
  }

  // Nešlo líznout vůbec nic ani remíchat — stav se nemění a tah nepřechází.
  if (drawn.length === 0 && !discardChanged) {
    return state;
  }

  const hand = handOf(state, player);
  const newHand = [...hand, ...drawn];

  return {
    playerHand: player === "player" ? newHand : state.playerHand.slice(),
    aiHand: player === "ai" ? newHand : state.aiHand.slice(),
    drawPile,
    discardPile: discardChanged ? discardPile : state.discardPile.slice(),
    currentSuit: state.currentSuit,
    currentPlayer: otherPlayer(player),
    pendingSevens: 0,
    pendingAces: 0,
  };
}

/**
 * Stání proti nakupeným esům: hráč přijde o tah bez líznutí a nakupená esa se
 * vynulují. Jediná alternativa k přebití vlastním esem (viz isPlayable). Vyhodí
 * Error, když na hráče žádná esa nemíří (pendingAces === 0) — stát jindy nelze.
 * Čistá funkce — vrací nový stav, vstup nemění.
 */
export function standAce(state: GameState, player: Player): GameState {
  if (state.pendingAces <= 0) {
    throw new Error("standAce: stát lze jen proti nakupeným esům (pendingAces === 0)");
  }
  return {
    playerHand: state.playerHand.slice(),
    aiHand: state.aiHand.slice(),
    drawPile: state.drawPile.slice(),
    discardPile: state.discardPile.slice(),
    currentSuit: state.currentSuit,
    currentPlayer: otherPlayer(player),
    pendingSevens: state.pendingSevens,
    pendingAces: 0,
  };
}

/**
 * Vítěz partie: hráč s prázdnou rukou. Výhra má přednost před efektem poslední
 * karty (sedma/eso/svršek se po vyložení poslední karty už neřeší). Vrátí null,
 * dokud oba mají karty. Odvozená čistá funkce — nemění stav.
 */
export function winnerOf(state: GameState): Player | null {
  if (state.playerHand.length === 0) {
    return "player";
  }
  if (state.aiHand.length === 0) {
    return "ai";
  }
  return null;
}
