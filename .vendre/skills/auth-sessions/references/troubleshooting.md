# Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Refreshing the page signs the user out | Session cookie is `SameSite=Lax` (dropped in the preview iframe) or written by a non-bootstrap call | `SameSite=None; Secure; Partitioned; HttpOnly`; only bootstrap establishes the cookie |
| User logs in, then gets logged out a second later | Concurrent page-load calls each minted a session and overwrote the cookie | Guard non-bootstrap writes with `if (incoming)`; add the ready-gate |
| Sign-in form does nothing | Submitted before bootstrap resolved, or login body used `email_address` | Disable the button until ready; use `email` |
| `401 SURFACE_SESSION_UNAUTHORIZED` | No session cookie sent, or session expired | Return 401 softly, throttled re-bootstrap, retry once |
| `422 SURFACE_ACCOUNT_MALFORMED_BODY` | Missing required registration fields | Send the full field set incl. `gender`, `telephone`, `personnummer`, `state`, numeric `country` |
| Generic browser CORS error on `/surface/2/accounts*` | Origin not allowlisted; those endpoints use the `default` policy (not `customer`) | Add the exact origin (scheme + host, no trailing slash) under Admin → Headless → CORS (`/Admin/configuration?gID=232`), or rely on the server-proxy fallback |
| Gateway 401 shows as a CORS error | Invalid-bearer 401s may carry no CORS headers (session-gate 401s include them since 2026-09-30) | Check the bearer token / session gate, not CORS config |
| `useAccount must be used inside <AccountProvider>` | The provider module was imported both relatively and via `@/lib/...`, creating two module instances | Use the `@/lib/...` alias everywhere |
| `429` | Rate limited | Read `RateLimit-Reset` / `Retry-After`, exponential backoff |
| `client_secret` visible in a network tab | OAuth called from the browser | Move to the server proxy; secret only in server env |

## Preview vs published origins

Lovable preview (`*.lovableproject.com`, `*.lovable.app` preview subdomain) and
the published domain are different origins. Allowlisting the published domain
does not allowlist previews. The direct-to-store path will fail in preview and
fall back to the proxy — expected, and it must be silent.

## Quick connectivity check

```bash
curl -s -X POST "$VENDRE_BASE_URL/surface/2/oauth/token" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "grant_type=client_credentials&client_id=$VENDRE_CLIENT_ID&client_secret=$VENDRE_CLIENT_SECRET"
```

Then bootstrap with the returned bearer to confirm the session gate works
before debugging any app code.
