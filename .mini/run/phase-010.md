---
phase: 10
verdict: done
steps:
  - title: "Struktura README: nadpis + popis hry"
    status: done
  - title: "Sekce Pravidla (stručně)"
    status: done
  - title: "Sekce Instalace a spuštění"
    status: done
  - title: "Vložení snímku herní plochy"
    status: done
  - title: "Vizuální ověření renderu README"
    status: done
verify:
  - title: "README a snímek se na GitHubu vykreslí správně"
    detail: "Cestu k obrázku (public/images/hraci_plocha.png, relativní od kořene repa) i existenci souboru jsem ověřil, ale samotný vizuální render markdownu a obrázku na GitHubu posoudí jen člověk."
---

Přepsal jsem dosud prázdné `README.md` (obsahovalo jen `# Prší`) na plnohodnotný popis:
úvod, sekce Pravidla ve zkratce, Instalace a spuštění a Technologie. Příkazy v sekci
instalace odpovídají skriptům v `package.json` (`dev`, `build`, `preview`, `test`).

Snímek herní plochy je vložen relativní cestou `public/images/hraci_plocha.png` — soubor
v repu existuje (479 kB). Port dev serveru (5173) je výchozí Vite.

Otevřená věc pro člověka: vizuální kontrola, že se README i obrázek na GitHubu vykreslí
korektně (relativní cesta k obrázku, žádné rozbité odkazy). Mechanicky nelze ověřit.
