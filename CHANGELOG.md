# Changelog

Všechny podstatné změny v projektu Prší. Formát vychází z
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- AI soupeř: čistá funkce `chooseAiMove(state)` vracející vždy platný tah (`play` se zahranou kartou a u svrška i zvolenou barvou, nebo `draw`). Jednoduchá heuristika reagující na nakupené sedmy i vynucenou barvu; barvu po svršku volí podle nejčastější barvy ve zbytku ruky — pokryto unit testy.
- Engine speciálních karet a výhry: sedma (soupeř bere 2, hromadění až 4 sedmy = ber 8), eso (soupeř stojí → v 1v1 hraješ znovu), svršek (změna barvy přes `chosenSuit`) a detekce vítěze prázdnou rukou (`winnerOf`) — pokryto unit testy.
- Stav partie nově nese, kdo je na tahu (`currentPlayer`), a počet nakupených sedem (`pendingSevens`).
- Základ projektu: Vite + TypeScript (bez frameworku), struktura `src/engine/` a `src/ui/`.
- Vitest jako test runner se smoke testem.
- Placeholder herní obrazovka (nadpis + rub karty) ověřující cestu k obrázkům v `public/cards/`.
- Skripty `dev`, `build`, `preview`, `typecheck`, `test`.
- Datový model enginu: typy `Card`/`Suit`/`Rank`, balíček 32 mariášových karet (`createDeck`), zamíchání s injektovaným RNG (`shuffle`) a rozdání počátečního stavu partie 5+5 karet (`deal`) — čisté funkce pokryté unit testy.
- Engine základního tahu: validace platnosti tahu (shoda barvy nebo hodnoty), vyložení karty (`playCard`), líznutí karty s remícháním odhazovací hromádky zpět do balíčku (`drawCard`) a pomocné `isPlayable`/`playableCards` — čisté funkce pokryté unit testy. Stav nese aktuální požadovanou barvu (`currentSuit`).

### Changed
- `playCard` aplikuje efekty speciálních karet a předává tah (po esu zůstává hráči); přijímá volitelný `chosenSuit` pro svršek. `drawCard` pod útokem sedem líže `2 × pendingSevens` karet a předává tah. `isPlayable`/`playableCards` nově zohledňují nakupené sedmy (pod útokem je hratelná jen sedma).
