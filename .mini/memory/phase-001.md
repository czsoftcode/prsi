# Phase 1 — Scaffold Vite + TypeScript

**Goal:** Založit Vite + TypeScript projekt se strukturou složek (engine/ui/assets) a ověřit, že běží dev server i produkční build.

## Steps
- [done] Inicializace Vite vanilla-ts projektu
- [done] Struktura složek a strict tsconfig
- [done] Nastavení Vitestu se smoke testem
- [done] Placeholder herní stůl + ověření assetů
- [done] Ověření produkčního buildu

## Auto-commit
- Phase 1: Scaffold Vite + TypeScript

## Run report
---
phase: 1
verdict: done
steps:
  - title: "Inicializace Vite vanilla-ts projektu"
    status: done
  - title: "Struktura složek a strict tsconfig"
    status: done
  - title: "Nastavení Vitestu se smoke testem"
    status: done
  - title: "Placeholder herní stůl + ověření assetů"
    status: done
  - title: "Ověření produkčního buildu"
    status: done
verify:
  - title: "Vizuální kontrola placeholder stránky v prohlížeči"
    detail: "Mechanicky ověřeno HTTP 200 pro index.html, main.ts i /cards/rub.png (dev i preview). Že se nadpis 'Prší' a obrázek rubu opravdu vizuálně vykreslí, jsem neviděl — spusť `npm run dev` a koukni."
---

# Phase 1 — report z auto session

## Co se povedlo
Scaffold stojí a je mechanicky ověřený end-to-end:
- **Vite + TypeScript** (vanilla, bez frameworku), `type: module`. `npm install` proběhl (54 balíčků).
- **Struktura**: `src/engine/` a `src/ui/`, `public/cards/` (33 souborů — 32 karet + rub). `tsconfig.json` má `strict: true` + přísnější volby (`noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`). `npx tsc --noEmit` projde čistě.
- **Vitest** nastavený přes `vite.config.ts` (globals), smoke test v `src/engine/smoke.test.ts` prochází (`npm test`).
- **Placeholder** `index.html` + `src/ui/main.ts` vykreslí nadpis a `/cards/rub.png` — cesta k assetům funguje.
- **Build**: `npm run build` (`tsc --noEmit && vite build`) vytvoří `dist/` včetně `dist/cards/` (33 obrázků). `npm run preview` i `npm run dev` vrací HTTP 200 pro stránku i obrázek karty.

## Na co jsem narazil / poznámky
- `pwd` se rozbaluje na `/home/debian/MyProjects/Typescript/prsi` (primární cesta `…/stkremen/…` je symlink na stejný adresář). Je tu i `.git` — projekt je reálně git repo, i když prostředí hlásilo opak. Commit jsem nedělal (mini workflow to neřeší a nebyls o to požádán).
- `npm install` hlásí 5 zranitelností (3 moderate, 1 high, 1 critical) v dev závislostech (tranzitivně přes vite/esbuild). Pro lokální offline hru to teď neřeším; `npm audit fix --force` by tahal breaking změny. Drž v hlavě pro pozdější úklid.
- `npm run build` schválně pouští i `tsc --noEmit`, aby build padal na typové chyby (vite sám typy nekontroluje).

## Otevřené otázky
Žádné blokující. Jediné, co stojí za lidský pohled, je vizuální vykreslení placeholderu (viz `verify`).
