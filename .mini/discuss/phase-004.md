# Phase 4 — Engine: speciální karty + výhra

## Intent
Rozšířit čistý engine o efekty speciálních karet a detekci výhry, vše pokryté unit testy.
Staví na hotovém datovém modelu (cards.ts) a základním tahu (moves.ts: isPlayable,
playableCards, playCard, drawCard). Cílem je, aby pravidla byla kompletně v enginu
a testovatelná bez DOM (success criteria).

Čtyři pravidla:
- Sedma: soupeř bere 2, sedmy se nakupí (max 4 = ber 8).
- Eso: soupeř stojí → v 1v1 hraješ znovu.
- Svršek: změna barvy na vybranou.
- Výhra: prázdná ruka po tahu.

## Key decisions
- **Tah žije ve stavu.** Přidat `currentPlayer: Player` do `GameState`. Engine vlastní
  střídání tahů: po normální kartě tah přejde na soupeře, po esu zůstává hráči
  (= eso v 1v1 řeší currentPlayer, žádný zvláštní čítač es). `deal` nastaví
  `currentPlayer = "player"`.
- **Svršek přes parametr.** `playCard(state, player, card, chosenSuit?)`. U svršku je
  `chosenSuit` povinný (libovolná ze 4 barev, i vlastní), u ostatních karet se nesmí/ignoruje.
  Engine zůstává čistá funkce; overlay výběru barvy si řeší UI lokálně (drží „rozehraný svršek").
- **Útok sedmou: jen sedma counteruje.** Nové pole `pendingSevens: number` (0–4). Když
  `pendingSevens > 0`, hratelná je POUZE sedma (ani shodná barva neprojde). Hráč buď přidá
  sedmu (pendingSevens++), nebo líznutím vezme `2 × pendingSevens` karet a pendingSevens = 0.
  Toto pravidlo zároveň automaticky řeší souběh eso+sedma (eso pod útokem nelze zahrát).
  Max 4 je přirozeně dáno počtem sedem v balíčku.
- **Výhra odvozená funkcí.** `winnerOf(state): Player | null` podle prázdné ruky, žádné
  pole ve stavu. Volající (UI/smyčka) kontroluje vítěze před povolením dalšího tahu.
  Výhra má přednost před efektem poslední karty (non-goal: „poslední karta nesmí být funkční").
- **Líznutí = konec tahu.** `drawCard` nově předává tah soupeři. Penalty draw (2×N pod
  sedmami) i normální draw (1 karta) ukončí tah.

## Watch out for
- **Rozbije existující testy/stavy.** Přidání `currentPlayer` a `pendingSevens` do `GameState`
  znamená upravit `deal` a všechny GameState literály v moves.test.ts (očekávaná churn).
- **isPlayable musí znát pendingSevens.** Dnešní `isPlayable(card, topCard, currentSuit)` nezná
  útok sedmou. Buď rozšířit signaturu o `pendingSevens`, nebo to řešit v `playableCards`/`playCard`.
  Pozor, ať se logika nerozdvojí mezi dvě místa.
- **Eso vs. extra tah:** po esu zůstává tah hráči; pokud zahraje další eso, hraje zase znovu
  (přirozené přes currentPlayer, žádné stackování es).
- **drawCard při útoku:** musí vzít 2×pendingSevens (ne 1) a vynulovat pendingSevens; pohlídat
  remíchání balíčku, když během penalty dojdou karty (drawCard už remíchání umí pro 1 kartu —
  ověřit chování pro N karet).
- **Svršek a currentSuit vs. topCard:** po svršku je currentSuit ≠ barva vrchní karty; isPlayable
  už currentSuit zohledňuje, ale potvrdit, že další tah validuje proti currentSuit, ne barvě svršku.
- **chosenSuit u ne-svršku:** rozhodnout, zda vyhodit Error, nebo tiše ignorovat (doporučeno: Error
  při svršku bez chosenSuit, a Error/ignorovat chosenSuit u ne-svršku — ať se nedá poslat nesmysl).
