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
