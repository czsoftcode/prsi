# Změna úrovně AI se uplatní okamžitě, ne od nové partie

## Decision
Přepnutí úrovně obtížnosti tlačítkem mění chování AI okamžitě — advanceAi čte aktuální getAiLevel() při každém tahu AI. Žádný snapshot úrovně při rozdání nové partie.

## Why
Zvažovaná alternativa: zamrznout úroveň při newGame(), aby změna uprostřed partie neovlivnila běžící hru (původní znění cíle fáze). Zamítnuto: přidává stav a kód (snapshot úrovně) navíc a hlavně vytváří UX past — uživatel (cílovka 6+) klikne na obtížnost během hry, nic se viditelně nestane a nechápe proč. Okamžitá aplikace je jednodušší a srozumitelnější; riziko zlehčení rozehrané partie je u hry pro děti zanedbatelné.
