---
phase: 11
verdict: done
steps:
  - title: "Ověřit existenci a rozměry obrázků"
    status: done
  - title: "Nastavit obrázek jako pozadí .prsi-table"
    status: done
  - title: "Přidat ztmavující překryv pro čitelnost"
    status: done
  - title: "Ověřit čitelnost na mobilu i desktopu"
    status: done
verify:
  - title: "Vizuální čitelnost pozadí na desktopu i mobilu"
    detail: "Mechanicky ověřeno (build, 302 testů, obrázek v dist/images, base path i overlay v buildu), ale samotný render jsem vizuálně nezkontroloval — připojený prohlížeč pro screenshot nereagoval v limitu. Projdi: čitelnost bílého textu, indikátoru barvy, rubů karet a overlayů (výběr barvy, konec hry) na širokém i úzkém displeji; ověř, že ořez vláčku (background-size: cover) je akceptovatelný. Pokud je overlay moc tmavý/světlý, lze doladit hodnoty rgba(0,0,0,.45/.55) ve style.css."
---

# Phase 11 — report z auto session

## Co je hotové
- Obrázek pozadí (`public/images/dashboard_01.webp` + `.jpg` fallback) nasazen jako pozadí `.prsi-table` přes `image-set()`.
- Ztmavující overlay `linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.55))` nad obrázkem kvůli čitelnosti bílého textu a rubů.
- `background-size: cover; position: center; repeat: no-repeat;` — **bez** `background-attachment: fixed` (dle dohody kvůli mobilu).

## Klíčové rozhodnutí (base path)
CSS `url()` na absolutní cestu `/images/...` by se v produkčním buildu pod base `"/prsi/"` **nerozšířilo** o prefix a 404nulo. Proto se hodnota `image-set()` skládá v JS z `import.meta.env.BASE_URL` (`TABLE_BG_IMAGE_SET` v `assets.ts`) a nastavuje se na CSS proměnnou `--table-bg` v `render.ts`. Overlay i fallback gradient zůstávají v `style.css`. Fallback: `var(--table-bg, radial-gradient(... felt ...))` — kdyby proměnná nebyla nastavená, vrátí se původní filc.

Ověřeno v buildu: `dist/assets/index-*.js` obsahuje `images/dashboard_01.webp/jpg`, `image-set` i `/prsi/`; `dist/images/` obsahuje oba obrázky; CSS obsahuje overlay + `var(--table-bg)`.

## Co jsem neověřil
Vizuální render — viz `verify` výše. Pokus o screenshot přes prohlížeč selhal (žádný připojený Chrome nereagoval do timeoutu).

## Poznámka
`image-set()` používám bez `-webkit-` prefixu; moderní prohlížeče (Chrome 113+, Safari, Firefox) ho znají. Prohlížeč bez podpory webp si v rámci `image-set` vybere `.jpg`.
