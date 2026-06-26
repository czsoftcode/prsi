// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";

// Zvuk konce hry (fanfára/defeat) musí zaznít PRÁVĚ JEDNOU ve chvíli, kdy partie
// skončí — ne při každém dalším renderu téhož skončeného stavu — a po nové partii
// smí zaznít znovu. main.ts je uzavřený modul bez exportů (stav i draw() jsou v
// closure), takže ho řídíme přes mocky závislostí: ./game určuje výsledek
// (winnerOf/isPat), ./overlay zachytí callback nové partie, ./render je no-op
// (kreslení netestujeme tady — to dělá render.test.ts). Heavy mocky proto NEsmí
// být v main.test.ts (ten ověřuje reálný bootstrap), odtud separátní soubor.
//
// Re-render bez změny herního stavu pošleme přes tlačítko "Motiv" (onChooseTheme
// volá draw() bezpodmínečně). Protože render je mockovaný, #app si naplníme
// tlačítky ručně — delegovaný listener na #app je přežije.

vi.mock("./render", () => ({ render: vi.fn() }));
vi.mock("./audio", () => ({
  playWin: vi.fn(),
  playLose: vi.fn(),
  playPlay: vi.fn(),
  playDraw: vi.fn(),
  initAudioUnlock: vi.fn(),
  startMusic: vi.fn(),
  stopMusic: vi.fn(),
  isMusicEnabled: vi.fn(() => true),
  setMusicEnabled: vi.fn(),
}));
vi.mock("./theme", () => ({
  setActiveTheme: vi.fn(),
  getActiveTheme: vi.fn(() => "01"),
  listThemes: vi.fn(() => ["01"]),
  DEFAULT_THEME: "01",
}));
vi.mock("./animate", () => ({
  clearAnim: vi.fn(),
  animatePlay: vi.fn(() => Promise.resolve()),
  animateDraw: vi.fn(() => Promise.resolve()),
}));
vi.mock("./overlay", () => ({
  chooseSuit: vi.fn(() => Promise.resolve(null)),
  chooseTheme: vi.fn(() => Promise.resolve("02")),
  showEndOverlay: vi.fn(),
}));
vi.mock("./game", () => ({
  createGame: vi.fn(() => ({ currentPlayer: "player" })),
  playerPlay: vi.fn(() => null),
  playerDraw: vi.fn(() => null),
  advanceAi: vi.fn((s) => s),
  playerPlayable: vi.fn(() => []),
  winnerOf: vi.fn(() => null),
  isPat: vi.fn(() => false),
}));

/** Doběhne mikro/makro fronty (onChooseTheme awaituje chooseTheme). */
const flush = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

/** Klikne na delegovaný listener #app přes tlačítko dané akce. */
function clickAction(action: string): void {
  const btn = document.querySelector<HTMLButtonElement>(
    `#app [data-action='${action}']`,
  )!;
  btn.click();
}

describe("main: zvuk konce hry", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    // #app s tlačítky, která render (mock) nepřekreslí → listener je přežije.
    document.body.innerHTML =
      '<div id="app">' +
      "<button data-action='theme'></button>" +
      "<button data-action='draw'></button>" +
      "<button data-action='music'></button>" +
      "</div>";
  });

  it("fanfára zazní právě jednou při výhře a NE při dalším renderu", async () => {
    const game = await import("./game");
    const audio = await import("./audio");
    const overlay = await import("./overlay");
    // Start: hra ještě běží → bootstrap draw() nesmí přehrát nic.
    vi.mocked(game.winnerOf).mockReturnValue(null);
    await import("./main");
    expect(audio.playWin).not.toHaveBeenCalled();

    // Příští draw() už hru ukončí výhrou hráče.
    vi.mocked(game.winnerOf).mockReturnValue("player");
    clickAction("theme");
    await flush();
    expect(audio.playWin).toHaveBeenCalledTimes(1);
    expect(overlay.showEndOverlay).toHaveBeenCalledTimes(1);

    // Další re-render téhož skončeného stavu už fanfáru nezopakuje (guard `ended`).
    clickAction("theme");
    await flush();
    expect(audio.playWin).toHaveBeenCalledTimes(1);
    expect(overlay.showEndOverlay).toHaveBeenCalledTimes(1);
  });

  it("prohra přehraje defeat (a ne fanfáru)", async () => {
    const game = await import("./game");
    const audio = await import("./audio");
    vi.mocked(game.winnerOf).mockReturnValue("ai");
    await import("./main"); // bootstrap draw() rovnou skončí hru prohrou
    expect(audio.playLose).toHaveBeenCalledTimes(1);
    expect(audio.playWin).not.toHaveBeenCalled();
  });

  it("po nové partii může fanfára zaznít znovu", async () => {
    const game = await import("./game");
    const audio = await import("./audio");
    const overlay = await import("./overlay");
    vi.mocked(game.winnerOf).mockReturnValue("player");
    await import("./main"); // výhra → fanfára #1, showEndOverlay zachytí newGame
    expect(audio.playWin).toHaveBeenCalledTimes(1);

    // showEndOverlay(message, onNewGame) → spustíme novou partii jako klik hráče.
    const onNewGame = vi.mocked(overlay.showEndOverlay).mock.calls[0]![1];
    onNewGame(); // reset ended=false, nový stav, draw() → opět výhra
    expect(audio.playWin).toHaveBeenCalledTimes(2);
  });

  it("pat (remíza) nepřehraje žádný zvuk konce", async () => {
    const game = await import("./game");
    const audio = await import("./audio");
    vi.mocked(game.winnerOf).mockReturnValue(null);
    vi.mocked(game.isPat).mockReturnValue(true);
    await import("./main"); // bootstrap draw() → pat overlay, ale ticho
    expect(audio.playWin).not.toHaveBeenCalled();
    expect(audio.playLose).not.toHaveBeenCalled();
  });

  it("hudba se zastaví při konci hry a restartuje při nové partii", async () => {
    const game = await import("./game");
    const audio = await import("./audio");
    const overlay = await import("./overlay");
    vi.mocked(game.winnerOf).mockReturnValue("player");
    await import("./main"); // konec hry → stopMusic; startMusic zatím 0×
    expect(audio.stopMusic).toHaveBeenCalledTimes(1);
    expect(audio.startMusic).not.toHaveBeenCalled();

    const onNewGame = vi.mocked(overlay.showEndOverlay).mock.calls[0]![1];
    onNewGame(); // nová partie → restart smyčky
    expect(audio.startMusic).toHaveBeenCalledTimes(1);
  });

  it("klik na vypínač přepne hudbu i při locked (handler je před zámkem)", async () => {
    // Ověřuje LOGIKU handleru, ne fyzickou dosažitelnost: klik míří přímo na
    // tlačítko, takže obchází z-index/hit-testing overlaye. Reálně je vypínač
    // klikatelný v okně AI prodlevy (locked=true, bez overlaye) — pod end-overlayem
    // je překrytý. Test drží kontrakt "obsluha běží i když locked".
    const game = await import("./game");
    const audio = await import("./audio");
    vi.mocked(game.winnerOf).mockReturnValue("player"); // konec → locked=true
    vi.mocked(audio.isMusicEnabled).mockReturnValue(true);
    await import("./main");
    clickAction("music");
    expect(audio.setMusicEnabled).toHaveBeenCalledWith(false); // true → toggle → false
  });
});
