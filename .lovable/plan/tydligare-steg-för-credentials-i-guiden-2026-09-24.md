## Tydligare steg för credentials i guiden

Steg 2 ("Lägg in credentials") får en förklaring i tre delar:

1. **Var:** Värdena fylls i formuläret som visas här i chatten, inte i koden och inte som ett chattmeddelande.
2. **Om formuläret inte syns:** Skriv till exempel "lägg in credentials" i chatten så öppnas formuläret igen. Under texten finns en kopierbar rad med just den frasen.
3. **Vad värdena är:**
   - **VENDRE_BASE_URL**: adressen till din Vendre-butik, alltså den du använder för att logga in i Vendre Admin, utan `/Admin` på slutet. Exempel: `https://minbutik.vendre.io`. Den ska börja med `https://` och får inte sluta med snedstreck.
   - **CLIENT_ID** och **CLIENT_SECRET**: nycklarna från OAuth-klienten du skapade i steg 1.

Raden om att värdena bara används på servern står kvar. Kortraden "Lägg in tre värden under Secrets" ändras till "Lägg in tre värden i formuläret i chatten". Texten finns på svenska och engelska.

### Tekniska detaljer
- `src/lib/i18n.tsx`: uppdatera `step2.verdict`. Lägg till nycklarna `step2.where`, `step2.reopen`, `step2.reopenPrompt`, `step2.baseUrl` och `step2.clientKeys` (sv + en).
- `src/components/vendre/setup-wizard.tsx`: i steg 2 läggs `where` och `reopen` till, med en `CopyButton`-rad för `reopenPrompt`. I nyckellistan får varje post en kort förklaring (`baseUrl` för VENDRE_BASE_URL, `clientKeys` för de två andra).
