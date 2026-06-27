import { describe, it, expect } from "vitest";
import { createDeck } from "../engine/cards";
import { cardSrc, tableBgImageSet } from "./assets";
import { getActiveTheme } from "./theme";
import {
  REQUIRED_THEME_FILES,
  isValidThemeId,
  hasAllRequiredCardFiles,
  dashboardFileNames,
  RUB_FILE,
  suitIconFileName,
  cardFileName,
} from "./theme-assets";
import { SUITS } from "../engine/cards";

// Odebere adresářový prefix z cesty assetu ("/cards_01/srdce-07.png" -> "srdce-07.png").
function fileName(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
}

describe("isValidThemeId", () => {
  it("přijme přesně dvojciferné NN", () => {
    expect(isValidThemeId("01")).toBe(true);
    expect(isValidThemeId("27")).toBe(true);
  });

  it("odmítne jednociferné, tříciferné, nečíselné i prázdné", () => {
    for (const bad of ["6", "1", "100", "abc", "0a", "", " 1", "1 "]) {
      expect(isValidThemeId(bad)).toBe(false);
    }
  });
});

describe("REQUIRED_THEME_FILES — kompletní sada", () => {
  it("obsahuje 37 souborů: 32 líců + rub + 4 ikony barev", () => {
    expect(REQUIRED_THEME_FILES).toHaveLength(37);
    expect(REQUIRED_THEME_FILES).toContain(RUB_FILE);
    for (const suit of SUITS) {
      expect(REQUIRED_THEME_FILES).toContain(suitIconFileName(suit));
    }
  });

  it("kompletní složka projde reálným predikátem hasAllRequiredCardFiles", () => {
    expect(hasAllRequiredCardFiles(REQUIRED_THEME_FILES)).toBe(true);
  });

  it("soubor navíc nevadí (subset-check, ne přesná shoda)", () => {
    expect(hasAllRequiredCardFiles([...REQUIRED_THEME_FILES, "navic.png"])).toBe(true);
  });

  it("chybějící líc / rub / ikona sadu vyřadí (unhappy path)", () => {
    for (const missing of [cardFileName("srdce", "7"), RUB_FILE, suitIconFileName("kule")]) {
      const present = REQUIRED_THEME_FILES.filter((f) => f !== missing);
      expect(hasAllRequiredCardFiles(present)).toBe(false);
    }
  });
});

describe("kontrakt pozadí: dashboardFileNames vs. tableBgImageSet (runtime)", () => {
  it("oba formáty pozadí aktivního motivu, které runtime načítá, sedí na názvy z kontraktu", () => {
    const dash = dashboardFileNames(getActiveTheme());
    const css = tableBgImageSet();
    // Kdyby se přejmenoval prefix (dashboard_ -> bg_) jen na jednom místě, rozejde
    // se validace s runtimem a tenhle test to chytne.
    expect(css).toContain(dash.webp);
    expect(css).toContain(dash.jpg);
  });
});

describe("kontrakt: cardSrc (runtime) vs. REQUIRED_THEME_FILES (validace)", () => {
  it("každý líc, který hra načítá, je v seznamu požadovaných souborů", () => {
    const required = new Set(REQUIRED_THEME_FILES);
    const faces = createDeck().map((card) => fileName(cardSrc(card)));
    expect(faces).toHaveLength(32);
    for (const face of faces) {
      // Kdyby se rozešlo pojmenování (např. návrat lokálního rankSlug do assets.ts),
      // validace by propustila sadu sypoucí 404 — tenhle test to chytne.
      expect(required.has(face)).toBe(true);
    }
  });
});
