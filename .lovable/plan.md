# Translate hard-coded Swedish text to English

Only human-readable text changes. No logic, no keys, no URLs, no API field names.

## What gets translated
1. **Connection test** (`src/lib/vendre/test-connection.ts`) — all step labels and detail messages (e.g. "Läsrättigheter" -> "Read permissions", "Saknade secrets" -> "Missing secrets").
2. **API error messages** — Swedish error titles in `src/lib/vendre/client.ts` and the proxy route `src/routes/api/vendre/surface/$.ts` (e.g. "Butiken svarar inte just nu." -> "The store is not responding right now."). Error `code` values stay unchanged.
3. **Page titles and SEO descriptions** — `head()` metadata in the routes: index, kategori, produkt, sida, sok, logga-in, mitt-konto (all three files).
4. **Remaining Swedish lines** in `.vendre/skills/remove-setup-guide.md` (except any prompt text that must match the guide's copy button).

## What stays Swedish (affects logic or is intentional)
- URL paths/route filenames (`/kategori`, `/logga-in`, `/mitt-konto`, `/sok`, `/produkt`, `/sida`) — renaming would break links.
- Vendre API field `personnummer`.
- The Swedish translation dictionary in `src/lib/i18n.tsx` (the store's Swedish language option).
- Demo data in `src/mock/*` — represents a Swedish demo store's content (can be translated too if you want; say so).

## Verification
Re-scan for Swedish characters afterwards and confirm the build is clean; run the connection test in the guide to confirm messages show in English.
