# Prestandaanalys: 3 prioriterade refaktoreringar

Analysen utgår från hur butiken hämtar data idag. Viktigt: flera av tipsen i bakgrunden finns **redan**:
- Sökfältet har redan debounce (250 ms) och anropar först från 3 tecken.
- Vendre-logiken ligger redan i egna hooks (`useCart`, `useProduct`, `useCategory`, `useProductSearch` m.fl.).
- Produktbilder har redan `loading="lazy"`, och bildproxyn cachar i 1 dag.
- Menyer, kategorier, produkter och CMS cachas redan i 5–10 minuter.

De verkliga vinsterna finns därför på andra ställen:

## 1. Sessionen hämtas om alldeles för ofta (högst prioritet)
Sessionsinfo (butiksnamn, logga, språk, valuta, landslista) läses från ungefär 10 ställen och är inställd på "aldrig cacha". Resultatet: ett nytt anrop till Vendre varje gång en del av sidan visas, vid varje sidbyte och varje gång kunden byter tillbaka till fliken.

Åtgärd: dela ett enda sessionssvar i hela appen och hämta om det bara när något faktiskt ändras (inloggning, utloggning, framtida valuta-/språkbyte) eller vid 401. Butiksnamn, logga och landslista ändras nästan aldrig under ett besök.

Påverkar inte affärslogik: samma data, färre anrop.

## 2. Varukorgen hämtas om vid varje sidbyte och flikbyte
Varukorgen är inställd på "aldrig cacha", så ikonen i headern gör ett nytt anrop vid varje navigering och varje gång fönstret får fokus – även om inget ändrats. Efter varje ändring (lägg till, ändra antal, ta bort) läses varukorgen redan in på nytt från butiken, så appen vet alltid när något har ändrats.

Åtgärd: behåll varukorgen i minnet mellan sidbyten, hämta om den när varukorgspanelen öppnas, efter varje ändring (som idag) och före kassan (som idag). Kassaflödet och "läs butikens sanning innan kassan" lämnas orört.

Obs: detta avviker medvetet från nuvarande regel "cacha aldrig varukorgen" i projektets skill-filer – reglen ändras till "färsk vid visning och efter ändring, inte vid varje sidbyte". Kräver ditt godkännande.

## 3. Bilder i rätt storlek och modernt format
Bilderna hämtas i originalstorlek via vår proxy – en liten miniatyr i varukorgen eller sökförslagen laddar samma stora fil som produktsidan. Åtgärd: be om rätt storlek per plats (miniatyr, produktkort, produktsida), ange `width/height` för att undvika hopp i layouten, och låt proxyn leverera WebP när Vendre/bildtjänsten stödjer det. Första steget blir att kontrollera vilka storleks-/formatparametrar Vendres bildadresser stödjer.

## Lägre prioritet (senare)
- Städning av oanvända filer (t.ex. dubblerade exempelfiler i skills-mapparna, gammal `src/pages`-struktur) och död kod.
- Ladda setup-guiden först när den öppnas, eftersom den är stor och inte behövs för besökare.

## Tekniska detaljer
- `useSessionContext` (src/lib/vendre/api.ts): `staleTime: 0, gcTime: 0` → längre staleTime, `refetchOnWindowFocus: false`, explicit `invalidateQueries` i login/logout/re-bootstrap.
- `useCart`: behåll `staleTime: 0` men ta bort `gcTime: 0` och `refetchOnWindowFocus`; `refetch` vid öppning av CartSheet. `useCartMutations` och `goToCheckout` oförändrade.
- `QueryClient` i src/router.tsx saknar standardinställningar – lägg till rimliga defaults (`refetchOnWindowFocus: false`, `retry: 1`).
- Bilder: utöka `resolveImageUrl`/`StoreImage` med storleksvariant; proxyn skickar vidare `Accept` för WebP.
- Uppdatera `.vendre/skills/caching.md` och `cart-sync.md` så reglerna matchar.

Förslag: börja med punkt 1 – störst minskning av anrop och lägst risk.
