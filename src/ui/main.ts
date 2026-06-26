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
  isPat,
} from "./game";
import { chooseSuit, chooseTheme, showEndOverlay } from "./overlay";
import { setActiveTheme } from "./theme";

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
  let ended = false; // hra skončila (výhra/pat) → vstup zamčen, čeká se na novou partii

  function sameCard(a: Card, b: Card): boolean {
    return a.suit === b.suit && a.rank === b.rank;
  }

  function gameOver(): boolean {
    return winnerOf(state) !== null;
  }

  /** Text overlaye konce hry, nebo null když hra běží dál. */
  function endMessage(): string | null {
    const winner = winnerOf(state);
    if (winner) {
      return winner === "player" ? "Vyhrál jsi! 🎉" : "Vyhrál počítač.";
    }
    if (isPat(state)) {
      return "Nikdo nemůže hrát — remíza!";
    }
    return null;
  }

  /** Nová partie bez reloadu: reset stavu, NE druhý startGame (jediný listener zůstává). */
  function newGame(): void {
    state = createGame(rng);
    ended = false;
    locked = false;
    draw();
  }

  function draw(): void {
    render(state, app);
    if (!ended) {
      const msg = endMessage();
      if (msg) {
        ended = true;
        locked = true; // zamkni vstup (overlay navíc fyzicky překryje stůl)
        showEndOverlay(msg, newGame);
      }
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
      if (ended) {
        return; // hra mezitím skončila → žádný zbloudilý tah
      }
      state = advanceAi(state, rng);
      draw();
      locked = ended; // po výhře/patu nech zamčeno, jinak odemkni
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

  /** Otevře výběr motivu; po výběru přepne motiv a překreslí stůl (bez reloadu). */
  async function onChooseTheme(): Promise<void> {
    locked = true; // drž zámek, dokud overlay žije (žádný tah pod ním)
    try {
      const picked = await chooseTheme();
      if (picked !== null) {
        setActiveTheme(picked);
        draw(); // assety se počítají z aktivního motivu → re-render stačí
      }
    } finally {
      locked = false; // motiv nemění herní stav, hra nemohla skončit → odemkni
    }
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
    if (target.closest<HTMLElement>("[data-action='theme']")) {
      void onChooseTheme();
      return;
    }
    if (target.closest<HTMLElement>("[data-action='draw']")) {
      onDraw();
    }
  });

  draw();
}
