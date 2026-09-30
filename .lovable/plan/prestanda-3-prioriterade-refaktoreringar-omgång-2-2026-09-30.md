# Prestanda: 3 prioriterade refaktoreringar (omgång 2)

## Nuläge (redan på plats)

- Sökfältet väntar redan 250 ms efter sista tangenttryckningen och söker först från 3 tecken.
- Produktbilder laddas redan "vid behov" (lazy) och i mindre storlek. WebP stöds inte av butiken än.
- Varukorg och sessionsinfo hämtas inte längre vid varje sidbyte (tidigare steg 1–2).
- UI-filerna anropar inte Vendre direkt; all logik ligger redan i egna hooks (19 st).

Därför föreslås nedan tre saker som faktiskt återstår. Ingen affärslogik ändras.

VIKTIGT: genomför endast punkt 1 nu! Låt punkt 2 och 3 vara

## 1. Avbryt föråldrade sökningar + cacha sökförslag (färre API-anrop)

- När kunden skriver vidare avbryts den pågående sökningen i stället för att köras klart.
- Samma sökord inom några minuter hämtas från cache, inte från butiken igen.
- Förslagen börjar inte hämtas förrän sökrutan har fokus.

## 2. Ladda sidor och tunga delar först när de behövs (snabbare första visning)

- Kontosidorna, inloggningssidan, setup-guiden och varukorgspanelen laddas separat, först när de öppnas.
- Produkter/kategorier förhämtas när kunden håller muspekaren över en länk, så nästa sida känns direkt.

## 3. Städa bort oanvänd kod

- 35 oanvända standardkomponenter tas bort (t.ex. kalender, diagram, sidomeny, karusell).
- Oanvända paket som bara de använde avinstalleras.
- De två stora Vendre-filerna (ca 1 200 rader var) delas upp per område (produkter, varukorg, session, konto) utan att koden ändras — lättare att underhålla.

## Tekniska detaljer

1. `useProductSearch`: skicka React Query `signal` till fetch (AbortController), `staleTime` 5 min, `enabled` kopplat till fokus.
2. Router: `autoCodeSplitting` / `.lazy`-komponenter för `mitt-konto*`, `logga-in`; `React.lazy` för `setup-wizard` och `cart-sheet`; `defaultPreload: "intent"` med loader-`ensureQueryData` så cache återanvänds.
3. Ta bort filer i `src/components/ui/` utan importer (verifierat med sökning); `bun remove` av tillhörande Radix/recharts/embla/date-fns m.fl. efter kontroll. Dela `lib/vendre/api.ts` och `account.ts` i moduler med re-export från `lib/vendre/index.ts` så inga importer bryts.

- Verifiering: build, samt testbrowser som räknar nätverksanrop vid sök och sidbyte före/efter.

Börja med att genomföra punkt 1