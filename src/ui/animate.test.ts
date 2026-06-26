// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { animatePlay, animateDraw, clearAnim } from "./animate";
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

describe("animateDraw", () => {
  const FROM = rect(140, 200, 80, 120); // lízací balíček
  const TO = rect(20, 400, 80, 120); // zóna ruky

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete (window as unknown as { matchMedia?: unknown }).matchMedia;
  });

  it("při prefers-reduced-motion nevykreslí žádný rub a hned resolvuje", async () => {
    setReducedMotion(true);
    await animateDraw({ fromRect: FROM, toRect: TO, count: 1 });
    expect(document.querySelector(".anim-ghost")).toBeNull();
  });

  it("při degenerované geometrii (nulové rect) žádný rub nevznikne", async () => {
    setReducedMotion(false);
    await animateDraw({ fromRect: rect(0, 0, 0, 0), toRect: rect(0, 0, 0, 0), count: 1 });
    expect(document.querySelector(".anim-ghost")).toBeNull();
  });

  it("jeden rub se vytvoří a po fallbacku se uklidí (bez transitionend)", async () => {
    setReducedMotion(false);
    vi.useFakeTimers();
    const p = animateDraw({ fromRect: FROM, toRect: TO, count: 1 });
    vi.advanceTimersByTime(10); // stagger i=0 má timeout 0 → ghost vznikne
    expect(document.querySelectorAll(".anim-ghost")).toHaveLength(1);
    vi.advanceTimersByTime(2000); // jsdom neposílá transitionend → uklidí fallback
    await p;
    expect(document.querySelector(".anim-ghost")).toBeNull();
  });

  it("braní 8 karet pošle nejvýš cap rubů (DRAW_MAX_GHOSTS) a všechny doletí", async () => {
    setReducedMotion(false);
    vi.useFakeTimers();
    const p = animateDraw({ fromRect: FROM, toRect: TO, count: 8 });
    // V čase 300 ms jsou všechny staggerované starty odpálené (3*80=240) a žádný
    // fallback (380 ms) ještě neuklidil → vidíme přesně cap = 4 ruby.
    vi.advanceTimersByTime(300);
    expect(document.querySelectorAll(".anim-ghost")).toHaveLength(4);
    vi.advanceTimersByTime(2000);
    await p;
    expect(document.querySelector(".anim-ghost")).toBeNull();
  });

  it("clearAnim() smaže letící ruby", () => {
    setReducedMotion(false);
    vi.useFakeTimers();
    void animateDraw({ fromRect: FROM, toRect: TO, count: 3 });
    vi.advanceTimersByTime(300);
    expect(document.querySelectorAll(".anim-ghost").length).toBeGreaterThan(0);
    clearAnim();
    expect(document.querySelector(".anim-ghost")).toBeNull();
  });
});
