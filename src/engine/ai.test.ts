import { describe, it, expect } from "vitest";
import { type Card, type GameState, type Suit } from "./cards";
import { playableCards, playCard, drawCard, standAce } from "./moves";
import { chooseAiMove } from "./ai";

const c = (suit: Suit, rank: Card["rank"]): Card => ({ suit, rank });
const sameCard = (a: Card, b: Card) => a.suit === b.suit && a.rank === b.rank;

/** Sestaví stav z dílčích polí; AI je na tahu, doplní rozumné defaulty. */
function makeState(partial: Partial<GameState>): GameState {
  const discardPile = partial.discardPile ?? [c("srdce", "kral")];
  return {
    playerHand: partial.playerHand ?? [],
    aiHand: partial.aiHand ?? [],
    drawPile: partial.drawPile ?? [c("kule", "8")],
    discardPile,
    currentSuit: partial.currentSuit ?? discardPile[discardPile.length - 1]!.suit,
    currentPlayer: partial.currentPlayer ?? "ai",
    pendingSevens: partial.pendingSevens ?? 0,
    pendingAces: partial.pendingAces ?? 0,
  };
}

describe("chooseAiMove — líznutí", () => {
  it("nemá hratelnou kartu → draw", () => {
    const state = makeState({
      discardPile: [c("srdce", "kral")],
      currentSuit: "srdce",
      aiHand: [c("kule", "8"), c("zelene", "9")],
    });
    expect(chooseAiMove(state)).toEqual({ type: "draw" });
  });
});

describe("chooseAiMove — nakupené sedmy", () => {
  it("pendingSevens > 0 a má sedmu → zahraje sedmu", () => {
    const state = makeState({
      discardPile: [c("srdce", "7")],
      currentSuit: "srdce",
      pendingSevens: 2,
      aiHand: [c("kule", "7"), c("srdce", "kral")],
    });
    const move = chooseAiMove(state);
    expect(move.type).toBe("play");
    if (move.type === "play") {
      expect(move.card.rank).toBe("7");
    }
  });

  it("pendingSevens > 0 a nemá sedmu → draw (i když má kartu v barvě)", () => {
    const state = makeState({
      discardPile: [c("srdce", "7")],
      currentSuit: "srdce",
      pendingSevens: 1,
      aiHand: [c("srdce", "kral"), c("kule", "8")],
    });
    expect(chooseAiMove(state)).toEqual({ type: "draw" });
  });
});

describe("chooseAiMove — vynucená barva (po svršku)", () => {
  it("zahraje jen kartu v aktuální barvě, ne v barvě vrchní karty", () => {
    // Vrchní je srdce-kral, ale aktuální barva je kule (soupeř hrál svrška).
    const state = makeState({
      discardPile: [c("srdce", "kral")],
      currentSuit: "kule",
      aiHand: [c("srdce", "9"), c("kule", "8")],
    });
    const move = chooseAiMove(state);
    expect(move.type).toBe("play");
    if (move.type === "play") {
      expect(move.card).toEqual(c("kule", "8"));
    }
  });
});

describe("chooseAiMove — priorita hodnot", () => {
  it("eso má přednost před obyčejnou kartou", () => {
    const state = makeState({
      discardPile: [c("srdce", "kral")],
      currentSuit: "srdce",
      aiHand: [c("srdce", "9"), c("srdce", "eso")],
    });
    const move = chooseAiMove(state);
    expect(move.type === "play" && move.card.rank).toBe("eso");
  });

  it("obyčejná karta má přednost před svrškem (svršek se drží)", () => {
    const state = makeState({
      discardPile: [c("srdce", "kral")],
      currentSuit: "srdce",
      aiHand: [c("srdce", "svrsek"), c("srdce", "9")],
    });
    const move = chooseAiMove(state);
    expect(move.type === "play" && move.card.rank).toBe("9");
  });

  it("sedma má přednost před obyčejnou kartou", () => {
    const state = makeState({
      discardPile: [c("srdce", "kral")],
      currentSuit: "srdce",
      aiHand: [c("srdce", "10"), c("srdce", "7")],
    });
    const move = chooseAiMove(state);
    expect(move.type === "play" && move.card.rank).toBe("7");
  });
});

describe("chooseAiMove — výběr barvy po svršku", () => {
  it("zvolí nejčastější barvu ve zbytku ruky", () => {
    const state = makeState({
      discardPile: [c("srdce", "kral")],
      currentSuit: "srdce",
      // jediná hratelná karta je svršek (srdce); zbytek je 2× kule, 1× zelene.
      aiHand: [c("srdce", "svrsek"), c("kule", "8"), c("kule", "9"), c("zelene", "10")],
    });
    const move = chooseAiMove(state);
    expect(move).toEqual({ type: "play", card: c("srdce", "svrsek"), chosenSuit: "kule" });
  });

  it("tie-break podle pořadí SUITS (zaludy < zelene < srdce < kule)", () => {
    const state = makeState({
      discardPile: [c("srdce", "kral")],
      currentSuit: "srdce",
      // zbytek: 1× kule, 1× zelene → remíza; SUITS pořadí preferuje zelene.
      aiHand: [c("srdce", "svrsek"), c("kule", "8"), c("zelene", "9")],
    });
    const move = chooseAiMove(state);
    expect(move.type === "play" && move.chosenSuit).toBe("zelene");
  });

  it("svršek jako poslední karta → chosenSuit je platná barva (SUITS[0])", () => {
    const state = makeState({
      discardPile: [c("srdce", "kral")],
      currentSuit: "srdce",
      aiHand: [c("srdce", "svrsek")],
    });
    const move = chooseAiMove(state);
    expect(move).toEqual({ type: "play", card: c("srdce", "svrsek"), chosenSuit: "zaludy" });
  });
});

describe("chooseAiMove — invariant: vrácený tah je vždy proveditelný", () => {
  const rng = () => 0;
  const states: GameState[] = [
    // bez hratelné karty → draw
    makeState({ currentSuit: "srdce", aiHand: [c("kule", "8"), c("zelene", "9")] }),
    // obyčejná shoda
    makeState({ currentSuit: "srdce", aiHand: [c("srdce", "9"), c("kule", "10")] }),
    // eso
    makeState({ currentSuit: "srdce", aiHand: [c("srdce", "eso"), c("srdce", "9")] }),
    // svršek (jediná hratelná)
    makeState({
      currentSuit: "srdce",
      aiHand: [c("srdce", "svrsek"), c("kule", "8"), c("kule", "9")],
    }),
    // nakupené sedmy se sedmou
    makeState({
      discardPile: [c("srdce", "7")],
      currentSuit: "srdce",
      pendingSevens: 3,
      aiHand: [c("kule", "7"), c("srdce", "kral")],
    }),
    // nakupené sedmy bez sedmy → draw
    makeState({
      discardPile: [c("srdce", "7")],
      currentSuit: "srdce",
      pendingSevens: 1,
      aiHand: [c("srdce", "kral")],
    }),
  ];

  it.each(states.map((s, i) => [i, s] as const))(
    "stav #%i: tah projde playCard/drawCard bez chyby a hraje jen platnou kartu",
    (_i, state) => {
      const move = chooseAiMove(state);
      if (move.type === "draw") {
        expect(() => drawCard(state, "ai", rng)).not.toThrow();
        return;
      }
      if (move.type === "stand") {
        expect(state.pendingAces).toBeGreaterThan(0);
        expect(() => standAce(state, "ai")).not.toThrow();
        return;
      }
      const top = state.discardPile[state.discardPile.length - 1]!;
      const playable = playableCards(
        state.aiHand,
        top,
        state.currentSuit,
        state.pendingSevens,
        state.pendingAces,
      );
      expect(playable.some((card) => sameCard(card, move.card))).toBe(true);
      expect(() => playCard(state, "ai", move.card, move.chosenSuit)).not.toThrow();
    },
  );
});

describe("chooseAiMove — nakupená esa", () => {
  it("pendingAces > 0 a má eso → přebije (zahraje eso)", () => {
    const state = makeState({
      discardPile: [c("srdce", "eso")],
      currentSuit: "srdce",
      pendingAces: 1,
      aiHand: [c("kule", "eso"), c("srdce", "kral")],
    });
    const move = chooseAiMove(state);
    expect(move.type).toBe("play");
    if (move.type === "play") {
      expect(move.card.rank).toBe("eso");
    }
  });

  it("pendingAces > 0 a nemá eso → stand (i když má kartu v barvě)", () => {
    const state = makeState({
      discardPile: [c("srdce", "eso")],
      currentSuit: "srdce",
      pendingAces: 2,
      aiHand: [c("srdce", "kral"), c("kule", "8")],
    });
    expect(chooseAiMove(state)).toEqual({ type: "stand" });
  });
});

describe("chooseAiMove — čistota", () => {
  it("nemodifikuje vstupní stav", () => {
    const state = makeState({
      currentSuit: "srdce",
      aiHand: [c("srdce", "svrsek"), c("kule", "8")],
    });
    const snapshot = JSON.stringify(state);
    chooseAiMove(state);
    expect(JSON.stringify(state)).toBe(snapshot);
  });
});
