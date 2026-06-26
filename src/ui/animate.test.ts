// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { animatePlay, clearAnim } from "./animate";
import type { Card } from "../engine/cards";

const CARD: Card = { suit: "srdce", rank: "7" };

/** Minimální DOMRect — animatePlay čte jen left/top/width/height. */
function rect(left: number, top: number, width: number, height: number): DOMRect {
  return { left, top, width, height } as DOMRect;
}

function setReducedMotion(matches: boolean): void {
  window.matchMedia = vi.fn().mockReturnValue({ matches }) as unknown as typeof window.matchMedia;
}

describe("animatePlay", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    // matchMedia v jsdom neexistuje — po mocku ho zase odeber.
    delete (window as unknown as { matchMedia?: unknown }).matchMedia;
  });

  it("při prefers-reduced-motion nevykreslí ghost a hned resolvuje", async () => {
    setReducedMotion(true);
    await animatePlay({ fromRect: rect(0, 0, 80, 120), toRect: rect(200, 50, 80, 120), card: CARD });
    expect(document.querySelector(".anim-ghost")).toBeNull();
  });

  it("při degenerované geometrii (nulové rect) ghost nevznikne", async () => {
    setReducedMotion(false);
    await animatePlay({ fromRect: rect(0, 0, 0, 0), toRect: rect(0, 0, 0, 0), card: CARD });
    expect(document.querySelector(".anim-ghost")).toBeNull();
  });

  it("ghost se vytvoří a po timeout fallbacku se uklidí, i bez transitionend", async () => {
    setReducedMotion(false);
    vi.useFakeTimers();
    const p = animatePlay({ fromRect: rect(0, 0, 80, 120), toRect: rect(200, 50, 80, 120), card: CARD });
    // Ghost letí — v DOM je přítomný.
    expect(document.querySelector(".anim-ghost")).not.toBeNull();
    // jsdom nikdy nepošle transitionend → uvolní až fallback timer.
    vi.advanceTimersByTime(1000);
    await p;
    expect(document.querySelector(".anim-ghost")).toBeNull();
  });

  it("clearAnim() smaže letící ghosty (přerušení novou partií)", () => {
    setReducedMotion(false);
    vi.useFakeTimers();
    void animatePlay({ fromRect: rect(0, 0, 80, 120), toRect: rect(200, 50, 80, 120), card: CARD });
    expect(document.querySelector(".anim-ghost")).not.toBeNull();
    clearAnim();
    expect(document.querySelector(".anim-ghost")).toBeNull();
  });
});
