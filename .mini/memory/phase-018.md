# Phase 18 — Zvuková vrstva: líznutí a odhoz

**Goal:** Přidat lehký audio.ts, který přehraje MP3 efekt líznutí při braní karty a odhozu při zahrání karty (hráč i AI), zapojený ve stejných bodech jako stávající animace, s odolností vůči autoplay-blokaci a bez zásahu do render() či zaseknutí herní smyčky.

## Steps
- [done] audio.ts: přednačtení + přehrávání
- [done] Odolnost vůči autoplay-blokaci
- [done] Zapojení zvuků do herních helperů
- [done] Úklid WAV souborů
- [done] Testy + zelený build

## Auto-commit
- Phase 18: Zvuková vrstva: líznutí a odhoz

## Run report
---
phase: 18
verdict: done
steps:
  - title: "audio.ts: přednačtení + přehrávání"
    status: done
  - title: "Odolnost vůči autoplay-blokaci"
    status: done
  - title: "Zapojení zvuků do herních helperů"
    status: done
  - title: "Úklid WAV souborů"
    status: done
  - title: "Testy + zelený build"
    status: done
verify:
  - title: "Zvuky reálně zní v prohlížeči a nejsou otravné"
    detail: "Mechanicky ověřeno jen že se play() volá; skutečné přehrání (Chrome i mobil) musí posoudit člověk. liznuti.mp3 je 1,85 s a odhoz.mp3 1,32 s — na herní efekt dlouhé; doporučuju zkrátit na ~0,3 s (viz diskuse). Při braní více karet po sedmě se zvuk líznutí pustí jen jednou na tah (ne na kartu) — ověř, že to zní ok."
  - title: "Autoplay unlock v Safari / iOS"
    detail: "Spoléhá hlavně na document sticky-activation po prvním gestu (Chrome/Firefox). Safari je přísnější (per-element user-activation) — protože reálné efekty hrají z klonů, ne z odemčeného base uzlu, na iOS Safari nemusí zaznít. V Chrome (cílový prohlížeč) to funguje. Ověř na zařízení, pokud iOS zajímá."
---

# Phase 18 — report z auto session

Hotovo, vše zelené (333 testů, tsc, vite build).

## Co vzniklo
- `src/ui/audio.ts` — lehká zvuková vrstva: preload obou MP3, `playDraw()`/`playPlay()` (klon uzlu kvůli překryvu rychlých tahů), `initAudioUnlock()` (odemčení na první pointerdown/keydown). Cesty přes `BASE_URL` stejně jako obrázky karet.
- Zapojení v `main.ts`: `playPlay()` na začátku `flyToDiscard`, `playDraw()` na začátku `flyFromDraw` — **před** guardem na chybějící rect, takže zvuk zní i bez animace (prefers-reduced-motion) a jediným místem na helper pokrývá hráče i AI včetně braní po sedmě. `initAudioUnlock()` volané v `startGame`.
- Smazány `public/sounds/liznuti.wav` a `odhoz.wav` (10× větší, žádné reference).

## Kontrakt „nezasekne smyčku"
`play()` je fire-and-forget: tělo je v `try/catch` (synchronní chyba z exotického prostředí nepropadne do awaitované `flyToDiscard`/`flyFromDraw`) a odmítnutý `play()` Promise se spolkne v `.catch()`. Bez `Audio` v prostředí (test/SSR) je to no-op.

## Adversariální self-review (nezávislý sub-agent) — opraveno
Review odhalil dva testy **bez zubů** a dva minor; všechny vyřešeno:
1. Test spolknutí odmítnutí spoléhal na `process.unhandledRejection`, který se pod jsdom nenavěsí → vždy prošel. Přepsán na deterministickou kontrolu, že `swallow()` připojil `.catch` (ověřeno empiricky: rozbití swallow → test padá).
2. Test odebrání listenerů maskoval `unlocked`-guard. Doplněn spy na `removeEventListener` (ověřeno: smazání remove → test padá).
3. `play()` doplněn o `try/catch` kvůli explicitnímu kontraktu „nikdy nerozbít smyčku".
4. Race „první efekt němý" (klon dědil dočasný `muted` z unlock) ošetřen `node.muted = false` na klonu.

## Otevřené k posouzení člověkem
Viz `verify` výše — délka zvuků a Safari/iOS autoplay. Pro cílový Chrome je to v pořádku.
