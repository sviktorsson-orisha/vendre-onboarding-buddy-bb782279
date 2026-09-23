---
name: vendre-remove-setup-guide
description: Run when the user says the store is finished and wants the onboarding/setup guide gone — "remove the setup guide", "hide onboarding", "ta bort guiden", "butiken är klar". Removes the setup notice bar, the guide dialog and its progress tracking, while keeping the credentials form, the demo/live status resolver and the connection test.
---

# Remove the Vendre setup guide

Use this when the store is connected and the owner is done onboarding. This is the
inverse of `.vendre/skills/setup.md`. Read `AGENTS.md` section 0 together with this
file so a finished store is never re-onboarded automatically.

The credentials themselves are NOT touched. The secrets form for
`VENDRE_BASE_URL`, `VENDRE_CLIENT_ID` and `VENDRE_CLIENT_SECRET` is opened on request
with the secrets tools (`update_secret` for existing values, `add_secret` for missing
ones) and never depends on the guide UI.

## Remove

- `src/components/vendre/setup-notice-bar.tsx` — the top banner.
- `src/components/vendre/setup-wizard.tsx` — the guide dialog.
- `src/components/vendre/publish-origin-field.tsx` — guide-only helper.
- `src/lib/vendre/setup-progress.ts` and `src/lib/vendre/setup-progress.server.ts`.
- `src/routes/api/vendre/setup-progress.ts` — the progress endpoint.
- The `<SetupNoticeBar />` render and its import in `src/components/store/store-shell.tsx`.
- Guide-only strings in `src/lib/i18n.tsx` (keys used only by the removed components).

The Cloud table `public.vendre_setup_progress` can stay; it is unused after this and
dropping it is optional. Do not delete the migration file.

## Keep

- `src/routes/api/vendre/status.ts` and `src/lib/vendre/status.functions.ts` — the
  server-resolved storefront status.
- `src/routes/__root.tsx` keeps `getStorefrontStatus` plus `setServerConfigured` and
  `setServerVerified`. Demo data vs. live store must behave exactly as before.
- `src/context/onboarding-context.tsx` stays as the demo/live switch. After removal
  only `guideDismissed`, `markConfigured` and `reset` are unused and may be trimmed;
  `isConfigured` / `mode` must remain.
- `src/lib/vendre/test-connection.ts` — the connection can still be verified on demand.
- The proxy in `src/routes/api/vendre/surface/$.ts` and everything under
  `src/lib/vendre/` that serves the storefront.

## After the change

1. `rg -n "setup-notice-bar|setup-wizard|setup-progress|publish-origin-field" src`
   returns nothing.
2. The storefront loads with no banner and still shows live products.
3. Typecheck and build pass.

## Bringing the guide back

Revert the change from the project history (History tab or the revert button on the
message), or re-run `.vendre/skills/setup.md` for a fresh onboarding flow.
