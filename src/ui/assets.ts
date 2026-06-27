// Mapování karet na cesty k obrázkům v public/cards_NN/ podle aktivního motivu.
// Pozor: soubory mají jednociferné numerické ranky nulované (7 -> 07), proto
// nelze použít naivní `${suit}-${rank}.png`.
//
// Motiv (NN) je runtime stav (theme.ts). Cesty se proto musí počítat při každém
// volání, ne jednou při importu — jinak by přepnutí motivu nemělo efekt.

import { SUITS, type Card, type Rank, type Suit } from "../engine/cards";
import { getActiveTheme } from "./theme";
import { cardFileName, suitIconFileName, dashboardFileNames, RUB_FILE } from "./theme-assets";

// Prefix veřejných assetů. Vite ho nastaví dle `base`: v dev/testech "/",
// v produkčním buildu na GitHub Pages "/prsi/". Vždy končí lomítkem, takže
// se připojuje přímo bez dalšího "/".
const BASE = import.meta.env.BASE_URL;

/** Adresář sady karet pro konkrétní motiv NN, např. "/cards_02/" (s koncovým lomítkem). */
function cardsDirOf(themeId: string): string {
  return `${BASE}cards_${themeId}/`;
}

/** Adresář aktivní sady karet, např. "/cards_01/" (s koncovým lomítkem). */
function cardsDir(): string {
  return cardsDirOf(getActiveTheme());
}

/** Reprezentativní rank pro náhled motivu — jedna karta z každé barvy. */
const PREVIEW_RANK: Rank = "kral";

/** Český popisek barvy (pro alt texty a overlay). Sdílí render i overlay. */
export const SUIT_LABELS: Record<Suit, string> = {
  zaludy: "žaludy",
  zelene: "zelené",
  srdce: "srdce",
  kule: "kule",
};

/** Cesta k obrázku rubu karty v aktivním motivu. */
export function rubSrc(): string {
  return `${cardsDir()}${RUB_FILE}`;
}

/**
 * Hodnota pro CSS `background-image` herního stolu: image-set s webp variantou
 * a jpg fallbackem pro pozadí aktivního motivu (dashboard_NN). Sestavuje se v
 * JS, protože CSS `url()` na absolutní cestu by se v produkčním buildu pod base
 * "/prsi/" nerozšířilo o prefix a 404nulo. Nastavuje se na CSS proměnnou
 * `--table-bg` (overlay je v style.css).
 */
export function tableBgImageSet(): string {
  const dash = dashboardFileNames(getActiveTheme());
  return (
    `image-set(` +
    `url("${BASE}images/${dash.webp}") type("image/webp"), ` +
    `url("${BASE}images/${dash.jpg}") type("image/jpeg"))`
  );
}

/** Cesta k ikoně barvy (indikátor aktuální barvy), např. "srdce" -> ".../cards_01/suit-srdce.png". */
export function suitIconSrc(suit: Suit): string {
  return `${cardsDir()}${suitIconFileName(suit)}`;
}

/** Cesta k obrázku konkrétní karty, např. {srdce,7} -> "/cards_01/srdce-07.png". */
export function cardSrc(card: Card): string {
  return `${cardsDir()}${cardFileName(card.suit, card.rank)}`;
}

/**
 * Náhledové cesty pro daný motiv NN: jedna karta z každé barvy (pevný rank, v
 * pořadí SUITS) + rub. Nezávisí na aktivním motivu — slouží overlayi výběru, kde
 * se zobrazují i jiné než aktivní motivy.
 */
export function themePreviewSrcs(themeId: string): { cards: string[]; rub: string } {
  const dir = cardsDirOf(themeId);
  return {
    cards: SUITS.map((suit) => `${dir}${cardFileName(suit, PREVIEW_RANK)}`),
    rub: `${dir}${RUB_FILE}`,
  };
}
