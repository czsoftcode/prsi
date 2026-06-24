// Controller herní smyčky: čistá orchestrace nad pure enginem. Žádný DOM.
// Funkce vrací nový GameState (nebo null u ignorovaného tahu) — mutaci stavu
// a vykreslování drží vrstva v main.ts.

import {
  createDeck,
  shuffle,
  deal,
  type Card,
  type GameState,
  type Rng,
  type Suit,
} from "../engine/cards";
import { playableCards, playCard, drawCard, winnerOf } from "../engine/moves";
import { chooseAiMove } from "../engine/ai";

/** Bezpečnostní strop kol AI smyčky (proti zacyklení při neočekávaném stavu). */
const AI_LOOP_GUARD = 200;

/** Rozdá novou partii zamícháním balíčku injektovaným RNG. */
export function createGame(rng: Rng): GameState {
  return deal(shuffle(createDeck(), rng));
}

/** Vrchní karta odhazovací hromádky. */
function topCard(state: GameState): Card {
  return state.discardPile[state.discardPile.length - 1]!;
}

/** Karty v ruce hráče, které lze teď zahrát (respektuje barvu i nakupené sedmy). */
export function playerPlayable(state: GameState): Card[] {
  return playableCards(state.playerHand, topCard(state), state.currentSuit, state.pendingSevens);
}

function sameCard(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

/**
 * Tah hráče zahráním karty z ruky (index do playerHand). Vrací nový stav, nebo
 * null když je tah ignorovaný: hráč není na tahu, partie skončila, index mimo
 * rozsah, karta není hratelná, nebo svršek bez zvolené barvy (tu nejdřív vybere
 * overlay). Pro ne-svršek musí být chosenSuit undefined.
 */
export function playerPlay(
  state: GameState,
  cardIndex: number,
  chosenSuit?: Suit,
): GameState | null {
  if (state.currentPlayer !== "player" || winnerOf(state) !== null) {
    return null;
  }
  const card = state.playerHand[cardIndex];
  if (!card) {
    return null;
  }
  if (!playerPlayable(state).some((c) => sameCard(c, card))) {
    return null;
  }
  const isSvrsek = card.rank === "svrsek";
  if (isSvrsek && chosenSuit === undefined) {
    return null; // barvu nejdřív zvolí overlay, pak se zavolá znovu s chosenSuit
  }
  if (!isSvrsek && chosenSuit !== undefined) {
    return null;
  }
  try {
    return playCard(state, "player", card, isSvrsek ? chosenSuit : undefined);
  } catch {
    return null;
  }
}

/**
 * Líznutí hráče. Povolené JEN když nemá žádnou hratelnou kartu (pravidlo
 * „kdo nemá co hrát, líže"). Vrací nový stav, nebo null když je tah ignorovaný:
 * hráč není na tahu, partie skončila, má hratelnou kartu, nebo nešlo líznout ani
 * remíchat (drawCard vrátí tentýž stav).
 */
export function playerDraw(state: GameState, rng: Rng): GameState | null {
  if (state.currentPlayer !== "player" || winnerOf(state) !== null) {
    return null;
  }
  if (playerPlayable(state).length > 0) {
    return null;
  }
  const next = drawCard(state, "player", rng);
  if (next === state) {
    return null; // no-op: prázdný balíček a nelze remíchat
  }
  return next;
}

/**
 * Dožene tahy AI: dokud je AI na tahu a partie neskončila, nechá ji rozhodnout
 * (chooseAiMove) a tah provede. Kvůli esu může AI hrát víckrát (tah jí zůstane).
 * Smyčka končí, když se tah vrátí hráči, je vítěz, nebo nastane stall — drawCard
 * vrátí tentýž stav (prázdný balíček, nelze remíchat) a tah se neposune.
 * Strop AI_LOOP_GUARD je pojistka proti zacyklení.
 */
export function advanceAi(state: GameState, rng: Rng): GameState {
  let cur = state;
  for (let guard = 0; guard < AI_LOOP_GUARD; guard++) {
    if (cur.currentPlayer !== "ai" || winnerOf(cur) !== null) {
      break;
    }
    const move = chooseAiMove(cur);
    const next =
      move.type === "play"
        ? playCard(cur, "ai", move.card, move.chosenSuit)
        : drawCard(cur, "ai", rng);
    if (next === cur) {
      break; // stall: tah se neposunul
    }
    cur = next;
  }
  return cur;
}

/**
 * Patový stav: partie nemá vítěze, ale hráč na tahu nemá co zahrát ani co líznout
 * (lízací balíček je prázdný a odhazovací hromádku nelze remíchat —
 * `discardPile.length <= 1`). Bez tohoto je hra zaseknutá. Čistá funkce bez RNG.
 */
export function isPat(state: GameState): boolean {
  if (winnerOf(state) !== null) {
    return false;
  }
  const hand = state.currentPlayer === "player" ? state.playerHand : state.aiHand;
  const canPlay =
    playableCards(hand, topCard(state), state.currentSuit, state.pendingSevens).length > 0;
  if (canPlay) {
    return false;
  }
  // Nemůže hrát → může vůbec líznout? (stejná podmínka jako no-op v drawCard)
  const canDraw = state.drawPile.length > 0 || state.discardPile.length > 1;
  return !canDraw;
}

/** Vítěz partie nebo null, dokud oba mají karty. */
export { winnerOf };
