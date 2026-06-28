// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";

// Smoke test vstupního bodu: ověřuje, že bootstrap main.ts skutečně vykreslí stůl
// do #app (chytí chyby typu ReferenceError z pořadí deklarací / TDZ, které unit
// testy render/game nezachytí, protože main.ts neimportují).

describe("main bootstrap", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    // main.ts se bootstrapuje jen jednou při importu; pro každý test ho chceme
    // znovu spustit proti čerstvému #app, jinak druhý import vrátí cache bez render.
    vi.resetModules();
  });

  it("vykreslí herní stůl s rukou hráče do #app", async () => {
    await import("./main");
    const app = document.querySelector("#app")!;
    expect(app.classList.contains("prsi-table")).toBe(true);
    // Po rozdání má hráč 5 karet lícem.
    expect(app.querySelectorAll(".hand--player .card--face")).toHaveLength(5);
    expect(app.querySelectorAll(".hand--ai .card--back")).toHaveLength(5);
  });

  it("klik na tlačítko Motiv otevře overlay výběru motivu", async () => {
    await import("./main");
    const btn = document.querySelector<HTMLButtonElement>(
      "#app [data-action='theme']",
    )!;
    btn.click();
    expect(document.querySelector(".overlay--theme")).not.toBeNull();
  });

  it("klik na tlačítko obtížnosti cykluje úroveň a překreslí popisek", async () => {
    localStorage.clear(); // začni od defaultu (dospělý), ať je cyklus deterministický
    await import("./main");
    const sel = "#app [data-action='difficulty']";
    expect(
      document.querySelector<HTMLButtonElement>(sel)!.getAttribute("aria-label"),
    ).toBe("Obtížnost: dospělý");
    document.querySelector<HTMLButtonElement>(sel)!.click();
    // dospělý → expert (cyklus dítě→dospělý→expert→dítě); po překreslení nový label
    expect(
      document.querySelector<HTMLButtonElement>(sel)!.getAttribute("aria-label"),
    ).toBe("Obtížnost: expert");
    expect(localStorage.getItem("prsi.difficulty")).toBe("expert");
  });
});
