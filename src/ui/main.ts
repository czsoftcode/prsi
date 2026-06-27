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
import { animatePlay, animateDraw, clearAnim } from "./animate";
import {
  playPlay,
  playDraw,
  playWin,
  playLose,
  initAudioUnlock,
  startMusic,
  stopMusic,
  isMusicEnabled,
  setMusicEnabled,
} from "./audio";
import { isHintEnabled, setHintEnabled } from "./hint";

/** Prodleva před reakcí AI, aby byl tah vidět (není to animace, jen pauza). */
const AI_DELAY_MS = 600;
const rng = Math.random;

const app = document.querySelector<HTMLDivElement>("#app");

if (app) {
  startGame(app);
}

function startGame(app: HTMLElement): void {
  initAudioUnlock(); // odemkne zvuk na první gesto (autoplay policy)
  let state: GameState = createGame(rng);
  let locked = false; // zámek vstupu během AI prodlevy a otevřeného overlay
  let ended = false; // hra skončila (výhra/pat) → vstup zamčen, čeká se na novou partii
  // Generace partie: každá nová partie ji zvýší. Asynchronní tah (let ghostu, AI
  // prodleva) si svou generaci zapamatuje a po awaitu se zahodí, pokud se mezitím
  // změnila — jinak by stará continuation sáhla na zámek/AI nové partie.
  let generation = 0;

  function sameCard(a: Card, b: Card): boolean {
    return a.suit === b.suit && a.rank === b.rank;
  }

  /** Vrchní karta odhazovací hromádky (discardPile má vždy ≥1 prvek). */
  function topDiscard(s: GameState): Card {
    return s.discardPile[s.discardPile.length - 1]!;
  }

  /** Rect prvku v #app, nebo null když chybí / nemá layout. */
  function rectOf(selector: string): DOMRect | null {
    return app.querySelector(selector)?.getBoundingClientRect() ?? null;
  }

  /**
   * Nechá ghost zahrané `card` přeletět z `fromRect` (zachyceného PŘED překreslením)
   * na aktuální vrch hromádky. Cíl se čte až teď, po draw(). Když některý rect
   * chybí, animace se přeskočí (smyčka pokračuje). animatePlay resolvuje vždy.
   */
  async function flyToDiscard(card: Card, fromRect: DOMRect | null): Promise<void> {
    playPlay(); // zvuk odhozu — před guardem, ať zní i bez animace (reduced-motion)
    const toRect = rectOf(".pile--discard .card--face");
    if (!fromRect || !toRect) {
      return;
    }
    await animatePlay({ fromRect, toRect, card });
  }

  /**
   * Nechá `count` rubů přeletět z lízacího balíčku (`fromRect` zachycený PŘED
   * překreslením) do zóny ruky `handSelector`, kterou čte až teď (po draw()).
   * Když některý rect chybí, animace se přeskočí. animateDraw resolvuje vždy.
   */
  async function flyFromDraw(
    handSelector: string,
    count: number,
    fromRect: DOMRect | null,
  ): Promise<void> {
    playDraw(); // zvuk líznutí — před guardem, ať zní i bez animace (reduced-motion)
    const toRect = rectOf(handSelector);
    if (!fromRect || !toRect) {
      return;
    }
    await animateDraw({ fromRect, toRect, count });
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
    generation++; // zneplatni doběhlé async tahy z minulé partie
    clearAnim(); // smaž případný letící ghost, ať nepřeletí přes nový stůl
    state = createGame(rng);
    ended = false;
    locked = false;
    startMusic(); // rozjeď hudbu (od začátku — předchozí konec hry zavolal
    // stopMusic, který přetočil currentTime na 0); no-op když je hudba vypnutá
    draw();
  }

  function draw(): void {
    render(state, app);
    if (!ended) {
      const msg = endMessage();
      if (msg) {
        ended = true;
        locked = true; // zamkni vstup (overlay navíc fyzicky překryje stůl)
        // Zvuk konce hry právě jednou: ended brání opakování při dalším renderu,
        // newGame() ho resetuje → po nové partii může zaznít znovu. Pat (winner ===
        // null) zůstává bez zvuku.
        stopMusic(); // ztiš hudbu, ať fanfára/defeat (i pat) zazní do ticha
        const winner = winnerOf(state);
        if (winner === "player") {
          playWin();
        } else if (winner === "ai") {
          playLose();
        }
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
    const gen = generation;
    window.setTimeout(() => {
      void runAi(gen);
    }, AI_DELAY_MS);
  }

  /**
   * Dožene tahy AI a animuje JEDEN přelet. Priorita: zahrání (vrch hromádky se
   * změnil) → ghost ze zóny AI na hromádku. Jinak když ruka AI vzrostla → líznutí
   * (rub z balíčku do zóny AI). Zjednodušení: při esu hraje AI víc karet v jednom
   * advanceAi (animuje se jen výsledná vrchní karta), a vzácný případ "eso + vynucené
   * braní" ukáže jen zahrání. Detekce líznutí přes nárůst ruky, ne přes drawPile
   * (robustní vůči remíchání balíčku). Zámek se uvolní až po letu.
   */
  async function runAi(gen: number): Promise<void> {
    if (gen !== generation || ended) {
      return; // nová partie během AI prodlevy, nebo hra už skončila → zbloudilý tah
    }
    const topBefore = topDiscard(state);
    const aiCountBefore = state.aiHand.length;
    // Zdroje obou možných animací, zachycené před překreslením.
    const playFrom = rectOf(".zone--ai .card--back") ?? rectOf(".zone--ai");
    const drawFrom = rectOf(".pile--draw");
    state = advanceAi(state, rng);
    const played = topDiscard(state);
    const drew = state.aiHand.length - aiCountBefore;
    draw();
    if (!sameCard(topBefore, played)) {
      await flyToDiscard(played, playFrom);
    } else if (drew > 0) {
      await flyFromDraw(".hand--ai", drew, drawFrom);
    }
    if (gen !== generation) {
      return; // během letu začala nová partie → nesahej na její zámek
    }
    locked = ended; // po výhře/patu nech zamčeno, jinak odemkni
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
    // Zdrojový rect zahrané karty musíme zachytit PŘED draw() — po překreslení
    // už karta v ruce není.
    const fromRect = rectOf(`.hand--player .card--face[data-index="${index}"]`);
    state = next;
    draw();
    locked = true; // drž zámek po dobu letu ghostu, ať klik nerozjede stav
    const gen = generation;
    await flyToDiscard(card, fromRect);
    if (gen !== generation) {
      return; // během letu začala nová partie → tahle continuation už neplatí
    }
    if (ended) {
      return; // vítězný tah hráče: nech zamčeno (overlay stejně překrývá), nevolej AI
    }
    scheduleAi(); // nastaví zámek dle toho, kdo je na tahu
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

  async function onDraw(): Promise<void> {
    if (locked || gameOver() || state.currentPlayer !== "player") {
      return;
    }
    const next = playerDraw(state, rng);
    if (!next) {
      return; // nelze líznout: nebyl na tahu / konec / prázdný balíček (stall)
    }
    // Počet líznutých karet a zdroj (lízací balíček) zachytit PŘED draw().
    const count = next.playerHand.length - state.playerHand.length;
    const fromRect = rectOf(".pile--draw");
    state = next;
    draw();
    locked = true; // drž zámek po dobu letu rubů, ať klik nerozjede stav
    const gen = generation;
    await flyFromDraw(".hand--player", count, fromRect);
    if (gen !== generation) {
      return; // během letu začala nová partie → tahle continuation už neplatí
    }
    scheduleAi(); // nastaví zámek dle toho, kdo je na tahu
  }

  // Jeden delegovaný listener — přežije full re-render #app. Click pokrývá myš i dotyk.
  app.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    // Vypínač hudby řešíme PŘED zámkem `locked`, ať jde přepnout i v okně AI
    // prodlevy (locked=true, ale stůl je odkrytý). Nemění herní stav. Pozn.: pod
    // otevřeným overlayem (výběr barvy/motivu, konec hry) je tlačítko fyzicky
    // překryté (overlay má z-index a chytá kliky), takže tam se sem klik nedostane.
    if (target.closest<HTMLElement>("[data-action='music']")) {
      setMusicEnabled(!isMusicEnabled());
      draw(); // překresli popisek tlačítka podle nového stavu
      return;
    }
    // Přepínač nápovědy je čistě vizuální (nemění herní stav) — řešíme ho také
    // PŘED zámkem `locked`, ať jde přepnout i v okně AI prodlevy.
    if (target.closest<HTMLElement>("[data-action='hint']")) {
      setHintEnabled(!isHintEnabled());
      draw(); // překresli stůl: tlačítko + (ne)zvýraznění hratelných karet
      return;
    }
    if (locked) {
      return;
    }
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
      void onDraw();
    }
  });

  draw();
}
