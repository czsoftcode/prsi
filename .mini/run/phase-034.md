---
phase: 34
verdict: done
steps:
  - title: "Typ AiLevel + parametrizace chooseAiMove"
    status: done
  - title: "Strategie dite (deterministicky slaba)"
    status: done
  - title: "Strategie expert (setri utocne karty)"
    status: done
  - title: "Testy tri urovni + komentar v ai.ts"
    status: done
  - title: "Regrese: typecheck + build + cela sada"
    status: done
verify:
  - title: "Herní pocit tří úrovní v reálné partii"
    detail: "Mechanicky ověřeno jen rozhodování v izolovaných stavech (jednotlivé tahy v testech). Jestli jsou dítě/dospělý/expert v plné partii znatelně odlišně silní (dítě se dá porazit, expert dotírá) půjde posoudit až po propojení s UI v navazující fázi — engine teď úroveň jen přijímá parametrem."
---

# Phase 34 — report z auto session

## Co je hotové
`chooseAiMove(state, level = "dospely")` má volitelný druhý parametr `AiLevel = "dite" | "dospely" | "expert"`. Výběr karty z hratelných kandidátů je vytažený do `pickByLevel`; pravidla, volba barvy po svršku (`chooseSuit`) i větve draw/stand zůstaly společné a nezměněné.

- **dospely** — beze změny (stávající `pickCard` / `RANK_PRIORITY`). Default → všech 388 původních testů prošlo bez úprav, čímž je potvrzeno, že „dospělý" = původní chování.
- **dite** — `pickWeak`: obrácená priorita, vybere kartu s nejnižší prioritou (zahodí svršek/obyčejné dřív, útočné karty drží). Plně deterministické.
- **expert** — `pickExpert`/`expertScore`: v útočném režimu (soupeř má ≤ `EXPERT_ATTACK_THRESHOLD` = 2 karet) vrhne eso a sedmu; jinak je šetří, nejdřív se zbavuje obyčejných karet a svršek hraje jen na přepnutí na vlastní převažující barvu (`svrsekUseful`).

## Determinismus
Žádný `Math.random` — engine zůstává čistý, stejný stav dává stejný tah. E2E simulace i ostatní testy nedotčeny.

## Testy
Přidáno 7 testů (3 dítě, 4 expert) ve vlastních `describe` blocích. Zuby: testy „dítě" porovnávají proti „dospělému" ve stejném stavu (rozdílná volba), expertí testy kontrastují útočný vs. šetřící režim a užitečný vs. zbytečný svršek — záměna strategie shodí příslušný test. Celkem 395 testů zelených, `tsc --noEmit` čistý, `vite build` projde.

## Pozn. k navazující práci
`AiLevel` je exportovaný, ale zatím nikým nevolaný (UI ho ještě nepředává). Propojení s UI a výběr úrovně je v todo. Vyškrtnutí non-goalu „Nepřidávej nastavení obtížnosti" patří do `/mini:project` (rovněž v todo) — vize je teď s kódem dočasně v rozporu.

## Rozhodnutí
Padlo jedno netriviální rozhodnutí hodné ADR: „dítě" deterministicky slabé (obrácená priorita) místo seedovaného RNG — drží čistotu enginu a reprodukovatelnost testů za cenu předvídatelnějšího soupeře. Zvaž `/mini:decision` před `/mini:done`.
