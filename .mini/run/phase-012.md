---
phase: 12
verdict: done
steps:
  - title: "Přejmenovat složku karet na cards_01"
    status: done
  - title: "Modul src/ui/theme.ts se stavem a persistencí"
    status: done
  - title: "Refaktor assets.ts na runtime motiv"
    status: done
  - title: "Aktualizovat konzumenty v render.ts"
    status: done
  - title: "Aktualizovat a doplnit testy"
    status: done
verify:
  - title: "Vizuální kontrola v prohlížeči: karty i pozadí se načtou bez 404"
    detail: "Testy ověřují tvar cest (/cards_01/..., dashboard_01), ne reálné načtení souborů po přejmenování složky. Pustit `npm run dev`, otevřít hru a zkontrolovat, že karty, rub i pozadí stolu se zobrazí (žádné 404 v Network/Console). Volitelně v konzoli `setActiveTheme('02')` + nová partie → motiv 02."
---

# Phase 12 — report z auto session

Hotovo, všech 308 testů zelené, `typecheck` i `vite build` projdou.

## Co se udělalo
- `public/cards` → `public/cards_01` přes `git mv` (zachována historie). Rozpracovaný `hraci_plocha.png` zůstal mimo, nemíchal jsem ho do změny.
- Nový modul `src/ui/theme.ts`: `getActiveTheme()` / `setActiveTheme()`, klíč `prsi.theme`, default `"01"`, in-memory cache + best-effort persistence (čtení i zápis v `try/catch`, fallback bez pádu). Pokryto `theme.test.ts` (default, set→get, persistence napříč „session", fallback při házejícím localStorage).
- `assets.ts`: cesty se počítají při volání podle aktivního motivu. `RUB_SRC` → `rubSrc()`, `TABLE_BG_IMAGE_SET` → `tableBgImageSet()` (obě byly konstanty počítané při importu). `cardSrc`/`suitIconSrc`/rub míří do `cards_NN`, pozadí na `dashboard_NN` (image-set webp+jpg). `BASE_URL` prefix zachován.
- `render.ts`: konzumenti přepnuti na nové funkce.
- Testy `assets.test.ts` + `render.test.ts` přepsány na `/cards_01/`, přidán test, že `setActiveTheme("02")` přepne karty/rub/ikony/pozadí na motiv 02.

## Pozn. / na co dát pozor dál
- **Re-render po přepnutí není zadrátovaný** (záměr fáze — bez UI). Vizuální projev přepnutí přijde až s `setActiveTheme` voláním + re-renderem, což řeší navazující UI fáze (todo #9). V konzoli je přepnutí vidět až po nové partii / re-renderu.
- **Bez validace NN** — neznámá uložená hodnota by ukázala na neexistující složku (404). Validace + registr motivů je vědomě odloženo na todo #10.
- `project.md` (Approach) pořád zmiňuje `public/cards/` — dokumentace, mimo rozsah.
