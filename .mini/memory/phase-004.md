# Phase 4 — Engine: speciální karty + výhra

**Goal:** Doplnit do enginu efekty sedmy (ber 2, hromadění max 4 sedmy = 8 karet), esa (soupeř stojí → v 1v1 hraješ znovu), svršku (změna barvy) a detekci výhry (prázdná ruka), vše pokryté unit testy.

## Steps
- [done] Model: currentPlayer + pendingSevens do GameState
- [done] Střídání tahu v playCard a drawCard
- [done] Eso: hraješ znovu
- [done] Svršek: změna barvy přes chosenSuit
- [done] Sedma: hromadění a líznutí penalty
- [done] Detekce výhry: winnerOf(state)

## Auto-commit
- Phase 4: Engine: speciální karty + výhra

## Discussion
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

## Run report
---
phase: 4
verdict: done
steps:
  - title: "Model: currentPlayer + pendingSevens do GameState"
    status: done
  - title: "Střídání tahu v playCard a drawCard"
    status: done
  - title: "Eso: hraješ znovu"
    status: done
  - title: "Svršek: změna barvy přes chosenSuit"
    status: done
  - title: "Sedma: hromadění a líznutí penalty"
    status: done
  - title: "Detekce výhry: winnerOf(state)"
    status: done
---

# Phase 4 — report z auto session

## Co je hotové
Engine umí všechny speciální karty i detekci výhry, vše pokryté unit testy.
47 testů zelených, `tsc --noEmit` čistý.

- `GameState` rozšířen o `currentPlayer: Player` a `pendingSevens: number`; `deal`
  nastaví `"player"` a `0`.
- `isPlayable` má nový volitelný 4. parametr `pendingSevens` (default 0) — jediné
  místo rozhodující o hratelnosti. Při `pendingSevens > 0` je hratelná jen sedma.
  `playableCards` i `playCard` se opírají o tuto funkci (logika se nerozdvojila).
- `playCard(state, player, card, chosenSuit?)`: sedma zvyšuje `pendingSevens`,
  eso ponechá tah hráči, ostatní karty tah předají soupeři. Svršek vyžaduje
  `chosenSuit` (jinak Error), `chosenSuit` u ne-svrška je Error.
- `drawCard`: bez sedem líže 1, pod útokem `2 × pendingSevens` a vynuluje;
  remíchá i uprostřed penalty; tah předá soupeři. Když nelze líznout ani míchat,
  vrací stav beze změny (zachováno kvůli stávajícímu testu).
- `winnerOf(state): Player | null` — odvozená funkce, výhra má přednost před
  efektem poslední karty.

## Rozhodnutí učiněná během práce (nad rámec diskuze)
- **Turn se v playCard/drawCard nevaliduje.** Funkce nekontrolují, že předaný
  `player` odpovídá `currentPlayer` — jen spočítají, kdo je na tahu příště. Tím
  zůstaly zelené stávající testy (volají playCard/drawCard s explicitním hráčem
  bez ohledu na currentPlayer) a validace „čí je tah" je věc UI/herní smyčky.
- **Penalta větší než počet dostupných karet vezme jen co jde** a nezacyklí se
  (pokryto testem). Reálně nemůže nastat, ale engine to ustojí.
- **Svršek vyžaduje `chosenSuit` i jako poslední (vítězná) karta.** Nezavedl jsem
  výjimku „při výhře barvu neřeš" — méně větví, ale UI musí počítat s tím, že
  k zahrání svrška vždy potřebuje barvu (i když tím hráč vyhraje).

## Na co navázat v dalších fázích
- Tohle jsou nízkoúrovňové primitivy. Chybí orchestrace jednoho celého tahu
  (vyber/zahraj/líznI → vyhodnoť výhru) — to přijde s AI (fáze 5) a UI smyčkou.
- AI i UI musí samy hlídat `winnerOf` a `currentPlayer` (engine je nevynucuje).
