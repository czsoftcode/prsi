import { defineConfig, type Plugin } from "vite";
import { readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  isValidThemeId,
  hasAllRequiredCardFiles,
  dashboardFileNames,
} from "./src/ui/theme-assets";

// Registr dostupných motivů jako virtuální modul `virtual:themes`.
//
// Motiv = dvojciferné NN, které páruje složku karet `public/cards_NN` s pozadím
// `public/images/dashboard_NN.{webp,jpg}`. Sken běží přes node `fs` při startu
// (NE `import.meta.glob` — ten na `public/` nefunguje, ty soubory nejsou moduly).
// Žádný commitnutý vygenerovaný soubor: přidat motiv = nahrát složku + rebuild
// (v dev serveru je třeba restart, plugin load proběhne jednou).
//
// Validace kompletní sady (ne jen existence složky), aby do výběru nepronikl
// motiv sypoucí 404:
//  - NN je přesně dvojciferné (isValidThemeId) — odfiltruje `cards_`, `cards_x` ap.,
//  - dashboard_NN.webp i .jpg existují (oba formáty — `tableBgImageSet()` staví
//    image-set z obou),
//  - složka cards_NN obsahuje VŠECHNY REQUIRED_THEME_FILES (32 líců + rub + 4 ikony).
// Seznam názvů sdílí runtime vykreslování (theme-assets.ts) — žádná druhá pravda.
function themesRegistry(): Plugin {
  const VIRTUAL_ID = "virtual:themes";
  const RESOLVED_ID = "\0" + VIRTUAL_ID;

  function scan(): string[] {
    const publicDir = resolve(process.cwd(), "public");
    const cardsDir = publicDir; // cards_* leží přímo v public/
    const imagesDir = resolve(publicDir, "images");
    let entries: string[];
    try {
      entries = readdirSync(cardsDir, { withFileTypes: true })
        .filter((e) => e.isDirectory() && e.name.startsWith("cards_"))
        .map((e) => e.name.slice("cards_".length));
    } catch {
      return []; // public/ nedostupné — prázdný registr (appka spadne na default)
    }
    const valid = entries.filter((nn) => isValidThemeId(nn) && hasCompleteAssets(nn));
    return valid.sort();

    function hasCompleteAssets(nn: string): boolean {
      const dash = dashboardFileNames(nn);
      if (
        !existsSync(resolve(imagesDir, dash.webp)) ||
        !existsSync(resolve(imagesDir, dash.jpg))
      ) {
        return false;
      }
      let files: string[];
      try {
        files = readdirSync(resolve(cardsDir, `cards_${nn}`));
      } catch {
        return false; // složka nečitelná (zmizela mezi readdir a teď) — vyřadit
      }
      return hasAllRequiredCardFiles(files);
    }
  }

  return {
    name: "prsi-themes-registry",
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },
    load(id) {
      if (id === RESOLVED_ID) {
        const themes = scan();
        return `export const THEMES = ${JSON.stringify(themes)};`;
      }
    },
  };
}

// Na GitHub Pages běží hra pod /prsi/ (project page), proto produkční build
// potřebuje base "/prsi/". Dev server i testy zůstávají na "/".
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/prsi/" : "/",
  plugins: [themesRegistry()],
  test: {
    globals: true,
    environment: "node",
  },
}));
