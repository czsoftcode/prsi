// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { vi } from "vitest";

// Modul má líně inicializovaný stav (cache úrovně) → pro každý test čerstvý
// dynamický import po resetModules, jinak by volba prosákla mezi testy.
describe("difficulty", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it("default je dospělý, když úložiště je prázdné", async () => {
    const { getAiLevel } = await import("./difficulty");
    expect(getAiLevel()).toBe("dospely");
  });

  it("setAiLevel uloží volbu a getAiLevel ji vrátí (perzistence)", async () => {
    const { setAiLevel, getAiLevel } = await import("./difficulty");
    setAiLevel("expert");
    expect(localStorage.getItem("prsi.difficulty")).toBe("expert");
    expect(getAiLevel()).toBe("expert");
  });

  it("uloženou úroveň přečte nová instance modulu z localStorage", async () => {
    localStorage.setItem("prsi.difficulty", "dite");
    const { getAiLevel } = await import("./difficulty");
    expect(getAiLevel()).toBe("dite");
  });

  it("poškozená/neznámá hodnota v úložišti spadne na default", async () => {
    localStorage.setItem("prsi.difficulty", "smazat-vse");
    const { getAiLevel } = await import("./difficulty");
    expect(getAiLevel()).toBe("dospely");
  });

  it("cycleAiLevel projde dítě→dospělý→expert a zacyklí zpět", async () => {
    localStorage.setItem("prsi.difficulty", "dite");
    const { cycleAiLevel, getAiLevel } = await import("./difficulty");
    expect(getAiLevel()).toBe("dite");
    expect(cycleAiLevel()).toBe("dospely");
    expect(cycleAiLevel()).toBe("expert");
    expect(cycleAiLevel()).toBe("dite"); // wrap zpět na začátek
    // a volba se průběžně ukládá (poslední krok)
    expect(localStorage.getItem("prsi.difficulty")).toBe("dite");
  });

  it("getAiLevel je no-throw a vrací default i bez localStorage", async () => {
    // Zuby: simuluj nedostupné úložiště (private mode) — getItem hodí výjimku.
    const orig = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error("localStorage nedostupné");
    };
    try {
      const { getAiLevel } = await import("./difficulty");
      expect(getAiLevel()).toBe("dospely");
    } finally {
      Storage.prototype.getItem = orig;
    }
  });

  it("setAiLevel nehodí ani když úložiště odmítá zápis (in-memory fallback)", async () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("kvóta překročena");
    };
    try {
      const { setAiLevel, getAiLevel } = await import("./difficulty");
      expect(() => setAiLevel("expert")).not.toThrow();
      expect(getAiLevel()).toBe("expert"); // platí aspoň pro relaci
    } finally {
      Storage.prototype.setItem = orig;
    }
  });
});
