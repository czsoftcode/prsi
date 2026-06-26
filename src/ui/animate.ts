// Animační vrstva pro "ghost" karty. Žije mimo #app (jako overlaye), takže ji
// full re-render herního stolu nesmaže, a řídí ji herní smyčka v main.ts —
// render() zůstává čistě deklarativní a o animacích neví.
//
// Kontrakt jako u overlayů: Promise z animatePlay() resolvuje VŽDY — na konci
// přechodu, nebo timeout fallbackem — takže smyčka nikdy neuvízne v zámku.

import type { Card } from "../engine/cards";
import { cardSrc, SUIT_LABELS } from "./assets";

/** Trvání letu ghost karty (ms). Krátké, ať tah znatelně nezdržuje. */
const FLIGHT_MS = 260;
/** Pojistka, kdyby transitionend nepřišel (jsdom bez layoutu, přerušení). */
const FALLBACK_MS = FLIGHT_MS + 120;

let layer: HTMLElement | null = null;

/** Jednou vytvořená vrstva pro ghost karty (mimo #app). */
function ensureLayer(): HTMLElement {
  if (layer && layer.isConnected) {
    return layer;
  }
  const el = document.createElement("div");
  el.className = "anim-layer";
  el.setAttribute("aria-hidden", "true");
  document.body.append(el);
  layer = el;
  return el;
}

/** Odstraní všechny letící ghosty (volá se při nové partii, ať nepřeletí přes nový stůl). */
export function clearAnim(): void {
  layer?.replaceChildren();
}

/** Uživatel si přeje omezené animace? Bez matchMedia (jsdom) bereme jako ne. */
function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export interface PlayAnim {
  /** Pozice zdrojové karty (před překreslením). */
  fromRect: DOMRect;
  /** Pozice cílové karty na vrchu hromádky (po překreslení). */
  toRect: DOMRect;
  /** Karta, jejíž líc letí. */
  card: Card;
}

/**
 * Nechá ghost kartu lícem přeletět z `fromRect` do `toRect`. Resolvuje VŽDY.
 * Nic se nevykreslí (a resolvuje okamžitě), když:
 *  - uživatel chce omezené animace (`prefers-reduced-motion`), nebo
 *  - geometrie je degenerovaná (oba rect nulové) — typicky bez layoutu v jsdom.
 */
export function animatePlay({ fromRect, toRect, card }: PlayAnim): Promise<void> {
  const degenerate =
    fromRect.width === 0 &&
    fromRect.height === 0 &&
    toRect.width === 0 &&
    toRect.height === 0;
  if (prefersReducedMotion() || degenerate) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const ghost = document.createElement("img");
    ghost.className = "anim-ghost";
    ghost.src = cardSrc(card);
    ghost.alt = `${SUIT_LABELS[card.suit]} ${card.rank}`;
    ghost.style.width = `${fromRect.width}px`;
    ghost.style.height = `${fromRect.height}px`;
    ghost.style.transition = `transform ${FLIGHT_MS}ms ease-out`;
    // Výchozí poloha = zdrojová karta (transform-origin: top left v CSS).
    ghost.style.transform = `translate(${fromRect.left}px, ${fromRect.top}px)`;

    ensureLayer().append(ghost);

    let settled = false;
    const finish = (): void => {
      if (settled) {
        return;
      }
      settled = true;
      ghost.remove();
      resolve();
    };

    ghost.addEventListener("transitionend", finish, { once: true });
    window.setTimeout(finish, FALLBACK_MS);

    // Vynutit reflow, aby přechod transformu z výchozí do cílové pozice naběhl.
    void ghost.getBoundingClientRect();
    const scale = fromRect.width > 0 ? toRect.width / fromRect.width : 1;
    ghost.style.transform = `translate(${toRect.left}px, ${toRect.top}px) scale(${scale})`;
  });
}
