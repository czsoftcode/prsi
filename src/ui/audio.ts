// Zvuková vrstva: krátké efekty líznutí a odhozu + hudba na pozadí ve smyčce.
// Žije mimo render() — herní smyčka v main.ts ji volá ze stejných míst jako
// animace. Kontrakt: přehrání je fire-and-forget a NIKDY nesmí zaseknout smyčku —
// odmítnutý play() Promise (autoplay policy prohlížeče) i prostředí bez Audio
// (SSR/test) se tiše spolknou.
//
// Soubory leží v public/sounds/ (nejsou to moduly), proto se cesta skládá z
// BASE_URL stejně jako u obrázků karet — v dev/testech "/", v buildu "/prsi/".

const BASE = import.meta.env.BASE_URL;

/** Cesta k hudbě na pozadí (jeden trvalý smyčkový uzel, ne klonovaný efekt). */
const MUSIC_SRC = `${BASE}sounds/soundtrack.mp3`;
/** Hlasitost hudby — pod efekty, ať nepřehluší líznutí/odhoz a fanfáru. */
const MUSIC_VOLUME = 0.35;
/** Klíč v localStorage pro volbu zapnuté/vypnuté hudby (best-effort). */
const MUSIC_STORAGE_KEY = "prsi.music";

type SoundName = "draw" | "play" | "win" | "lose";

const SOURCES: Record<SoundName, string> = {
  draw: `${BASE}sounds/liznuti.mp3`,
  play: `${BASE}sounds/odhoz.mp3`,
  win: `${BASE}sounds/fanfara.mp3`,
  lose: `${BASE}sounds/defeat.mp3`,
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

/** Přednačte uzly jednou; vrací sdílenou čtveřici prvků. */
function ensureElements(): Record<SoundName, HTMLAudioElement> {
  if (!elements) {
    elements = {
      draw: makeAudio(SOURCES.draw),
      play: makeAudio(SOURCES.play),
      win: makeAudio(SOURCES.win),
      lose: makeAudio(SOURCES.lose),
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

/** Fanfára při výhře hráče. Volá se z main.ts jednou při skončení partie. */
export function playWin(): void {
  play("win");
}

/** Smutný zvuk při prohře hráče. Volá se z main.ts jednou při skončení partie. */
export function playLose(): void {
  play("lose");
}

// --- Hudba na pozadí ------------------------------------------------------

/** Trvalý smyčkový uzel hudby (jeden, NEklonuje se — na rozdíl od efektů). */
let musicEl: HTMLAudioElement | null = null;
/**
 * Zdroj pravdy pro zapnutou/vypnutou hudbu. `null` = ještě nenačteno z úložiště;
 * inicializuje se líně při prvním dotyku (isMusicEnabled/setMusicEnabled).
 */
let musicEnabled: boolean | null = null;

/** Přednačte hudební uzel jednou (loop + snížená hlasitost). */
function ensureMusic(): HTMLAudioElement {
  if (!musicEl) {
    musicEl = makeAudio(MUSIC_SRC);
    musicEl.loop = true;
    musicEl.volume = MUSIC_VOLUME;
  }
  return musicEl;
}

/** Best-effort čtení volby z localStorage; default zapnuto (vrací true). */
function loadMusicEnabled(): boolean {
  try {
    return localStorage.getItem(MUSIC_STORAGE_KEY) !== "off";
  } catch {
    return true; // localStorage nedostupné (private mode) → default zapnuto
  }
}

/** Vrátí, zda je hudba zapnutá (líně inicializuje z localStorage). */
export function isMusicEnabled(): boolean {
  if (musicEnabled === null) {
    musicEnabled = loadMusicEnabled();
  }
  return musicEnabled;
}

/**
 * Spustí hudbu od aktuální pozice. No-op, když: není Audio (test/SSR), zvuk
 * ještě nebyl odemčen gestem (autoplay policy) nebo je hudba vypnutá. Voláno
 * z unlock() (první gesto) a z newGame() v main.ts (restart partie).
 */
export function startMusic(): void {
  if (!audioAvailable() || !unlocked || !isMusicEnabled()) {
    return;
  }
  try {
    swallow(ensureMusic().play());
  } catch {
    // Hudba je dekorativní; synchronní chyba NESMÍ rozbít herní smyčku.
  }
}

/** Zastaví hudbu a přetočí na začátek (další startMusic ji rozjede znovu). */
export function stopMusic(): void {
  if (!musicEl) {
    return;
  }
  try {
    musicEl.pause();
    musicEl.currentTime = 0;
  } catch {
    // pause()/currentTime v exotickém prostředí — ignoruj, je to dekorace.
  }
}

/**
 * Přepne hudbu zap/vyp, uloží volbu (best-effort) a rovnou ji rozjede/utiší.
 * Vypnutí jen pozastaví (bez resetu pozice), aby zpětné zapnutí navázalo.
 */
export function setMusicEnabled(on: boolean): void {
  musicEnabled = on;
  try {
    localStorage.setItem(MUSIC_STORAGE_KEY, on ? "on" : "off");
  } catch {
    // localStorage nedostupné — volba platí aspoň pro tuto relaci (in-memory).
  }
  if (on) {
    startMusic();
  } else if (musicEl) {
    try {
      musicEl.pause();
    } catch {
      // viz výše — dekorace, chybu spolkni
    }
  }
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
  // Gesto právě odemklo autoplay i pro hudbu → rozjeď ji (respektuje volbu).
  startMusic();
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
