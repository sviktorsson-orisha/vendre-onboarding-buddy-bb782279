# Skill: remove the setup guide when the store is finished

Add one new documentation file, `.vendre/skills/remove-setup-guide.md`, that tells the
assistant exactly how to strip the onboarding guide out of a finished store — while
keeping the ability to open the credentials form (store URL, client id, client secret)
at any time.

No application code changes in this step. The file is a recipe that can be run later
when you say "remove the setup guide".

## What the skill will instruct

Remove:
- The top notice bar and the guide dialog (`setup-notice-bar.tsx`, `setup-wizard.tsx`)
  and the place the bar is rendered in the store layout.
- The guide's progress tracking: `setup-progress.ts`, `setup-progress.server.ts`,
  the `api/vendre/setup-progress` route and the guide-only helper
  `publish-origin-field.tsx`.
- Guide-only wording from the translation file.

Keep:
- Credentials stay where they are; the form for store URL, client id and client secret
  is opened on request and is not part of the guide.
- The server status check that decides demo data vs. live store, so the storefront keeps
  working exactly as today.
- The connection test helper, so the store connection can still be verified on demand.

Also included in the skill:
- A short check list to run afterwards (storefront loads, no leftover references,
  build passes).
- A note on how to bring the guide back (revert the change from history).

## Technical notes

- New file only: `.vendre/skills/remove-setup-guide.md`, with frontmatter
  (`name: vendre-remove-setup-guide`, description covering triggers such as
  "remove the setup guide", "hide onboarding", "store is done").
- Documents that `src/routes/__root.tsx` keeps `getStorefrontStatus` +
  `setServerConfigured` / `setServerVerified`, and that `useOnboarding()` stays as the
  demo/live switch; only `guideDismissed`/`markConfigured`/`reset` become unused and can
  be trimmed.
- Points at `src/lib/vendre/test-connection.ts` and `src/routes/api/vendre/status.ts` as
  must-keep files.
- Cross-references `.vendre/skills/setup.md` as the inverse procedure, and notes
  `AGENTS.md` section 0 should be read together with it so a finished store is not
  re-onboarded.
