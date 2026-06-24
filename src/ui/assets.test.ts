import { describe, it, expect } from "vitest";
import { SUITS, RANKS, type Card } from "../engine/cards";
import { cardSrc, RUB_SRC, suitIconSrc } from "./assets";

describe("cardSrc", () => {
  it("nuluje jednociferné numerické ranky (7-9)", () => {
    expect(cardSrc({ suit: "srdce", rank: "7" })).toBe("/cards/srdce-07.png");
    expect(cardSrc({ suit: "kule", rank: "8" })).toBe("/cards/kule-08.png");
    expect(cardSrc({ suit: "zelene", rank: "9" })).toBe("/cards/zelene-09.png");
  });

  it("nechává desítku i pojmenované ranky beze změny", () => {
    expect(cardSrc({ suit: "zaludy", rank: "10" })).toBe("/cards/zaludy-10.png");
    expect(cardSrc({ suit: "srdce", rank: "svrsek" })).toBe("/cards/srdce-svrsek.png");
    expect(cardSrc({ suit: "kule", rank: "spodek" })).toBe("/cards/kule-spodek.png");
    expect(cardSrc({ suit: "zelene", rank: "kral" })).toBe("/cards/zelene-kral.png");
    expect(cardSrc({ suit: "zaludy", rank: "eso" })).toBe("/cards/zaludy-eso.png");
  });

  it("pro všech 32 karet vrací cestu, která neobsahuje holý jednociferný rank", () => {
    // Zuby: chytí naivní `${suit}-${rank}.png`, kde by 7-9 zůstaly bez nuly.
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        const card: Card = { suit, rank };
        const src = cardSrc(card);
        expect(src.startsWith(`/cards/${suit}-`)).toBe(true);
        expect(src.endsWith(".png")).toBe(true);
        expect(src).not.toMatch(/-[7-9]\.png$/);
      }
    }
  });

  it("rub má pevnou cestu", () => {
    expect(RUB_SRC).toBe("/cards/rub.png");
  });
});

describe("suitIconSrc", () => {
  it("mapuje barvu na ikonu suit-<barva>.png", () => {
    expect(suitIconSrc("srdce")).toBe("/cards/suit-srdce.png");
    expect(suitIconSrc("kule")).toBe("/cards/suit-kule.png");
    expect(suitIconSrc("zaludy")).toBe("/cards/suit-zaludy.png");
    expect(suitIconSrc("zelene")).toBe("/cards/suit-zelene.png");
  });

  it("vrací ikonu pro všechny barvy, odlišnou od karetních cest", () => {
    for (const suit of SUITS) {
      const src = suitIconSrc(suit);
      expect(src).toBe(`/cards/suit-${suit}.png`);
    }
  });
});
