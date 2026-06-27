---
phase: 28
verdict: done
steps:
  - title: "README: eso = přebij nebo stůj"
    status: done
  - title: "README: doplnit dobrovolné líznutí"
    status: done
  - title: "Projektový kontrakt v .mini/project.md"
    status: done
  - title: "Komentář priority eso v ai.ts + zelená regrese"
    status: done
---

# Phase 28 — report z auto session

Čistě dokumentační fáze (fix nálezu 25-4), žádná změna herní logiky. Před úpravami jsem
ověřil reálné shipped chování v kódu, abych texty psal přesně:

- `src/engine/moves.ts:108–139` + `src/ui/game.ts:80–101` — eso předá tah soupeři a hromadí
  se (`pendingAces++`); soupeř musí přebít vlastním esem, nebo stát (`playerStand`, přijde
  o tah bez líznutí). Pod nakupenými esy `playerDraw` vrací `null` → líznout nelze.
- `playerDraw` dovoluje dobrovolné líznutí kdykoliv na tahu (i s hratelnou kartou), tím se
  předá tah soupeři.

Provedené úpravy textů:
- `README.md:17–20` — eso přepsáno na „přebij vlastním esem, nebo stůj"; doplněno, že líznout
  lze i dobrovolně kdykoliv na tahu.
- `.mini/project.md:12` — kontrakt sjednocen se stejným zněním (eso přebij-nebo-stůj +
  dobrovolné líznutí). Vědomá ruční editace mimo `/mini:project`, jen sjednocení textu.
- `src/engine/ai.ts:21` — komentář priority eso upřesněn: eso není bezpodmínečné „tah znovu",
  soupeř může přebít vlastním esem; „hraješ znovu" platí jen po nepřebitém esu.

`npm test` zelený (388/388). Pozn.: v README jsem ponechal původní tvar „líznéš" beze změny
(nešahal jsem na pravopis nad rámec fáze) — pokud to je překlep, lze opravit zvlášť.
