# Adapt to Vendre fix: inactive customers are no longer signed in at registration

## What changed at Vendre
When a store requires manual approval, a new customer is created inactive. Before the fix the store briefly signed that customer in (they could e.g. change the cart) and then signed them out on the next page load. Now an inactive customer is never signed in.

## Impact on the storefront
- The "your account is waiting for approval" message keeps working. It becomes more reliable: the check that asks the store "is this visitor signed in?" after registration now always answers "no" for inactive accounts, so they can no longer be mistaken for active ones.
- Business customers awaiting approval: the company name is saved onto the address right after sign-up, which needs a signed-in session. For inactive accounts this now always fails (silently). The company name for those customers must be added later from My account, once approved.
- No other app code relies on the old short-lived sign-in.

## Changes
1. `src/lib/vendre/account.ts` (register):
   - Determine the status (explicit status from response, otherwise session context) before the company-address write.
   - Only run the company-address write when the status is "active"; skip it for "pending".
   - After a pending result, reset the session gate so the next call uses a fresh guest session (no leftover state from before the fix).
2. `.vendre/knowledge/api-reference.md` — "Account creation status": add a dated note (2026-09-30) that inactive accounts are no longer authenticated after `POST accounts`; `session/context.authenticated` is `false` for them; post-registration writes that need a session (address/company) are not possible until approval.
3. `.vendre/skills/account-auth.md` — update the company paragraph: the address write only applies to accounts that are active right away.

## Verification
Typecheck, then a live test if the store has manual approval switched on (register a business customer, confirm the pending message and no failed address request).
