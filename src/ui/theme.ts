// Aktivní motiv (sada karet + pozadí). Motiv je dvojciferné id "NN", které váže
// složku karet `cards_NN` i pozadí `dashboard_NN`. Stav drží tento modul, assety
// (assets.ts) z něj jen čtou — samy žádný stav nemají.
//
// Persistence je "best effort": localStorage může být nedostupné (private mode,
// blokované úložiště) → čtení i zápis jsou v try/catch a padají zpět na
// in-memory hodnotu, hra kvůli tomu nikdy nespadne.
//
// Validace: uložené NN se ověří proti registru motivů (virtual:themes). Neznámé
// nebo nekompletní NN (chybějící assety → 404) by jinak rozbilo vykreslení,
// proto padá na DEFAULT_THEME. Validuje se JEN načtení z úložiště (čtení v
// getActiveTheme); setActiveTheme drží v paměti cokoli (validní motivy stejně
// přepíná jen UI z registru). Při fallbacku se úložiště NEpřepisuje — opraví se
// pouze vrácená hodnota.

import { THEMES } from "virtual:themes";

/** Výchozí motiv = dnešní vzhled (cards_01 + dashboard_01). */
export const DEFAULT_THEME = "01";

/** Klíč v localStorage. */
const STORAGE_KEY = "prsi.theme";

// In-memory zdroj pravdy. Inicializuje se z localStorage při prvním čtení.
let active: string | null = null;

/**
 * Vrátí aktivní motiv. Při prvním volání ho zkusí načíst z localStorage a ověří
 * proti registru — neznámé/nekompletní NN spadne na DEFAULT_THEME.
 */
export function getActiveTheme(): string {
  if (active === null) {
    const stored = readStored();
    active = stored !== null && THEMES.includes(stored) ? stored : DEFAULT_THEME;
  }
  return active;
}

/** Nastaví aktivní motiv a zkusí ho uložit do localStorage. */
export function setActiveTheme(id: string): void {
  active = id;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // úložiště nedostupné — zůstává jen in-memory hodnota
  }
}

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
