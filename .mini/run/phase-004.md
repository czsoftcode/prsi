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
