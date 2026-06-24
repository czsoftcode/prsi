// Vykreslení stavu hry do DOM. Pouze zobrazení, žádná interakce (to je fáze 7).
// Kontrakt: render() je idempotentní — pokaždé přestaví celý obsah `root`.

import type { Card, GameState } from "../engine/cards";
import { playableCards } from "../engine/moves";
import { cardSrc, RUB_SRC, suitIconSrc, SUIT_LABELS } from "./assets";

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  return node;
}

/** Obrázek karty lícem. */
function faceCard(card: Card): HTMLImageElement {
  const img = el("img", "card card--face");
  img.src = cardSrc(card);
  img.alt = `${SUIT_LABELS[card.suit]} ${card.rank}`;
  return img;
}

/** Obrázek rubu karty. */
function backCard(): HTMLImageElement {
  const img = el("img", "card card--back");
  img.src = RUB_SRC;
  img.alt = "Rub karty";
  return img;
}

/** Zóna AI nahoře — řada rubů podle počtu karet v ruce AI. */
function renderAiZone(state: GameState): HTMLElement {
  const zone = el("div", "zone zone--ai");
  const hand = el("div", "hand hand--ai");
  for (let i = 0; i < state.aiHand.length; i++) {
    hand.append(backCard());
  }
  zone.append(hand);
  return zone;
}

function sameCard(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

function topOfDiscard(state: GameState): Card {
  return state.discardPile[state.discardPile.length - 1]!;
}

/** Lízací balíček: rub s počtem, nebo prázdné místo když je vyčerpaný. */
function renderDrawPile(state: GameState): HTMLElement {
  const pile = el("div", "pile pile--draw");
  pile.dataset.action = "draw"; // interakce: klik/dotyk = líznutí
  if (state.drawPile.length > 0) {
    pile.append(backCard());
    const count = el("span", "pile__count");
    count.textContent = String(state.drawPile.length);
    pile.append(count);
  } else {
    pile.classList.add("pile--empty");
    const empty = el("span", "pile__empty");
    empty.textContent = "prázdný";
    pile.append(empty);
  }
  return pile;
}

/** Odhazovací hromádka: vrchní karta (poslední prvek discardPile) lícem. */
function renderDiscardPile(state: GameState): HTMLElement {
  const pile = el("div", "pile pile--discard");
  const top = state.discardPile[state.discardPile.length - 1];
  if (top) {
    pile.append(faceCard(top));
  }
  return pile;
}

/** Indikátor aktuálně požadované barvy — miniatura karty té barvy s popiskem. */
function renderSuitIndicator(state: GameState): HTMLElement {
  const box = el("div", "indicator indicator--suit");
  const label = el("span", "indicator__label");
  label.textContent = "Barva:";
  const swatch = el("img", "indicator__suit-img");
  swatch.src = suitIconSrc(state.currentSuit);
  swatch.alt = SUIT_LABELS[state.currentSuit];
  box.append(label, swatch);
  return box;
}

/** Indikátor nakupených sedem — skrytý při 0. */
function renderSevensIndicator(state: GameState): HTMLElement | null {
  if (state.pendingSevens <= 0) {
    return null;
  }
  const box = el("div", "indicator indicator--sevens");
  box.textContent = `Sedmy: ${state.pendingSevens} (bereš ${state.pendingSevens * 2})`;
  return box;
}

/** Indikátor, kdo je na tahu. */
function renderTurnIndicator(state: GameState): HTMLElement {
  const box = el("div", "indicator indicator--turn");
  box.textContent = state.currentPlayer === "player" ? "Na tahu: ty" : "Na tahu: počítač";
  return box;
}

/** Střed stolu: indikátory + lízací balíček a odhazovací hromádka. */
function renderCenterZone(state: GameState): HTMLElement {
  const zone = el("div", "zone zone--center");

  const indicators = el("div", "indicators");
  indicators.append(renderTurnIndicator(state), renderSuitIndicator(state));
  const sevens = renderSevensIndicator(state);
  if (sevens) {
    indicators.append(sevens);
  }

  const piles = el("div", "piles");
  piles.append(renderDrawPile(state), renderDiscardPile(state));

  zone.append(indicators, piles);
  return zone;
}

/** Zóna hráče dole — ruka lícem v pořadí podle playerHand. */
function renderPlayerZone(state: GameState): HTMLElement {
  const zone = el("div", "zone zone--player");
  const hand = el("div", "hand hand--player");
  const myTurn = state.currentPlayer === "player";
  // Hratelné karty zvýrazníme jen když je hráč na tahu.
  const playable = myTurn
    ? playableCards(state.playerHand, topOfDiscard(state), state.currentSuit, state.pendingSevens)
    : [];
  state.playerHand.forEach((card, index) => {
    const img = faceCard(card);
    img.dataset.index = String(index); // interakce: identita karty pro handler
    if (playable.some((c) => sameCard(c, card))) {
      img.classList.add("card--playable");
    }
    hand.append(img);
  });
  zone.append(hand);
  return zone;
}

/**
 * Vykreslí celý herní stůl ze stavu `state` do `root`. Idempotentní:
 * `root` se nejprve vyprázdní, takže opakované volání dá stejný výsledek.
 */
export function render(state: GameState, root: HTMLElement): void {
  root.replaceChildren();
  root.classList.add("prsi-table");
  root.append(
    renderAiZone(state),
    renderCenterZone(state),
    renderPlayerZone(state),
  );
}
