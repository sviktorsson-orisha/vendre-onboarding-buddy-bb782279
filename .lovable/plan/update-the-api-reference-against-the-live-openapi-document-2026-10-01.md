# Update the API reference against the live OpenAPI document

I compared `https://sara-phoenix.testavendre.se/surface/2/openapi` (49 paths) with `.vendre/knowledge/api-reference.md`. Every endpoint in the document is already listed in the reference. These are the differences to fix (documentation only):

1. **Where the document lives**: the reference says `GET /surface/1/openapi` and "51 paths". Change this to `GET /surface/2/openapi`, 49 paths, in the source line (top) and in §2.
2. **`POST customers` is gone**: the document has no `customers` endpoint. Remove "and `POST customers`" from the registration heading and the "`POST customers` additionally accepts `email_addresses`" line. Only `POST accounts` remains.
3. **Cart line mutations (`POST shopping-cart/products`)**: add the fields the document now describes:
   - `id` = existing cart line id (preferred when updating or removing a specific line), `product_id` = product id, matched to an existing line.
   - `quantity` = absolute quantity, plus the new `quantity_diff` (relative change, e.g. `-1`).
   - `products` can be a single object or a list. Optional `comments`, `text`, `json` and `attributes` (an object).
   - `clear` as already documented.
4. **Registration (`POST accounts`)**: the document marks only `country_id` and `email_address` as required, and everything else depends on `accounts/form`. Add a line about this and list all accepted keys (`first_name`/`last_name`, `g-recaptcha-response`, `customers_group_id`, `vat_identification_number`, `fax` and so on).
5. **Favorites**: the document still uses `empty` (not `clear`) for `favorites/lists/products`, and product entries have `id`, `product_id`, `remove`. Note this next to the existing row.

## Not changed
- No app code changes. The cart keeps sending `{ products: [{ id, quantity, attributes }] }`, which still matches the document. `quantity_diff` is only recorded as an option for later.
- The skill files (`cart-checkout.md`, `cart-sync.md`) get one line each about `quantity_diff` and line `id`.
