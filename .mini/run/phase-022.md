---
phase: 22
verdict: done
steps:
  - title: "Modul stavu nápovědy s persistencí"
    status: done
  - title: "Tlačítko nápovědy v render.ts"
    status: done
  - title: "Podmínit vykreslení card--playable"
    status: done
  - title: "Handler přepnutí v main.ts"
    status: done
  - title: "Testy a zelený build"
    status: done
verify:
  - title: "Vizuální chování přepínače 💡/🚫 na stole"
    detail: "Mechanicky ověřeno: build + 352 testů zelené, aria-pressed a počet .card--playable testem. Lidským okem zbývá ověřit, že tlačítko sedí vedle motivu/hudby (desktop i mobil) a po kliknutí žluté orámování opravdu zmizí/se vrátí a přežije restart partie i reload (localStorage)."
---

# Phase 22 — report z auto session

## Co se udělalo
Přidán přepínač nápovědy tahu jako zrcadlo stávajícího vypínače hudby:

- **`src/ui/hint.ts`** (nový) — `isHintEnabled()` (líná inicializace z localStorage, default zapnuto) a `setHintEnabled(on)`. localStorage čtení/zápis je best-effort v try/catch (klíč `prsi.hint`); při nedostupném úložišti (private mode) platí volba pro relaci in-memory.
- **`render.ts`** — `renderHintButton()` (💡/🚫, `data-action='hint'`, `aria-pressed` dle stavu), přidáno do bloku indikátorů vedle motivu a hudby. Zvýraznění `card--playable` se přidá jen když `myTurn && isHintEnabled()`. Výpočet `playableCards` zůstal nedotčený.
- **`main.ts`** — větev `data-action='hint'` před zámkem `locked` (lze přepnout i během AI prodlevy), volá `setHintEnabled` + `draw()`. Nemění herní stav.
- **`render.test.ts`** — mock `./hint`, dva nové testy (vypnutá nápověda nezvýrazní karty ani na tahu; aria-pressed obousměrně).

## Ověření
`npm run build` (tsc + vite) zelený, `vitest run` 352 testů zelených.

## Nezávislý self-review
Spuštěn sub-agent (čerstvý kontext) cílený na cross-module kontrakt, chybovou cestu localStorage a izolaci validace tahu. **Žádné reálné nálezy.** Potvrzeno, že:
- Validace tahu je zcela nezávislá na `isHintEnabled()` — engine ani `onPlayCard` o nápovědě neví, vypnutí nemůže povolit neplatný tah (CSS třída není vstup do validace).
- Testy mají zuby: kdyby z podmínky vypadl `isHintEnabled()`, nový test spadne; `playableCards` se nemockuje (běží reálný engine).

## Otevřená drobnost (bez akce)
Literál `data-action='hint'` je duplikovaný mezi render.ts a main.ts — stejný preexistující vzor jako u music/theme/draw, TypeScript ani test ho neváže end-to-end. Není to regrese této fáze; pokud by se řešilo, pak globálně sdílenou konstantou pro všechna tlačítka, ne izolovaně u hintu.
