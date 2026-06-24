---
phase: 5
verdict: done
steps:
  - title: "Typ tahu AI a kostra ai.ts"
    status: done
  - title: "Heuristika výběru karty (priorita)"
    status: done
  - title: "Výběr barvy po svrškovi"
    status: done
  - title: "chooseAiMove: sestavení tahu + invariant platnosti"
    status: done
  - title: "Unit testy AI"
    status: done
---

# Phase 5 — report z auto session

## Co vzniklo
- `src/engine/ai.ts` — čistá funkce `chooseAiMove(state): AiMove`, typ `AiMove` (discriminated union `play` | `draw`). Nic nemutuje, vrací rozhodnutí, které volající provede přes `playCard`/`drawCard`.
- `src/engine/ai.test.ts` — 17 testů. Full suite 64/64 zelená, `tsc --noEmit` čistý.

## Heuristika (priorita hodnot, vyšší = hraj dřív)
eso (4) > sedma (3) > obyčejné 8/9/10/spodek/kral (2) > svršek (1). Při shodě priority se bere první karta v pořadí ruky (deterministické). Barva po svršku = nejčastější barva ve zbytku ruky, tie-break podle pořadí `SUITS`.

## Odchylka od plánu (vědomá)
Plán naznačoval „obyčejná shoda dřív". Zvolil jsem **eso jako nejvyšší prioritu**: v 1v1 dává tah znovu, takže urychluje vyprázdnění ruky. Svršek je naopak nejníž — řídí barvu, drží se jako poslední záchrana. Je to defenzibilní, ale je to skutečné rozhodnutí — jestli chceš zafixovat „proč" do ADR, spusť před `/mini:done` příkaz `/mini:decision`. Není to nutné, heuristika je záměrně jednoduchá.

## Jak je pokrytá „vždy platný tah"
Reakce na `pendingSevens` i vynucenou barvu nedělá AI ručně — spoléhá na `playableCards`, který obojí už filtruje (proto AI při nakupených sedmách bez sedmy správně padne na `draw`). Invariant je navíc otestovaný proti **reálnému** `playCard`/`drawCard` (ne mock): pro 6 reprezentativních stavů musí vrácený tah projít bez výjimky a hraná karta být v `playableCards`. Plus test čistoty (vstupní stav se nemění přes JSON snapshot).

## Pozn. k self-review
Nepouštěl jsem nezávislého sub-agenta: jediný cross-module kontrakt je `Record<Rank, …>` (vyčerpávající barvy/hodnoty vynucuje kompilátor) a pořadí `SUITS` (přímo aserované v testu proti reálnému kódu). Žádná chybová cesta ani vstupní bod procesu — čistá funkce. Invariant platnosti drží strukturálně: `pickCard` vybírá jen z `playableCards`, svršek vždy dostane `chosenSuit`, jiné karty nikdy.

## Co může selhat / co sledovat dál
- Heuristika je „hloupá" záměrně — netestuje se kvalita hry, jen platnost. Ladění chytrosti není cílem této fáze.
- Při shodě priority závisí výběr na pořadí karet v ruce; pořadí je deterministické, ale není „nejlepší" volba — to je v pořádku pro tuto verzi.
