---
phase: 8
verdict: done
steps:
  - title: "isPat: cista funkce + unit testy"
    status: done
  - title: "End overlay komponenta + CSS + jsdom test"
    status: done
  - title: "Zapojeni v main.ts: konec/pat -> overlay, restart"
    status: done
  - title: "Zastaveni smycky po konci + overeni cyklu"
    status: done
verify:
  - title: "Vizuální průběh konce hry a restartu v prohlížeči"
    detail: "Mechanické testy (jsdom) ověřily strukturu overlaye a callback. Nepodařilo se spustit dev server pro ověření reálného UI průběhu — ověř v prohlížeči: výhra/prohra/pat zobrazí správnou hlášku, tlačítko Nová partie spustí novou partii bez reloadu."
---

# Phase 8 — Konec hry, nová partie, pat

Implementace proběhla bez větších problémů. Klíčové body:

- `isPat()` v `game.ts` — čistá funkce, bez mutace, 6 unit testů (hráč i AI strana, balíček prázdný/neprázdný, hromádka pro remíchání, vítěz existuje).
- `showEndOverlay()` v `overlay.ts` — overlay mimo `#app`, nelze zavřít jinak než tlačítkem (záměr: jediná akce je nová hra). Jsdom testy ověřily text, tlačítko, callback i odebrání ze DOM.
- `main.ts` — přidán `ended` flag zabraňující dvojímu overlaye (výhra + stale setTimeout AI), `endMessage()` pro unifikaci textu, `newGame()` v closure (resety state bez druhého `startGame()`), `locked = ended` po AI tahu.
- CSS pro `.overlay--end` a `.overlay__newgame` doplněno do `style.css`.

Adversariální review (sub-agent) selhal dvakrát na server 529 — uživatel rozhodl pokračovat bez něj. Mechanické ověření: 102/102 testů OK, `vite build` OK.
