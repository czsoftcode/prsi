---
phase: 33
verdict: done
steps:
  - title: "Povýšit vitest na 4.x a sladit závislosti"
    status: done
  - title: "Zprovoznit testovou sadu po bumpu"
    status: done
  - title: "Ověřit čistý audit"
    status: done
  - title: "Regrese: build + typecheck"
    status: done
---

# Phase 33 — report z auto session

## Co se udělalo
`vitest` povýšen z `^2.1.8` na `^4.1.9` (`npm install -D vitest@^4`). Instalace odebrala 17 a přidala 6 balíčků (zmizel starý vnořený `vite@5` + `esbuild@0.21`, které táhl jen vitest 2). `jsdom` zůstal na `^29.1.1` — vitest 4 ho akceptuje bez peer konfliktu, bump nebyl potřeba.

## Jak ověřeno (mechanicky)
- **Testy:** `npm test` → všech 388 testů prošlo na vitest 4.1.9 **bez jediné úpravy kódu nebo configu**. Žádné API breaky — `defineConfig({ test })` v `vite.config.ts`, `globals: true`, `environment: "node"` i per-file `// @vitest-environment jsdom` fungují v majoru 4 stejně.
- **Audit:** `npm audit` → `found 0 vulnerabilities` (pět dosavadních advisories u vitest/vite/esbuild je pryč). To samé hlásil už `npm install`.
- **Typecheck:** `tsc --noEmit` bez chyby.
- **Build:** `npm run build` bez chyby; produkční bundle nedotčen (vite 6 app build beze změny, jen hash JS chunku se posunul rebuildem).

## Pozn. / trade-off
- Očekávané riziko major bumpu (změny `vi.*` mocků, environment, vynucený jsdom/Node) se **nenaplnilo** — sada je čistá a přechod byl bezbolestný.
- Připomínka: jde čistě o vývojový toolchain, v produkčním bundlu žádná z těchto závislostí není. Hodnota fáze = čistý `npm audit`, ne odstranění aktivní produkční hrozby.
