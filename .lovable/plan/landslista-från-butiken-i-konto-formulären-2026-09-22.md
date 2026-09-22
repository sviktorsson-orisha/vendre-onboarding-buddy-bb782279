# Landslista från butiken i konto­formulären

## Vad jag har verifierat mot butiken

Butikens sessionssvar innehåller nu en komplett landslista: 247 länder med `id`, `code` och `name` (t.ex. Sweden = 752, Norway = 578, Denmark = 208, Finland = 246, Germany = 276).

Den fasta listan i koden idag har fel id:n — den skickar 203 för Sverige, medan butikens eget id är 752. Alla konton som registrerats hittills har alltså fått fel land.

## Vad som ändras

- Landsvalet vid **registrering** och **Redigera konto** fylls med butikens riktiga landslista i stället för de fem fasta alternativen.
- Länderna visas med butikens namn, sorterade i bokstavsordning, och Sverige förvalt när det finns i listan (annars första landet).
- Den felaktiga fasta listan tas bort. Om butiken av någon anledning inte skickar länder används en liten reservlista med korrekta id:n, så formuläret aldrig blir tomt.
- Demoläget (utan ansluten butik) får samma reservlista så att fältet fungerar där också.

## Tekniska detaljer

- `src/types/vendre.ts`: `SessionContext` får `countries?: { id: number; code: string; name: string }[]`.
- `src/lib/vendre/account.ts`: `COUNTRY_IDS`/`COUNTRY_OPTIONS` ersätts av korrekta ISO-numeriska fallback-värden (SE 752, NO 578, DK 208, FI 246, DE 276) plus en `useCountryOptions()`-hook som läser `useSessionContext().countries`, sorterar på namn och faller tillbaka på listan. `countryId()` fortsätter översätta landskod → id via samma källa.
- `src/pages/LoginPage.tsx` och `src/pages/AccountPage.tsx`: select-fälten renderar `useCountryOptions()`; defaultvärdet i registreringsformuläret sätts från listan (Sverige) i stället för hårdkodad 203.
- `src/mock/vendreResponses.ts`: mocksessionen får samma `countries`-lista.
- Dokumentation: `.vendre/knowledge/api-reference.md` och `.vendre/skills/session-context.md` noterar att `session/context` levererar `countries` och att `country_id` hämtas därifrån.
- Verifiering: `tsgo --noEmit`, build, samt ett live-test av registrering och kontosparning med land från listan.
