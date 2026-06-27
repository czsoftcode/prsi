# Nezavádět „šetření sedmy" pro AI (1v1 prší)

## Decision
AI pod nakupenými sedmami vždy zahraje vlastní sedmu (řetězí penaltu) a nikdy ji vědomě nešetří braním 2 karet. Feature z fáze 25 (shouldSaveSeven) byla implementována a vzápětí revertována; todo 12 je uzavřené jako zamítnuté.

## Why
Zvažovaná alternativa: heuristika, kdy AI místo zahrání sedmy vezme penaltu a sedmu si nechá „na pozdější útok". V 1v1 je ale tento tah dominovaný — zahrání sedmy znamená, že soupeř bere 2 (maximální zásah jedné sedmy), kdežto ušetření znamená, že AI sama bere 2 karty a tutéž sedmu zaútočí později za stejnou cenu: žádný zisk tempa, jen 2 karty navíc teď. Heuristika navíc nečetla stav soupeře, takže se spouštěla v běžné konfiguraci (pendingSevens=1, ruka >=4) a systematicky převracela vyhrávající interakci na prohrávající — to je nad rámec „záměrně hloupé" AI (ta dělá rovnoměrně suboptimální volby, ne cílené sebepoškození v jádrové mechanice). Strategické šetření sedmy má reálný obsah jen ve hrách 3+ (držet kartu na konkrétního soupeře), což je explicitní non-goal projektu.
