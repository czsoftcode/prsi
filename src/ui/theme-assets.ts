// Kontrakt názvů souborů jedné sady motivu — JEDINÁ pravda o tom, jak se jmenují
// assety v public/cards_NN/. Sdílí ho runtime vykreslování (assets.ts staví cesty
// pro <img>) i build-time registr (vite.config.ts ověřuje kompletnost sady před
// zařazením do výběru). Kdyby každý počítal názvy zvlášť, validace by se s reálnými
// cestami rozešla při prvním přejmenování barvy/hodnoty.
//
// Listový modul: importuje jen čisté konstanty z enginu, ŽÁDNÉ import.meta ani
// theme.ts (browser/runtime stav). Díky tomu ho smí importovat i vite.config.ts,
// který se načítá v Node při startu serveru/buildu.

import { SUITS, RANKS, type Rank, type Suit } from "../engine/cards";

/** Část názvu souboru pro daný rank (numerické 7–9 se nulují, zbytek 1:1). */
export function rankSlug(rank: Rank): string {
  switch (rank) {
    case "7":
      return "07";
    case "8":
      return "08";
    case "9":
      return "09";
    default:
      return rank; // "10", "svrsek", "spodek", "kral", "eso"
  }
}

/** Název souboru líce karty, např. {srdce,7} -> "srdce-07.png" (bez adresáře). */
export function cardFileName(suit: Suit, rank: Rank): string {
  return `${suit}-${rankSlug(rank)}.png`;
}

/** Název souboru ikony barvy, např. "srdce" -> "suit-srdce.png". */
export function suitIconFileName(suit: Suit): string {
  return `suit-${suit}.png`;
}

/** Název souboru rubu karty. */
export const RUB_FILE = "rub.png";

/**
 * Kompletní seznam souborů, které MUSÍ být v public/cards_NN/, aby byla sada
 * použitelná: 32 líců (4 barvy × 8 hodnot) + rub + 4 ikony barev = 37 souborů.
 * Pořadí není významné (validace dělá test podmnožiny).
 */
export const REQUIRED_THEME_FILES: readonly string[] = [
  ...SUITS.flatMap((suit) => RANKS.map((rank) => cardFileName(suit, rank))),
  RUB_FILE,
  ...SUITS.map((suit) => suitIconFileName(suit)),
];

/** Motiv NN je platný identifikátor jen jako přesně dvojciferné číslo (např. "01", "27"). */
export function isValidThemeId(nn: string): boolean {
  return /^\d{2}$/.test(nn);
}

/**
 * Názvy obou souborů pozadí motivu (bez adresáře). Oba formáty jsou povinné —
 * `tableBgImageSet()` staví image-set z webp i jpg, takže validace i runtime
 * musí žádat stejnou dvojici. Sdílený kontrakt, ne literál na dvou místech.
 */
export function dashboardFileNames(nn: string): { webp: string; jpg: string } {
  return { webp: `dashboard_${nn}.webp`, jpg: `dashboard_${nn}.jpg` };
}

/**
 * Obsahuje sada všech 37 povinných souborů karet? Reálný predikát, který používá
 * registr ve vite.config.ts (subset-check). Extra soubory navíc nevadí.
 */
export function hasAllRequiredCardFiles(files: Iterable<string>): boolean {
  const present = files instanceof Set ? files : new Set(files);
  return REQUIRED_THEME_FILES.every((name) => present.has(name));
}
