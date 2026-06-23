// Datový model karetní hry Prší — čisté typy a funkce, bez DOM.

export type Suit = "zaludy" | "zelene" | "srdce" | "kule";

export type Rank = "7" | "8" | "9" | "10" | "svrsek" | "spodek" | "kral" | "eso";

export interface Card {
  readonly suit: Suit;
  readonly rank: Rank;
}

export const SUITS: readonly Suit[] = ["zaludy", "zelene", "srdce", "kule"] as const;

export const RANKS: readonly Rank[] = [
  "7",
  "8",
  "9",
  "10",
  "svrsek",
  "spodek",
  "kral",
  "eso",
] as const;

/** Počet karet rozdaných každému hráči na začátku partie. */
export const HAND_SIZE = 5;

/**
 * Zdroj náhody pro míchání. Vrací číslo v intervalu [0, 1) stejně jako
 * Math.random. Předává se parametrem, aby šlo míchání deterministicky testovat.
 */
export type Rng = () => number;

/** Účastník hry. */
export type Player = "player" | "ai";

/** Stav rozdané partie. U balíčků je poslední prvek vrchní (top). */
export interface GameState {
  /** Ruka lidského hráče. */
  playerHand: Card[];
  /** Ruka počítače. */
  aiHand: Card[];
  /** Lízací balíček; líže se z konce (poslední prvek). */
  drawPile: Card[];
  /** Odhazovací hromádka; vrchní karta je poslední prvek. */
  discardPile: Card[];
  /** Aktuálně požadovaná barva (po svršku se může lišit od barvy vrchní karty). */
  currentSuit: Suit;
}

/** Vytvoří kompletní balíček 32 mariášových karet (každá kombinace barva×hodnota). */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

/**
 * Zamíchá balíček čistě (vrací novou kopii, vstup nemění). Fisher–Yates
 * s injektovaným RNG, takže při stejném RNG je výsledek deterministický.
 */
export function shuffle(deck: readonly Card[], rng: Rng): Card[] {
  const result = deck.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    // i i j jsou prokazatelně v rozsahu, proto non-null assertion (tsconfig má noUncheckedIndexedAccess).
    const tmp = result[i]!;
    result[i] = result[j]!;
    result[j] = tmp;
  }
  return result;
}

/**
 * Rozdá z (typicky zamíchaného) balíčku počáteční stav partie: HAND_SIZE karet
 * hráči i AI, první kartu z balíčku jako úvodní odhazovací (bez filtru funkčních
 * karet) a zbytek jako lízací balíček. Vstupní balíček se nemění.
 */
export function deal(deck: readonly Card[]): GameState {
  const needed = HAND_SIZE * 2 + 1;
  if (deck.length < needed) {
    throw new Error(`deal: balíček má jen ${deck.length} karet, potřeba alespoň ${needed}`);
  }
  const cards = deck.slice();
  const playerHand = cards.slice(0, HAND_SIZE);
  const aiHand = cards.slice(HAND_SIZE, HAND_SIZE * 2);
  const topCard = cards[HAND_SIZE * 2]!;
  const discardPile = [topCard];
  const drawPile = cards.slice(HAND_SIZE * 2 + 1);
  return { playerHand, aiHand, drawPile, discardPile, currentSuit: topCard.suit };
}
