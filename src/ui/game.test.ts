import { describe, it, expect } from "vitest";
import type { Card, GameState, Rng, Suit } from "../engine/cards";
import {
  createGame,
  playerPlay,
  playerDraw,
  advanceAi,
  playerPlayable,
  isPat,
} from "./game";

/** Deterministický RNG (mulberry32) pro testy. */
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

function card(suit: Suit, rank: Card["rank"]): Card {
  return { suit, rank };
}

/** Sestaví stav s rozumnými defaulty pro cílené scénáře. */
function makeState(over: Partial<GameState> = {}): GameState {
  return {
    playerHand: [card("srdce", "8")],
    aiHand: [card("kule", "9")],
    drawPile: [card("zelene", "10"), card("zaludy", "kral")],
    discardPile: [card("srdce", "9")],
    currentSuit: "srdce",
    currentPlayer: "player",
    pendingSevens: 0,
    ...over,
  };
}

describe("createGame", () => {
  it("rozdá platnou počáteční partii (5+5, hráč na tahu)", () => {
    const s = createGame(seededRng(1));
    expect(s.playerHand).toHaveLength(5);
    expect(s.aiHand).toHaveLength(5);
    expect(s.currentPlayer).toBe("player");
    expect(s.discardPile).toHaveLength(1);
    expect(s.drawPile).toHaveLength(32 - 11);
  });
});

describe("playerDraw — dobrovolné líznutí kdykoliv", () => {
  it("líznе i když má hráč hratelnou kartu, a předá tah AI", () => {
    // 8 srdce je hratelná na 9 srdce, ale líznutí je přesto povolené.
    const s = makeState();
    expect(playerPlayable(s).length).toBeGreaterThan(0);
    const next = playerDraw(s, seededRng(1));
    expect(next).not.toBeNull();
    expect(next!.playerHand.length).toBe(2);
    expect(next!.currentPlayer).toBe("ai");
  });

  it("líznе, když hráč nemá co hrát, a předá tah AI", () => {
    const s = makeState({
      playerHand: [card("kule", "9")], // na 9 srdce / barvu srdce nehratelná
      currentSuit: "srdce",
      discardPile: [card("srdce", "10")],
    });
    expect(playerPlayable(s)).toHaveLength(0);
    const next = playerDraw(s, seededRng(1));
    expect(next).not.toBeNull();
    expect(next!.playerHand.length).toBe(2);
    expect(next!.currentPlayer).toBe("ai");
  });

  it("u nakupených sedem vezme penaltu i se sedmou v ruce (lze ji schovat)", () => {
    // pendingSevens=2 → penalta 4 karty; hráč má sedmu, ale rozhodne se líznout.
    const s = makeState({
      playerHand: [card("srdce", "7"), card("kule", "9")],
      pendingSevens: 2,
      drawPile: [
        card("zelene", "10"),
        card("zaludy", "kral"),
        card("kule", "8"),
        card("srdce", "spodek"),
      ],
    });
    const next = playerDraw(s, seededRng(1));
    expect(next).not.toBeNull();
    expect(next!.playerHand.length).toBe(2 + 4); // 2 původní + penalta 4
    expect(next!.pendingSevens).toBe(0);
    expect(next!.currentPlayer).toBe("ai");
  });

  it("vrátí null, když hráč není na tahu", () => {
    expect(playerDraw(makeState({ currentPlayer: "ai" }), seededRng(1))).toBeNull();
  });

  it("vrátí null, když už je vítěz", () => {
    expect(playerDraw(makeState({ playerHand: [] }), seededRng(1))).toBeNull();
  });

  it("vrátí null při stallu (prázdný balíček, nelze remíchat)", () => {
    const s = makeState({
      playerHand: [card("kule", "9")],
      currentSuit: "srdce",
      discardPile: [card("srdce", "10")],
      drawPile: [],
    });
    expect(playerDraw(s, seededRng(1))).toBeNull();
  });
});

describe("playerPlay", () => {
  it("vrátí null, když hráč není na tahu", () => {
    const s = makeState({ currentPlayer: "ai" });
    expect(playerPlay(s, 0)).toBeNull();
  });

  it("vrátí null pro nehratelnou kartu", () => {
    const s = makeState({
      playerHand: [card("kule", "9")],
      currentSuit: "srdce",
      discardPile: [card("srdce", "10")],
    });
    expect(playerPlay(s, 0)).toBeNull();
  });

  it("zahraje obyčejnou kartu a předá tah AI", () => {
    const s = makeState();
    const next = playerPlay(s, 0);
    expect(next).not.toBeNull();
    expect(next!.playerHand).toHaveLength(0);
    expect(next!.currentPlayer).toBe("ai");
  });

  it("eso ponechá tah hráči", () => {
    const s = makeState({
      playerHand: [card("srdce", "eso"), card("kule", "8")],
    });
    const next = playerPlay(s, 0);
    expect(next).not.toBeNull();
    expect(next!.currentPlayer).toBe("player");
  });

  it("svršek bez barvy vrátí null, s barvou nastaví currentSuit", () => {
    const s = makeState({ playerHand: [card("srdce", "svrsek")] });
    expect(playerPlay(s, 0)).toBeNull();
    const next = playerPlay(s, 0, "kule");
    expect(next).not.toBeNull();
    expect(next!.currentSuit).toBe("kule");
  });

  it("chosenSuit u ne-svrška vrátí null", () => {
    const s = makeState();
    expect(playerPlay(s, 0, "kule")).toBeNull();
  });
});

describe("advanceAi", () => {
  it("dožene řetězené tahy AI po esu (hraje víckrát)", () => {
    const s = makeState({
      currentPlayer: "ai",
      aiHand: [card("srdce", "eso"), card("srdce", "8"), card("kule", "9")],
      discardPile: [card("srdce", "10")],
      currentSuit: "srdce",
    });
    const next = advanceAi(s, seededRng(1));
    // Zahrála eso (tah jí zůstal) i 8 srdce (předala tah) → ruka 3 → 1.
    expect(next.aiHand).toHaveLength(1);
    expect(next.currentPlayer).toBe("player");
  });

  it("nezacyklí se při stallu a vrátí beze změny", () => {
    const s = makeState({
      currentPlayer: "ai",
      aiHand: [card("kule", "9")], // na barvu srdce nehratelná
      currentSuit: "srdce",
      discardPile: [card("srdce", "10")],
      drawPile: [],
    });
    const next = advanceAi(s, seededRng(1));
    expect(next).toBe(s); // stejný stav, žádný posun, žádné zacyklení
  });

  it("nedělá nic, když už je vítěz", () => {
    const s = makeState({ currentPlayer: "ai", playerHand: [] });
    expect(advanceAi(s, seededRng(1))).toBe(s);
  });
});

describe("isPat", () => {
  // Pat: hráč na tahu nemá hratelnou kartu, balíček prázdný a hromádku nelze remíchat.
  const patBase = (): GameState =>
    makeState({
      playerHand: [card("kule", "9")], // na barvu srdce nehratelná
      currentSuit: "srdce",
      discardPile: [card("srdce", "10")], // length 1 → nelze remíchat
      drawPile: [],
    });

  it("je pat, když hráč nemůže hrát ani líznout", () => {
    expect(isPat(patBase())).toBe(true);
  });

  it("není pat, když lze líznout (balíček není prázdný)", () => {
    expect(isPat({ ...patBase(), drawPile: [card("zelene", "8")] })).toBe(false);
  });

  it("není pat, když lze remíchat (hromádka má víc než vrchní kartu)", () => {
    expect(
      isPat({ ...patBase(), discardPile: [card("srdce", "10"), card("zelene", "8")] }),
    ).toBe(false);
  });

  it("není pat, když má hráč hratelnou kartu", () => {
    expect(isPat({ ...patBase(), playerHand: [card("srdce", "8")] })).toBe(false);
  });

  it("není pat, když už je vítěz", () => {
    expect(isPat({ ...patBase(), playerHand: [] })).toBe(false);
  });

  it("zachytí i AI stall (currentPlayer === ai, AI nemůže hrát ani líznout)", () => {
    expect(isPat({ ...patBase(), currentPlayer: "ai", aiHand: [card("kule", "9")] })).toBe(true);
  });
});
