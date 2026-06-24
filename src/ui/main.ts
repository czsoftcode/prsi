import "./style.css";
import type { Card, GameState } from "../engine/cards";
import { render } from "./render";
import {
  createGame,
  playerPlay,
  playerDraw,
  advanceAi,
  playerPlayable,
  winnerOf,
} from "./game";
import { chooseSuit } from "./overlay";

/** Prodleva před reakcí AI, aby byl tah vidět (není to animace, jen pauza). */
const AI_DELAY_MS = 600;
const rng = Math.random;

const app = document.querySelector<HTMLDivElement>("#app");

if (app) {
  startGame(app);
}

function startGame(app: HTMLElement): void {
  let state: GameState = createGame(rng);
  let locked = false; // zámek vstupu během AI prodlevy a otevřeného overlay

  const banner = document.createElement("div");
  banner.className = "banner";
  banner.hidden = true;
  document.body.append(banner);

  function sameCard(a: Card, b: Card): boolean {
    return a.suit === b.suit && a.rank === b.rank;
  }

  function gameOver(): boolean {
    return winnerOf(state) !== null;
  }

  function draw(): void {
    render(state, app);
    const winner = winnerOf(state);
    if (winner) {
      banner.hidden = false;
      banner.textContent = winner === "player" ? "Vyhrál jsi! 🎉" : "Vyhrál počítač.";
    } else {
      banner.hidden = true;
    }
  }

  /** Po tahu hráče: pokud je na tahu AI, s prodlevou ji dožene a překreslí. */
  function scheduleAi(): void {
    if (gameOver() || state.currentPlayer !== "ai") {
      locked = false;
      return;
    }
    locked = true;
    window.setTimeout(() => {
      state = advanceAi(state, rng);
      draw();
      locked = false;
    }, AI_DELAY_MS);
  }

  async function onPlayCard(index: number): Promise<void> {
    if (locked || gameOver() || state.currentPlayer !== "player") {
      return;
    }
    const card = state.playerHand[index];
    if (!card || !playerPlayable(state).some((c) => sameCard(c, card))) {
      return; // nehratelná karta (i svršek) → ignoruj, neotvírej overlay
    }
    let chosenSuit;
    if (card.rank === "svrsek") {
      locked = true; // drž zámek, dokud hráč nevybere barvu
      try {
        const picked = await chooseSuit();
        if (picked === null) {
          return; // hráč výběr zrušil → tah se neprovede (finally uvolní zámek)
        }
        chosenSuit = picked;
      } finally {
        locked = false; // zámek se uvolní vždy, i kdyby výběr selhal
      }
    }
    const next = playerPlay(state, index, chosenSuit);
    if (!next) {
      return;
    }
    state = next;
    draw();
    scheduleAi();
  }

  function onDraw(): void {
    if (locked || gameOver() || state.currentPlayer !== "player") {
      return;
    }
    const next = playerDraw(state, rng);
    if (!next) {
      return; // má hratelnou kartu, nebo nelze líznout (stall)
    }
    state = next;
    draw();
    scheduleAi();
  }

  // Jeden delegovaný listener — přežije full re-render #app. Click pokrývá myš i dotyk.
  app.addEventListener("click", (e) => {
    if (locked) {
      return;
    }
    const target = e.target as HTMLElement;
    const cardEl = target.closest<HTMLElement>(".card--face[data-index]");
    if (cardEl && cardEl.dataset.index !== undefined) {
      void onPlayCard(Number(cardEl.dataset.index));
      return;
    }
    if (target.closest<HTMLElement>("[data-action='draw']")) {
      onDraw();
    }
  });

  draw();
}
