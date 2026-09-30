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

## 2. Varukorgen hämtas om vid varje sidbyte
Varukorgen är inställd på "aldrig cacha", så ikonen i headern gör ett nytt anrop vid varje navigering inom butiken – även om inget ändrats.

Risk med annan enhet: om kunden ändrar varukorgen på mobilen och sedan går tillbaka till datorn kan den sparade varukorgen vara inaktuell. Därför behålls de tillfällen då en ändring utifrån faktiskt kan ha skett:
- **När kunden kommer tillbaka till fliken/fönstret** – hämtas om (ändringar från annan enhet syns direkt).
- **När varukorgspanelen öppnas** – hämtas alltid om.
- **Efter varje egen ändring** – som idag.
- **Före kassan** – som idag; butikens aktuella varukorg läses alltid innan kunden skickas vidare, så fel order kan aldrig nå kassan.
- **Efter en tidsgräns** (t.ex. 30 sekunder) – hämtas om vid nästa sidbyte.

Det som tas bort är bara omhämtningen vid varje sidbyte inom samma flik några sekunder efter förra hämtningen. Kassaflödet lämnas orört.

Obs: detta justerar regeln "cacha aldrig varukorgen" i projektets skill-filer till "färsk vid visning, fokus, ändring och kassa – inte vid varje sidbyte".

## 3. Bilder i rätt storlek och modernt format
Bilderna hämtas i originalstorlek via vår proxy – en liten miniatyr i varukorgen eller sökförslagen laddar samma stora fil som produktsidan. Åtgärd: be om rätt storlek per plats (miniatyr, produktkort, produktsida), ange `width/height` för att undvika hopp i layouten, och låt proxyn leverera WebP när Vendre/bildtjänsten stödjer det. Första steget blir att kontrollera vilka storleks-/formatparametrar Vendres bildadresser stödjer.

## Lägre prioritet (senare)
- Städning av oanvända filer (t.ex. dubblerade exempelfiler i skills-mapparna, gammal `src/pages`-struktur) och död kod.
- Ladda setup-guiden först när den öppnas, eftersom den är stor och inte behövs för besökare.

## Tekniska detaljer
- `useSessionContext` (src/lib/vendre/api.ts): `staleTime: 0, gcTime: 0` → längre staleTime, `refetchOnWindowFocus: false`, explicit `invalidateQueries` i login/logout/re-bootstrap.
- `useCart`: `staleTime: 30s`, ta bort `gcTime: 0`, behåll `refetchOnWindowFocus: "always"`; `refetch` vid öppning av CartSheet. `useCartMutations` och `goToCheckout` oförändrade.
- `QueryClient` i src/router.tsx saknar standardinställningar – lägg till rimliga defaults (`refetchOnWindowFocus: false`, `retry: 1`).
- Bilder: utöka `resolveImageUrl`/`StoreImage` med storleksvariant; proxyn skickar vidare `Accept` för WebP.
- Uppdatera `.vendre/skills/caching.md` och `cart-sync.md` så reglerna matchar.

Förslag: börja med punkt 1 – störst minskning av anrop och lägst risk.
