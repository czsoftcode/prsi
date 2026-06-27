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
import { playableCards, playCard, drawCard, standAce, winnerOf } from "../engine/moves";
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

/** Karty v ruce hráče, které lze teď zahrát (respektuje barvu, nakupené sedmy i esa). */
export function playerPlayable(state: GameState): Card[] {
  return playableCards(
    state.playerHand,
    topCard(state),
    state.currentSuit,
    state.pendingSevens,
    state.pendingAces,
  );
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
 * Líznutí hráče. Líznout smí kdykoliv na svém tahu — i když má hratelnou kartu
 * (líznutí pak předá tah soupeři). U nakupených sedem (pendingSevens>0) líznutí
 * bere penaltu 2×pendingSevens, takže si hráč může sedmu schválně schovat místo
 * jejího zahrání. Pod nakupenými esy (pendingAces>0) líznout NELZE — jedinou
 * alternativou k přebití esem je stání (playerStand). Vrací nový stav, nebo null
 * když je tah ignorovaný: hráč není na tahu, partie skončila, je čekací stav es,
 * nebo nešlo líznout ani remíchat (drawCard vrátí tentýž stav).
 */
export function playerDraw(state: GameState, rng: Rng): GameState | null {
  if (state.currentPlayer !== "player" || winnerOf(state) !== null) {
    return null;
  }
  if (state.pendingAces > 0) {
    return null; // pod nakupenými esy líznout nelze — jen přebít esem, nebo stát
  }
  const next = drawCard(state, "player", rng);
  if (next === state) {
    return null; // no-op: prázdný balíček a nelze remíchat
  }
  return next;
}

/**
 * Stání hráče proti nakupeným esům: přijde o tah bez líznutí, nakupená esa se
 * vynulují a tah přejde na AI. Vrací nový stav, nebo null když je tah ignorovaný:
 * hráč není na tahu, partie skončila, nebo žádná esa nemíří (pendingAces===0).
 */
export function playerStand(state: GameState): GameState | null {
  if (state.currentPlayer !== "player" || winnerOf(state) !== null) {
    return null;
  }
  if (state.pendingAces <= 0) {
    return null;
  }
  return standAce(state, "player");
}

/**
 * Dožene tahy AI: dokud je AI na tahu a partie neskončila, nechá ji rozhodnout
 * (chooseAiMove) a tah provede. AI buď zahraje kartu, líznu, nebo (pod nakupenými
 * esy bez esa) stojí. Smyčka končí, když se tah vrátí hráči, je vítěz, nebo nastane
 * stall — drawCard vrátí tentýž stav (prázdný balíček, nelze remíchat) a tah se
 * neposune. Strop AI_LOOP_GUARD je pojistka proti zacyklení.
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
        : move.type === "stand"
          ? standAce(cur, "ai")
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
 * `discardPile.length <= 1`). Pod nakupenými esy nikdy není pat — stání (standAce)
 * je vždy platný tah, který hru posune. Čistá funkce bez RNG.
 */
export function isPat(state: GameState): boolean {
  if (winnerOf(state) !== null) {
    return false;
  }
  if (state.pendingAces > 0) {
    return false; // stání je vždy dostupné → hra není zaseknutá
  }
  const hand = state.currentPlayer === "player" ? state.playerHand : state.aiHand;
  const canPlay =
    playableCards(hand, topCard(state), state.currentSuit, state.pendingSevens, state.pendingAces)
      .length > 0;
  if (canPlay) {
    return false;
  }
  // Nemůže hrát → může vůbec líznout? (stejná podmínka jako no-op v drawCard)
  const canDraw = state.drawPile.length > 0 || state.discardPile.length > 1;
  return !canDraw;
}

/** Vítěz partie nebo null, dokud oba mají karty. */
export { winnerOf };
