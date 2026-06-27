// AI soupeř pro Prší — čistá heuristika nad GameState. Vrací rozhodnutí o tahu
// (AiMove), které volající provede přes playCard / drawCard. Nic nemutuje.

import { type Card, type GameState, type Rank, type Suit, SUITS } from "./cards";
import { playableCards } from "./moves";

/**
 * Rozhodnutí AI o tahu.
 * - `play`: zahrát danou kartu; u svrška je `chosenSuit` vyplněn vždy (jinak undefined),
 * - `draw`: nemá co zahrát (líznutí 1, resp. 2 × pendingSevens řeší drawCard),
 * - `stand`: nakupená esa a nemá čím přebít → stojí (standAce, přijde o tah bez líznutí).
 */
export type AiMove =
  | { type: "play"; card: Card; chosenSuit?: Suit }
  | { type: "draw" }
  | { type: "stand" };

/**
 * Priorita hodnoty při výběru z hratelných karet (vyšší = hraj dřív). Záměrně
 * jednoduchá, „hloupá" heuristika:
 * - eso (4): nutí soupeře přebít vlastním esem, nebo stát (přijde o tah); když nepřebije,
 *   v 1v1 hraješ vzápětí znovu → zbavíš se ruky rychleji, hraj nejdřív,
 * - sedma (3): tlačí soupeře brát, útočná,
 * - obyčejné (2): běžné karty, zbav se jich,
 * - svršek (1): řídí barvu, drž ho jako poslední záchranu / na odhození nechtěné barvy.
 *
 * Pozn.: při pendingSevens > 0 vrací playableCards stejně jen sedmy, takže priorita
 * tam nehraje roli — vybere se sedma, nebo (bez sedmy) padne na draw.
 */
const RANK_PRIORITY: Record<Rank, number> = {
  eso: 4,
  "7": 3,
  "8": 2,
  "9": 2,
  "10": 2,
  spodek: 2,
  kral: 2,
  svrsek: 1,
};

/** Z hratelných karet vybere kartu s nejvyšší prioritou; při shodě tu první (stabilní). */
function pickCard(candidates: readonly Card[]): Card {
  let best = candidates[0]!;
  for (const card of candidates) {
    if (RANK_PRIORITY[card.rank] > RANK_PRIORITY[best.rank]) {
      best = card;
    }
  }
  return best;
}

/** Odstraní z ruky jednu instanci dané karty (kopie, vstup nemění). */
function removeOne(hand: readonly Card[], card: Card): Card[] {
  const index = hand.findIndex((c) => c.suit === card.suit && c.rank === card.rank);
  if (index === -1) {
    return hand.slice();
  }
  const copy = hand.slice();
  copy.splice(index, 1);
  return copy;
}

/**
 * Barva volená po zahrání svrška = nejčastější barva ve zbytku ruky (po odebrání
 * svrška). Tie-break deterministicky podle pořadí SUITS. Prázdný zbytek (svršek byl
 * poslední karta → výhra) → SUITS[0]; barva je v tu chvíli irelevantní, ale musí být platná.
 */
function chooseSuit(hand: readonly Card[], played: Card): Suit {
  const remaining = removeOne(hand, played);
  const counts = new Map<Suit, number>();
  for (const card of remaining) {
    counts.set(card.suit, (counts.get(card.suit) ?? 0) + 1);
  }
  let best: Suit = SUITS[0]!;
  let bestCount = -1;
  for (const suit of SUITS) {
    const count = counts.get(suit) ?? 0;
    if (count > bestCount) {
      best = suit;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Rozhodne tah AI nad aktuálním stavem. Garantuje platnost: `play` vrací jen kartu
 * z playableCards (respektuje vynucenou barvu, nakupené sedmy i esa) a u svrška vždy
 * doplní `chosenSuit`. Nemá-li co hrát: pod nakupenými esy `stand` (nelíže se), jinak
 * `draw`. Eso má v RANK_PRIORITY nejvyšší prioritu, takže pod nakupenými esy AI vždy
 * přebije, pokud eso má. Čistá funkce — stav nemění.
 */
export function chooseAiMove(state: GameState): AiMove {
  const top = state.discardPile[state.discardPile.length - 1];
  if (!top) {
    throw new Error("chooseAiMove: odhazovací hromádka je prázdná");
  }
  const candidates = playableCards(
    state.aiHand,
    top,
    state.currentSuit,
    state.pendingSevens,
    state.pendingAces,
  );
  if (candidates.length === 0) {
    return state.pendingAces > 0 ? { type: "stand" } : { type: "draw" };
  }
  const card = pickCard(candidates);
  if (card.rank === "svrsek") {
    return { type: "play", card, chosenSuit: chooseSuit(state.aiHand, card) };
  }
  return { type: "play", card };
}
