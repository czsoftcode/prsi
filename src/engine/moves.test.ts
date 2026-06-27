import { describe, it, expect } from "vitest";
import { type Card, type GameState, type Suit } from "./cards";
import { isPlayable, playableCards, playCard, drawCard, standAce, winnerOf } from "./moves";

const c = (suit: Suit, rank: Card["rank"]): Card => ({ suit, rank });
const key = (card: Card) => `${card.suit}-${card.rank}`;

/**
 * Sestaví stav z dílčích polí; doplní rozumné defaulty. Obě ruce defaultují na
 * jednu placeholder kartu (= rozehraná partie), aby `winnerOf` byl null a guard
 * pořadí/konce hry nehlásil falešnou výhru. Testy, které potřebují prázdnou ruku
 * nebo konkrétní karty, si je nastaví explicitně.
 */
function makeState(partial: Partial<GameState>): GameState {
  const discardPile = partial.discardPile ?? [c("srdce", "kral")];
  return {
    playerHand: partial.playerHand ?? [c("zaludy", "kral")],
    aiHand: partial.aiHand ?? [c("zaludy", "kral")],
    drawPile: partial.drawPile ?? [],
    discardPile,
    currentSuit: partial.currentSuit ?? discardPile[discardPile.length - 1]!.suit,
    currentPlayer: partial.currentPlayer ?? "player",
    pendingSevens: partial.pendingSevens ?? 0,
    pendingAces: partial.pendingAces ?? 0,
  };
}

describe("isPlayable", () => {
  const top = c("srdce", "kral");
  it("shoda barvy s aktuální barvou", () => {
    expect(isPlayable(c("srdce", "7"), top, "srdce")).toBe(true);
  });
  it("shoda hodnoty s vrchní kartou", () => {
    expect(isPlayable(c("kule", "kral"), top, "srdce")).toBe(true);
  });
  it("žádná shoda", () => {
    expect(isPlayable(c("kule", "7"), top, "srdce")).toBe(false);
  });
  it("barva se porovnává s currentSuit, ne s vrchní kartou", () => {
    // vrchní je srdce, ale aktuální barva je kule (po svršku)
    expect(isPlayable(c("kule", "8"), top, "kule")).toBe(true);
    expect(isPlayable(c("srdce", "8"), top, "kule")).toBe(false);
  });
  it("svršek je divoká karta — hratelný na libovolnou barvu i hodnotu", () => {
    // vrchní srdce-kral, aktuální barva srdce; svršek bez shody barvy ani hodnoty.
    expect(isPlayable(c("kule", "svrsek"), top, "srdce")).toBe(true);
    expect(isPlayable(c("zelene", "svrsek"), c("kule", "8"), "kule")).toBe(true);
  });
  it("svršek sedmy neruší — pod útokem je hratelná jen sedma", () => {
    expect(isPlayable(c("kule", "svrsek"), top, "srdce", 1)).toBe(false);
  });
});

describe("playableCards", () => {
  it("vrátí jen hratelné karty", () => {
    const hand = [c("srdce", "7"), c("kule", "8"), c("zelene", "kral")];
    const result = playableCards(hand, c("srdce", "kral"), "srdce");
    expect(result.map(key)).toEqual(["srdce-7", "zelene-kral"]);
  });
});

describe("playCard", () => {
  it("vyloží kartu, nastaví currentSuit a odebere ji z ruky", () => {
    const state = makeState({
      playerHand: [c("srdce", "7"), c("kule", "8")],
      discardPile: [c("srdce", "kral")],
    });
    const next = playCard(state, "player", c("srdce", "7"));
    expect(next.playerHand.map(key)).toEqual(["kule-8"]);
    expect(next.discardPile.map(key)).toEqual(["srdce-kral", "srdce-7"]);
    expect(next.currentSuit).toBe("srdce");
  });

  it("zahrání shodou hodnoty nastaví currentSuit na barvu zahrané karty", () => {
    const state = makeState({
      playerHand: [c("kule", "kral")],
      discardPile: [c("srdce", "kral")],
      currentSuit: "srdce",
    });
    const next = playCard(state, "player", c("kule", "kral"));
    expect(next.currentSuit).toBe("kule");
  });

  it("nemění vstupní stav", () => {
    const state = makeState({
      playerHand: [c("srdce", "7"), c("kule", "8")],
      discardPile: [c("srdce", "kral")],
    });
    const before = state.playerHand.map(key);
    playCard(state, "player", c("srdce", "7"));
    expect(state.playerHand.map(key)).toEqual(before);
    expect(state.discardPile.map(key)).toEqual(["srdce-kral"]);
  });

  it("vyhodí Error, když hráč kartu nemá", () => {
    const state = makeState({ playerHand: [c("srdce", "7")] });
    expect(() => playCard(state, "player", c("kule", "8"))).toThrow();
  });

  it("vyhodí Error pro neplatný tah", () => {
    const state = makeState({
      playerHand: [c("kule", "8")],
      discardPile: [c("srdce", "kral")],
      currentSuit: "srdce",
    });
    expect(() => playCard(state, "player", c("kule", "8"))).toThrow();
  });

  it("funguje i pro AI", () => {
    const state = makeState({
      aiHand: [c("srdce", "9")],
      currentPlayer: "ai",
      discardPile: [c("srdce", "kral")],
    });
    const next = playCard(state, "ai", c("srdce", "9"));
    expect(next.aiHand).toHaveLength(0);
    expect(next.discardPile.map(key)).toContain("srdce-9");
  });
});

describe("drawCard", () => {
  const noRng = () => 0;

  it("líznutí přidá vrchní kartu balíčku do ruky", () => {
    const state = makeState({
      playerHand: [c("srdce", "7")],
      drawPile: [c("kule", "9"), c("zelene", "10")], // top = poslední
    });
    const next = drawCard(state, "player", noRng);
    expect(next.playerHand.map(key)).toEqual(["srdce-7", "zelene-10"]);
    expect(next.drawPile.map(key)).toEqual(["kule-9"]);
  });

  it("nemění vstupní stav", () => {
    const state = makeState({
      playerHand: [c("srdce", "7")],
      drawPile: [c("zelene", "10")],
    });
    drawCard(state, "player", noRng);
    expect(state.playerHand.map(key)).toEqual(["srdce-7"]);
    expect(state.drawPile.map(key)).toEqual(["zelene-10"]);
  });

  it("při prázdném balíčku remíchá odhazovací hromádku bez vrchní karty", () => {
    const state = makeState({
      playerHand: [c("kule", "9")], // jedna karta v ruce — hráč s prázdnou rukou by už vyhrál
      drawPile: [],
      discardPile: [c("srdce", "7"), c("srdce", "8"), c("srdce", "kral")], // top = kral
      currentSuit: "srdce",
    });
    const next = drawCard(state, "player", noRng);
    // vrchní karta zůstává na hromádce
    expect(next.discardPile.map(key)).toEqual(["srdce-kral"]);
    // líznula se jedna z remíchaných (7/8), v balíčku zbyla druhá
    expect(next.playerHand).toHaveLength(2);
    expect(next.drawPile).toHaveLength(1);
    // výchozí kule-9 zůstává, remíchané 7/8 se rozdělily mezi ruku a balíček
    const moved = [...next.playerHand.filter((card) => key(card) !== "kule-9"), ...next.drawPile]
      .map(key)
      .sort();
    expect(moved).toEqual(["srdce-7", "srdce-8"]);
  });

  it("pod nakupenými esy vyhodí Error (líznout nelze)", () => {
    const state = makeState({
      playerHand: [c("kule", "8")],
      drawPile: [c("zelene", "10")],
      pendingAces: 1,
    });
    expect(() => drawCard(state, "player", noRng)).toThrow();
  });

  it("vrátí stav beze změny, když není co líznout ani míchat", () => {
    const state = makeState({
      playerHand: [c("kule", "9")],
      drawPile: [],
      discardPile: [c("srdce", "kral")], // jen vrchní karta
    });
    const next = drawCard(state, "player", noRng);
    expect(next).toBe(state);
  });
});

describe("střídání tahu", () => {
  const noRng = () => 0;

  it("po normální kartě přechází tah na soupeře", () => {
    const state = makeState({
      playerHand: [c("srdce", "8")],
      currentPlayer: "player",
      discardPile: [c("srdce", "kral")],
    });
    expect(playCard(state, "player", c("srdce", "8")).currentPlayer).toBe("ai");
  });

  it("po líznutí přechází tah na soupeře", () => {
    const state = makeState({
      aiHand: [c("srdce", "8")],
      drawPile: [c("kule", "9")],
      currentPlayer: "ai",
    });
    expect(drawCard(state, "ai", noRng).currentPlayer).toBe("player");
  });
});

describe("eso — přebití a stání", () => {
  it("zahrání esa předá tah soupeři a nastaví pendingAces na 1", () => {
    const state = makeState({
      playerHand: [c("srdce", "eso"), c("kule", "8")],
      currentPlayer: "player",
      discardPile: [c("srdce", "kral")],
    });
    const next = playCard(state, "player", c("srdce", "eso"));
    expect(next.currentPlayer).toBe("ai");
    expect(next.pendingAces).toBe(1);
  });

  it("v čekacím stavu je hratelné jen eso (přebití)", () => {
    const top = c("srdce", "kral");
    // shoda barvy i hodnoty by normálně prošla, ale pod nakupenými esy ne
    expect(isPlayable(c("srdce", "8"), top, "srdce", 0, 1)).toBe(false);
    expect(isPlayable(c("kule", "svrsek"), top, "srdce", 0, 1)).toBe(false);
    expect(isPlayable(c("kule", "eso"), top, "srdce", 0, 1)).toBe(true);
  });

  it("playableCards v čekacím stavu vrátí jen esa", () => {
    const hand = [c("srdce", "8"), c("kule", "eso"), c("zelene", "svrsek")];
    const result = playableCards(hand, c("srdce", "kral"), "srdce", 0, 1);
    expect(result.map(key)).toEqual(["kule-eso"]);
  });

  it("přebití esem řetězí: tah jde zpět a pendingAces roste (1 → 2)", () => {
    const state = makeState({
      aiHand: [c("kule", "eso")],
      currentPlayer: "ai",
      discardPile: [c("srdce", "eso")],
      currentSuit: "srdce",
      pendingAces: 1,
    });
    const next = playCard(state, "ai", c("kule", "eso"));
    expect(next.currentPlayer).toBe("player");
    expect(next.pendingAces).toBe(2);
  });

  it("standAce předá tah soupeři a vynuluje pendingAces", () => {
    const state = makeState({
      playerHand: [c("kule", "8")],
      currentPlayer: "player",
      pendingAces: 2,
    });
    const next = standAce(state, "player");
    expect(next.currentPlayer).toBe("ai");
    expect(next.pendingAces).toBe(0);
    // stání nelíže — ruka beze změny
    expect(next.playerHand.map(key)).toEqual(["kule-8"]);
  });

  it("standAce bez nakupených es je Error", () => {
    const state = makeState({ playerHand: [c("kule", "8")], pendingAces: 0 });
    expect(() => standAce(state, "player")).toThrow();
  });

  it("standAce nemění vstupní stav", () => {
    const state = makeState({ playerHand: [c("kule", "8")], pendingAces: 1 });
    standAce(state, "player");
    expect(state.currentPlayer).toBe("player");
    expect(state.pendingAces).toBe(1);
  });

  it("eso jako poslední karta = výhra (efekt se neaplikuje)", () => {
    const state = makeState({
      playerHand: [c("srdce", "eso")],
      aiHand: [c("kule", "9")],
      currentPlayer: "player",
      discardPile: [c("srdce", "kral")],
    });
    const next = playCard(state, "player", c("srdce", "eso"));
    expect(next.playerHand).toHaveLength(0);
    expect(winnerOf(next)).toBe("player");
  });
});

describe("svršek", () => {
  it("nastaví aktuální barvu na vybranou, ne na barvu karty", () => {
    const state = makeState({
      playerHand: [c("srdce", "svrsek")],
      discardPile: [c("srdce", "kral")],
      currentSuit: "srdce",
    });
    const next = playCard(state, "player", c("srdce", "svrsek"), "kule");
    expect(next.currentSuit).toBe("kule");
  });

  it("další tah se validuje proti zvolené barvě", () => {
    const state = makeState({
      playerHand: [c("srdce", "svrsek")],
      discardPile: [c("srdce", "kral")],
      currentSuit: "srdce",
    });
    const next = playCard(state, "player", c("srdce", "svrsek"), "kule");
    // kule projde (zvolená barva), srdce ne (přestože vrchní karta je srdce)
    expect(isPlayable(c("kule", "8"), c("srdce", "svrsek"), next.currentSuit)).toBe(true);
    expect(isPlayable(c("srdce", "8"), c("srdce", "svrsek"), next.currentSuit)).toBe(false);
  });

  it("svršek bez výběru barvy je Error", () => {
    const state = makeState({
      playerHand: [c("srdce", "svrsek")],
      discardPile: [c("srdce", "kral")],
    });
    expect(() => playCard(state, "player", c("srdce", "svrsek"))).toThrow();
  });

  it("chosenSuit u jiné než svršek je Error", () => {
    const state = makeState({
      playerHand: [c("srdce", "8")],
      discardPile: [c("srdce", "kral")],
    });
    expect(() => playCard(state, "player", c("srdce", "8"), "kule")).toThrow();
  });
});

describe("sedma — hromadění a líznutí penalty", () => {
  const noRng = () => 0;

  it("zahrání sedmy zvýší pendingSevens", () => {
    const state = makeState({
      playerHand: [c("srdce", "7")],
      discardPile: [c("srdce", "kral")],
      pendingSevens: 0,
    });
    expect(playCard(state, "player", c("srdce", "7")).pendingSevens).toBe(1);
  });

  it("pod útokem sedmy je hratelná jen další sedma", () => {
    const top = c("srdce", "7");
    // shoda barvy i hodnoty by normálně prošla, ale pod útokem ne
    expect(isPlayable(c("srdce", "8"), top, "srdce", 1)).toBe(false);
    expect(isPlayable(c("kule", "7"), top, "srdce", 1)).toBe(true);
  });

  it("playableCards pod útokem vrátí jen sedmy", () => {
    const hand = [c("srdce", "8"), c("kule", "7"), c("zelene", "kral")];
    const result = playableCards(hand, c("srdce", "7"), "srdce", 2);
    expect(result.map(key)).toEqual(["kule-7"]);
  });

  it("nakupení sedem zvyšuje pendingSevens (1 → 2)", () => {
    const state = makeState({
      playerHand: [c("kule", "7")],
      discardPile: [c("srdce", "7")],
      currentSuit: "srdce",
      pendingSevens: 1,
    });
    expect(playCard(state, "player", c("kule", "7")).pendingSevens).toBe(2);
  });

  it("eso pod útokem sedmy nelze zahrát", () => {
    const state = makeState({
      playerHand: [c("srdce", "eso")],
      discardPile: [c("srdce", "7")],
      currentSuit: "srdce",
      pendingSevens: 1,
    });
    expect(() => playCard(state, "player", c("srdce", "eso"))).toThrow();
  });

  it("líznutí pod útokem vezme 2 × pendingSevens a vynuluje", () => {
    const drawPile = [
      c("kule", "8"),
      c("kule", "9"),
      c("kule", "10"),
      c("zelene", "8"),
      c("zelene", "9"),
      c("zelene", "10"),
    ];
    for (const [pending, expected] of [
      [1, 2],
      [2, 4],
      [3, 6],
    ] as const) {
      const state = makeState({
        playerHand: [c("zaludy", "kral")], // 1 výchozí karta — s prázdnou rukou by hráč už vyhrál
        drawPile,
        pendingSevens: pending,
      });
      const next = drawCard(state, "player", noRng);
      expect(next.playerHand).toHaveLength(expected + 1); // +1 výchozí karta
      expect(next.pendingSevens).toBe(0);
    }
  });

  it("ber 8 při 4 nakupených sedmách (remíchá uprostřed penalty)", () => {
    // 5 v balíčku + 3 pod vrchní = 8 lízatelných; po 5 kartách dojde a remíchá se.
    const state = makeState({
      playerHand: [c("zaludy", "kral")], // 1 výchozí karta
      drawPile: [
        c("kule", "7"),
        c("kule", "8"),
        c("kule", "9"),
        c("kule", "10"),
        c("kule", "spodek"),
      ],
      discardPile: [c("zelene", "8"), c("zelene", "9"), c("zelene", "10"), c("srdce", "kral")],
      currentSuit: "srdce",
      pendingSevens: 4,
    });
    const next = drawCard(state, "player", noRng);
    expect(next.playerHand).toHaveLength(9); // 1 výchozí + 2 × 4
    expect(next.pendingSevens).toBe(0);
    // vrchní karta zůstala na hromádce
    expect(next.discardPile.map(key)).toEqual(["srdce-kral"]);
  });

  it("penalta větší než dostupné karty vezme jen co jde (nezacyklí se)", () => {
    const state = makeState({
      playerHand: [c("zaludy", "kral")], // 1 výchozí karta
      drawPile: [c("kule", "8"), c("kule", "9"), c("kule", "10")], // 3 + 0 pod vrchní
      discardPile: [c("srdce", "kral")],
      currentSuit: "srdce",
      pendingSevens: 4, // chtělo by 8, ale jsou jen 3
    });
    const next = drawCard(state, "player", noRng);
    expect(next.playerHand).toHaveLength(4); // 1 výchozí + 3 dostupné
    expect(next.pendingSevens).toBe(0);
  });
});

describe("winnerOf", () => {
  it("hráč s prázdnou rukou vyhrává", () => {
    const state = makeState({ playerHand: [], aiHand: [c("srdce", "8")] });
    expect(winnerOf(state)).toBe("player");
  });

  it("AI s prázdnou rukou vyhrává", () => {
    const state = makeState({ playerHand: [c("srdce", "8")], aiHand: [] });
    expect(winnerOf(state)).toBe("ai");
  });

  it("dokud oba mají karty, není vítěz", () => {
    const state = makeState({ playerHand: [c("srdce", "8")], aiHand: [c("kule", "9")] });
    expect(winnerOf(state)).toBeNull();
  });

  it("výhra i když je poslední karta funkční (sedma) — efekt se neaplikuje", () => {
    const state = makeState({
      playerHand: [c("srdce", "7")],
      aiHand: [c("kule", "9")],
      discardPile: [c("srdce", "kral")],
    });
    const next = playCard(state, "player", c("srdce", "7"));
    expect(next.playerHand).toHaveLength(0);
    expect(winnerOf(next)).toBe("player");
  });
});

describe("guard pořadí tahu — tah nesprávného hráče", () => {
  const noRng = () => 0;

  // Ve všech případech má volající hráč legální tah (vlastní hratelnou kartu /
  // smí líznout / smí stát), takže jediný důvod k Erroru je guard pořadí — bez
  // guardu by volání prošlo a test by spadl (má zuby).
  it("playCard za hráče, který není na tahu, vyhodí Error", () => {
    const state = makeState({
      currentPlayer: "ai",
      playerHand: [c("srdce", "8")],
      aiHand: [c("kule", "9")],
      discardPile: [c("srdce", "kral")],
    });
    expect(() => playCard(state, "player", c("srdce", "8"))).toThrow(/na tahu/);
  });

  it("drawCard za hráče, který není na tahu, vyhodí Error", () => {
    const state = makeState({
      currentPlayer: "ai",
      playerHand: [c("srdce", "8")],
      aiHand: [c("kule", "9")],
      drawPile: [c("kule", "7")],
    });
    expect(() => drawCard(state, "player", noRng)).toThrow(/na tahu/);
  });

  it("standAce za hráče, který není na tahu, vyhodí Error", () => {
    const state = makeState({
      currentPlayer: "ai",
      pendingAces: 1,
      playerHand: [c("srdce", "8")],
      aiHand: [c("kule", "9")],
    });
    expect(() => standAce(state, "player")).toThrow(/na tahu/);
  });
});

describe("guard pořadí tahu — tah po skončené hře", () => {
  const noRng = () => 0;

  // Vítěz je AI (prázdná ruka), ale na tahu je poražený hráč (currentPlayer ===
  // "player"). Kontrola hráče by tedy prošla — Error padá výhradně z kontroly
  // konce hry, která jde první.
  it("playCard po výhře vyhodí Error i pro hráče na tahu", () => {
    const state = makeState({
      currentPlayer: "player",
      playerHand: [c("srdce", "8")],
      aiHand: [],
      discardPile: [c("srdce", "kral")],
    });
    expect(() => playCard(state, "player", c("srdce", "8"))).toThrow(/skončila/);
  });

  it("drawCard po výhře vyhodí Error i pro hráče na tahu", () => {
    const state = makeState({
      currentPlayer: "player",
      playerHand: [c("srdce", "8")],
      aiHand: [],
      drawPile: [c("kule", "7")],
    });
    expect(() => drawCard(state, "player", noRng)).toThrow(/skončila/);
  });

  it("standAce po výhře vyhodí Error i pro hráče na tahu", () => {
    const state = makeState({
      currentPlayer: "player",
      pendingAces: 1,
      playerHand: [c("srdce", "8")],
      aiHand: [],
    });
    expect(() => standAce(state, "player")).toThrow(/skončila/);
  });
});
