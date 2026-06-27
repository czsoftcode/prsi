/**
 * Stav přepínače nápovědy tahu (žluté zvýraznění hratelných karet).
 * Čistě prezentační — neovlivňuje validaci tahu, jen zda render přidá třídu
 * card--playable. Volba se ukládá best-effort do localStorage (zrcadlo vzoru
 * z audio.ts pro hudbu); při nedostupném úložišti platí pro aktuální relaci.
 */

/** Klíč v localStorage pro volbu zapnuté/vypnuté nápovědy (best-effort). */
const HINT_STORAGE_KEY = "prsi.hint";

let hintEnabled: boolean | null = null;

/** Best-effort čtení volby z localStorage; default zapnuto (vrací true). */
function loadHintEnabled(): boolean {
  try {
    return localStorage.getItem(HINT_STORAGE_KEY) !== "off";
  } catch {
    return true; // localStorage nedostupné (private mode) → default zapnuto
  }
}

/** Vrátí, zda je nápověda zapnutá (líně inicializuje z localStorage). */
export function isHintEnabled(): boolean {
  if (hintEnabled === null) {
    hintEnabled = loadHintEnabled();
  }
  return hintEnabled;
}

/** Přepne nápovědu zap/vyp a uloží volbu (best-effort). */
export function setHintEnabled(on: boolean): void {
  hintEnabled = on;
  try {
    localStorage.setItem(HINT_STORAGE_KEY, on ? "on" : "off");
  } catch {
    // localStorage nedostupné — volba platí aspoň pro tuto relaci (in-memory).
  }
}
