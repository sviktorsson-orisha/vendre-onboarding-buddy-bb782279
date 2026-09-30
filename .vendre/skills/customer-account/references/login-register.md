# Login and registration

## Login

`POST /surface/2/login/email` with the mutation-token header.

```json
{ "email": "user@example.com", "password": "..." }
```

The key is `email`. Using `email_address` here silently fails — that key belongs
to the *registration* payload only.

After a 200:

```ts
setMutationToken(res.body.mutationProtectionToken ?? currentToken);
await refreshSession();                 // GET /surface/2/session/context
queryClient.setQueryData(ACCOUNT_QUERY_KEY, normalizeAccount(account));
```

Priming the cache manually avoids a race where the account query refetches
before the new session cookie is visible and flips the UI back to signed-out.

## Registration

`POST /surface/2/accounts` with the mutation-token header. A Swedish B2C store
typically requires all of these — omitting any yields
`422 SURFACE_ACCOUNT_MALFORMED_BODY`:

```json
{
  "gender": "m",
  "first_name": "Test",
  "last_name": "Testsson",
  "email_address": "test@example.com",
  "telephone": "0701234567",
  "street_address": "Testgatan 1",
  "postcode": "12345",
  "city": "Stockholm",
  "state": "Stockholm",
  "country": 203,
  "personnummer": "199001011234",
  "password": "...",
  "newsletter": false
}
```

`country` is a numeric country id (203 = Sweden), not an ISO code.
Optional B2B fields: `company`, `vat_identification_number`.

After registration, log the user in with the same credentials (registration
does not always authenticate the session) and then refresh the session.

## Error surfacing

Parse the standard envelope into a typed error so forms can show real messages:

```ts
// { "errors": [{ "code": "...", "status": "...", "public": true, "title": "..." }] }
export class VendreApiError extends Error {
  constructor(public status: number, public errors: SurfaceError[]) {
    super(errors.map((e) => e.title).join(" ") || `Vendre request failed [${status}]`);
  }
}
```

Show `error.message` under the form. Never show a raw JSON blob.

## Logout

`POST /surface/2/logout` with the mutation token → store the returned
`mutationProtectionToken` → `refreshSession()` → `queryClient.removeQueries`
for all account keys.

## UI states

Buttons need three states: idle, "Connecting…" while the session is still
bootstrapping (disabled), and submitting. Submitting before the ready-gate
resolves is the most common source of "nothing happens when I click sign in".
