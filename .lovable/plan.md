# Document Surface audit logging and session CORS headers

## Finding
The storefront isn't affected. Every Vendre call already goes through our own server, so the browser never sees Vendre's CORS headers, and audit logging only happens inside Vendre. No app code change is needed. The docs do need updating: several of them say Vendre's session 401 errors carry no CORS headers, and that's now only partly true.

## Changes (documentation only)
1. `.vendre/knowledge/api-reference.md`: add a short dated note (2026-09-30):
   - Session-related Surface responses, including session-gate 401s, now include CORS headers. Invalid-bearer 401s may still lack them.
   - Surface API activity is recorded in a Vendre audit log, viewable in Admin at `/Admin/headless/audit/logs/browse` (filters, sorting, max 200 per page, live table only). Archiving is off by default (`SURFACE_AUDIT_ARCHIVE_ENABLED`). This is useful for troubleshooting.
2. `.vendre/skills/store-troubleshooting.md`: update the "generic CORS error" row to match, and add a row pointing to the audit log page for tracing failed requests.
3. Update the same 401/CORS statement to match in `general.md`, `category-plp.md`, `customer-account/references/troubleshooting.md` and `auth-sessions/references/troubleshooting.md`.
4. Optional: add an "Open audit log" link next to the CORS button in the setup guide? Left out unless you want it.
