---
phase: 23
verdict: done
steps:
  - title: "Uvolnit gate dobrovolného líznutí v playerDraw"
    status: done
  - title: "Narovnat komentář onDraw v main.ts"
    status: done
  - title: "Testy game.ts pro dobrovolné líznutí"
    status: done
  - title: "Zelený build, lint a celá test suite"
    status: done
verify:
  - title: "Ruční zahrání: dobrovolné líznutí v UI"
    detail: "V prohlížeči klikni na lízací balíček, i když máš zvýrazněnou hratelnou kartu — má líznout 1 kartu, přehrát animaci/zvuk líznutí a předat tah AI. U nakupených sedem (pendingSevens>0) klik na balíček se sedmou v ruce má vzít celou penaltu (animace více karet). Testy pokrývají logiku, ale samotnou animaci/zvuk a klikací afordanci jsem v reálném DOM neověřoval."
---

# Phase 23 — report z auto session

## Co se udělalo
- `playerDraw` v `src/ui/game.ts`: odstraněn gate `if (playerPlayable(state).length > 0) return null;`. Líznutí teď smí kdykoliv na svém tahu; vrací null jen když hráč není na tahu, je vítěz, nebo `drawCard` vrátí tentýž stav (no-op stall). JSDoc upraven, včetně zmínky o schování sedmy přes penaltu.
- `src/ui/main.ts`: narovnán komentář v `onDraw` (původní „má hratelnou kartu, nebo nelze líznout" už neplatí).
- `src/ui/game.test.ts`: přepsán describe blok na „dobrovolné líznutí kdykoliv" — nový test, že hráč s hratelnou kartou smí líznout (+1 karta, tah na AI); nový test penalty u nakupených sedem se sedmou v ruce (2×pendingSevens, vynulování sedem); doplněné guardy (ne na tahu, vítěz, stall).

## Důsledky pro pravidla
- Pravidlo „líznout kdykoliv" je naplněné pro lidského hráče.
- Pravidlo „nemusím hrát sedmu" je pro lidského hráče vyřešené automaticky: uvolněný gate umožní vzít penaltu i se sedmou v ruce. AI strana (strategické šetření sedmy) je samostatné todo.
- Výjimka „nelze líznout na eso" je zatím nedosažitelná (eso si drží tah, soupeř žádné eso „nečelí") — naplní se až s todo „eso přebití a stání".

## Ověření
- `npx vitest run`: 355 testů zelených (14 souborů), včetně 200 simulací partií.
- `npm run build` (`tsc --noEmit && vite build`): prošlo. V projektu není samostatný `lint` skript — typovou kontrolu dělá `tsc --noEmit` v rámci buildu.

## Otevřené otázky
- Žádný rozcestník hodný ADR. UI afordance/animace ponechány k ručnímu ověření (viz verify).
