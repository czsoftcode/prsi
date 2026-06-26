# Phase 12 — Motivy: abstrakce assetů + přejmenování

**Goal:** Přejmenovat public/cards na public/cards_01 a převést src/ui/assets.ts ze statických konstant na runtime motiv: cardSrc, RUB_SRC, suitIconSrc i pozadí stolu čtou aktivní motiv NN (výchozí 01), volba se ukládá do localStorage; aktualizovat dotčené testy (assets.test.ts, render.test.ts). Bez UI obrazovky výběru — jen funkční přepnutí motivu programově.

## Steps
- [done] Přejmenovat složku karet na cards_01
- [done] Modul src/ui/theme.ts se stavem a persistencí
- [done] Refaktor assets.ts na runtime motiv
- [done] Aktualizovat konzumenty v render.ts
- [done] Aktualizovat a doplnit testy

## Auto-commit
- Phase 12: Motivy: abstrakce assetů + přejmenování

## Discussion
# Phase 12 — Motivy: abstrakce assetů + přejmenování

## Intent
Připravit infrastrukturu pro výběr motivu (bez UI obrazovky — ta je todo #9).
Přejmenovat `public/cards` → `public/cards_01` a převést `src/ui/assets.ts` ze
statických cest na cesty závislé na aktivním motivu `NN`. Po fázi se vizuálně nic
nemění (výchozí motiv 01 = dnešní stav), ale `cardSrc`/`RUB`/`suitIcon`/pozadí
ukazují na `cards_NN` / `dashboard_NN` a motiv jde přepnout programově.

## Key decisions
- **Jedno NN váže karty i pozadí**: motiv 01 = `cards_01` + `dashboard_01`,
  motiv 02 = `cards_02` + `dashboard_02`. Jeden stav, jeden přepínač.
- **Minimální persistence**: localStorage uloží/načte NN, výchozí `"01"`,
  **bez validace** proti seznamu motivů — registr a validace neznámého NN je
  todo #10. Drží fázi malou.
- **Formát id**: string s nulou, `"01"` / `"02"` (odpovídá názvům složek).
- **localStorage klíč**: `prsi.theme`.
- **Nový modul** `src/ui/theme.ts` drží stav motivu + persistenci
  (`getActiveTheme()` / `setActiveTheme(id)`), `assets.ts` z něj čte. Assety
  zůstanou bez vlastního stavu.
- **Re-render po přepnutí se v této fázi NEdrátuje** (není UI). `setActiveTheme`
  jen uloží + aktualizuje stav v paměti; vizuální projev závisí na příštím
  renderu. Ověří se testem: po `setActiveTheme("02")` vrací `cardSrc` cestu s
  `cards_02`.

## Watch out for
- `RUB_SRC` a `TABLE_BG_IMAGE_SET` jsou dnes **konstanty** počítané při importu
  → musí se stát funkcemi (`rubSrc()`, `tableBgImageSet()`), které čtou aktivní
  motiv. Aktualizovat konzumenty v `render.ts` (řádky ~8, ~11, ~34, ~162) —
  importují je jako konstanty.
- **Testy mají natvrdo `/cards/...`** → po přejmenování rozbité, nutno upravit
  společně: `assets.test.ts` (cardSrc/suit/...) a `render.test.ts:39` (svršek),
  `:45` (suit-srdce). Po fázi musí očekávat `/cards_01/...`.
- Přejmenovat přes `git mv public/cards public/cards_01` (zachová historii).
  Pozor: working tree má rozpracovaný `public/images/hraci_plocha.png` —
  nemíchat do commitu nesouvisející změny.
- localStorage může vyhodit (private mode / blokované úložiště) → čtení i zápis
  obalit `try/catch`, fallback na in-memory default `"01"` (tichý fallback, ne
  pád hry).
- Zachovat prefix `import.meta.env.BASE_URL` (GH Pages base `/prsi/`).
- Pozadí zůstává `image-set` webp + jpg fallback pro každé `dashboard_NN`
  (oba motivy mají .webp i .jpg — ověřeno).
- `project.md` (Approach) zmiňuje `public/cards/` — dokumentace, mimo rozsah
  této fáze.

## Run report
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
