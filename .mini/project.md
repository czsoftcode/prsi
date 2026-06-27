# Karetní hra Prší

## What I'm building
Webová hra Prší 1v1 proti počítači podle českých pravidel s mariášovými kartami — jedna partie od rozdání po výhru, běží v prohlížeči.

## Who it's for
Uživatel ve věku 6+

## Approach
- Jádro je čistý herní engine v TS (pure funkce: pravidla, validace tahu, vyhodnocení), oddělený od vykreslování a testovatelný bez DOM.
- Jedna herní obrazovka: ruka hráče dole, rub karet AI nahoře, lízací balíček + odhazovací hromádka uprostřed, indikátor aktuální barvy a nakupených sedem; overlaye pro výběr barvy (svršek) a konec hry.
- Pravidla: 32 mariášových karet; tah = shoda barvy nebo hodnoty; svršek mění barvu; sedma = soupeř bere 2 a hromadí se max 4 sedmy (= 8 karet); eso = soupeř musí přebít vlastním esem, nebo stojí a přijde o tah (esa se hromadí, pod nakupenými esy nelze líznout) — v 1v1 po nepřebitém esu hraješ znovu; kdo nemá hratelnou kartu, líže 1 a tah končí, líznout lze ale i dobrovolně kdykoliv na tahu (předá tah soupeři); dojde-li lízací balíček, zamíchá se odhazovací zpět; vyhrává první s prázdnou rukou.
- AI je jednoduchá heuristika — vždy jen platné tahy, záměrně hloupá.
- Grafika karet: AI-generované PNG v public/cards/, pojmenování {barva}-{hodnota}.png (barvy zaludy/zelene/srdce/kule), rub jako rub.png.

## Non-goals
- Neimplementuj online ani síťový multiplayer v této verzi.
- Neimplementuj hru pro 3+ hráčů ani hotseat dvou lidí na jednom zařízení.
- Nezaváděj pravidlo „červená sedma vrací hráče do hry".
- Nezaváděj pravidlo „poslední karta nesmí být funkční".
- Neimplementuj skóre přes více partií ani více kol — jen jedna partie.
- Nepřidávej nastavení obtížnosti, ukládání ani lokalizaci.

## Success criteria
- Lze odehrát celou partii 1v1 od rozdání po výhru bez chyby pravidel.
- Pravidla (sedma + hromadění, eso, svršek + změna barvy, lízání, remíchání balíčku) fungují správně a jsou pokrytá testy enginu.
- AI vždy zahraje jen platný tah.
- Hra běží v prohlížeči přes Vite a je ovladatelná myší i dotykem.

## Main constraints
TypeScript + Vite, bez frameworku (čisté DOM vykreslování)
