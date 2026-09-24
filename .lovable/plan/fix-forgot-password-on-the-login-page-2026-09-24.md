# Fix "Forgot password" on the login page

## What is happening
The button does send the request to Vendre, but Vendre rejects it every time with "Customer is not authenticated" (401). The only password reset endpoint in Surface v2 (`GET accounts/me/forgot-password`) sits under `accounts/me`, so the store requires the customer to already be logged in, which makes it useless on the login page. The page still shows "email sent" regardless, so it looks like nothing happens.

Getting the email sent needs a change on Vendre's side (let this endpoint work for logged-out customers, or add a public one). The storefront can't work around this.

## What changes in the storefront
1. **Honest feedback:** show "check your email" only when Vendre actually confirms the request. If it fails, show a clear error ("Password reset isn't available right now, please contact the store") in Swedish/English.
2. **Email required:** if the email field is empty, ask the customer to enter their email first instead of sending an empty request (one of the logged requests had no email).
3. **Loading state:** disable the link while the request is running.
4. **No re-bootstrap loop:** this 401 is expected, so it must not trigger the session reset logic.
5. **Documentation:** note in `api-reference.md` and the account-auth skill that the endpoint currently returns 401 for guests. As soon as Vendre allows it, the new flow works without code changes.

## Technical details
- `LoginPage.tsx`: replace fire-and-forget `mutateAsync().catch()` with awaited mutation; states `idle | sending | sent | error`; validate email.
- `account.ts` `forgotPassword`: call without `guarded()` re-bootstrap on `SURFACE_SESSION_UNAUTHORIZED`, rethrow a typed error.
- i18n keys: `account.forgotNeedEmail`, `account.forgotFailed`.
