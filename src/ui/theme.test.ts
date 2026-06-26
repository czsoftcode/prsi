import { describe, it, expect, afterEach, vi } from "vitest";

// theme.ts má modulový stav (cache aktivního motivu) — pro čistý stav v každém
// testu modul znovu importujeme přes vi.resetModules() + dynamic import.
async function freshTheme() {
  vi.resetModules();
  return import("./theme");
}

// Pomocná in-memory náhrada localStorage.
function memStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, v),
  };
}

describe("theme persistence", () => {
  const original = globalThis.localStorage;

  afterEach(() => {
    // obnovit původní stav globálu (v node prostředí typicky undefined)
    (globalThis as unknown as { localStorage?: unknown }).localStorage = original;
  });

  it("výchozí motiv je 01, když nic není uloženo", async () => {
    (globalThis as unknown as { localStorage?: unknown }).localStorage = memStorage();
    const { getActiveTheme, DEFAULT_THEME } = await freshTheme();
    expect(DEFAULT_THEME).toBe("01");
    expect(getActiveTheme()).toBe("01");
  });

  it("set -> get vrátí nastavený motiv", async () => {
    (globalThis as unknown as { localStorage?: unknown }).localStorage = memStorage();
    const { getActiveTheme, setActiveTheme } = await freshTheme();
    setActiveTheme("02");
    expect(getActiveTheme()).toBe("02");
  });

  it("uloženou hodnotu načte při startu (persistence)", async () => {
    const store = memStorage();
    (globalThis as unknown as { localStorage?: unknown }).localStorage = store;
    const first = await freshTheme();
    first.setActiveTheme("02");
    // nový import (jiná "session") se stejným úložištěm
    const second = await freshTheme();
    expect(second.getActiveTheme()).toBe("02");
  });

  it("nedostupné localStorage nezpůsobí pád: fallback na default a in-memory set", async () => {
    const throwing = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    (globalThis as unknown as { localStorage?: unknown }).localStorage = throwing;
    const { getActiveTheme, setActiveTheme } = await freshTheme();
    expect(getActiveTheme()).toBe("01"); // čtení spadlo -> default
    expect(() => setActiveTheme("02")).not.toThrow();
    expect(getActiveTheme()).toBe("02"); // in-memory drží i bez úložiště
  });
});
