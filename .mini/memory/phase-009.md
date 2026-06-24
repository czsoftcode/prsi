# Phase 9 — E2E herní simulace

**Goal:** Deterministický test zahraje N kompletních partií (AI vs. AI přes engine) a ověří, že každá skončí výhrou nebo pataem bez pádu invariantů.

## Steps
- [done] Simulační smyčka + invarianty
- [done] Parametrický test 200 partií

## Auto-commit
- Phase 9: E2E herní simulace

## Discussion
# Phase 9 — E2E herní simulace

## Intent
Napsat simulační test v `src/engine/simulation.test.ts` (čistý engine, žádný DOM). Zahraje 200 kompletních partií (100 seedů × 2 počáteční hráči). „Hráč" = deterministický bot (první hratelná karta nebo lízne), AI jede přes existující `advanceAi`. Každá partie musí skončit do 2 000 tahů, jinak test padne.

## Key decisions
- N = 200, max 2 000 tahů/partie — odsouhlaseno uživatelem.
- Invarianty po každém tahu: součet karet = 32, `currentSuit ∈ SUITS`, `pendingSevens ∈ [0,4]`.
- Simulace přímo přes `playCard`/`drawCard` z engine (ne přes `playerPlay`/`playerDraw` z UI game.ts) — testujeme engine nezávisle na UI vrstvě.
- Výsledek každé partie: `winnerOf !== null` nebo `isPat` — jinak test selže.

## Watch out for
- `advanceAi` obsahuje stall detection (vrátí stejný stav při zacyklení) — simulační loop to musí rozlišit od normálního průběhu (jinak nekonečná smyčka).
- `pendingSevens` max = 4 (čtyři sedmy v balíčku 32 karet) — ověřit v invariantu.
- `chooseSuit` v reálném UI vybírá hráč; v simulaci bot musí dodat barvu pro svršek (deterministicky, např. vždy první z SUITS).

## Run report
---
phase: 9
verdict: done
steps:
  - title: "Simulační smyčka + invarianty"
    status: done
  - title: "Parametrický test 200 partií"
    status: done
---

# Phase 9 — E2E herní simulace

Nový soubor `src/engine/simulation.test.ts`: 200 partií (seed 1–100 × player/ai začíná), každá projde kompletní smyčkou přes engine API bez DOM. Po každém tahu invarianty (32 karet, validní currentSuit, pendingSevens 0–4). Vše 200/200, celková sada 302/302.

`chooseAiMove` hardcoduje `state.aiHand` → player bot implementován inline (první hratelná karta nebo líz; svršek vždy volí SUITS[0]). `isPat` není importován — pat detekce je inline (identická logika).

Žádné edge case selhání: eso + pendingSevens souběh, remíchání prázdného balíčku, vícekolové tahy esa — vše prošlo bez narušení invariantů.
