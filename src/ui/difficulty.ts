/**
 * Volba úrovně obtížnosti AI (dítě / dospělý / expert).
 * Čistě prezentační vrstva nad enginem: drží zvolenou úroveň a propisuje ji do
 * chooseAiMove přes parametr advanceAi (engine sám na localStorage nesahá).
 * Volba se ukládá best-effort do localStorage (zrcadlo vzoru z hint.ts/audio.ts);
 * při nedostupném úložišti platí pro aktuální relaci (in-memory).
 *
 * Na rozdíl od nápovědy (boolean) je hodnota enum → uloženou hodnotu validujeme
 * proti AiLevel; cokoliv neznámého/poškozeného → default dospělý.
 */
import type { AiLevel } from "../engine/ai";

/** Klíč v localStorage pro volbu úrovně AI (best-effort). */
const DIFFICULTY_STORAGE_KEY = "prsi.difficulty";

/** Výchozí úroveň (stejná jako default chooseAiMove). */
const DEFAULT_LEVEL: AiLevel = "dospely";

/** Pořadí cyklu tlačítka: dítě → dospělý → expert → (zpět) dítě. */
const LEVEL_CYCLE: readonly AiLevel[] = ["dite", "dospely", "expert"];

let level: AiLevel | null = null;

/** Type guard: je hodnota platná AiLevel? (chrání proti poškozenému úložišti) */
function isAiLevel(value: string | null): value is AiLevel {
  return value === "dite" || value === "dospely" || value === "expert";
}

/** Best-effort čtení úrovně z localStorage; neznámá/chybějící → default. */
function loadLevel(): AiLevel {
  try {
    const stored = localStorage.getItem(DIFFICULTY_STORAGE_KEY);
    return isAiLevel(stored) ? stored : DEFAULT_LEVEL;
  } catch {
    return DEFAULT_LEVEL; // localStorage nedostupné (private mode) → default
  }
}

/** Vrátí zvolenou úroveň AI (líně inicializuje z localStorage). */
export function getAiLevel(): AiLevel {
  if (level === null) {
    level = loadLevel();
  }
  return level;
}

/** Nastaví úroveň AI a uloží volbu (best-effort). */
export function setAiLevel(next: AiLevel): void {
  level = next;
  try {
    localStorage.setItem(DIFFICULTY_STORAGE_KEY, next);
  } catch {
    // localStorage nedostupné — volba platí aspoň pro tuto relaci (in-memory).
  }
}

/** Posune úroveň na další v cyklu (dítě→dospělý→expert→dítě), uloží a vrátí ji. */
export function cycleAiLevel(): AiLevel {
  const current = getAiLevel();
  const idx = LEVEL_CYCLE.indexOf(current);
  // idx je vždy ≥ 0 (getAiLevel vrací validní AiLevel), modulo zajistí wrap.
  // idx ≥ 0 a modulo drží index v rozsahu → prvek vždy existuje (! kvůli
  // noUncheckedIndexedAccess; readonly tuple by typově nešel snadno zúžit).
  const next = LEVEL_CYCLE[(idx + 1) % LEVEL_CYCLE.length]!;
  setAiLevel(next);
  return next;
}
