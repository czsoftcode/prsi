# Ideas & changes

> Archive of future ideas and changes for this project. Managed by `mini todo`
> (`add` / `done` / `remove`); `mini next` offers the open items as candidate
> phase ideas. You can also edit this checklist by hand.
- [x] Fáze 1 — Scaffold: Vite + TypeScript projekt, struktura složek (engine/ui/assets), běžící dev server a build.
- [x] Fáze 2 — Engine, datový model: typy Card/Suit/Rank, vytvoření 32 mariášových karet, zamíchání, rozdání ruky hráči i AI, počáteční odhazovací karta.
- [x] Fáze 3 — Engine, základní tah: validace platnosti (shoda barvy nebo hodnoty), vyložení karty, lízání 1 karty když není co hrát, remíchání odhazovací hromádky zpět do balíčku když dojde + unit testy.
- [x] Fáze 4 — Engine, speciální karty: sedma (ber 2) s hromaděním max 4 sedmy, eso (soupeř stojí = v 1v1 hraješ znovu), svršek (změna barvy), detekce výhry (prázdná ruka) + unit testy.
- [x] Fáze 5 — AI soupeř: heuristika výběru vždy platného tahu (preferuj speciální karty rozumně), reakce na nakupené sedmy a vynucenou barvu.
- [ ] Fáze 6 — UI herní stůl: vykreslení stavu z enginu — ruka hráče dole, ruby AI nahoře, lízací balíček a odhazovací hromádka uprostřed, indikátor aktuální barvy a počtu nakupených sedem; načítání obrázků z public/cards/.
- [ ] Fáze 7 — UI interakce: klik/dotyk na kartu a balíček, overlay výběru barvy po svršku, obrazovka konce hry + nová partie; ovladatelné myší i dotykem.
- [ ] Fáze 8 — End-to-end playtest a doladění: odehrání celé partie od rozdání po výhru, ošetření edge cases (souběh eso + nakupené sedmy, prázdný balíček).
