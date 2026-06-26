# Phase 16 — Animační vrstva: zahrání karty

**Goal:** Přidat overlay animační vrstvu řízenou herní smyčkou, která při zahrání karty (hráčem i AI) nechá ghost kartu přeletět ze zdrojové pozice na vrch odhazovací hromádky, se zamčeným vstupem po dobu animace a respektem k prefers-reduced-motion, bez zásahu do kontraktu render().

## Steps
- [done] Animační modul ghost karty (animate.ts)
- [done] Zapojení animace zahrání hráčem
- [done] Zapojení animace zahrání AI
- [done] Robustnost: reduced-motion, krátké trvání, žádné zaseknutí
- [done] Zelený build + testy + lint

## Auto-commit
- Phase 16: Animační vrstva: zahrání karty

## Run report
---
phase: 16
verdict: done
steps:
  - title: "Animační modul ghost karty (animate.ts)"
    status: done
  - title: "Zapojení animace zahrání hráčem"
    status: done
  - title: "Zapojení animace zahrání AI"
    status: done
  - title: "Robustnost: reduced-motion, krátké trvání, žádné zaseknutí"
    status: done
  - title: "Zelený build + testy + lint"
    status: done
verify:
  - title: "Vizuální dojem letu ghost karty v prohlížeči"
    detail: "Build i testy jsou zelené, ale samotnou animaci (plynulost, že ghost dosedne na vrch hromádky, ~260 ms) jde posoudit jen okem v reálném prohlížeči — jsdom layout/transition nespouští. Vyzkoušej `npm run dev`: zahrání karty hráčem i AI, svršek (po výběru barvy), eso (AI hraje víc karet → animuje se jen jedna), líznutí (žádná animace), a prefers-reduced-motion (žádný let, hra běží)."
  - title: "Geometrie zdroje letu AI karty"
    detail: "Zdroj AI letu je první rub v .zone--ai (velikost karty). Ověř, že ghost nevychází vizuálně z divného místa a nedeformuje se (scale je uniformní z poměru šířek)."
---

# Phase 16 — report z auto session

## Co je hotové
Přidána animační vrstva `src/ui/animate.ts` (`animatePlay`, `clearAnim`) žijící mimo `#app` (jako overlaye), takže ji full re-render stolu nesmaže a `render()` zůstal nedotčený. Při zahrání karty hráčem i AI přeletí ghost karta lícem ze zdroje na vrch odhazovací hromádky. Smyčka v `main.ts` drží `locked=true` po dobu letu, takže kliky během animace jsou ignorované. CSS ve `style.css` (`.anim-layer` z-index 9 = pod overlayi, `.anim-ghost`).

Kontrakt jako u overlayů: `animatePlay` resolvuje VŽDY — `transitionend` (once) nebo timeout fallback (380 ms) — takže smyčka nikdy neuvízne v zámku. Při `prefers-reduced-motion` i degenerované geometrii (nulové rect, typicky jsdom) se nic nevykreslí a resolvuje okamžitě → testy ani reduced-motion uživatele animace nezdržuje.

## Adversarial self-review (nezávislý sub-agent, čerstvý kontext)
Našel reálný **MAJOR**: chyběl generační token kolem `await`. Po vítězném tahu se end-overlay zobrazí PŘED awaitem letu, tlačítko „Nová partie" je tak dosažitelné během ~260–380 ms, a stará continuation (`onPlayCard`/`runAi`) by pak doběhla nad stavem nové partie a sáhla na její zámek/AI. **Opraveno** zavedením `generation`: každá `newGame` ji zvýší, async tah si ji zapamatuje a po awaitu se zahodí při neshodě. Dále opraveny dva MINORy: AI zdroj letu je teď první rub (velikost karty) místo celé zóny (deformovaný ghost) a `newGame` volá `clearAnim()` (stray ghost přes nový stůl). Konzistence zámku: vítězný tah hráče nechává `locked=true` (dřív `scheduleAi` dělalo `locked=false`).

## Známé zjednodušení
Eso řetězec — AI v jednom `advanceAi` zahraje víc karet; animuje se jen výsledná vrchní karta (jeden ghost), ne celá série. Detekce „AI reálně zahrála" přes `sameCard(topBefore, played)` je pro jednoduchý 32karetní balíček korektní (identická karta je unikátní, nevrací se do hry).

## Trade-off
`await` letu přidává do každého zahrání ~260 ms sériové prodlevy (drží konzistenci stav↔obraz). Reduced-motion to obchází úplně.

## Build/testy
`npm run build` zelený, `npm test` 324 testů zelených (3 nové v `animate.test.ts`: reduced-motion skip, fallback resolve + úklid, clearAnim). Lint skript v projektu není — typovou kontrolu pokrývá `tsc --noEmit` v rámci buildu.
