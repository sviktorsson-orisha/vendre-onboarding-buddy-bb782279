## CORS-länken blir en knapp

I steget "Konfigurera CORS" byts den lilla länktexten (`/Admin/headless/cors`) ut mot en tydlig knapp: **"Öppna CORS-inställningarna"** / **"Open CORS settings"**. Knappen har en ikon som visar att den öppnas i en ny flik och leder direkt till butikens CORS-sida i Vendre Admin.

Om butiksadressen inte är sparad än visas knappen inaktiverad, med en kort text om att den blir klickbar när credentials är sparade.

### Tekniska detaljer
- `src/components/vendre/setup-wizard.tsx`: ny liten komponent `AdminButton` (en `<a>` med klassen `brand-button`, target _blank, med `ExternalLink`-ikon; inaktiverad `<button>` när `baseUrl` saknas). Den ersätter `AdminLink` i steg 4. Steg 1 lämnas som det är.
- `src/lib/i18n.tsx`: nya nycklar `step4.openCors` och `step4.openCorsDisabled` (sv + en).
