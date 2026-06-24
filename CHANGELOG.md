# Changelog

Všechny podstatné změny v projektu Prší. Formát vychází z
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Nasazení na GitHub Pages přes GitHub Actions (`.github/workflows/deploy.yml`): push do `main` spustí testy, build a deploy. Hra běží na `https://czsoftcode.github.io/prsi/`.
- README s popisem hry (pro děti 6+, dětské motivy, odvozeno od žolíkových karet J/Q/K/A), pravidly ve zkratce, návodem na instalaci a spuštění přes Vite a vloženým snímkem herní plochy.
- Interaktivní herní smyčka: hra je hratelná tah-za-tahem myší i dotykem. Klik/dotyk na zvýrazněnou hratelnou kartu ji zahraje, nehratelná karta se ignoruje; líznout lze jen když hráč nemá co hrát. Po zahrání svrška se otevře overlay výběru barvy (klik mimo = zrušení tahu), eso nechá hráče hrát znovu. AI reaguje s krátkou prodlevou (~600 ms) a stůl se po každém tahu překreslí. Po vyprázdnění ruky se zobrazí banner vítěze a vstup se zastaví.
- Zvýraznění hratelných karet hráče (jen když je na tahu).
- Vykreslení herního stolu z enginu (`render(state, root)`): ruka hráče dole lícem, ruby AI nahoře, lízací balíček (s počtem, prázdný = placeholder) a odhazovací hromádka uprostřed, indikátor aktuální barvy (vyhrazená ikona `suit-<barva>.png` přes `suitIconSrc`), počtu nakupených sedem a kdo je na tahu. Načítání karet z `public/cards/` přes `cardSrc(card)` (mapování názvů včetně nulování ranků 7–9). Zatím bez interakce. Pokryto unit testy (mapování) a jsdom smoke testem (struktura).
- AI soupeř: čistá funkce `chooseAiMove(state)` vracející vždy platný tah (`play` se zahranou kartou a u svrška i zvolenou barvou, nebo `draw`). Jednoduchá heuristika reagující na nakupené sedmy i vynucenou barvu; barvu po svršku volí podle nejčastější barvy ve zbytku ruky — pokryto unit testy.
- Engine speciálních karet a výhry: sedma (soupeř bere 2, hromadění až 4 sedmy = ber 8), eso (soupeř stojí → v 1v1 hraješ znovu), svršek (změna barvy přes `chosenSuit`) a detekce vítěze prázdnou rukou (`winnerOf`) — pokryto unit testy.
- Stav partie nově nese, kdo je na tahu (`currentPlayer`), a počet nakupených sedem (`pendingSevens`).
- Základ projektu: Vite + TypeScript (bez frameworku), struktura `src/engine/` a `src/ui/`.
- Vitest jako test runner se smoke testem.
- Placeholder herní obrazovka (nadpis + rub karty) ověřující cestu k obrázkům v `public/cards/`.
- Skripty `dev`, `build`, `preview`, `typecheck`, `test`.
- Datový model enginu: typy `Card`/`Suit`/`Rank`, balíček 32 mariášových karet (`createDeck`), zamíchání s injektovaným RNG (`shuffle`) a rozdání počátečního stavu partie 5+5 karet (`deal`) — čisté funkce pokryté unit testy.
- Engine základního tahu: validace platnosti tahu (shoda barvy nebo hodnoty), vyložení karty (`playCard`), líznutí karty s remícháním odhazovací hromádky zpět do balíčku (`drawCard`) a pomocné `isPlayable`/`playableCards` — čisté funkce pokryté unit testy. Stav nese aktuální požadovanou barvu (`currentSuit`).

### Fixed
- Svršek je nyní divoká karta — lze ho zahrát na libovolnou barvu i hodnotu (a mění barvu). Dříve engine svršek chybně omezoval na shodu barvy nebo hodnoty. Sedmy svršek neruší (pod útokem nakupených sedem je dál hratelná jen sedma).

### Changed
- Cesty k obrázkům karet se nově skládají přes `import.meta.env.BASE_URL` (Vite `base`), aby fungovaly i při běhu pod podadresářem (`/prsi/` na GitHub Pages). V dev i testech zůstává prefix `/`.
- `playCard` aplikuje efekty speciálních karet a předává tah (po esu zůstává hráči); přijímá volitelný `chosenSuit` pro svršek. `drawCard` pod útokem sedem líže `2 × pendingSevens` karet a předává tah. `isPlayable`/`playableCards` nově zohledňují nakupené sedmy (pod útokem je hratelná jen sedma).
