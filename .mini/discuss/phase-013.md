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
