# Adapt to Vendre's first_name / last_name rename

Vendre now uses `first_name` / `last_name` instead of `firstname` / `lastname` on account creation, the sign-up field list, profile editing and addresses.

## What breaks today
- **Sign-up form:** the store's field list now says `first_name`, which the form doesn't recognise. The first and last name fields would disappear from sign-up and account editing.
- **Sign-up and saving:** the store gets `firstname`/`lastname`, so creating an account, saving the profile and saving the company name on the address would fail or lose the name.
- **Reading names:** already works. The code reads both spellings.

## Changes
1. **Sign-up field list:** treat `first_name`/`last_name` from the store as the form's first and last name fields, with their visibility, required and length rules. The old spelling still works.
2. **Sending data:** send `first_name`/`last_name` when creating an account, updating the profile and saving the main address.
3. **Error messages:** when the store flags `first_name`/`last_name`, show the error under the right name field.
4. **Documentation:** update the API reference, account instructions and the reference examples to the new names, with a dated note about Vendre's change.
5. **Check:** read the store's live field list to confirm the new names. If allowed, create a test account and save a profile to confirm names are stored.

## Technical details
- `src/lib/vendre/account.ts`: alias map `{ first_name: "firstname", last_name: "lastname" }` in `normalizeRegisterConstraints`; `buildRegisterBody`, `buildAccountBody`, `addressBody` emit `first_name`/`last_name`; the 422 `source.parameter` mapping gets the same aliases. The form's own internal field names, types, mock and translations stay as they are.
- Docs: `.vendre/knowledge/api-reference.md`, `.vendre/skills/account-auth.md`, `customer-account/*` and `auth-sessions/*` references and `vendre-account.tsx` assets.
