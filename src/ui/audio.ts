// Zvuková vrstva: krátké efekty líznutí a odhozu. Žije mimo render() — herní
// smyčka v main.ts ji volá ze stejných míst jako animace. Kontrakt: přehrání je
// fire-and-forget a NIKDY nesmí zaseknout smyčku — odmítnutý play() Promise
// (autoplay policy prohlížeče) i prostředí bez Audio (SSR/test) se tiše spolknou.
//
// Soubory leží v public/sounds/ (nejsou to moduly), proto se cesta skládá z
// BASE_URL stejně jako u obrázků karet — v dev/testech "/", v buildu "/prsi/".

const BASE = import.meta.env.BASE_URL;

type SoundName = "draw" | "play";

const SOURCES: Record<SoundName, string> = {
  draw: `${BASE}sounds/liznuti.mp3`,
  play: `${BASE}sounds/odhoz.mp3`,
};

/** Přednačtené uzly (jeden na zvuk). Lazy: až při prvním dotyku na zvuk. */
let elements: Record<SoundName, HTMLAudioElement> | null = null;
/** Odemčeno gestem uživatele (po něm prohlížeč povolí programové play()). */
let unlocked = false;
/** Posluchače gesta jsou navěšené (ať initAudioUnlock nezdvojuje listenery). */
let armed = false;

function audioAvailable(): boolean {
  return typeof Audio !== "undefined";
}

function makeAudio(src: string): HTMLAudioElement {
  const a = new Audio(src);
  a.preload = "auto";
  return a;
}

/** Přednačte uzly jednou; vrací sdílenou trojici (resp. dvojici) prvků. */
function ensureElements(): Record<SoundName, HTMLAudioElement> {
  if (!elements) {
    elements = {
      draw: makeAudio(SOURCES.draw),
      play: makeAudio(SOURCES.play),
    };
  }
  return elements;
}

/** Tiše spolkne odmítnutý play() Promise (autoplay policy / test bez audia). */
function swallow(p: ReturnType<HTMLAudioElement["play"]> | undefined): void {
  if (p && typeof p.catch === "function") {
    p.catch(() => {});
  }
}

/**
 * Přehraje efekt `name`. Klon přednačteného uzlu umožní překryv rychlých tahů
 * (původní uzel může ještě dohrávat — stagger líznutí po sedmě, rychlé AI tahy).
 * Bez Audia (test/SSR) je to no-op.
 */
function play(name: SoundName): void {
  if (!audioAvailable()) {
    return;
  }
  try {
    const base = ensureElements()[name];
    const node = base.cloneNode(true) as HTMLAudioElement;
    node.muted = false; // klon nesmí zdědit dočasné ztlumení z unlock() (base je
    // během odemčení krátce muted — bez tohoto by první efekt mohl být němý)
    node.currentTime = 0;
    swallow(node.play());
  } catch {
    // Zvuk je čistě dekorativní; jakákoli synchronní chyba (exotické prostředí,
    // odpojený DOM) NESMÍ rozbít herní smyčku, která flyToDiscard/flyFromDraw
    // awaituje. Programátorskou chybu tu odhalí unit testy, ne runtime.
  }
}

export function playDraw(): void {
  play("draw");
}

export function playPlay(): void {
  play("play");
}

/** Odemkne audio během uživatelského gesta: krátce (muted) prohraje uzly. */
function unlock(): void {
  if (unlocked) {
    return;
  }
  unlocked = true;
  if (!audioAvailable()) {
    return;
  }
  for (const a of Object.values(ensureElements())) {
    const wasMuted = a.muted;
    a.muted = true;
    const restore = (): void => {
      a.pause();
      a.currentTime = 0;
      a.muted = wasMuted;
    };
    const p = a.play();
    if (p && typeof p.then === "function") {
      p.then(restore).catch(() => {
        a.muted = wasMuted; // play neproběhl → aspoň vrať mute zpět
      });
    } else {
      restore();
    }
  }
}

/**
 * Navěsí jednorázové odemčení zvuku na první gesto uživatele (pointerdown nebo
 * keydown). Bez něj by tah AI hned po načtení mohl být prohlížečem umlčen.
 * Opakované volání je no-op (listenery se nezdvojují).
 */
export function initAudioUnlock(): void {
  if (armed || unlocked) {
    return;
  }
  if (typeof window === "undefined") {
    return;
  }
  armed = true;
  const handler = (): void => {
    window.removeEventListener("pointerdown", handler);
    window.removeEventListener("keydown", handler);
    unlock();
  };
  window.addEventListener("pointerdown", handler);
  window.addEventListener("keydown", handler);
}
