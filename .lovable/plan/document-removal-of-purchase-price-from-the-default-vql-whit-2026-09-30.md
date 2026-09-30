# Document removal of purchase_price from the default VQL whitelist

## Finding
The storefront never requests or displays `purchase_price` (searched the whole project, including docs and mock data). No app code change is needed.

## Changes (documentation only)
1. `.vendre/knowledge/api-reference.md`, VQL section: add a dated note (2026-09-30) that `purchase_price` is no longer in the default VQL field whitelist; requesting it returns nothing/an error unless the store has added it to its whitelist; it must never be shown publicly.
2. `.vendre/skills/vql-queries.md`, "Field selection": add that `purchase_price` is not whitelisted by default and should not be requested by the storefront.
