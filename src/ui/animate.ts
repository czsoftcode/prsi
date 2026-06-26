// Animační vrstva pro "ghost" karty. Žije mimo #app (jako overlaye), takže ji
// full re-render herního stolu nesmaže, a řídí ji herní smyčka v main.ts —
// render() zůstává čistě deklarativní a o animacích neví.
//
// Kontrakt jako u overlayů: Promise z animatePlay() resolvuje VŽDY — na konci
// přechodu, nebo timeout fallbackem — takže smyčka nikdy neuvízne v zámku.

import type { Card } from "../engine/cards";
import { cardSrc, rubSrc, SUIT_LABELS } from "./assets";

/** Trvání letu ghost karty (ms). Krátké, ať tah znatelně nezdržuje. */
const FLIGHT_MS = 260;
/** Pojistka, kdyby transitionend nepřišel (jsdom bez layoutu, přerušení). */
const FALLBACK_MS = FLIGHT_MS + 120;
/** Posun startu mezi po sobě letícími rubky při braní více karet (ms). */
const DRAW_STAGGER_MS = 80;
/**
 * Strop počtu letících rubů. Po sedmách se bere až 8 karet — animovat všechny by
 * zámek vstupu natáhlo na vteřiny. Vizuálně stačí náznak, proto cap.
 */
const DRAW_MAX_GHOSTS = 4;

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

/** Geometrie je degenerovaná (oba rect nulové) — typicky bez layoutu v jsdom. */
function degenerate(a: DOMRect, b: DOMRect): boolean {
  return (
    a.width === 0 && a.height === 0 && b.width === 0 && b.height === 0
  );
}

/**
 * Sdílené jádro letu jednoho ghostu z `fromRect` do `toRect`. Resolvuje VŽDY —
 * na `transitionend`, nebo timeout fallbackem (jsdom bez layoutu, přerušení).
 * O reduced-motion / degenerovanou geometrii se starají volající.
 */
function flyGhost(
  src: string,
  alt: string,
  fromRect: DOMRect,
  toRect: DOMRect,
): Promise<void> {
  return new Promise((resolve) => {
    const ghost = document.createElement("img");
    ghost.className = "anim-ghost";
    ghost.src = src;
    ghost.alt = alt;
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
  if (prefersReducedMotion() || degenerate(fromRect, toRect)) {
    return Promise.resolve();
  }
  return flyGhost(cardSrc(card), `${SUIT_LABELS[card.suit]} ${card.rank}`, fromRect, toRect);
}

export interface DrawAnim {
  /** Pozice lízacího balíčku (zdroj). */
  fromRect: DOMRect;
  /** Pozice cílové zóny ruky (po překreslení). */
  toRect: DOMRect;
  /** Kolik karet bylo líznuto (po sedmách víc). */
  count: number;
}

/**
 * Nechá `count` rubů (cap `DRAW_MAX_GHOSTS`) staggerovaně přeletět z lízacího
 * balíčku do zóny ruky. Resolvuje VŽDY, až doletí poslední. Přeskočí (a resolvuje
 * okamžitě) při reduced-motion nebo degenerované geometrii — stejně jako animatePlay.
 */
export function animateDraw({ fromRect, toRect, count }: DrawAnim): Promise<void> {
  if (prefersReducedMotion() || degenerate(fromRect, toRect)) {
    return Promise.resolve();
  }
  const n = Math.max(1, Math.min(count, DRAW_MAX_GHOSTS));
  const flights: Promise<void>[] = [];
  for (let i = 0; i < n; i++) {
    flights.push(
      new Promise<void>((resolve) => {
        // Stagger startů; každý ghost si pak vede vlastní timeout fallback.
        window.setTimeout(() => {
          void flyGhost(rubSrc(), "Líznutá karta", fromRect, toRect).then(resolve);
        }, i * DRAW_STAGGER_MS);
      }),
    );
  }
  return Promise.all(flights).then(() => undefined);
}
