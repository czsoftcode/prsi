import { describe, it, expect } from "vitest";
import {
  createDeck,
  shuffle,
  deal,
  SUITS,
  type GameState,
  type Player,
  type Rng,
} from "./cards";
import { playableCards, playCard, drawCard, winnerOf } from "./moves";
import { chooseAiMove } from "./ai";

/** Mulberry32 — stejný deterministický RNG jako v ostatních testech. */
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

type Outcome = Player | "pat";

/**
 * Zahraje jednu celou partii determinicky od rozdání po konec.
 * - AI (obě strany) = chooseAiMove pro AI tah, "první hratelná karta nebo líz" pro player tah.
 * - Invarianty se ověřují po každém tahu přes expect() — selhání okamžitě hodí z it bloku.
 * - Nad MAX_TURNS vyhodí Error → test padne.
 */
function simulateGame(seed: number, firstPlayer: Player): { turns: number; outcome: Outcome } {
  const rng = seededRng(seed);
  let state: GameState = deal(shuffle(createDeck(), rng));
  if (firstPlayer === "ai") {
    state = { ...state, currentPlayer: "ai" };
  }

  const MAX_TURNS = 2000;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    // Výhra
    const winner = winnerOf(state);
    if (winner !== null) {
      return { turns: turn, outcome: winner };
    }

    // Pat: aktuální hráč nemá co hrát a nemůže líznout
    const hand = state.currentPlayer === "player" ? state.playerHand : state.aiHand;
    const top = state.discardPile[state.discardPile.length - 1]!;
    const playable = playableCards(hand, top, state.currentSuit, state.pendingSevens);
    const canDraw = state.drawPile.length > 0 || state.discardPile.length > 1;
    if (playable.length === 0 && !canDraw) {
      return { turns: turn, outcome: "pat" };
    }

    // Invarianty po každém tahu
    const totalCards =
      state.playerHand.length +
      state.aiHand.length +
      state.drawPile.length +
      state.discardPile.length;
    expect(totalCards, `tah ${turn}: součet karet není 32`).toBe(32);
    expect(SUITS, `tah ${turn}: neplatná currentSuit`).toContain(state.currentSuit);
    expect(state.pendingSevens, `tah ${turn}: pendingSevens mimo rozsah`).toBeGreaterThanOrEqual(0);
    expect(state.pendingSevens, `tah ${turn}: pendingSevens > 4`).toBeLessThanOrEqual(4);

    // Tah
    const player = state.currentPlayer;
    if (player === "ai") {
      const move = chooseAiMove(state);
      if (move.type === "play") {
        state = playCard(state, "ai", move.card, move.chosenSuit);
      } else {
        const next = drawCard(state, "ai", rng);
        // Bezpečnostní síť: drawCard vrátilo stejný stav (nic k lízání) — pat detekce ho
        // měla chytit výš, ale pro jistotu nekončíme smyčkou.
        if (next === state) return { turns: turn, outcome: "pat" };
        state = next;
      }
    } else {
      if (playable.length > 0) {
        const card = playable[0]!;
        // Svršek: bot vybere první barvu ze SUITS deterministicky.
        const chosenSuit = card.rank === "svrsek" ? SUITS[0] : undefined;
        state = playCard(state, "player", card, chosenSuit);
      } else {
        const next = drawCard(state, "player", rng);
        if (next === state) return { turns: turn, outcome: "pat" };
        state = next;
      }
    }
  }

  throw new Error(
    `Partie neskončila do ${MAX_TURNS} tahů (seed=${seed}, firstPlayer=${firstPlayer})`,
  );
}

describe("E2E simulace 200 partií", () => {
  for (let seed = 1; seed <= 100; seed++) {
    for (const firstPlayer of ["player", "ai"] as const) {
      it(`seed=${seed}, začíná ${firstPlayer}`, () => {
        const { outcome } = simulateGame(seed, firstPlayer);
        expect(["player", "ai", "pat"]).toContain(outcome);
      });
    }
  }
});
