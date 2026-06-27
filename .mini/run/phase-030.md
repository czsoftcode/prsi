---
phase: 30
verdict: done
steps:
  - title: "Build job omezit na contents: read"
    status: done
  - title: "Přesunout configure-pages do deploy jobu"
    status: done
  - title: "Připnout všechny Actions na commit SHA"
    status: done
  - title: "Přidat .github/dependabot.yml"
    status: done
  - title: "Ověřit validitu workflow"
    status: done
verify:
  - title: "Reálný běh workflow na GitHubu (build + deploy projde)"
    detail: "Lokálně ověřeno jen parsování YAML a rozdělení práv. Skutečnou funkčnost (zejm. že configure-pages s enablement:true projde z deploy jobu a deploy-pages se OIDC tokenem nasadí) potvrdí až push do main / workflow_dispatch — to spustit nemohu."
---

# Phase 30 — report z auto session

## Co se udělalo
- **Top-level `permissions` s write právy zrušeno.** Práva nastavena per-job: `build` má jen `contents: read`, `deploy` má `pages: write` + `id-token: write`. Protože per-job `permissions` blok plně přepisuje, ostatní práva jsou v obou jobech implicitně `none`.
- **`actions/configure-pages` přesunut z build jobu do deploy jobu** (před `deploy-pages`). Tím build job opravdu nepotřebuje žádné write právo; `enablement: true` (vyžaduje `pages: write`) běží už pod právy deploy jobu.
- **Všech 5 Actions připnuto na commit SHA** s komentářem verze:
  - checkout `34e1148…` # v4.3.1
  - setup-node `49933ea…` # v4.4.0
  - upload-pages-artifact `56afc60…` # v3.0.1
  - configure-pages `983d773…` # v5.0.0
  - deploy-pages `d6db901…` # v4.0.5
  - SHA dohledány přes `gh api` jako otisk nejnovějšího tagu v rámci **stávajících majorů** (záměrně bez upgradu majorů — ty navrhne Dependabot s reviewem).
- **`.github/dependabot.yml`** přidán: `package-ecosystem: github-actions`, `directory: "/"`, týdenní interval. Hlídá připnuté SHA a otevírá PR s povýšením.

## Jak ověřeno
- Oba YAML soubory naparsovány (`node` + balík `yaml` z node_modules) — bez chyb.
- Strojově zkontrolováno rozdělení práv: build `{contents: read}`, deploy `{pages: write, id-token: write}`, žádný top-level `permissions` blok.
- Ověřeno, že každý `uses:` má 40-znakový SHA + komentář `# vX.Y.Z`.

## Pozn. / trade-off
- SHA pinning zmrazí verze — proto Dependabot, ať povýšení nejsou čistě ruční. PR od Dependabotu je ale stále nutné odkliknout (review + merge).
- `configure-pages` v deploy jobu je netradiční umístění (obvykle bývá v buildu), ale je to cena za to, že build job běží čistě read-only. Funkčně rovnocenné.
- Nasazení samotné nešlo ověřit lokálně — viz `verify` výše.
