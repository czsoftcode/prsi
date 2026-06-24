// Mapování karet na cesty k obrázkům v public/cards/.
// Pozor: soubory mají jednociferné numerické ranky nulované (7 -> 07), proto
// nelze použít naivní `${suit}-${rank}.png`.

import type { Card, Rank, Suit } from "../engine/cards";

/** Český popisek barvy (pro alt texty a overlay). Sdílí render i overlay. */
export const SUIT_LABELS: Record<Suit, string> = {
  zaludy: "žaludy",
  zelene: "zelené",
  srdce: "srdce",
  kule: "kule",
};

/** Cesta k obrázku rubu karty. */
export const RUB_SRC = "/cards/rub.png";

/** Cesta k ikoně barvy (indikátor aktuální barvy), např. "srdce" -> "/cards/suit-srdce.png". */
export function suitIconSrc(suit: Suit): string {
  return `/cards/suit-${suit}.png`;
}

/** Část názvu souboru pro daný rank (numerické 7–9 se nulují, zbytek 1:1). */
function rankSlug(rank: Rank): string {
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

/** Cesta k obrázku konkrétní karty, např. {srdce,7} -> "/cards/srdce-07.png". */
export function cardSrc(card: Card): string {
  return `/cards/${card.suit}-${rankSlug(card.rank)}.png`;
}
