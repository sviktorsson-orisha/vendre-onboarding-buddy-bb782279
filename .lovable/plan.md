# Push the revert to GitHub (dev branch)

## Goal
Get the revert that's already saved in the project onto the `dev` branch on GitHub.

## Steps
1. Make a small, harmless change so Lovable sends an update to GitHub. The change is one line in `AGENTS.md` noting the revert. The store's code and behaviour stay exactly the same.
2. When this change is sent to GitHub, the revert commit that's waiting goes with it.
3. Check the project's latest commit to confirm the revert and the new change are both there.

## If it still doesn't show up on GitHub
- Open **+** (bottom left) → **GitHub** and check that the selected branch is `dev`.
- If Lovable says the history doesn't match GitHub, check GitHub for a `lovable-sync` branch or a waiting pull request, then merge it into `dev`.

## Technical details
- I can't push, reset or force anything in Git myself, because Lovable handles all of that.
- The new change only adds a comment line to `AGENTS.md`.
