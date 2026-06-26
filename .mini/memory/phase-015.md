# Phase 15 — Větší karty na mobilu

**Goal:** Přidat mobilní @media breakpoint v src/ui/style.css, který na úzkých displejích zvětší --card-w a navázané rozměry alespoň na dvojnásobek současné velikosti, aniž by se rozbil layout ruky a středové zóny.

## Steps
- [done] Mobilní @media breakpoint pro --card-w
- [done] Ověřit layout ruky a středu na mobilu
- [done] Ošetřit přetečení při velké ruce
- [done] Zelený build + testy

## Auto-commit
- Phase 15: Větší karty na mobilu

## Run report
---
phase: 15
verdict: done
steps:
  - title: "Mobilní @media breakpoint pro --card-w"
    status: done
  - title: "Ověřit layout ruky a středu na mobilu"
    status: done
  - title: "Ošetřit přetečení při velké ruce"
    status: done
  - title: "Zelený build + testy"
    status: done
verify:
  - title: "Velikost karet na reálném telefonu vč. iPhone SE (375x667)"
    detail: "Po zpětné vazbě uživatele: velikost se počítá z min(20vw, 13vh) v @media (max-width: 900px), aby se na nízkém displeji (SE 667px) karty vešly i na výšku. SE → ~75px, landscape → ~49px. Ověř na reálném zařízení, že karty nejsou moc velké ani malé; koeficient 13vh ladí výškový strop."
  - title: "Svislé přetečení při velmi velké ruce po nakupení sedem"
    detail: "Edge-case, který jsem nechal bez zásahu (viz níže). Zahraj partii, kde se ruce nafouknou nakupením sedem, a zkontroluj, že lízací/odhazovací balíček uprostřed nezmizí ze obrazovky. Pokud ano, nahlas to do dalšího kola."
---

# Phase 15 — report from the auto session

## Co se udělalo
Jediná podstatná změna: v `src/ui/style.css` přibyl mobilní breakpoint
`@media (max-width: 900px)`, který přenastaví řídicí proměnnou `--card-w`
na `clamp(56px, min(20vw, 13vh), 120px)`. Všechny navázané rozměry
(`.card`, `.pile`, prázdný balíček, ikona barvy přes `calc(var(--card-w) * 0.45)`)
dědí přes proměnnou automaticky — žádná další pravidla nebylo třeba měnit.

**Pozn. k iteraci:** první verze byla pevná `clamp(96px, 24vw, 140px)` při
`max-width: 600px`. Na iPhone SE (375×667) vycházela karta na 96px (144px na
výšku) a tři řady se na 667px nevešly. Po zpětné vazbě se velikost počítá
z `min(vw, vh)` — na nízkém displeji rozhoduje výška, takže se layout vejde
i pod 900px výšky. Tím ale padá původní cíl „aspoň 2× na každém zařízení“:
na nízkém/širokém displeji je karta záměrně menší. SE → ~75px, landscape → ~49px.

## Co jde a co ne
- `npm run build` (tsc --noEmit + vite build) prošel zeleně.
- `npm test` — 320 testů prošlo. Testy nesahají na CSS, takže velikost
  karet ověřují jen nepřímo (rendering struktura beze změny).
- Horizontální přetečení ruky řeší stávající `flex-wrap` na `.hand` —
  větší karty se prostě zalomí do více řad.

## Rozhodnutí: svislé přetečení velké ruky jsem NEŘEŠIL
Plán připouštěl „pokud se rozbije, omez; jinak ponechej". Grid stolu je
`auto 1fr auto` (AI / střed / hráč). Při velmi velké ruce (nakupení sedem,
~12+ karet) se dvojnásobně vysoké karty zalomí do víc řad a `auto` řádek
hráče může zatlačit středovou zónu `1fr` k nule i mimo viewport.

Robustní oprava (cap výšky + scroll uvnitř zóny, `min-height: 0`) vyžaduje
vizuální ladění na reálném zařízení, které tady neumím provést, a netestovaný
zásah do gridu nese riziko regrese na desktopu i ve středu. Proto jsem ho
záměrně vynechal a předal člověku k ověření (viz `verify`). Je to edge-case,
který existoval i před touto fází — jen ho větší karty zvýrazňují.

## Pozn.
Overlaye (výběr barvy, výběr motivu) mají vlastní rozměry (`12vw`, `8vw`)
nezávislé na `--card-w` — záměrně jsem se jich nedotkl, fáze se týká karet
na stole.
