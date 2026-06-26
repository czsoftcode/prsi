// Aktivní motiv (sada karet + pozadí). Motiv je dvojciferné id "NN", které váže
// složku karet `cards_NN` i pozadí `dashboard_NN`. Stav drží tento modul, assety
// (assets.ts) z něj jen čtou — samy žádný stav nemají.
//
// Persistence je "best effort": localStorage může být nedostupné (private mode,
// blokované úložiště) → čtení i zápis jsou v try/catch a padají zpět na
// in-memory hodnotu, hra kvůli tomu nikdy nespadne. Validace neznámého NN se
// zde záměrně nedělá — to přijde s registrem motivů (samostatná fáze).

/** Výchozí motiv = dnešní vzhled (cards_01 + dashboard_01). */
export const DEFAULT_THEME = "01";

/** Klíč v localStorage. */
const STORAGE_KEY = "prsi.theme";

// In-memory zdroj pravdy. Inicializuje se z localStorage při prvním čtení.
let active: string | null = null;

/** Vrátí aktivní motiv. Při prvním volání ho zkusí načíst z localStorage. */
export function getActiveTheme(): string {
  if (active === null) {
    active = readStored() ?? DEFAULT_THEME;
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
