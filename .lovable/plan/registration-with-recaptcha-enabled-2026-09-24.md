# Registration with reCAPTCHA enabled

## Current state
- The sign-up form sends no reCAPTCHA token. Neither the storefront nor the Surface v2 reference mentions captcha for `POST accounts`, only for the contact form.
- When the store rejects the sign-up, the form shows a generic error or none at all. That matches the testers' report.
- Not yet confirmed: exactly which error Vendre returns, which field name it expects for the token, and where the storefront can read the public reCAPTCHA site key (session context `configuration`, `accounts/form`, or neither).

## Steps
1. **Confirm against the live store** (with reCAPTCHA turned on in admin): send a sign-up and record the error code and message, and check whether session context or `accounts/form` exposes a site key or a "captcha required" flag.
2. **Always show a clear message:** if Vendre rejects the sign-up because of captcha, show "The store requires a security check (reCAPTCHA) that couldn't be completed. Please try again or contact the store." in Swedish and English, instead of a generic or missing error. This is done no matter what step 1 finds.
3. **Add reCAPTCHA to the form if the store exposes it:** load Google reCAPTCHA only when the store says it is required, get a token on submit, and send it with the sign-up in the field Vendre expects. The same helper can be reused for the contact form later.
4. **If Vendre exposes no site key or token field:** keep the clear error from step 2 and document the gap in `api-reference.md` and the account-auth skill. Vendre then needs to expose the site key and the accepted token field for Surface v2 sign-ups.

## Technical details
- `account.ts` `register`: map captcha-related error codes/titles (e.g. containing `CAPTCHA`/`RECAPTCHA`) to a typed error. `LoginPage.tsx` shows the new i18n key `account.captchaFailed`.
- Optional `src/lib/vendre/recaptcha.ts`: loads the script lazily in the browser only, and exposes `getRecaptchaToken(siteKey, action)`. The site key is public, so it is fine in the browser.
- The token goes through the existing proxy along with the sign-up. No secret keys reach the browser.
