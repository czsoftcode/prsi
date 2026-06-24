// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { showEndOverlay } from "./overlay";

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
