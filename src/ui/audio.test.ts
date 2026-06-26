// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// jsdom neimplementuje HTMLMediaElement.prototype.play — mockujeme ho, ať testy
// ověřují náš kontrakt (fire-and-forget, spolknutí odmítnutí, odemčení gestem),
// ne chování jsdomu. resetModules: modul má stav (unlocked/armed/elements), který
// chceme pro každý test čerstvý → dynamický import.
describe("audio", () => {
  let playSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    playSpy = vi.fn(() => Promise.resolve());
    HTMLMediaElement.prototype.play = playSpy as unknown as () => Promise<void>;
    // pause() jsdom také neimplementuje (volá ho unlock při restore) — utiš ho
    HTMLMediaElement.prototype.pause = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("playDraw a playPlay přehrají zvuk (jedno play na volání)", async () => {
    const { playDraw, playPlay } = await import("./audio");
    playDraw();
    expect(playSpy).toHaveBeenCalledTimes(1);
    playPlay();
    expect(playSpy).toHaveBeenCalledTimes(2);
  });

  it("playWin a playLose přehrají zvuk (jedno play na volání)", async () => {
    const { playWin, playLose } = await import("./audio");
    playWin();
    expect(playSpy).toHaveBeenCalledTimes(1);
    playLose();
    expect(playSpy).toHaveBeenCalledTimes(2);
  });

  it("playWin/playLose mapují na fanfaru/defeat (správné MP3 cesty)", async () => {
    // Zuby: zachyť src klonu, který se reálně přehrává (ne jen přednačtený uzel).
    const srcs: string[] = [];
    playSpy.mockImplementation(function (this: HTMLAudioElement) {
      srcs.push(this.src);
      return Promise.resolve();
    });
    const { playWin, playLose } = await import("./audio");
    playWin();
    playLose();
    expect(srcs[0]).toContain("sounds/fanfara.mp3");
    expect(srcs[1]).toContain("sounds/defeat.mp3");
  });

  it("playWin/playLose jsou bez Audia no-op (test/SSR)", async () => {
    vi.stubGlobal("Audio", undefined);
    const { playWin, playLose } = await import("./audio");
    expect(() => playWin()).not.toThrow();
    expect(() => playLose()).not.toThrow();
    expect(playSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("odmítnutý play() Promise se spolkne (.catch) a nevyhodí (autoplay policy)", async () => {
    // Deterministicky (bez časování unhandledRejection): ověř, že na odmítnutý
    // Promise z play() byl reálně připojen .catch. Spy zároveň přebírá originál,
    // takže rejekce zůstává ošetřená a nehlásí se jako unhandled.
    const { playDraw } = await import("./audio");
    // rejekci vytvoř až PO importu — žádný await mezi ní a playDraw(), jinak by ji
    // Node v mezeře označil za unhandled dřív, než swallow() připojí .catch
    const rejected = Promise.reject(new Error("autoplay blocked"));
    const catchSpy = vi.spyOn(rejected, "catch");
    playSpy.mockReturnValue(rejected);
    expect(() => playDraw()).not.toThrow();
    expect(catchSpy).toHaveBeenCalled(); // swallow() připojil handler
  });

  it("bez Audia v prostředí je přehrání no-op", async () => {
    vi.stubGlobal("Audio", undefined);
    const { playDraw } = await import("./audio");
    expect(() => playDraw()).not.toThrow();
    expect(playSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("odemkne zvuk až na první gesto uživatele; další gesto je no-op", async () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { initAudioUnlock } = await import("./audio");
    initAudioUnlock();
    initAudioUnlock(); // opakované volání nesmí zdvojit listenery
    expect(playSpy).not.toHaveBeenCalled(); // bez gesta zatím nic

    window.dispatchEvent(new Event("pointerdown"));
    // odemčení krátce (muted) prohraje všechny čtyři přednačtené uzly
    expect(playSpy).toHaveBeenCalledTimes(4);
    // …a OBA listenery se reálně odeberou (zuby: jinak by test odhalil leak jen
    // díky unlocked-guardu, ne díky removeEventListener)
    expect(removeSpy).toHaveBeenCalledWith("pointerdown", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));

    window.dispatchEvent(new Event("pointerdown")); // listener byl odebrán
    window.dispatchEvent(new Event("keydown"));
    expect(playSpy).toHaveBeenCalledTimes(4); // beze změny
  });
});
