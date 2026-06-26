---
phase: 20
verdict: done
steps:
  - title: "audio.ts: smyčkový hudební uzel + start/stop"
    status: done
  - title: "audio.ts: perzistence vypínače (localStorage)"
    status: done
  - title: "render.ts: tlačítko vypínače hudby"
    status: done
  - title: "main.ts: napojení do životního cyklu hry"
    status: done
  - title: "Testy audio + render + main"
    status: done
  - title: "Zelený build + ruční ověření"
    status: done
verify:
  - title: "Reálné přehrávání hudby v prohlížeči"
    detail: "Mechanicky ověřeno: build (tsc + vite), 348 testů, perzistence v localStorage, loop/volume uzlu, no-op cesty bez Audia. Lidským uchem ověř: hudba hraje ve smyčce od prvního kliknutí/klávesy, při konci partie ztichne (fanfára/defeat zazní čistě), po Nové partii naběhne znovu od začátku, vypínač funguje a volba přežije reload stránky."
  - title: "Hlasitost hudby vůči efektům"
    detail: "Hudba má volume 0.35. Subjektivně ověř, že nepřehluší líznutí/odhoz ani fanfáru a není naopak moc tichá."
---

# Phase 20 — report z auto session

## Co se udělalo
- `audio.ts`: jeden trvalý smyčkový uzel pro `soundtrack.mp3` (`loop=true`, `volume=0.35`), funkce `startMusic()` / `stopMusic()` (stop = `pause` + `currentTime=0`). `startMusic` je no-op bez `Audia`, bez odemčení gestem (autoplay policy) nebo když je hudba vypnutá. Napojeno do `unlock()` — první gesto odemkne efekty i hudbu.
- Vypínač s perzistencí: `isMusicEnabled()` / `setMusicEnabled(on)`, zdroj pravdy v paměti + best-effort `localStorage` (`prsi.music`, default zapnuto). Vypnutí jen pozastaví (bez resetu pozice), zapnutí rozjede.
- `render.ts`: `renderMusicButton()` s `data-action='music'`, popisek 🔊/🔇 a `aria-pressed` dle stavu; CSS `.indicator--music` sdílí styl s `--theme`.
- `main.ts`: `stopMusic()` v `draw()` v bloku konce hry (vedle `playWin`/`playLose` — fanfára/defeat do ticha), `startMusic()` v `newGame()`; delegovaný listener obsluhuje `data-action='music'` před zámkem `locked`.

## Testy
- `audio.test.ts`: spuštění smyčky po odemčení (loop/volume/src zachycené přes `this` v play spy), no-op bez odemčení, vypnutá hudba se nespustí, perzistence + přepnutí `isMusicEnabled`, no-op bez `Audia`. Opraven unlock test — odemčení teď přehraje 5 uzlů (4 efekty + hudba).
- `render.test.ts`: vypínač existuje, popisek a `aria-pressed` odráží stav (mock `isMusicEnabled`).
- `main.endsound.test.ts`: `stopMusic` při konci hry, `startMusic` při nové partii, klik na vypínač zavolá `setMusicEnabled(false)` i při `locked`.
- Build (`tsc --noEmit` + `vite build`) i celá sada (348 testů) zelené.

## Adversariální self-review (nezávislý sub-agent)
Spuštěn kvůli zásahu do vstupního bodu (listener) a cross-module kontraktu (`data-action='music'`). Žádný kritický nález. Jeden oprávněný střední: původní komentář/test tvrdily, že vypínač jde přepnout „i pod otevřeným overlayem", ale overlay (`z-index`, bez `pointer-events:none`) tlačítko v `#app` fyzicky překryje — reálně dosažitelné je jen v okně AI prodlevy (`locked=true`, bez overlaye). Opraveno: přehánějící komentáře v `main.ts` upřesněny na pravdivý rozsah a doplněn komentář v testu, že ověřuje logiku handleru (bypass zámku), ne fyzickou dosažitelnost pod overlayem. Chování ponecháno — vypínač plovoucí nad výherní obrazovkou by byl horší UX. Kosmeticky upřesněn i komentář o resetu smyčky (reset dělá `stopMusic`, ne `startMusic`).

## Poznámky / rizika / dluhy
- **Vypínač pod overlayem nedosažitelný** (viz výše) — vědomě ponecháno. Kdyby vadilo (např. ztišit během výběru barvy), je to samostatná UX fáze (z-index tlačítka nad overlay nebo `pointer-events`).
- Cross-module řetězec `'music'` není sdílená konstanta (stejně jako stávající `'theme'`/`'draw'`) — divergenci mezi `render.ts` a `main.ts` by ale shodil aspoň jeden test (render.test používá reálný render, main test reálný listener). Integrační test reálný-render→reálný-listener chybí, riziko nízké.
- `soundtrack.mp3` má ~3,4 MB; natáhne se při prvním přehrání. `preload` jsem nechal výchozí (uzel se vytvoří líně až v `ensureMusic`), takže stahování startuje až po prvním gestu — na pomalém připojení může hudba naběhnout se zpožděním.
