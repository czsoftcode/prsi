import { describe, it, expect } from "vitest";
import type { Card, GameState, Rng, Suit } from "../engine/cards";
import {
  createGame,
  playerPlay,
  playerDraw,
  playerStand,
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
    pendingAces: 0,
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

  it("vrátí null pod nakupenými esy (líznout nelze, jen přebít nebo stát)", () => {
    const s = makeState({
      playerHand: [card("kule", "8")],
      discardPile: [card("srdce", "eso")],
      currentSuit: "srdce",
      pendingAces: 1,
    });
    expect(playerDraw(s, seededRng(1))).toBeNull();
  });
});

describe("playerStand — stání proti nakupeným esům", () => {
  it("stojí, vynuluje pendingAces a předá tah AI (bez líznutí)", () => {
    const s = makeState({
      playerHand: [card("kule", "8"), card("zelene", "9")],
      discardPile: [card("srdce", "eso")],
      currentSuit: "srdce",
      pendingAces: 2,
    });
    const next = playerStand(s);
    expect(next).not.toBeNull();
    expect(next!.currentPlayer).toBe("ai");
    expect(next!.pendingAces).toBe(0);
    expect(next!.playerHand).toHaveLength(2); // nelíže
  });

  it("vrátí null, když žádná esa nemíří (pendingAces === 0)", () => {
    expect(playerStand(makeState({ pendingAces: 0 }))).toBeNull();
  });

  it("vrátí null, když hráč není na tahu", () => {
    expect(playerStand(makeState({ currentPlayer: "ai", pendingAces: 1 }))).toBeNull();
  });

  it("vrátí null, když už je vítěz", () => {
    expect(playerStand(makeState({ playerHand: [], pendingAces: 1 }))).toBeNull();
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

  it("eso předá tah AI a nastaví pendingAces (čekací stav)", () => {
    const s = makeState({
      playerHand: [card("srdce", "eso"), card("kule", "8")],
    });
    const next = playerPlay(s, 0);
    expect(next).not.toBeNull();
    expect(next!.currentPlayer).toBe("ai");
    expect(next!.pendingAces).toBe(1);
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
  it("eso AI předá tah hráči do čekacího stavu (nehraje dál)", () => {
    const s = makeState({
      currentPlayer: "ai",
      aiHand: [card("srdce", "eso"), card("srdce", "8"), card("kule", "9")],
      discardPile: [card("srdce", "10")],
      currentSuit: "srdce",
    });
    const next = advanceAi(s, seededRng(1));
    // Zahrála eso → tah jde hráči (čekací stav), AI dál nehraje.
    expect(next.aiHand).toHaveLength(2);
    expect(next.currentPlayer).toBe("player");
    expect(next.pendingAces).toBe(1);
  });

  it("AI přebije eso vlastním esem (řetězení), tah jde zpět hráči", () => {
    const s = makeState({
      currentPlayer: "ai",
      aiHand: [card("kule", "eso"), card("srdce", "9")],
      discardPile: [card("srdce", "eso")],
      currentSuit: "srdce",
      pendingAces: 1,
    });
    const next = advanceAi(s, seededRng(1));
    expect(next.currentPlayer).toBe("player");
    expect(next.pendingAces).toBe(2);
    expect(next.aiHand).toHaveLength(1);
  });

  it("AI bez esa pod nakupenými esy stojí (přijde o tah, nelíže)", () => {
    const s = makeState({
      currentPlayer: "ai",
      aiHand: [card("srdce", "9"), card("kule", "8")],
      discardPile: [card("srdce", "eso")],
      currentSuit: "srdce",
      pendingAces: 1,
    });
    const next = advanceAi(s, seededRng(1));
    expect(next.currentPlayer).toBe("player");
    expect(next.pendingAces).toBe(0);
    expect(next.aiHand).toHaveLength(2); // stání nelíže
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

  it("není pat pod nakupenými esy (stání je vždy dostupné)", () => {
    // jinak by to byl pat (prázdný balíček, nehratelná ruka), ale stání hru posune
    expect(isPat({ ...patBase(), discardPile: [card("srdce", "eso")], pendingAces: 1 })).toBe(
      false,
    );
  });
});
