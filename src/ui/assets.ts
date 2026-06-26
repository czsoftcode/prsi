// Mapování karet na cesty k obrázkům v public/cards_NN/ podle aktivního motivu.
// Pozor: soubory mají jednociferné numerické ranky nulované (7 -> 07), proto
// nelze použít naivní `${suit}-${rank}.png`.
//
// Motiv (NN) je runtime stav (theme.ts). Cesty se proto musí počítat při každém
// volání, ne jednou při importu — jinak by přepnutí motivu nemělo efekt.

import type { Card, Rank, Suit } from "../engine/cards";
import { getActiveTheme } from "./theme";

// Prefix veřejných assetů. Vite ho nastaví dle `base`: v dev/testech "/",
// v produkčním buildu na GitHub Pages "/prsi/". Vždy končí lomítkem, takže
// se připojuje přímo bez dalšího "/".
const BASE = import.meta.env.BASE_URL;

/** Adresář aktivní sady karet, např. "/cards_01/" (s koncovým lomítkem). */
function cardsDir(): string {
  return `${BASE}cards_${getActiveTheme()}/`;
}

/** Český popisek barvy (pro alt texty a overlay). Sdílí render i overlay. */
export const SUIT_LABELS: Record<Suit, string> = {
  zaludy: "žaludy",
  zelene: "zelené",
  srdce: "srdce",
  kule: "kule",
};

/** Cesta k obrázku rubu karty v aktivním motivu. */
export function rubSrc(): string {
  return `${cardsDir()}rub.png`;
}

/**
 * Hodnota pro CSS `background-image` herního stolu: image-set s webp variantou
 * a jpg fallbackem pro pozadí aktivního motivu (dashboard_NN). Sestavuje se v
 * JS, protože CSS `url()` na absolutní cestu by se v produkčním buildu pod base
 * "/prsi/" nerozšířilo o prefix a 404nulo. Nastavuje se na CSS proměnnou
 * `--table-bg` (overlay je v style.css).
 */
export function tableBgImageSet(): string {
  const nn = getActiveTheme();
  return (
    `image-set(` +
    `url("${BASE}images/dashboard_${nn}.webp") type("image/webp"), ` +
    `url("${BASE}images/dashboard_${nn}.jpg") type("image/jpeg"))`
  );
}

/** Cesta k ikoně barvy (indikátor aktuální barvy), např. "srdce" -> ".../cards_01/suit-srdce.png". */
export function suitIconSrc(suit: Suit): string {
  return `${cardsDir()}suit-${suit}.png`;
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

/** Cesta k obrázku konkrétní karty, např. {srdce,7} -> "/cards_01/srdce-07.png". */
export function cardSrc(card: Card): string {
  return `${cardsDir()}${card.suit}-${rankSlug(card.rank)}.png`;
}
