// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import type { Card, GameState } from "../engine/cards";
import { render } from "./render";

function card(suit: Card["suit"], rank: Card["rank"]): Card {
  return { suit, rank };
}

function makeState(over: Partial<GameState> = {}): GameState {
  return {
    playerHand: [card("srdce", "7"), card("kule", "kral"), card("zelene", "9")],
    aiHand: [card("zaludy", "8"), card("kule", "eso")],
    drawPile: [card("srdce", "10"), card("zelene", "spodek")],
    discardPile: [card("zaludy", "kral"), card("kule", "svrsek")],
    currentSuit: "kule",
    currentPlayer: "player",
    pendingSevens: 0,
    ...over,
  };
}

describe("render (jsdom smoke)", () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement("div");
  });

  it("vykreslí počet karet hráče lícem a počet rubů AI", () => {
    render(makeState(), root);
    expect(root.querySelectorAll(".hand--player .card--face")).toHaveLength(3);
    expect(root.querySelectorAll(".hand--ai .card--back")).toHaveLength(2);
  });

  it("vrchní karta odhazovací hromádky je poslední prvek discardPile", () => {
    render(makeState(), root);
    const top = root.querySelector<HTMLImageElement>(".pile--discard .card--face");
    expect(top?.getAttribute("src")).toBe("/cards/kule-svrsek.png");
  });

  it("indikátor barvy zobrazuje ikonu currentSuit", () => {
    render(makeState({ currentSuit: "srdce" }), root);
    const suit = root.querySelector<HTMLImageElement>(".indicator--suit .indicator__suit-img");
    expect(suit?.getAttribute("src")).toBe("/cards/suit-srdce.png");
  });

  it("indikátor sedem se skryje při 0 a zobrazí při >0", () => {
    render(makeState({ pendingSevens: 0 }), root);
    expect(root.querySelector(".indicator--sevens")).toBeNull();

    render(makeState({ pendingSevens: 2 }), root);
    expect(root.querySelector(".indicator--sevens")?.textContent).toContain("4");
  });

  it("prázdný lízací balíček vykreslí placeholder, ne chybu", () => {
    render(makeState({ drawPile: [] }), root);
    expect(root.querySelector(".pile--draw.pile--empty")).not.toBeNull();
    expect(root.querySelectorAll(".pile--draw .card--back")).toHaveLength(0);
  });

  it("karty hráče mají data-index a lízací balíček data-action=draw", () => {
    render(makeState(), root);
    const cards = root.querySelectorAll<HTMLElement>(".hand--player .card--face");
    cards.forEach((c, i) => expect(c.dataset.index).toBe(String(i)));
    expect(root.querySelector<HTMLElement>(".pile--draw")?.dataset.action).toBe("draw");
  });

  it("zvýrazní hratelné karty jen když je hráč na tahu", () => {
    // currentSuit kule, top kule-svrsek; hratelné: kule-kral (barva) i ostatní kule.
    const onTurn = makeState({ currentPlayer: "player" });
    render(onTurn, root);
    const highlightedOnTurn = root.querySelectorAll(".hand--player .card--playable").length;
    expect(highlightedOnTurn).toBeGreaterThan(0);

    const offTurn = makeState({ currentPlayer: "ai" });
    render(offTurn, root);
    expect(root.querySelectorAll(".hand--player .card--playable")).toHaveLength(0);
  });

  it("je idempotentní — opakované volání dá stejný počet elementů", () => {
    render(makeState(), root);
    const first = root.innerHTML;
    render(makeState(), root);
    expect(root.innerHTML).toBe(first);
    expect(root.querySelectorAll(".hand--player .card--face")).toHaveLength(3);
  });
});
