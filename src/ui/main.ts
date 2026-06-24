import "./style.css";
import { createDeck, deal } from "../engine/cards";
import { render } from "./render";

const app = document.querySelector<HTMLDivElement>("#app");

if (app) {
  // Zatím bez interakce a míchání — ukázkový rozdaný stav pro vykreslení.
  const state = deal(createDeck());
  render(state, app);
}
