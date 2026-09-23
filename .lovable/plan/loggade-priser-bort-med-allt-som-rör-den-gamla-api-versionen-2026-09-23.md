# Loggade priser: bort med allt som rör den gamla API-versionen

## Avstämning mot din butik (gjord nu)

- Nya adressen svarar korrekt: `GET /surface/2/products/price-log-prices?id[]=<id>` → 200 (tom lista för de testade produkterna, alltså inga loggade priser satta på dem just nu).
- Gamla adressen `/surface/1/products/price_log_prices` svarar nu 404 i din butik.

Slutsatsen är alltså att uppdateringen är på plats och att den gamla vägen inte längre behövs.

## Vad som ändras

Loggade priser finns bara som dokumentation i mallen – ingen kod, inget gränssnitt använder dem. Därför handlar städningen om dokumentationen:

1. `.vendre/skills/price-log.md` – ta bort stycket om den gamla versionen som "legacy/fallback". Kvar blir en ren beskrivning av den nya adressen, med noteringen att den är verifierad mot butiken 2026-09-23.
2. `.vendre/knowledge/api-reference.md`
   - §1.10: ta bort punkten "Legacy: /surface/1/products/price_log_prices …" och ersätt med en rad om att loggade priser enbart finns på v2.
   - §1.1: ta bort formuleringen om att loggade priser en gång var ett v1-anrop; behåll regeln att mallen enbart använder v2.
   - Rad 3: beskrivningen av dokumentet nämner båda versionerna – skriv om så den beskriver v2 som det mallen använder. Länken till OpenAPI-dokumentet (`GET /surface/1/openapi`) står kvar eftersom det är butikens faktiska adress för specifikationen och inte har med loggade priser att göra.

## Teknisk detalj

Inga kodfiler berörs; det finns ingen hjälpfunktion, hook, proxy-route eller UI för loggade priser i projektet. Verifiering skedde via den befintliga proxyn `/api/vendre/surface/*` med bootstrappad session.
