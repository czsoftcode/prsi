# Review findings

> Recorded by `mini findings add` (the adversarial and verify review steps).
> Each entry is `## <id> · <severity> · <status>`; do not hand-edit those header
> lines.

## 25-1 · should-know · resolved
**Where:** src/engine/ai.ts:55-67
**Reviewed-at:** 650e4b0368b2587e92e330460a4ed305e3b384fd
**Source:** adversarial
**Reason:** Feature kompletně revertována — v 1v1 prší je šetření sedmy dominovaný tah bez payoffu (ušetření = AI sama bere 2 a sedmu může zaútočit později za stejnou cenu; žádný zisk tempa). Heuristika netvořila strategii, jen systematicky oslabovala AI v sedmovém souboji.
shouldSaveSeven šetří sedmu naslepo bez podmínky výplaty → pravděpodobně zhoršuje AI

Heuristika rozhodne o ušetření sedmy jen z velikosti penalty a vlastní ruky; vůbec nečte stav soupeře (state.playerHand). Ušetření = AI VEZME 2 karty a předá tah, přičemž sedmu, kterou si nechává, mohla TEĎ zahrát a těm 2 kartám se vyhnout. Konkrétní scénář: soupeř má 7 karet, AI má 4 (vč. jedné sedmy), pendingSevens=1 → AI si zbytečně nabere na 6 karet, vzdálí se výhře a soupeř hraje volně. Bez kritéria 'kdy se šetření vyplatí' (např. soupeř má málo karet / endgame) je tah ve většině stavů dominovaný — ztráta tempa i karet. E2E simulace tuto větev neaktivovala (report: 'ustála beze změny'), takže neexistuje důkaz, že feature AI pomáhá, spíš ji oslabuje.

## 25-2 · nit · resolved
**Where:** src/engine/ai.ts:40-43
**Reviewed-at:** 650e4b0368b2587e92e330460a4ed305e3b384fd
**Source:** adversarial
**Reason:** Zaniká revertem feature (shouldSaveSeven odstraněn).
Zavádějící komentář u SAVE_SEVEN_MIN_HAND (zdůvodnění z play-cesty, ne save-cesty)

Komentář práh zdůvodňuje větou 'práh >=2 zaručuje, že ušetřená sedma nikdy není poslední karta (při ruce >=4 a zahrání sedmy zbývají >=3 karty)'. Jenže ve větvi šetření se sedma nikdy nehraje — AI líže, ruka roste na 6, takže 'poslední karta' je triviálně vyloučena. Komentář mísí úvahu o zahrání sedmy (jiná cesta) s cestou šetření; pro čtenáře matoucí. Hodnota prahu fajn, jen odůvodnění nesedí.

## 25-3 · nit · resolved
**Where:** src/engine/ai.ts:140
**Reviewed-at:** 650e4b0368b2587e92e330460a4ed305e3b384fd
**Source:** adversarial
**Reason:** Zaniká revertem feature (shouldSaveSeven odstraněn).
Redundantní guard pendingSevens>0 před shouldSaveSeven

Podmínka 'state.pendingSevens > 0 && shouldSaveSeven(state)': shouldSaveSeven vrací false pro cokoliv jiného než pendingSevens===1, takže prefix 'pendingSevens > 0 &&' nikdy nezmění výsledek. Neškodí, ale je nadbytečný; buď ho zahodit, nebo nechat čistě shouldSaveSeven(state). Bez testovacího/funkčního dopadu.
