# Changelog

Všechny podstatné změny v projektu Prší. Formát vychází z
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
a projekt používá [sémantické verzování](https://semver.org/lang/cs/).

## [Unreleased]

### Added
- Engine AI nově umí tři úrovně obtížnosti (`chooseAiMove(state, level)`): **dítě** (slabá — útočné karty drží, zahazuje je pozdě), **dospělý** (dosavadní heuristika, výchozí) a **expert** (šetří sedmy a esa na finiš, kdy soupeři dochází ruka, a svrškem přepíná na vlastní převažující barvu). Všechny úrovně jsou deterministické (bez náhody). Zatím jen v enginu — výběr úrovně v UI přijde v navazující fázi.

## [2.3.0] - 2026-06-28

### Security
- Vývojová závislost `vitest` povýšena z 2.x na 4.x, čímž z projektu zmizelo pět známých advisories (kritická/high/moderate) ve vnořených `vite`/`esbuild`, které táhl jen starý vitest. `npm audit` je nově čistý. Týká se pouze testovacího nástroje — v produkčním balíčku hry žádná z těchto závislostí není. (Řeší nález SEC-1 ze security review.)
- Přidána Content-Security-Policy (přes `<meta>`, protože GitHub Pages neumí HTTP hlavičky), která omezuje, odkud smí běžet skript a kam smí jít síťový požadavek: skripty jen z vlastního původu a z `plausible.softcode.cz` (inline bootstrap povolen přes SHA-256 hash), obrázky/zvuky jen z vlastního původu. Kompromitovaný analytický server tak už nemůže spustit libovolný kód v originu hry. (Styly povolují `'unsafe-inline'` kvůli dynamickým inline stylům animací — nízké riziko; klíčové omezení skriptů zůstává přísné.) (Řeší nález SEC-2 ze security review.)
- Workflow nasazení na GitHub Pages zpevněn: build job běží jen s právem `contents: read`, zápisová práva (`pages`, `id-token`) má nově pouze deploy job, a všech 5 použitých GitHub Actions je připnuto na konkrétní commit SHA místo pohyblivých tagů (`@v4` apod.). Přidán `.github/dependabot.yml`, který hlídá nové verze Actions a otevírá PR s povýšením připnutých SHA. (Řeší nález SEC-3 ze security review.)

### Changed
- Na velkých displejích (šířka od 1200px) jsou karty výrazně větší — strop velikosti se zvedl o ~50 % (na 144px na monitorech 1080p a vyšších). Velikost zůstává vázaná i na výšku okna, takže na nízkém širokoúhlém monitoru (1366×768) se karty nenafouknou natolik, aby ruka přetekla mimo obrazovku. Na střední šířce (do 1200px) a na mobilu se nic nemění.

### Fixed
- Do výběru motivu se nově dostane jen sada s kompletními assety. Registr odmítne složku `cards_NN`, které chybí kterýkoli z 37 souborů (32 líců, rub, 4 ikony barev) nebo některé z obou pozadí, i složku s nečíselným/jednociferným označením. Dřív stačila libovolná složka `cards_*` s párem pozadí a neúplný motiv pak v náhledu i hře sypal chybějící obrázky (404).
- README sjednocen s aktuálními pravidly: eso je popsáno jako „přebij vlastním esem, nebo stůj" (místo dřívějšího „hraješ vzápětí znovu") a doplněno dobrovolné líznutí kdykoliv na tahu. Dřív README popisovalo stará pravidla a odporovalo skutečnému chování hry.

## [2.2.0] - 2026-06-27

### Added
- Nový motiv karet „05" (sada `cards_05` + pozadí `dashboard_05`). Přidá se do výběru motivu automaticky; vzhled karet i pravidla zůstávají beze změny.

## [2.1.0] - 2026-06-27

### Changed
- Eso funguje podle pravidel jako přebití a stání místo dřívějšího „hraješ znovu". Zahrané eso předá tah soupeři, který buď přebije vlastním esem (esa se řetězí a nakupí), nebo musí stát — přijde o tah bez líznutí. Když na tebe míří nakupená esa, hratelné je jen eso a z balíčku si nelízneš; pokud eso nemáš (nebo nechceš přebíjet), klikni na tlačítko „Stojím". Počet nakupených es ukazuje modrý indikátor pod hromádkami.

## [2.0.0] - 2026-06-27

### Changed
- Líznout z balíčku lze nově kdykoliv na svém tahu — i když máš hratelnou kartu (líznutí pak předá tah počítači). Díky tomu si můžeš schválně schovat sedmu: u nakupených sedem klik na balíček vezme penaltu místo toho, abys musel sedmu zahrát. Dřív šlo líznout jen tehdy, když jsi neměl co hrát.

## [1.4.0] - 2026-06-27

### Added
- Zvuk konce hry: při výhře hráče zazní fanfára, při prohře smutný zvuk. Přehraje se právě jednou ve chvíli skončení partie (remíza je beze zvuku) a po spuštění nové partie může zaznít znovu.
- Hudba na pozadí ve smyčce: během partie hraje podkresová hudba, která se rozjede po prvním kliknutí/stisku klávesy (kvůli pravidlům prohlížečů), ztichne při konci hry (aby fanfára/smutný zvuk zazněly čistě) a naběhne znovu při nové partii. Tlačítko hudby ji vypne nebo zapne; volba se uchová v prohlížeči.
- Přepínač nápovědy tahu: tlačítko 💡/🚫 vedle motivu a hudby zapíná nebo vypíná žluté zvýraznění hratelných karet. Pro náročnější hráče lze nápovědu vypnout a karty se přestanou orámovávat; volba se uchová v prohlížeči. Vypnutí je čistě vizuální — pravidla a kontrola platného tahu zůstávají beze změny.

### Changed
- Přeskupení středu stolu: indikátor „Na tahu" je teď vlevo od lízacího balíčku jako ikona (🧑 ty / 🤖 počítač), indikátor barvy vpravo od odhazovací hromádky jako symbol barvy v kroužku (bez popisku „Barva:"). Ovládací tlačítka pod hromádkami jsou jen ikony — 🎨 pro výběr motivu a 🔊/🔇 pro hudbu. Plné popisky zůstávají v `title`/`aria-label`. Na úzkém mobilu se řada s balíčky zalomí místo vodorovného přetečení.

## [1.3.0] - 2026-06-26

### Added
- Zvukové efekty: při odhození karty (hráč i počítač) zazní krátký zvuk odhozu, při líznutí z balíčku zvuk líznutí. Zvuky se odemknou po prvním kliknutí/stisku klávesy (kvůli pravidlům prohlížečů pro automatické přehrávání) a zní i tehdy, když má hráč zapnuté omezené animace.

## [1.2.0] - 2026-06-26

### Added
- Animace zahrání karty: při tahu hráče i počítače „odletí" karta lícem ze své pozice na vrch odhazovací hromádky. Po dobu letu (~260 ms) je ovládání zamčené, takže klik nerozhodí stav. Kdo má v systému zapnuté omezené animace (`prefers-reduced-motion`), žádný let nevidí a hra běží bez prodlevy.
- Animace líznutí karty: když si hráč nebo počítač líznou z balíčku, rub karty přeletí z lízacího balíčku do ruky. Při braní více karet po sedmě (až 8) letí ruby krátce za sebou; pro plynulost se jich naráz animuje nejvýš pár. Respektuje `prefers-reduced-motion` a po dobu letu je ovládání zamčené.

### Changed
- Karty jsou na mobilu a tabletu (šířka do 900px) výrazně větší. Velikost se počítá z `min(20vw, 13vh)`, takže na nízkém displeji (např. iPhone SE, 667px) rozhoduje výška a tři řady karet se vejdou na obrazovku; na úzkém displeji rozhoduje šířka. Na desktopu beze změny.

## [1.1.0] - 2026-06-26

### Added
- Výběr motivu obrázků přímo ve hře: tlačítko „Vyber si motiv obrázků" vedle indikátorů otevře overlay s náhledem každého dostupného motivu (karta z každé barvy + rub). Klik motiv přepne a překreslí stůl bez načtení stránky; volba se uchovává v prohlížeči.
- Registr dostupných motivů: Vite plugin při buildu/dev proskenuje `public/` a sestaví seznam motivů s kompletními assety (`cards_NN` + pozadí `dashboard_NN`). Nový motiv stačí nahrát jako složku a znovu sestavit, není třeba upravovat kód.

### Changed
- Pozadí herního stolu je nově dětský ilustrovaný obrázek (medvídek ve vláčku) místo zeleného „filcového" gradientu. Použit `dashboard_01.webp` s `.jpg` fallbackem přes `image-set()`, překrytý poloprůhledným ztmavujícím gradientem kvůli čitelnosti karet a textu. Filcový gradient zůstává jako fallback, kdyby se obrázek nenačetl.

### Fixed
- Neplatně uložený motiv (např. po odebrání složky) už nevede na rozbité obrázky — hra spadne zpět na výchozí motiv.

## [1.0.3] - 2026-06-24

### Added
- Nasazení na GitHub Pages přes GitHub Actions (`.github/workflows/deploy.yml`): push do `main` spustí testy, build a deploy. Hra běží na `https://czsoftcode.github.io/prsi/`.
- Privacy-friendly analytika Plausible (self-hosted, bez cookies).

### Changed
- Cesty k obrázkům karet se nově skládají přes `import.meta.env.BASE_URL` (Vite `base`), aby fungovaly i při běhu pod podadresářem (`/prsi/` na GitHub Pages). V dev i testech zůstává prefix `/`.

## [1.0.2] - 2026-06-24

### Added
- Licence MIT (soubor `LICENSE`, pole `license` v `package.json`) a sekce Licence v README.

## [1.0.1] - 2026-06-24

### Added
- README s popisem hry (pro děti 6+, dětské motivy, odvozeno od žolíkových karet J/Q/K/A), pravidly ve zkratce, návodem na instalaci a spuštění přes Vite a vloženým snímkem herní plochy.

## [1.0.0] - 2026-06-24

První stabilní vydání — kompletní hratelná partie Prší 1v1 proti AI od rozdání po výhru.
Stejný kód jako 0.0.9, povýšený na stabilní verzi (bez dalších změn).

## [0.0.9] - 2026-06-24

### Added
- E2E herní simulace: deterministický test odehraje 200 partií AI vs. AI přes engine a ověří, že každá končí výhrou nebo patem bez porušení invariantů.

## [0.0.8] - 2026-06-24

### Added
- Konec hry: nová partie a detekce patu (remízy).

## [0.0.7] - 2026-06-24

### Added
- Interaktivní herní smyčka: hra je hratelná tah-za-tahem myší i dotykem. Klik/dotyk na zvýrazněnou hratelnou kartu ji zahraje, nehratelná karta se ignoruje; líznout lze jen když hráč nemá co hrát. Po zahrání svrška se otevře overlay výběru barvy (klik mimo = zrušení tahu), eso nechá hráče hrát znovu. AI reaguje s krátkou prodlevou (~600 ms) a stůl se po každém tahu překreslí. Po vyprázdnění ruky se zobrazí banner vítěze a vstup se zastaví.
- Zvýraznění hratelných karet hráče (jen když je na tahu).

## [0.0.6] - 2026-06-24

### Added
- Vykreslení herního stolu z enginu (`render(state, root)`): ruka hráče dole lícem, ruby AI nahoře, lízací balíček (s počtem, prázdný = placeholder) a odhazovací hromádka uprostřed, indikátor aktuální barvy (vyhrazená ikona `suit-<barva>.png` přes `suitIconSrc`), počtu nakupených sedem a kdo je na tahu. Načítání karet z `public/cards/` přes `cardSrc(card)` (mapování názvů včetně nulování ranků 7–9). Zatím bez interakce. Pokryto unit testy (mapování) a jsdom smoke testem (struktura).

## [0.0.5] - 2026-06-24

### Added
- AI soupeř: čistá funkce `chooseAiMove(state)` vracející vždy platný tah (`play` se zahranou kartou a u svrška i zvolenou barvou, nebo `draw`). Jednoduchá heuristika reagující na nakupené sedmy i vynucenou barvu; barvu po svršku volí podle nejčastější barvy ve zbytku ruky — pokryto unit testy.

## [0.0.4] - 2026-06-24

### Added
- Engine speciálních karet a výhry: sedma (soupeř bere 2, hromadění až 4 sedmy = ber 8), eso (soupeř stojí → v 1v1 hraješ znovu), svršek (změna barvy přes `chosenSuit`) a detekce vítěze prázdnou rukou (`winnerOf`) — pokryto unit testy.
- Stav partie nově nese, kdo je na tahu (`currentPlayer`), a počet nakupených sedem (`pendingSevens`).

### Changed
- `playCard` aplikuje efekty speciálních karet a předává tah (po esu zůstává hráči); přijímá volitelný `chosenSuit` pro svršek. `drawCard` pod útokem sedem líže `2 × pendingSevens` karet a předává tah. `isPlayable`/`playableCards` nově zohledňují nakupené sedmy (pod útokem je hratelná jen sedma).

### Fixed
- Svršek je nyní divoká karta — lze ho zahrát na libovolnou barvu i hodnotu (a mění barvu). Dříve engine svršek chybně omezoval na shodu barvy nebo hodnoty. Sedmy svršek neruší (pod útokem nakupených sedem je dál hratelná jen sedma).

## [0.0.3] - 2026-06-23

### Added
- Engine základního tahu: validace platnosti tahu (shoda barvy nebo hodnoty), vyložení karty (`playCard`), líznutí karty s remícháním odhazovací hromádky zpět do balíčku (`drawCard`) a pomocné `isPlayable`/`playableCards` — čisté funkce pokryté unit testy. Stav nese aktuální požadovanou barvu (`currentSuit`).

## [0.0.2] - 2026-06-23

### Added
- Základ projektu: Vite + TypeScript (bez frameworku), struktura `src/engine/` a `src/ui/`.
- Vitest jako test runner se smoke testem.
- Placeholder herní obrazovka (nadpis + rub karty) ověřující cestu k obrázkům v `public/cards/`.
- Skripty `dev`, `build`, `preview`, `typecheck`, `test`.
- Datový model enginu: typy `Card`/`Suit`/`Rank`, balíček 32 karet (`createDeck`), zamíchání s injektovaným RNG (`shuffle`) a rozdání počátečního stavu partie 5+5 karet (`deal`) — čisté funkce pokryté unit testy.

[Unreleased]: https://github.com/czsoftcode/prsi/compare/v1.0.3...HEAD
[1.0.3]: https://github.com/czsoftcode/prsi/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/czsoftcode/prsi/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/czsoftcode/prsi/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/czsoftcode/prsi/compare/v0.0.9...v1.0.0
[0.0.9]: https://github.com/czsoftcode/prsi/compare/v0.0.8...v0.0.9
[0.0.8]: https://github.com/czsoftcode/prsi/compare/v0.0.7...v0.0.8
[0.0.7]: https://github.com/czsoftcode/prsi/compare/v0.0.6...v0.0.7
[0.0.6]: https://github.com/czsoftcode/prsi/compare/v0.0.5...v0.0.6
[0.0.5]: https://github.com/czsoftcode/prsi/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/czsoftcode/prsi/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/czsoftcode/prsi/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/czsoftcode/prsi/releases/tag/v0.0.2
