// Overlaye mimo #app (do document.body), takže je full re-render herního stolu
// nesmaže. Blokují vstup do stolu vizuálně (backdrop) i logicky (volající drží zámek
// / smyčka se nevolá, dokud overlay žije).

import { SUITS, type Suit } from "../engine/cards";
import { suitIconSrc, SUIT_LABELS } from "./assets";

/**
 * Zobrazí overlay se 4 barvami a vrátí Promise se zvolenou barvou, nebo null když
 * hráč výběr zruší (klik mimo box). Promise resolvne VŽDY (žádná cesta, kde by
 * zůstala viset → volající by uvízl v zámku). Overlay se po výběru/zrušení odstraní.
 */
export function chooseSuit(): Promise<Suit | null> {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "overlay overlay--suit";

    // Klik na pozadí (mimo box) = zrušení výběru.
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        backdrop.remove();
        resolve(null);
      }
    });

    const box = document.createElement("div");
    box.className = "overlay__box";

    const title = document.createElement("p");
    title.className = "overlay__title";
    title.textContent = "Vyber barvu";
    box.append(title);

    const row = document.createElement("div");
    row.className = "overlay__suits";
    for (const suit of SUITS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "overlay__suit-btn";
      btn.setAttribute("aria-label", SUIT_LABELS[suit]);
      const img = document.createElement("img");
      img.src = suitIconSrc(suit);
      img.alt = SUIT_LABELS[suit];
      btn.append(img);
      btn.addEventListener("click", () => {
        backdrop.remove();
        resolve(suit);
      });
      row.append(btn);
    }
    box.append(row);
    backdrop.append(box);
    document.body.append(backdrop);
  });
}

/**
 * Zobrazí overlay konce hry s výsledkem (`message`) a tlačítkem „Nová partie".
 * Nelze ho zavřít jinak než tlačítkem (jediná akce je nová hra). Po kliku se overlay
 * odstraní a zavolá `onNewGame`. Vykresluje se mimo #app, blokuje vstup do stolu.
 */
export function showEndOverlay(message: string, onNewGame: () => void): void {
  const backdrop = document.createElement("div");
  backdrop.className = "overlay overlay--end";

  const box = document.createElement("div");
  box.className = "overlay__box";

  const title = document.createElement("p");
  title.className = "overlay__title";
  title.textContent = message;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "overlay__newgame";
  btn.textContent = "Nová partie";
  btn.addEventListener("click", () => {
    backdrop.remove();
    onNewGame();
  });

  box.append(title, btn);
  backdrop.append(box);
  document.body.append(backdrop);
}
