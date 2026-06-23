import { describe, it, expect } from "vitest";
import { type Card, type GameState, type Suit } from "./cards";
import { isPlayable, playableCards, playCard, drawCard } from "./moves";

const c = (suit: Suit, rank: Card["rank"]): Card => ({ suit, rank });
const key = (card: Card) => `${card.suit}-${card.rank}`;

/** Sestaví stav z dílčích polí; doplní rozumné defaulty. */
function makeState(partial: Partial<GameState>): GameState {
  const discardPile = partial.discardPile ?? [c("srdce", "kral")];
  return {
    playerHand: partial.playerHand ?? [],
    aiHand: partial.aiHand ?? [],
    drawPile: partial.drawPile ?? [],
    discardPile,
    currentSuit: partial.currentSuit ?? discardPile[discardPile.length - 1]!.suit,
  };
}

describe("isPlayable", () => {
  const top = c("srdce", "kral");
  it("shoda barvy s aktuální barvou", () => {
    expect(isPlayable(c("srdce", "7"), top, "srdce")).toBe(true);
  });
  it("shoda hodnoty s vrchní kartou", () => {
    expect(isPlayable(c("kule", "kral"), top, "srdce")).toBe(true);
  });
  it("žádná shoda", () => {
    expect(isPlayable(c("kule", "7"), top, "srdce")).toBe(false);
  });
  it("barva se porovnává s currentSuit, ne s vrchní kartou", () => {
    // vrchní je srdce, ale aktuální barva je kule (po svršku)
    expect(isPlayable(c("kule", "8"), top, "kule")).toBe(true);
    expect(isPlayable(c("srdce", "8"), top, "kule")).toBe(false);
  });
});

describe("playableCards", () => {
  it("vrátí jen hratelné karty", () => {
    const hand = [c("srdce", "7"), c("kule", "8"), c("zelene", "kral")];
    const result = playableCards(hand, c("srdce", "kral"), "srdce");
    expect(result.map(key)).toEqual(["srdce-7", "zelene-kral"]);
  });
});

describe("playCard", () => {
  it("vyloží kartu, nastaví currentSuit a odebere ji z ruky", () => {
    const state = makeState({
      playerHand: [c("srdce", "7"), c("kule", "8")],
      discardPile: [c("srdce", "kral")],
    });
    const next = playCard(state, "player", c("srdce", "7"));
    expect(next.playerHand.map(key)).toEqual(["kule-8"]);
    expect(next.discardPile.map(key)).toEqual(["srdce-kral", "srdce-7"]);
    expect(next.currentSuit).toBe("srdce");
  });

  it("zahrání shodou hodnoty nastaví currentSuit na barvu zahrané karty", () => {
    const state = makeState({
      playerHand: [c("kule", "kral")],
      discardPile: [c("srdce", "kral")],
      currentSuit: "srdce",
    });
    const next = playCard(state, "player", c("kule", "kral"));
    expect(next.currentSuit).toBe("kule");
  });

  it("nemění vstupní stav", () => {
    const state = makeState({
      playerHand: [c("srdce", "7"), c("kule", "8")],
      discardPile: [c("srdce", "kral")],
    });
    const before = state.playerHand.map(key);
    playCard(state, "player", c("srdce", "7"));
    expect(state.playerHand.map(key)).toEqual(before);
    expect(state.discardPile.map(key)).toEqual(["srdce-kral"]);
  });

  it("vyhodí Error, když hráč kartu nemá", () => {
    const state = makeState({ playerHand: [c("srdce", "7")] });
    expect(() => playCard(state, "player", c("kule", "8"))).toThrow();
  });

  it("vyhodí Error pro neplatný tah", () => {
    const state = makeState({
      playerHand: [c("kule", "8")],
      discardPile: [c("srdce", "kral")],
      currentSuit: "srdce",
    });
    expect(() => playCard(state, "player", c("kule", "8"))).toThrow();
  });

  it("funguje i pro AI", () => {
    const state = makeState({
      aiHand: [c("srdce", "9")],
      discardPile: [c("srdce", "kral")],
    });
    const next = playCard(state, "ai", c("srdce", "9"));
    expect(next.aiHand).toHaveLength(0);
    expect(next.discardPile.map(key)).toContain("srdce-9");
  });
});

describe("drawCard", () => {
  const noRng = () => 0;

  it("líznutí přidá vrchní kartu balíčku do ruky", () => {
    const state = makeState({
      playerHand: [c("srdce", "7")],
      drawPile: [c("kule", "9"), c("zelene", "10")], // top = poslední
    });
    const next = drawCard(state, "player", noRng);
    expect(next.playerHand.map(key)).toEqual(["srdce-7", "zelene-10"]);
    expect(next.drawPile.map(key)).toEqual(["kule-9"]);
  });

  it("nemění vstupní stav", () => {
    const state = makeState({
      playerHand: [c("srdce", "7")],
      drawPile: [c("zelene", "10")],
    });
    drawCard(state, "player", noRng);
    expect(state.playerHand.map(key)).toEqual(["srdce-7"]);
    expect(state.drawPile.map(key)).toEqual(["zelene-10"]);
  });

  it("při prázdném balíčku remíchá odhazovací hromádku bez vrchní karty", () => {
    const state = makeState({
      playerHand: [],
      drawPile: [],
      discardPile: [c("srdce", "7"), c("srdce", "8"), c("srdce", "kral")], // top = kral
      currentSuit: "srdce",
    });
    const next = drawCard(state, "player", noRng);
    // vrchní karta zůstává na hromádce
    expect(next.discardPile.map(key)).toEqual(["srdce-kral"]);
    // líznula se jedna z remíchaných (7/8), v balíčku zbyla druhá
    expect(next.playerHand).toHaveLength(1);
    expect(next.drawPile).toHaveLength(1);
    const moved = [...next.playerHand, ...next.drawPile].map(key).sort();
    expect(moved).toEqual(["srdce-7", "srdce-8"]);
  });

  it("vrátí stav beze změny, když není co líznout ani míchat", () => {
    const state = makeState({
      playerHand: [c("kule", "9")],
      drawPile: [],
      discardPile: [c("srdce", "kral")], // jen vrchní karta
    });
    const next = drawCard(state, "player", noRng);
    expect(next).toBe(state);
  });
});
