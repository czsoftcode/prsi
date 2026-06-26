# Phase 17 — Animace líznutí karty

**Goal:** Při líznutí karty (hráčem i AI, včetně vynuceného braní po sedmě) nechá ghost rubu přeletět z lízacího balíčku do cílové zóny ruky, se stejným kontraktem jako animatePlay (zámek vstupu po dobu letu, respekt k prefers-reduced-motion, Promise resolvuje vždy, žádné zaseknutí smyčky) a bez zásahu do render().

## Steps
- [done] animateDraw v animate.ts
- [done] Stagger více líznutých karet
- [done] Helper flyFromDraw v main.ts
- [done] Zapojení líznutí hráčem
- [done] Zapojení líznutí AI v runAi
- [done] Testy + zelený build

## Auto-commit
- Phase 17: Animace líznutí karty

## Run report
---
phase: 17
verdict: done
steps:
  - title: "animateDraw v animate.ts"
    status: done
  - title: "Stagger více líznutých karet"
    status: done
  - title: "Helper flyFromDraw v main.ts"
    status: done
  - title: "Zapojení líznutí hráčem"
    status: done
  - title: "Zapojení líznutí AI v runAi"
    status: done
  - title: "Testy + zelený build"
    status: done
verify:
  - title: "Vizuální dojem letu rubů z balíčku do ruky"
    detail: "Mechanicky ověřeno jen že ghosty vzniknou/zmizí a respektují cap/reduced-motion. Plynulost letu, scale a směr (balíček → dolní ruka hráče / horní zóna AI) je potřeba posoudit okem v prohlížeči (npm run dev)."
  - title: "Braní více karet po sedmě (stagger)"
    detail: "Zahraj soupeři sedmu a nech ho/sebe líznout 2–8 karet. Ověř, že stagger vypadá ok a zámek vstupu se po doletu uvolní (smyčka se nezasekne)."
---

# Phase 17 — report z auto session

## Co je hotové
Líznutí karty je animované pro hráče i AI. Refaktoroval jsem společné jádro letu ghostu do `flyGhost()` v `animate.ts`; `animatePlay` ho teď používá pro líc, nová `animateDraw` pro rub. `animateDraw` letí `min(count, 4)` rubů staggerovaně (80 ms mezi starty), jedna Promise resolvuje po doletu posledního. Kontrakt je stejný jako u `animatePlay`: resolvuje vždy (transitionend + per-ghost timeout fallback), přeskočí při `prefers-reduced-motion` i degenerované geometrii. `clearAnim()` smaže i letící ruby (sdílí vrstvu).

V `main.ts`:
- helper `flyFromDraw(handSelector, count, fromRect)` — rect balíčku se čte PŘED `draw()`, cílová zóna ruky až po překreslení;
- `onDraw` je nově `async`: spočítá počet líznutých karet z nárůstu ruky, drží zámek po dobu letu, po awaitu generation guard, pak `scheduleAi()`;
- `runAi` rozlišuje zahrání vs. líznutí: priorita zahrání (vrch hromádky se změnil), jinak při nárůstu ruky AI animuje líznutí do `.hand--ai`.

## Rozhodnutí / trade-offy
- **Cap 4 ruby**: po sedmách se bere až 8 karet; animovat všechny by zámek natáhlo na ~2 s. Vizuálně stačí náznak, proto strop. Vědomá vizuální nepřesnost (8 karet, 4 ruby).
- **Priorita zahrání před líznutím v `runAi`**: `advanceAi` smyčkuje, takže AI může v jednom kroku zahrát eso a pak líznout. V tom vzácném případě se ukáže jen zahrání (líznutí se přeskočí). Konzistentní s už existujícím zjednodušením "při esu jen výsledná vrchní karta".
- **Detekce líznutí přes nárůst ruky, ne přes `drawPile`**: odolné vůči remíchání balíčku (kde se `drawPile` může zvětšit i bez líznutí konkrétního hráče).
- Líznutá karta letí jako **rub**, ne líc — neodhaluje se za letu (konzistentní pro hráče i AI).

## Co nesedělo podle plánu
- Projekt **nemá lint skript** (jen `typecheck`/`build` přes `tsc --noEmit`). Typová kontrola i build jsou zelené, lint jako samostatný krok neexistuje — nic k spuštění.

## Ověřeno mechanicky
`npm run build` (tsc --noEmit + vite) zeleně, celá testovací sada 329/329 passed včetně 9 testů `animate.test.ts` (4 nové pro `animateDraw`: reduced-motion, degenerovaná geometrie, fallback úklid jednoho rubu, cap 4 při braní 8). Co stroj neutáhne (vizuální dojem letu, stagger po sedmě) je v `verify`.
