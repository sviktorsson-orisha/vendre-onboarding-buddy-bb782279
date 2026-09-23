---
name: vendre-price-log
description: Reference for logged prices (price history) via GET /surface/2/products/price-log-prices - request shape, session requirement and response format. Not implemented in this template; use when a customer asks for lowest/previous price display.
---

# Logged prices (Surface v2) — reference only

**Nothing in this template implements this.** There is no proxy route, no
helper, no hook and no UI for logged prices. This file documents how to call the
endpoint so it can be built when a customer asks for it.

The call lives on Surface v2 and is documented in the OpenAPI document.
Verified live against the store on 2026-09-23: the v2 path answers 200.
There is no older version of this call to fall back to.

## Endpoint

`GET /surface/2/products/price-log-prices`

- **OAuth bearer required**, like every other v2 call.
- **Session cookie required.** Without the store session cookie it returns
  `401 SURFACE_SESSION_UNAUTHORIZED`, so `POST /surface/2/session/bootstrap`
  must have run first.
- **No mutation protection token** (it is a GET).
- **Parameters:** repeated `id[]=<products_id>`, one per product, several per
  call. Other parameter names return an empty result instead of an error.
- **Response:** an object keyed by product id:

  ```json
  {
    "222": {
      "product_id": 222,
      "price_list_id": null,
      "currency_id": null,
      "products_tax_class_id": 2,
      "price_log_price_ex_vat_raw": 39.2,
      "price_log_price_raw": 49,
      "price_log_price": "49 kr"
    }
  }
  ```

  Products without a logged price are omitted from the object.
  `price_log_price` is already formatted in the session currency — render it as
  is, never compute a fallback in the frontend.

## If it is implemented again

- The browser must never call the store directly — it goes through the existing
  v2 proxy `/api/vendre/surface/products/price-log-prices`, no new route needed.
- Batch ids into one call per page instead of one call per price row, and cache
  a few minutes client-side; logged prices change rarely.
- Only show the value for discounted products, and never in demo mode.
- CORS is not applicable — the browser only talks to our own origin.
