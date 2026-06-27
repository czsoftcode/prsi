---
phase: 26
verdict: done
steps:
  - title: "Sdílený guard tahu (assertTurn)"
    status: done
  - title: "Zapojit guard do playCard, drawCard, standAce"
    status: done
  - title: "Negativní testy: tah nesprávného hráče"
    status: done
  - title: "Negativní testy: tah po skončené hře"
    status: done
  - title: "Zelená regrese: suite, build, lint, E2E"
    status: done
---

# Phase 26 — report z auto session

## Co se udělalo
Nález 25-5 vyřešen: kontrakt pořadí tahu a konce hry se přesunul z UI do enginu.

- `assertTurn(state, player, op)` v `src/engine/moves.ts` — privátní helper, vyhodí
  `Error` když `winnerOf(state) !== null` (hra skončila) nebo `player !== state.currentPlayer`
  (nesprávný hráč). Pořadí kontrol: konec hry **první** — po výhře je `currentPlayer`
  poražený, takže samotná kontrola hráče by tah po konci hry propustila.
- Volá se na začátku `playCard`, `drawCard` i `standAce`, před vší ostatní validací.
  Čistá funkce, hází před jakoukoli mutací → žádný poloviční stav.
- 6 negativních testů v `moves.test.ts` (3× tah nesprávného hráče, 3× tah po skončené
  hře), všechny tři operace pokryté.

## Co bylo třeba dořešit (riziko se naplnilo)
Guard rozbil **21 existujících testů** v `moves.test.ts` a **6** v `ai.test.ts`. Příčina:
test-helpery `makeState` defaultovaly ruce na `[]`, takže výchozí stav vypadal jako
vyhraný (`winnerOf` vracel vítěze) a guard se aktivoval. To není chyba guardu — stav
„hráč s prázdnou rukou je na tahu" je v reálné hře nemožný (už by vyhrál).

Oprava: default rukou v `makeState` (oba soubory) změněn z `[]` na placeholder kartu
(= rozehraná partie). Tři sedmové penalty testy a reshuffle test, které explicitně
startovaly s prázdnou rukou hrajícího, dostaly výchozí kartu a posunuté délkové
asserce (+1). Žádný test tím neztratil zuby — naopak: dřív by řada `.toThrow()` testů
házela z „hra skončila" místo zamýšleného důvodu a tiše prošla. Test "funguje i pro AI"
dostal chybějící `currentPlayer: "ai"`.

## Ověření
- Zuby guardu ověřeny: s dočasně vyřazeným `assertTurn` (early return) spadlo všech 6
  nových guard testů; po vrácení zelené.
- `npm run build` (tsc --noEmit + vite build) zelený.
- Celá suite `npm test`: 380/380 prošlo, včetně E2E herní simulace (`simulation.test.ts`).
  Lint není v projektu nakonfigurován (statickou kontrolu dělá `tsc` v build).
- Nezávislý adversariální self-review (čerstvý kontext) bez reálného nálezu: potvrdil,
  že `game.ts` si všechny předpoklady hlídá sám před voláním enginu (guard je čistě
  defenzivní, žádná runtime regrese ani u řetězení es / výhry poslední kartou), pořadí
  kontrol je správné a guard mají všechny tři stav-měnící exporty.

## Pozn. (nit, neřešeno)
V `ai.test.ts` defaultuje `aiHand` stále na `[]` (ne placeholder) — neškodí, protože AI
je aktivní hráč a každý test si `aiHand` nastavuje explicitně; jen mírná asymetrie vůči
`playerHand`.
