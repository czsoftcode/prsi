// Overlay výběru barvy po zahrání svrška. Vykresluje se mimo #app (do document.body),
// takže ho full re-render herního stolu nesmaže. Blokuje vstup do stolu vizuálně
// (backdrop) i logicky (volající drží zámek, dokud Promise nedoběhne).

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
