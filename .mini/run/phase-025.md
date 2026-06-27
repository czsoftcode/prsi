---
phase: 25
verdict: done
steps:
  - title: "Heuristika shouldSaveSeven (čistý predikát)"
    status: done
  - title: "Zapojení do chooseAiMove"
    status: done
  - title: "Jednotkové testy v ai.test.ts"
    status: done
  - title: "Regrese smyčky a patu"
    status: done
  - title: "Zelený build, lint, celá suite + E2E"
    status: done
---

# Phase 25 — report z auto session (feature nakonec REVERTOVÁNA)

## Výsledek
Feature „strategické šetření sedmy" byla implementována, prošla adversarial review,
a na základě jeho nálezu **kompletně revertována**. Chování AI je tedy stejné jako
před fází 25: pod nakupenými sedmami AI vždy zahraje vlastní sedmu (řetězí penaltu),
nikdy ji vědomě nešetří. Žádná čistá změna v `src/engine/ai.ts`.

## Proč revert (nález 25-1, should-know)
Heuristika rozhodovala o ušetření jen z velikosti penalty a vlastní ruky, vůbec
nečetla stav soupeře. V 1v1 prší ale šetření sedmy nemá payoff:
- Zahrát sedmu (bounce) = soupeř bere 2 (pokud nepřebije) — maximální možný zásah.
- Ušetřit sedmu = AI sama bere 2 karty a tutéž sedmu může „zaútočit později" za
  stejnou cenu → žádný zisk tempa, jen 2 karty navíc teď.
Spouštělo se to v běžné konfiguraci (`pendingSevens=1`, ruka ≥4 = většina hry), takže
to **systematicky** převracelo vyhrávající interakci (vrátit 2 soupeři) na prohrávající
(sníst 2 sám). To je nad rámec „záměrně hloupé" AI — `RANK_PRIORITY` dělá rovnoměrně
suboptimální volby, ale tahle větev aktivně sabotovala výhodný tah v jádrové mechanice.
Premisa todo 12 („strategicky šetřit sedmu") nemá v 1v1 reálný obsah; dává smysl jen
ve hrách 3+, které jsou explicitní non-goal projektu.

## Co bylo během epizody hotovo a pak vráceno
- `shouldSaveSeven` + konstanta `SAVE_SEVEN_MIN_HAND` v `ai.ts` — odstraněno.
- Save-větev v `chooseAiMove` — odstraněna; doc komentář vrácen.
- 4 testy v `ai.test.ts` a 1 regresní test v `game.test.ts` — odstraněny.
- Při implementaci se ukázal reálný soft-lock risk (ušetření při prázdném balíčku →
  `advanceAi` se zastaví, `isPat` to nehlásí), což byl jeden z argumentů, že feature
  přidává křehkost bez užitku.

## Stav po revertu
- `tsc --noEmit` zelené, build zelený, 374 testů zelených (zpět z 379 — 5 testů odebráno).
- Adversarial nálezy 25-1, 25-2, 25-3 uzavřeny (`mini findings resolve`).
- Todo 12 zůstává odškrtnuté jako vyřešené-zamítnuté (re-otevření by zvalo k dalšímu
  pokusu o feature, která v 1v1 nedává smysl).

## Doporučení
Tohle byla skutečná zamítnutá alternativa — vhodné zaznamenat ADR přes `/mini:decision`
(proč šetření sedmy v 1v1 nezavádět), aby se k tomu někdo za půl roku nevracel.
