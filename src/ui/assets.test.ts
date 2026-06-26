import { describe, it, expect, afterEach } from "vitest";
import { SUITS, RANKS, type Card } from "../engine/cards";
import {
  cardSrc,
  rubSrc,
  suitIconSrc,
  tableBgImageSet,
} from "./assets";
import { setActiveTheme } from "./theme";

// Výchozí motiv je "01" (cards_01 + dashboard_01). Cesty proto začínají /cards_01/.

describe("cardSrc", () => {
  it("nuluje jednociferné numerické ranky (7-9)", () => {
    expect(cardSrc({ suit: "srdce", rank: "7" })).toBe("/cards_01/srdce-07.png");
    expect(cardSrc({ suit: "kule", rank: "8" })).toBe("/cards_01/kule-08.png");
    expect(cardSrc({ suit: "zelene", rank: "9" })).toBe("/cards_01/zelene-09.png");
  });

  it("nechává desítku i pojmenované ranky beze změny", () => {
    expect(cardSrc({ suit: "zaludy", rank: "10" })).toBe("/cards_01/zaludy-10.png");
    expect(cardSrc({ suit: "srdce", rank: "svrsek" })).toBe("/cards_01/srdce-svrsek.png");
    expect(cardSrc({ suit: "kule", rank: "spodek" })).toBe("/cards_01/kule-spodek.png");
    expect(cardSrc({ suit: "zelene", rank: "kral" })).toBe("/cards_01/zelene-kral.png");
    expect(cardSrc({ suit: "zaludy", rank: "eso" })).toBe("/cards_01/zaludy-eso.png");
  });

  it("pro všech 32 karet vrací cestu, která neobsahuje holý jednociferný rank", () => {
    // Zuby: chytí naivní `${suit}-${rank}.png`, kde by 7-9 zůstaly bez nuly.
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        const card: Card = { suit, rank };
        const src = cardSrc(card);
        expect(src.startsWith(`/cards_01/${suit}-`)).toBe(true);
        expect(src.endsWith(".png")).toBe(true);
        expect(src).not.toMatch(/-[7-9]\.png$/);
      }
    }
  });

  it("rub má cestu v aktivní sadě karet", () => {
    expect(rubSrc()).toBe("/cards_01/rub.png");
  });
});

describe("suitIconSrc", () => {
  it("mapuje barvu na ikonu suit-<barva>.png", () => {
    expect(suitIconSrc("srdce")).toBe("/cards_01/suit-srdce.png");
    expect(suitIconSrc("kule")).toBe("/cards_01/suit-kule.png");
    expect(suitIconSrc("zaludy")).toBe("/cards_01/suit-zaludy.png");
    expect(suitIconSrc("zelene")).toBe("/cards_01/suit-zelene.png");
  });

  it("vrací ikonu pro všechny barvy, odlišnou od karetních cest", () => {
    for (const suit of SUITS) {
      const src = suitIconSrc(suit);
      expect(src).toBe(`/cards_01/suit-${suit}.png`);
    }
  });
});

describe("tableBgImageSet", () => {
  it("výchozí motiv ukazuje na dashboard_01 (webp + jpg fallback)", () => {
    const bg = tableBgImageSet();
    expect(bg).toContain('url("/images/dashboard_01.webp") type("image/webp")');
    expect(bg).toContain('url("/images/dashboard_01.jpg") type("image/jpeg")');
  });
});

describe("přepnutí motivu se promítne do cest", () => {
  // theme.ts má modulový stav sdílený s assets.ts; po testu vrátíme zpět na 01,
  // ať neovlivníme ostatní testy v tomto souboru.
  afterEach(() => setActiveTheme("01"));

  it("po setActiveTheme(02) míří karty, rub i pozadí do motivu 02", () => {
    setActiveTheme("02");
    expect(cardSrc({ suit: "srdce", rank: "7" })).toBe("/cards_02/srdce-07.png");
    expect(rubSrc()).toBe("/cards_02/rub.png");
    expect(suitIconSrc("kule")).toBe("/cards_02/suit-kule.png");
    expect(tableBgImageSet()).toContain("/images/dashboard_02.webp");
    expect(tableBgImageSet()).toContain("/images/dashboard_02.jpg");
  });
});
