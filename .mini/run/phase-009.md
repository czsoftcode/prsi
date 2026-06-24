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
