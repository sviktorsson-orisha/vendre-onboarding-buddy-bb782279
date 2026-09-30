# Update docs for Vendre's CORS change

## Impact on the store
None. All store traffic goes through our own server to `/surface/2/*`, so the browser never makes cross-origin calls to Vendre, and the app code never calls `/surface/1/*`. No code changes are needed.

## Documentation updates
1. `.vendre/knowledge/api-reference.md`
   - v1 section (around line 20/49): `/surface/1/*` is same-origin only. Cross-origin OPTIONS/GET/POST return `403 cors_not_supported` with no CORS headers. Browser clients must use v2.
   - Line 5: the OpenAPI document at `/surface/1/openapi` can only be read same-origin or server-side.
   - Line 513 (old "gateway 401 carries no CORS headers"): replace it. Early OAuth and session-gate 401s now carry CORS headers for any origin listed anywhere in `SURFACE_CORS_ORIGINS`/`SURFACE_CORS_POLICIES`, even if that origin isn't set up for the specific endpoint's policy. Unconfigured origins still get no headers, so they show up as generic CORS errors.
   - Update the 2026-09-30 section at line 557 the same way, and add a new dated section on v1 blocking, v2 gateway CORS and the hardened origin comparison (effective host and scheme).
2. `.vendre/knowledge/general.md` line 21, and these troubleshooting tables: `store-troubleshooting.md`, `category-plp.md`, `customer-account/references/troubleshooting.md` and `auth-sessions/references/troubleshooting.md`. Change "invalid-bearer 401s may lack CORS headers" to: "Gateway 401s carry CORS headers when the origin is configured. A bare CORS error now means the origin isn't allowlisted." In `store-troubleshooting.md`, also add a row: "403 `cors_not_supported` → calling v1 cross-origin; use v2."
3. `surface-v2.md` and `architecture-bootstrap.md`: "Never v1" now gets a short reason: v1 rejects cross-origin requests with 403.

## Verification
Search the docs for any wording left over from the old behaviour. No build or runtime check is needed because no code changes.
