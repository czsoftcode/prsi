---
phase: 19
verdict: done
steps:
  - title: "audio.ts: zvuky win/lose"
    status: done
  - title: "main.ts: přehrání při skončení partie"
    status: done
  - title: "Testy audio vrstvy"
    status: done
  - title: "Test jednorázového přehrání v main"
    status: done
  - title: "Zelený build + lint"
    status: done
verify:
  - title: "Skutečné přehrání fanfáry/defeat v prohlížeči"
    detail: "Mechanicky ověřeno: cesty k MP3 (fanfara.mp3/defeat.mp3), jednorázové volání playWin/playLose, build i 340 testů zelené. Reálný zvukový výstup (že fanfára zní při výhře hráče a defeat při prohře, hlasitost, odemčení po gestu) jsem ověřit nemohl — vyžaduje lidský poslech v prohlížeči."
---

# Phase 19 — report z auto session

## Co se udělalo
- `audio.ts`: `SoundName` rozšířen o `win | lose`, doplněny `SOURCES` (`sounds/fanfara.mp3`, `sounds/defeat.mp3`), preload v `ensureElements` (nyní čtyři uzly), exporty `playWin()` / `playLose()`. Zvuky se odemykají stejnou unlock smyčkou jako líznutí/odhoz.
- `main.ts`: v `draw()` uvnitř bloku `if (msg)` (přesně tam, kde se `ended` překlápí na `true`) se podle `winnerOf(state)` přehraje `playWin()` (hráč) nebo `playLose()` (AI). Pat zůstává beze zvuku.

## Guard proti opakování
Žádný nový stav nebyl potřeba — využit stávající příznak `ended`. Celý blok konce hry je obalen `if (!ended)`, takže fanfára/defeat zazní právě jednou při přechodu do konce hry; `newGame()` resetuje `ended = false`, takže po nové partii může zvuk zaznít znovu. Herní smyčka ani její awaity zůstaly nedotčené.

## Testy
- `audio.test.ts`: přidány testy existence `playWin`/`playLose`, no-op bez `Audio`, a mapování na správné MP3 cesty (zachycením `src` reálně přehrávaného klonu). Opraven unlock test — po přidání dvou zvuků odemčení přehraje 4 uzly místo 2.
- `main.endsound.test.ts` (nový sourozenec, ne `main.test.ts`): heavy mocky závislostí by rozbily reálný bootstrap smoke test v `main.test.ts`, proto separátní soubor. Ověřuje: fanfára zazní právě jednou při výhře a NE při dalším renderu (guard `ended`), prohra přehraje defeat a ne fanfáru, po nové partii fanfára zazní znovu, pat nepřehraje nic.
- Build (`tsc --noEmit` + `vite build`) i celá sada (340 testů) zelené.

## Poznámky / rizika
- V zadání byl název `fanfary.mp3`, reálný soubor je `fanfara.mp3` — použit reálný název (odsouhlaseno při návrhu fáze).
- `public/sounds/defeat.mp3` byl zatím neverzovaný; auto-commit fáze ho přidá do gitu. `fanfara.mp3` už verzovaný byl.
- Samostatný `lint` skript v projektu není — typecheck (`tsc --noEmit`) běží jako součást `npm run build` a prošel.
