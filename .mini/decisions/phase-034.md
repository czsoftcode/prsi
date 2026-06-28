# Slabá AI „dítě" deterministicky, ne přes seedovaný RNG

## Decision
Úroveň „dítě" je slabá deterministicky — obrácená priorita výběru karty (pickWeak: zahazuje svršek/obyčejné dřív, útočné karty drží). Žádný Math.random ani injektovaný seedovaný RNG; engine zůstává čistá funkce stavu.

## Why
Zvažovaná alternativa: dělat „dítě" náhodným výběrem z hratelných karet (přirozeně působící slabý hráč). Zamítnuto, protože náhoda by prolomila determinismus enginu, na kterém stojí reprodukovatelnost testů i E2E simulace — buď by testy AI musely seedovaný RNG injektovat a ověřovat konkrétní seed (křehké, váže test na interní pořadí volání RNG), nebo by se „dítě" testovat nedalo vůbec. Deterministická slabost je testovatelná porovnáním proti „dospělému" ve stejném stavu; cenou je předvídatelnější soupeř, což u úrovně pro začátečníky nevadí.
