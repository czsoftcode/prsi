# Changelog

Všechny podstatné změny v projektu Prší. Formát vychází z
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Základ projektu: Vite + TypeScript (bez frameworku), struktura `src/engine/` a `src/ui/`.
- Vitest jako test runner se smoke testem.
- Placeholder herní obrazovka (nadpis + rub karty) ověřující cestu k obrázkům v `public/cards/`.
- Skripty `dev`, `build`, `preview`, `typecheck`, `test`.
- Datový model enginu: typy `Card`/`Suit`/`Rank`, balíček 32 mariášových karet (`createDeck`), zamíchání s injektovaným RNG (`shuffle`) a rozdání počátečního stavu partie 5+5 karet (`deal`) — čisté funkce pokryté unit testy.
- Engine základního tahu: validace platnosti tahu (shoda barvy nebo hodnoty), vyložení karty (`playCard`), líznutí karty s remícháním odhazovací hromádky zpět do balíčku (`drawCard`) a pomocné `isPlayable`/`playableCards` — čisté funkce pokryté unit testy. Stav nese aktuální požadovanou barvu (`currentSuit`).
