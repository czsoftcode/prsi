// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";

// Smoke test vstupního bodu: ověřuje, že bootstrap main.ts skutečně vykreslí stůl
// do #app (chytí chyby typu ReferenceError z pořadí deklarací / TDZ, které unit
// testy render/game nezachytí, protože main.ts neimportují).

describe("main bootstrap", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  it("vykreslí herní stůl s rukou hráče do #app", async () => {
    await import("./main");
    const app = document.querySelector("#app")!;
    expect(app.classList.contains("prsi-table")).toBe(true);
    // Po rozdání má hráč 5 karet lícem.
    expect(app.querySelectorAll(".hand--player .card--face")).toHaveLength(5);
    expect(app.querySelectorAll(".hand--ai .card--back")).toHaveLength(5);
  });
});
