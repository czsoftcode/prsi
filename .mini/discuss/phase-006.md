# Phase 6 — UI herní stůl: vykreslení stavu

## Intent
Zavést první vykreslovací vrstvu: funkce, která z `GameState` (engine) vykreslí do DOM
herní stůl. Pouze čtení/zobrazení, ŽÁDNÁ interakce (klik/dotyk, herní smyčka, AI tahy =
fáze 7). Cíl je mít idempotentní `render(state, root)`, kterou půjde opakovaně volat a
vizuálně i testem ověřit, že odpovídá stavu.

Vykreslit:
- ruka hráče dole lícem (skutečné karty, pořadí = pořadí v `playerHand`)
- ruby AI nahoře (počet rubů = `aiHand.length`, obrázek `rub.png`)
- střed: lízací balíček (rub, příp. počet `drawPile.length`) + odhazovací hromádka
  (vrchní karta = poslední prvek `discardPile`)
- indikátor aktuální barvy `currentSuit`
- indikátor počtu nakupených sedem `pendingSevens`
- (volitelně) vyznačení `currentPlayer`

## Key decisions
- **Render kontrakt: full re-render z kořene.** `render(state, root)` pokaždé přestaví
  celý obsah kontejneru. Idempotentní, jednoduché. (Důsledek pro fázi 7: listenery se
  budou navěšovat po každém renderu znovu — řeší se až tam.)
- **Indikátor barvy: miniatura karty té barvy** (zmenšený obrázek, např. eso dané barvy)
  jako swatch. Bez nového assetu.
- **Testy: pure helpery + jsdom smoke.** Unit testy na čisté helpery (`cardSrc(card)`,
  mapování, počty elementů) + jeden jsdom smoke test, že render z `GameState` vytvoří
  očekávané elementy (počet karet v ruce, počet rubů AI, vrchní karta hromádky, indikátory).
- Tahle fáze zavádí i CSS layout (dosud žádné CSS není; `main.ts` je jen placeholder).

## Watch out for
- **Mapování názvů souborů:** ranky `7/8/9/10` → soubory `07/08/09/10` (nula u
  jednociferných), pojmenované ranky `svrsek/spodek/kral/eso` sedí 1:1. Render MUSÍ mít
  mapovací helper `cardSrc(card)`, ne naivní `${suit}-${rank}.png` (jinak rozbité u 7–9).
  Soubory ověřeny v `public/cards/`, rub = `rub.png`.
- **Indikátor barvy přes „eso té barvy" může u dětí splývat s tím, že je ve hře eso** —
  vizuálně odlišit (popisek „Barva:", jiné umístění/velikost než odhazovací hromádka).
- **jsdom smoke test** vyžaduje `jsdom` jako devDependency a přepnutí prostředí jen pro
  ten soubor (`// @vitest-environment jsdom`), ať engine testy zůstanou v node a nezpomalí.
- Render je side-effect do DOM, není to „pure funkce" v doslovném smyslu — testovatelnost
  zajišťují oddělené pure helpery + jsdom pro DOM výstup.
- Prázdný `drawPile` (po vyčerpání) — zobrazit prázdné místo, ne chybu (logiku remíchání
  řeší engine, UI jen zobrazuje aktuální stav).
