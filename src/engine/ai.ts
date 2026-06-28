// AI soupeř pro Prší — čistá heuristika nad GameState. Vrací rozhodnutí o tahu
// (AiMove), které volající provede přes playCard / drawCard. Nic nemutuje.
//
// Tři úrovně obtížnosti (parametr `level` v chooseAiMove), všechny DETERMINISTICKÉ
// (žádný Math.random — stejný stav dává stejný tah, testy i E2E simulace zůstávají
// reprodukovatelné). Liší se jen výběrem karty z hratelných kandidátů, ne pravidly:
// - `dite`    — slabá: obrácená priorita (zahodí svršek/obyčejné dřív, útočné karty
//               drží zbytečně), takže lidský junior soupeř snáz vyhraje,
// - `dospely` — výchozí: stávající ofenzivní heuristika (RANK_PRIORITY),
// - `expert`  — šetří sedmy a esa jako útok na finiš (zahraje je, když má soupeř málo
//               karet nebo je to vynucené), svršek hraje jen na přepnutí na vlastní
//               převažující barvu.
// Volba barvy po svršku (chooseSuit) je společná pro všechny úrovně.

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

/** Úroveň obtížnosti AI. Viz hlavičkový komentář. */
export type AiLevel = "dite" | "dospely" | "expert";

/**
 * Soupeř (lidský hráč) má nejvýš tolik karet → expert přepne do útočného režimu
 * a vrhne sedmy/esa, aby ho dorazil dřív, než dohraje ruku.
 */
const EXPERT_ATTACK_THRESHOLD = 2;

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

/**
 * Úroveň „dospely": z hratelných karet vybere kartu s nejvyšší prioritou; při shodě
 * tu první (stabilní).
 */
function pickCard(candidates: readonly Card[]): Card {
  let best = candidates[0]!;
  for (const card of candidates) {
    if (RANK_PRIORITY[card.rank] > RANK_PRIORITY[best.rank]) {
      best = card;
    }
  }
  return best;
}

/**
 * Úroveň „dite": obrácená priorita — vybere kartu s NEJNIŽŠÍ prioritou (svršek/obyčejné
 * dřív, útočné karty drží), při shodě tu první. Záměrně slabá, ale plně deterministická.
 * Při pendingSevens/pendingAces vrací playableCards stejně jen sedmy/esa (vše stejná
 * priorita) → vybere první, takže ve vynucené situaci hraje jako ostatní úrovně.
 */
function pickWeak(candidates: readonly Card[]): Card {
  let worst = candidates[0]!;
  for (const card of candidates) {
    if (RANK_PRIORITY[card.rank] < RANK_PRIORITY[worst.rank]) {
      worst = card;
    }
  }
  return worst;
}

/**
 * Svršek je pro experta užitečný, jen když po jeho zahrání umí přepnout na vlastní
 * převažující barvu odlišnou od aktuálně požadované (jinak by svrškem jen plýtval).
 * Poslední karta (prázdný zbytek) → nepodstatné, vrací false.
 */
function svrsekUseful(state: GameState, played: Card): boolean {
  const remaining = removeOne(state.aiHand, played);
  if (remaining.length === 0) {
    return false;
  }
  const dominant = chooseSuit(state.aiHand, played);
  return dominant !== state.currentSuit && remaining.some((c) => c.suit === dominant);
}

/**
 * Skóre karty pro experta (vyšší = hraj dřív). V útočném režimu (soupeř blízko výhry)
 * vrhne eso a sedmu napřed; jinak je šetří a nejdřív se zbavuje obyčejných karet,
 * svršek hraje jen na přepnutí barvy (jinak ho drží — nejnižší skóre).
 */
function expertScore(card: Card, state: GameState, attackMode: boolean): number {
  switch (card.rank) {
    case "eso":
      return attackMode ? 100 : 10;
    case "7":
      return attackMode ? 90 : 11;
    case "svrsek":
      return svrsekUseful(state, card) ? 30 : 5;
    default:
      return 40;
  }
}

/**
 * Úroveň „expert": vybere kartu s nejvyšším expertScore; při shodě tu první (stabilní).
 */
function pickExpert(candidates: readonly Card[], state: GameState): Card {
  const attackMode = state.playerHand.length <= EXPERT_ATTACK_THRESHOLD;
  let best = candidates[0]!;
  let bestScore = expertScore(best, state, attackMode);
  for (const card of candidates) {
    const score = expertScore(card, state, attackMode);
    if (score > bestScore) {
      best = card;
      bestScore = score;
    }
  }
  return best;
}

/** Vybere kartu z hratelných kandidátů podle úrovně obtížnosti. */
function pickByLevel(candidates: readonly Card[], state: GameState, level: AiLevel): Card {
  switch (level) {
    case "dite":
      return pickWeak(candidates);
    case "expert":
      return pickExpert(candidates, state);
    default:
      return pickCard(candidates);
  }
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
 * `draw`. Pod nakupenými esy/sedmami vrací playableCards stejně jen esa/sedmy, takže
 * každá úroveň přebije, pokud má čím. `level` určuje výběr karty (default „dospely" =
 * zpětně kompatibilní stávající chování). Čistá funkce — stav nemění.
 */
export function chooseAiMove(state: GameState, level: AiLevel = "dospely"): AiMove {
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
  const card = pickByLevel(candidates, state, level);
  if (card.rank === "svrsek") {
    return { type: "play", card, chosenSuit: chooseSuit(state.aiHand, card) };
  }
  return { type: "play", card };
}
