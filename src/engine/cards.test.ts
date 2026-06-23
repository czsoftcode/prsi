import { describe, it, expect } from "vitest";
import {
  type Card,
  type Rng,
  SUITS,
  RANKS,
  HAND_SIZE,
  createDeck,
  shuffle,
  deal,
} from "./cards";

/** Jednoduchý deterministický RNG (mulberry32) pro testy míchání. */
function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const key = (c: Card) => `${c.suit}-${c.rank}`;
const sortedKeys = (cards: readonly Card[]) => cards.map(key).sort();

describe("createDeck", () => {
  it("vrátí 32 karet", () => {
    expect(createDeck()).toHaveLength(SUITS.length * RANKS.length);
    expect(createDeck()).toHaveLength(32);
  });

  it("všechny karty jsou unikátní", () => {
    const deck = createDeck();
    const unique = new Set(deck.map(key));
    expect(unique.size).toBe(32);
  });
});

describe("shuffle", () => {
  it("zachová všechny karty (jen je přeskládá)", () => {
    const deck = createDeck();
    const shuffled = shuffle(deck, seededRng(42));
    expect(shuffled).toHaveLength(32);
    expect(sortedKeys(shuffled)).toEqual(sortedKeys(deck));
  });

  it("je deterministický pro stejný seed", () => {
    const deck = createDeck();
    const a = shuffle(deck, seededRng(123));
    const b = shuffle(deck, seededRng(123));
    expect(a.map(key)).toEqual(b.map(key));
  });

  it("nemění vstupní balíček", () => {
    const deck = createDeck();
    const before = deck.map(key);
    shuffle(deck, seededRng(7));
    expect(deck.map(key)).toEqual(before);
  });

  it("různé seedy dají (typicky) jiné pořadí", () => {
    const deck = createDeck();
    const a = shuffle(deck, seededRng(1));
    const b = shuffle(deck, seededRng(2));
    expect(a.map(key)).not.toEqual(b.map(key));
  });
});

describe("deal", () => {
  it("rozdá 5 karet hráči i AI", () => {
    const state = deal(createDeck());
    expect(state.playerHand).toHaveLength(HAND_SIZE);
    expect(state.aiHand).toHaveLength(HAND_SIZE);
  });

  it("úvodní odhazovací hromádka má jednu kartu", () => {
    const state = deal(createDeck());
    expect(state.discardPile).toHaveLength(1);
  });

  it("součet všech karet je 32 a všechny jsou unikátní", () => {
    const state = deal(createDeck());
    const all = [
      ...state.playerHand,
      ...state.aiHand,
      ...state.discardPile,
      ...state.drawPile,
    ];
    expect(all).toHaveLength(32);
    expect(new Set(all.map(key)).size).toBe(32);
  });

  it("lízací balíček má zbytek (32 - 11)", () => {
    const state = deal(createDeck());
    expect(state.drawPile).toHaveLength(32 - (HAND_SIZE * 2 + 1));
  });

  it("vyhodí chybu, když je v balíčku málo karet", () => {
    expect(() => deal(createDeck().slice(0, 10))).toThrow();
  });
});
