// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { chooseTheme, showEndOverlay } from "./overlay";
import { getActiveTheme, listThemes } from "./theme";

describe("showEndOverlay", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("zobrazí overlay s daným textem a tlačítkem Nová partie", () => {
    showEndOverlay("Vyhrál jsi!", () => {});
    const overlay = document.querySelector(".overlay--end");
    expect(overlay).not.toBeNull();
    expect(overlay?.querySelector(".overlay__title")?.textContent).toBe("Vyhrál jsi!");
    expect(overlay?.querySelector(".overlay__newgame")?.textContent).toBe("Nová partie");
  });

  it("klik na Nová partie zavolá callback a overlay odstraní", () => {
    let calls = 0;
    showEndOverlay("Remíza!", () => {
      calls++;
    });
    const btn = document.querySelector<HTMLButtonElement>(".overlay__newgame")!;
    btn.click();
    expect(calls).toBe(1);
    expect(document.querySelector(".overlay--end")).toBeNull();
  });
});

describe("chooseTheme", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("vykreslí jedno tlačítko na motiv, každé s náhledem (4 karty + rub)", () => {
    void chooseTheme();
    const btns = document.querySelectorAll(".overlay--theme .overlay__theme-btn");
    expect(btns).toHaveLength(listThemes().length);
    btns.forEach((btn) => {
      expect(btn.querySelectorAll(".overlay__theme-card")).toHaveLength(5);
    });
  });

  it("zvýrazní právě aktivní motiv", () => {
    void chooseTheme();
    const active = document.querySelectorAll(".overlay__theme-btn--active");
    expect(active).toHaveLength(1);
    expect((active[0] as HTMLElement).dataset.theme).toBe(getActiveTheme());
  });

  it("klik na motiv resolvuje jeho NN a overlay odstraní", async () => {
    const promise = chooseTheme();
    const btn = document.querySelector<HTMLButtonElement>(
      ".overlay__theme-btn[data-theme]",
    )!;
    const id = btn.dataset.theme!;
    btn.click();
    await expect(promise).resolves.toBe(id);
    expect(document.querySelector(".overlay--theme")).toBeNull();
  });

  it("klik mimo box resolvuje null a overlay odstraní", async () => {
    const promise = chooseTheme();
    const backdrop = document.querySelector<HTMLElement>(".overlay--theme")!;
    backdrop.click(); // cíl == backdrop (ne tlačítko) → zrušení
    await expect(promise).resolves.toBeNull();
    expect(document.querySelector(".overlay--theme")).toBeNull();
  });
});
