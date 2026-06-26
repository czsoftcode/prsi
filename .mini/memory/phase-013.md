# Phase 13 — Registr dostupných motivů

**Goal:** Build-time skript/Vite plugin proskenuje public/cards_* a public/images/dashboard_*, spáruje je a vygeneruje manifest motivů (jen NN s kompletními assety – cards_NN i dashboard_NN), který appka importuje místo natvrdo zadaného seznamu; getActiveTheme validuje uloženou hodnotu proti registru a při neznámém/nekompletním NN spadne na DEFAULT_THEME. Bez UI obrazovky výběru (to je todo 9).

## Steps
- [done] Vite plugin: sken public/ -> virtual:themes
- [done] Ambient deklarace virtual:themes
- [done] Validace v getActiveTheme
- [done] Testy registru a fallbacku
- [done] Overit zeleny build

## Auto-commit
- Phase 13: Registr dostupných motivů

## Discussion
# Phase 13 — Registr dostupných motivů

## Intent
Zavést jediný zdroj pravdy = seznam NN motivů s kompletními assety. Dnes `theme.ts`
nemá ponětí, které motivy existují, a `getActiveTheme()` vrátí uloženou hodnotu bez
kontroly → uložené neexistující/nekompletní NN (např. "03" nebo "99") vede na 404
karet/pozadí. Registr má sloužit (a) pozdější UI výběru (todo 9) a (b) validaci v
`getActiveTheme`. Reálný stav: `public/cards_03` existuje, ale `dashboard_03` ne →
motiv 03 musí být z registru vyloučen. Bez UI obrazovky výběru (to je todo 9).

## Key decisions
- **Mechanismus = Vite plugin + virtuální modul `virtual:themes`.** Plugin při startu
  (dev i build) proskenuje filesystem přes node `fs` (NE `import.meta.glob` — ten na
  `public/` nefunguje) a virtuální modul exportuje seznam. Žádný commitnutý
  vygenerovaný soubor → "přidat motiv = nahrát složku + rebuild/restart dev".
- **Tvar manifestu = `string[]` NN, vzestupně seřazeno.** Pro todo 9 teď víc netřeba
  (náhledy si UI dopočítá z `assets.ts`). Export např. `THEMES`.
- **Validace páru = jen existence**, ne hloubková kontrola obsahu: složka
  `public/cards_NN` existuje A ZÁROVEŇ `public/images/dashboard_NN.webp` i
  `dashboard_NN.jpg` existují (oba formáty — `tableBgImageSet()` používá image-set
  webp+jpg). NN = část názvu složky za `cards_`.
- **`getActiveTheme` fallback:** uložené NN mimo registr → vrať `DEFAULT_THEME`,
  úložiště NEPŘEPISUJ (jen čtení se opraví). `DEFAULT_THEME` ("01") se předpokládá
  přítomný; i prázdný registr → vrať `DEFAULT_THEME` (hra nikdy nespadne).
- **Typování:** ambient deklarace `declare module "virtual:themes"` (např. ve
  `src/vite-env.d.ts` nebo zvlášť) — jinak TS import nezná.

## Watch out for
- **Vitest sdílí vite config** (jediný `defineConfig`), takže plugin/virtuální modul
  se musí resolvovat i v testech — OVĚŘIT, že `theme.test.ts` (vi.resetModules +
  dynamic import `./theme`, env "node") projde, když `theme.ts` importuje
  `virtual:themes`. Sken `fs` běží z cwd = root projektu → `public/` dostupné.
- **theme.test.ts validuje proti reálnému registru** (01, 02). Nový test "neznámé
  NN → fallback": nastav uložené "99", očekávej "01". Test "set 02 → get 02" musí
  dál projít (02 je validní). Pozor: pokud bych přidal validaci i do `setActiveTheme`,
  rozbil bych volnost — validace patří JEN do `getActiveTheme` (čtení), `setActiveTheme`
  nech beze změny (in-memory drží cokoli).
- **Dev hot-reload:** přidání nové složky za běhu dev serveru se neprojeví bez
  restartu (plugin load proběhne jednou) — přijatelné, ale zmínit.
- **Konzistence s assets.ts:** assets.ts dál počítá cesty z `getActiveTheme()`, na
  registr se nedívá — registr je jen pro validaci a budoucí UI. Nepřidávat zbytečnou
  vazbu assets.ts → registr.
- **DEFAULT_THEME zůstává "01"** a předpokládá se, že má kompletní assety (jinak je
  build rozbitý tak jako tak — mimo rozsah).

## Run report
---
phase: 13
verdict: done
steps:
  - title: "Vite plugin: sken public/ -> virtual:themes"
    status: done
  - title: "Ambient deklarace virtual:themes"
    status: done
  - title: "Validace v getActiveTheme"
    status: done
  - title: "Testy registru a fallbacku"
    status: done
  - title: "Overit zeleny build"
    status: done
---

# Phase 13 — report z auto session

## Co vzniklo
- `vite.config.ts`: inline plugin `prsi-themes-registry` poskytuje virtuální modul
  `virtual:themes` s `export const THEMES: string[]`. Sken přes node `fs`:
  `public/cards_*` → NN, motiv validní jen když existují `public/images/dashboard_NN.webp`
  i `.jpg`. Výstup vzestupně. `try/catch` na `readdirSync` → prázdný registr když
  `public/` chybí.
- `src/virtual-themes.d.ts`: ambient deklarace modulu (jinak TS import nezná).
- `src/ui/theme.ts`: `getActiveTheme` importuje `THEMES` a uloženou hodnotu validuje —
  NN mimo registr → `DEFAULT_THEME`, úložiště se NEpřepisuje. `setActiveTheme` beze
  změny (drží v paměti cokoli). Aktualizovaná hlavička.
- `src/ui/theme.test.ts`: + test „uložené neznámé NN (99) → 01", + smoke testy registru
  (resolvuje se ve vitest, obsahuje `01`, je seřazený, neobsahuje `99`).

## Verifikace (vše mechanicky ověřeno)
- `npm run test` → 311 passed (11 souborů). `npm run typecheck` čistý. `npm run build`
  čistý (tsc + vite build OK).
- Potvrzeno, že `virtual:themes` se resolvuje i ve vitest (sdílený vite config) — smoke
  test prochází.

## Odchylka od plánu (pozn. pro člověka)
- Plán/poznámky počítaly s tím, že `cards_03` nemá dashboard a má být z registru
  VYLOUČEN. Během této session ale vznikly `public/images/dashboard_03.{webp,jpg}`
  (timestamp 12:57), takže motiv `03` má teď kompletní pár a registr ho — správně —
  zahrnuje (`THEMES = ["01","02","03"]`). Test jsem proto přepsal z „03 není v registru"
  na neutrální „registr je seřazený a neobsahuje neexistující `99`".
- Důsledek: párovací filtr (vyloučení nekompletního motivu) už NEMÁ na disku případ,
  na kterém by se přímo demonstroval — na současném stavu mají všechny `cards_NN`
  kompletní pár. Filtr je pokrytý jen nepřímo (logika v pluginu + getActiveTheme
  fallback). Pokud by bylo žádoucí to tvrdě otestovat, chtělo by to fixturu s
  nekompletním motivem nebo vytažení skenovací funkce do testovatelného modulu —
  vědomě jsem to neudělal (mimo rozsah, over-engineering pro tuto fázi).

## Pozn. dál
- Dev hot-reload: přidání nové složky za běhu dev serveru se projeví až po restartu
  (plugin load proběhne jednou). Přijatelné.
- `assets.ts` se na registr záměrně nedívá — cesty dál počítá z `getActiveTheme()`.
- Registr je připravený pro UI výběru motivu (todo 9), které si seznam vezme z `THEMES`.
