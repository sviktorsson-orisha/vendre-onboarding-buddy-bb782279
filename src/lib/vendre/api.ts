/**
 * Storefront data adapter.
 *
 * Same function signatures in both modes:
 *   demo -> src/mock/vendreResponses.ts (cart kept in memory)
 *   live -> /surface/2/* through our own /api/vendre/surface proxy (no token in the browser)
 *
 * All live paths, headers and error handling follow .vendre/knowledge/api-reference.md.
 * Caching follows .vendre/skills/caching.md: menus/categories are cached, cart and
 * session are never cached.
 */
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useOnboarding } from "@/context/onboarding-context";
import { formatAmount } from "@/lib/vendre/format";
import {
  emptyCart,
  mockCategory,
  mockFeaturedProducts,
  mockMenus,
  mockPageContent,
  mockPageTree,
  mockProduct,
  mockProductVariants,
  mockSearch,
  mockSessionContext,
} from "@/mock/vendreResponses";
import type {
  Cart,
  CartLine,
  CategoryQuery,
  CategoryResponse,
  GalleryPage,
  GalleryPagesResponse,
  MenuItem,
  MenuNode,
  PageContent,
  PageTreeNode,
  PageTreeResponse,
  Product,
  ProductSpecification,
  ProductVariantType,

  SearchQuery,
  SearchResult,
  SessionContext,
  VendreImage,
} from "@/types/vendre";


import {
  fetchStoreBaseUrl,
  setMutationProtectionToken,
  surfaceJson,
  VendreError,
} from "./client";


export type VendreMode = "demo" | "live";

export type VendreApi = {
  mode: VendreMode;
  getMenus: () => Promise<MenuItem[]>;
  getCategory: (id: number, query?: CategoryQuery) => Promise<CategoryResponse>;
  getProduct: (id: string, categoryId?: number) => Promise<Product | null>;
  /** Variant types + choices for a product (VQL). Empty when the product has none. */
  getProductVariants: (productId: string | number) => Promise<ProductVariantType[]>;
  /** Full product record for a selected variant child (its own product in Vendre). */
  getVariantProduct: (productId: string | number) => Promise<Product | null>;
  /** Name/value specifications for a product (VQL relation `specifications`). */
  getProductSpecifications: (productId: string | number) => Promise<ProductSpecification[]>;
  /** CMS page content for an information_page menu item (gallery id). */
  getPageContent: (id: number) => Promise<PageContent>;
  /** CMS page tree; the only source of `is_menu` for footer groups. */
  getPageTree: () => Promise<PageTreeResponse>;
  getCart: () => Promise<Cart>;
  /**
   * `knownQuantity` is the quantity the caller already knows the cart holds for
   * this product (from the live cart query cache); passing it avoids an extra
   * cart read before the add.
   */
  addToCart: (
    productId: string | number,
    quantity?: number,
    knownQuantity?: number,
  ) => Promise<void>;
  updateQty: (line: CartLine, quantity: number) => Promise<void>;
  removeLine: (line: CartLine) => Promise<void>;
  getSessionContext: () => Promise<SessionContext>;
  checkoutUrl: () => Promise<string | null>;
  searchProducts: (query: string, options?: SearchQuery) => Promise<SearchResult>;
};

export const SEARCH_MIN_CHARS = 3;
export const SEARCH_SUGGESTION_LIMIT = 5;

function paginate(list: Product[], limit: number, page: number): SearchResult {
  const size = limit > 0 ? limit : 12;
  const pageCount = Math.max(1, Math.ceil(list.length / size));
  const pageIndex = Math.min(Math.max(page, 1), pageCount);
  return {
    products: list.slice((pageIndex - 1) * size, pageIndex * size),
    product_count: list.length,
    page_index: pageIndex,
    page_count: pageCount,
  };
}

function matchesQuery(product: Product, needle: string) {
  return `${product.name} ${product.model ?? ""} ${product.description_short ?? ""}`
    .toLowerCase()
    .includes(needle);
}

/* ------------------------------------------------------------------ live -- */

let storeBaseUrl: string | null = null;
let sessionReady: Promise<void> | null = null;

export function getStoreBaseUrl() {
  return storeBaseUrl;
}

function transient(error: unknown) {
  // A 502/503/504 from the proxy means the store (or its OAuth endpoint)
  // hiccupped, not that the session is invalid — one retry usually recovers.
  if (!(error instanceof VendreError)) return true;
  const status = error.status ?? 0;
  return status === 0 || status === 429 || status >= 502;
}

async function bootstrapSession() {
  storeBaseUrl = await fetchStoreBaseUrl();
  let data: { surface_mutation_protection_token?: string };
  try {
    data = await surfaceJson("session/bootstrap", { method: "POST" });
  } catch (error) {
    if (!transient(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 700));
    data = await surfaceJson("session/bootstrap", { method: "POST" });
  }
  setMutationProtectionToken(data.surface_mutation_protection_token ?? null);
}



export function ensureSession() {
  sessionReady ??= bootstrapSession().catch((error) => {
    sessionReady = null;
    throw error;
  });
  return sessionReady;
}

/** Runs a call behind the session gate and re-bootstraps once on a session 401. */
export function resetSessionGate() {
  sessionReady = null;
}

export async function guarded<T>(run: () => Promise<T>): Promise<T> {
  await ensureSession();
  try {
    return await run();
  } catch (error) {
    const sessionGone =
      error instanceof VendreError &&
      (error.code === "SURFACE_SESSION_UNAUTHORIZED" || error.status === 401);
    if (!sessionGone) throw error;
    sessionReady = null;
    await ensureSession();
    return run();
  }
}

/**
 * Surface validates `limit` against a fixed allow-list and rejects anything
 * else with 400 FORM_INVALID_INPUT. 0 means "all products".
 */
export const ALLOWED_PAGE_SIZES = [12, 15, 20] as const;
/** Largest page size the store accepts for a paged read. */
export const MAX_PAGE_SIZE: number = 20;

/** Rounds any requested page size up to the nearest value Surface accepts. */
function allowedPageSize(limit: number): number {
  return ALLOWED_PAGE_SIZES.find((size) => size >= limit) ?? MAX_PAGE_SIZE;
}

function positiveInt(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && Number.isInteger(n) && n >= 1 ? n : null;
}

/**
 * Serialises listing state for GET categories/{id}; arrays use bracket syntax.
 * Listing parameters are validated strictly by Surface, so only well-formed
 * values are sent — anything else is dropped and the store default applies.
 */
function categoryQuery(query?: CategoryQuery) {
  const params = new URLSearchParams();
  const page = positiveInt(query?.page);
  if (page) params.set("page", String(page));
  const limit = positiveInt(query?.limit);
  if (limit) params.set("limit", String(allowedPageSize(limit)));
  if (query?.sort_by) params.set("sort_by", query.sort_by);
  // The store's own sort options use ASC/DESC; anything else is dropped.
  const order = String(query?.sort_order ?? "").toUpperCase();
  if (order === "ASC" || order === "DESC") params.set("sort_order", order);
  if (query?.pfrom != null) params.set("pfrom", String(query.pfrom));
  if (query?.pto != null) params.set("pto", String(query.pto));
  for (const tag of query?.tags ?? []) params.append("tags[]", String(tag));
  for (const [specId, values] of Object.entries(query?.specs ?? {}))
    for (const value of values) params.append(`f[${specId}][]`, value);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Every product in a category. Surface only accepts the page sizes in
 * ALLOWED_PAGE_SIZES, so the pages are walked with the largest allowed size
 * until a short one arrives (with a hard stop as a guard).
 */
async function allCategoryProducts(catId: number): Promise<Product[]> {
  const out: Product[] = [];
  for (let page = 1; page <= 100; page += 1) {
    const data = await liveApi.getCategory(catId, { limit: MAX_PAGE_SIZE, page });
    const list = data.product_list ?? [];
    out.push(...list);
    if (list.length < MAX_PAGE_SIZE) break;
  }
  return out;
}

const liveApi: VendreApi = {
  mode: "live",
  getMenus: () =>
    guarded(() => surfaceJson<{ menus: MenuItem[] }>("navigation/menus")).then(
      (data) => data.menus ?? [],
    ),
  getCategory: (id, query) =>
    guarded(() => surfaceJson<CategoryResponse>(`categories/${id}${categoryQuery(query)}`)),
  // Variants come from VQL. Verified response shape: { query: { product_variant_types: [...] } }.
  // `quantity` is not returned by this install; `stock_allow_checkout` may be null,
  // which means the store default (checkout allowed) applies.
  getProductVariants: async (productId) => {
    // The product read already batched this tree into its own query.
    const cached = variantTreeCache.get(String(productId));
    if (cached) return cached;
    try {
      const data = await guarded(() =>
        surfaceJson<VqlVariantsResponse>("vql", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            query: {
              product_variant_types: {
                filters: { where: { product_id: String(productId) } },
                fields: [
                  "id",
                  "name",
                  "sort_order",
                  {
                    product_variant_choices: {
                      fields: [
                        "_all",
                        {
                          products: {
                            fields: [
                              "id",
                              "in_stock",
                              "quantity",
                              "stock_allow_checkout",
                              "status",
                            ],
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          }),
        }),
      );
      const types =
        data?.query?.product_variant_types ?? data?.data?.query?.product_variant_types ?? [];
      const normalized = normalizeVariantTypes(types);
      variantTreeCache.set(String(productId), normalized);
      return normalized;
    } catch {
      // VQL disabled or the product has no variants: render the page without a selector.
      return [];
    }
  },
  getVariantProduct: (productId) => vqlProduct(productId),
  getProductSpecifications: (productId) => vqlSpecifications(productId),
  getProduct: async (id, categoryId) => {
    // Surface v2 has no products/{id} endpoint. VQL reads the product and its variant
    // tree in a single call — the category scan below is only a fallback for installs
    // without VQL, since it fetches every product of every category until the id turns up.
    if (!vqlDisabled) {
      const direct = await vqlProduct(id, true);
      if (direct) return direct;
    }
    const fromCategory = async (catId: number) => {
      const all = await allCategoryProducts(catId);
      return all.find((p) => String(p.id) === String(id)) ?? null;
    };
    if (categoryId) {
      const hit = await fromCategory(categoryId);
      if (hit) return hit;
    }
    const menus = await liveApi.getMenus();
    for (const item of menus.filter((menu) => menu.menu_type === "category")) {
      const hit = await fromCategory(item.id);
      if (hit) return hit;
    }
    return null;
  },

  // Only the page's own description is rendered — content blocks are not used.
  // GET galleries/{id}/pages lists the pages *inside* a gallery, so the page
  // itself is found in its parent gallery's list (pagetree gives the parent).
  getPageContent: async (id) => {
    const readPages = (galleryId: number) =>
      guarded(() => surfaceJson<GalleryPagesResponse>(`galleries/${galleryId}/pages`))
        .then((data) => data?.pages ?? [])
        .catch(() => [] as GalleryPage[]);

    const tree = await liveApi.getPageTree().catch(() => ({ tree: [], pages: [] }));
    const node = tree.pages.find((page) => page.id === id);
    const parentId = node?.parent_id ?? 0;

    let page = (await readPages(parentId)).find((item) => item.id === id);
    if (!page) page = (await readPages(id)).find((item) => item.id === id);

    return {
      id,
      title: page?.title ?? node?.title ?? null,
      description: page?.description || page?.short_description || null,
    };
  },

  getPageTree: () =>
    guarded(() => surfaceJson<PageTreeResponse>("galleries/pagetree")).then((data) => ({
      tree: data?.tree ?? [],
      pages: data?.pages ?? [],
    })),
  getCart: () => guarded(() => surfaceJson<Cart>("shopping-cart")),
  addToCart: async (productId, quantity = 1, knownQuantity) => {
    // The store sets an absolute quantity, so adding a product that is already
    // in the cart must carry existing + new, otherwise nothing changes. The
    // caller normally knows the current quantity from the live cart query, so
    // no extra read is needed; only fall back to reading when it does not.
    const id = Number(productId);
    let existing = knownQuantity ?? 0;
    if (knownQuantity == null) {
      try {
        const cart = await liveApi.getCart();
        const line = (cart?.products ?? []).find(
          (item) => Number(item.productId) === id && (item.attributes?.length ?? 0) === 0,
        );
        existing = line?.quantity ?? 0;
      } catch {
        existing = 0;
      }
    }


    await guarded(() =>
      surfaceJson("shopping-cart/products", {
        // PUT is the current contract; POST remains only as a legacy alias.
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          products: [{ id, quantity: existing + quantity }],
        }),
      }),
    );
  },
  updateQty: async (line, quantity) => {
    await guarded(() =>
      surfaceJson("shopping-cart/products", {
        // PUT is the current contract; POST remains only as a legacy alias.
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          products: [{ id: line.productId, quantity, attributes: line.attributes }],
        }),
      }),
    );
  },
  // DELETE shopping-cart clears the whole cart, so a single line is removed by
  // setting its quantity to 0 on the same endpoint used for quantity changes.
  removeLine: async (line) => {
    await guarded(() =>
      surfaceJson("shopping-cart/products", {
        // PUT is the current contract; POST remains only as a legacy alias.
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          products: [{ id: line.productId, quantity: 0, attributes: line.attributes }],
        }),
      }),
    );
  },

  getSessionContext: () => guarded(() => surfaceJson<SessionContext>("session/context")),
  // POST session/handover mints a short-lived token (~30s) and returns a ready
  // checkout URL, so the cart follows even when the store session cookie does
  // not survive the jump to the store domain. return_url/failure_url must be
  // absolute URLs on the same host as the request origin.
  checkoutUrl: async () => {
    if (typeof window !== "undefined") {
      try {
        const origin = window.location.origin;
        const handover = await guarded(() =>
          surfaceJson<{ checkout_url?: string | null }>("session/handover", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              return_url: `${origin}/`,
              failure_url: `${origin}/`,
            }),
          }),
        );
        if (handover?.checkout_url) return handover.checkout_url;
      } catch {
        // Fall back to the plain checkout link below so the button never dead-ends.
      }
    }
    const baseUrl = await fetchStoreBaseUrl();
    storeBaseUrl = baseUrl;
    return baseUrl ? `${baseUrl}/checkout` : null;
  },


  searchProducts: async (query, options = {}) => {
    const needle = query.trim().toLowerCase();
    const limit = options.limit ?? 12;
    const page = options.page ?? 1;
    if (needle.length < SEARCH_MIN_CHARS) return paginate([], limit, 1);

    // Search runs over the catalogue read from categories/{id}. VQL has no
    // supported free-text search on this Surface version — the previous
    // `{ resource, query }` body made the store answer 500, which also switched
    // VQL off for product and variant reads.
    const all = await liveCatalogue();
    return paginate(all.filter((p) => matchesQuery(p, needle)), limit, page);
  },
};


type VqlRawProduct = {
  id: number;
  name?: string;
  parent_id?: number | null;
  model?: string | null;
  description?: string | null;
  short_description?: string | null;
  child_count?: number | null;
  tax_rate?: number | null;
  category_id?: number | null;
  seo_link?: string | null;
  in_stock?: boolean | null;
  quantity?: number | null;
  stock_allow_checkout?: boolean | number | null;
  /** Relation `image` returns { id, name, href } — href is the store-relative path. */
  image?: { id?: number | string | null; name?: string | null; href?: string | null } | null;
  /** Relation `specifications`: { id, parent_id, name, type, short_value, value }. */
  specifications?: ProductSpecification[] | null;

  pricing?: {
    price?: string | null;
    original?: string | null;
    original_raw?: number | null;
    special?: string | null;
    special_raw?: number | null;
    final_excl_raw?: number | null;
  } | null;
};

/** Field selection for a full product record. */
const VQL_PRODUCT_FIELDS = [
  "_all",
  { image: { fields: ["id", "name", "href"] } },
  { specifications: { fields: ["_all"] } },
];

/** Field selection for the variant tree of a product. */
const VQL_VARIANT_FIELDS = [
  "id",
  "name",
  "sort_order",
  {
    product_variant_choices: {
      fields: [
        "_all",
        {
          products: {
            fields: ["id", "in_stock", "quantity", "stock_allow_checkout", "status"],
          },
        },
      ],
    },
  },
];

/**
 * Variant trees that arrived alongside a product read, keyed by the product id the
 * tree was queried for. `getProductVariants` serves these instead of firing a second
 * VQL call for the product the PDP just loaded.
 */
const variantTreeCache = new Map<string, ProductVariantType[]>();

function mapVqlProduct(raw: VqlRawProduct): Product {
  const pricing = raw.pricing ?? {};
  const image: VendreImage | null = raw.image?.href
    ? {
        id: raw.image.id != null ? String(raw.image.id) : null,
        path: raw.image.href,
        image: raw.image.href,
        alt: raw.image.name ?? null,
        alt_translated: null,
      }
    : null;
  const allowCheckout =
    raw.stock_allow_checkout == null ? null : Boolean(Number(raw.stock_allow_checkout));
  return {
    id: String(raw.id),
    name: raw.name ?? `#${raw.id}`,
    model: raw.model ?? null,
    description: raw.description ?? null,
    description_short: raw.short_description ?? null,
    price: pricing.price ?? pricing.original ?? null,
    price_raw: pricing.original_raw ?? null,
    price_original: pricing.original ?? null,
    price_original_raw: pricing.original_raw ?? null,
    price_special: pricing.special ?? null,
    price_special_raw: pricing.special_raw ?? null,
    final_price_excl_raw: pricing.final_excl_raw ?? null,
    tax: raw.tax_rate ?? null,
    unit: null,
    image,
    images: image ? [image] : [],
    stock_total: raw.quantity ?? (raw.in_stock === false ? 0 : null),
    stock_allow_checkout: allowCheckout,
    seo_link: raw.seo_link ?? null,
    categories_id: raw.category_id != null ? String(raw.category_id) : null,
    has_attributes: false,
    child_count: raw.child_count ?? 0,
    parent_id: raw.parent_id ?? null,
    specifications: (raw.specifications ?? []).filter((item) => item?.name && item?.value),
  };
}

/**
 * Single product read through VQL. Variant children are real products of their own,
 * so the PDP re-reads the full record (name, description, image, price, stock)
 * whenever a variant is selected.
 *
 * `withVariants` batches the variant tree into the same query, so a normal product
 * page load is one request instead of two. When the landed product turns out to be a
 * variant child the tree comes back empty and the PDP reads the parent's tree
 * separately — the tree only exists on the parent.
 */
async function vqlProduct(
  id: string | number,
  withVariants = false,
): Promise<Product | null> {
  try {
    const data = await guarded(() =>
      surfaceJson<{
        query?: { products?: VqlRawProduct[]; product_variant_types?: ProductVariantType[] };
      } | null>("vql", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query: {
            products: {
              filters: { where: { id: Number(id) } },
              fields: VQL_PRODUCT_FIELDS,
            },
            ...(withVariants
              ? {
                  product_variant_types: {
                    filters: { where: { product_id: String(id) } },
                    fields: VQL_VARIANT_FIELDS,
                  },
                }
              : {}),
          },
        }),
      }),
    );
    const raw = data?.query?.products?.[0];
    if (!raw) return null;
    if (withVariants) {
      variantTreeCache.set(
        String(id),
        normalizeVariantTypes(data?.query?.product_variant_types ?? []),
      );
    }
    return mapVqlProduct(raw);
  } catch {
    // VQL is off on this install (documented 500): stop trying it for product reads.
    vqlDisabled = true;
    return null;
  }
}




/**
 * Specifications live on the VQL relation `specifications`; category listings do not
 * carry them, so the PDP reads them for whichever product is currently active.
 */
async function vqlSpecifications(id: string | number): Promise<ProductSpecification[]> {
  try {
    const data = await guarded(() =>
      surfaceJson<{ query?: { products?: { specifications?: ProductSpecification[] }[] } } | null>(
        "vql",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            query: {
              products: {
                filters: { where: { id: Number(id) } },
                fields: ["id", { specifications: { fields: ["_all"] } }],
              },
            },
          }),
        },
      ),
    );
    const list = data?.query?.products?.[0]?.specifications ?? [];
    return list.filter((item) => item?.name && item?.value);
  } catch {
    return [];
  }
}

type VqlVariantsResponse = {
  query?: { product_variant_types?: ProductVariantType[] };
  data?: { query?: { product_variant_types?: ProductVariantType[] } };
} | null;

/**
 * Drop inactive variant products and choices without a buyable product, then sort
 * everything by sort_order. Vendre marks an inactive product with `status: 0`; a
 * missing/null status means the store default: active.
 */
function normalizeVariantTypes(types: ProductVariantType[]): ProductVariantType[] {
  const bySort = (a: { sort_order?: number | null }, b: { sort_order?: number | null }) =>
    (a.sort_order ?? 0) - (b.sort_order ?? 0);
  const isActive = (value: unknown) => value == null || Boolean(Number(value));
  return (types ?? [])
    .map((type) => ({
      ...type,
      product_variant_choices: (type.product_variant_choices ?? [])
        .map((choice) => ({
          ...choice,
          products: (choice.products ?? []).filter(
            (entry) => isActive(entry.status) && isActive(entry.active),
          ),
        }))
        .filter((choice) => choice.products.length > 0)
        .sort(bySort),
    }))
    .filter((type) => type.product_variant_choices.length > 0)
    .sort(bySort);
}

let vqlDisabled = false;
let catalogueCache: { at: number; products: Promise<Product[]> } | null = null;

/** Catalogue snapshot used by the search fallback; cached for 5 minutes. */
function liveCatalogue(): Promise<Product[]> {
  if (catalogueCache && Date.now() - catalogueCache.at < 5 * 60 * 1000) {
    return catalogueCache.products;
  }
  const products = (async () => {
    const menus = await liveApi.getMenus();
    // Every category, not just leaves: products can live directly on a parent.
    const categories = menus.filter((item) => item.menu_type === "category");
    const lists = await Promise.all(
      categories.map((item) =>
        allCategoryProducts(item.id).catch(() => [] as Product[]),
      ),
    );
    const byId = new Map<string, Product>();
    for (const product of lists.flat()) byId.set(String(product.id), product);
    return [...byId.values()];
  })().catch((error) => {
    catalogueCache = null;
    throw error;
  });
  catalogueCache = { at: Date.now(), products };
  return products;
}

/* ------------------------------------------------------------------ demo -- */

let demoCart: Cart = { ...emptyCart, products: [] };

function recalcDemoCart() {
  // Demo mode plays the role of the store: it produces the totals, the UI never
  // computes them.
  demoCart = {
    products: demoCart.products,
    cart_count: demoCart.products.reduce((sum, line) => sum + line.quantity, 0),
    cart_total: demoCart.products.reduce((sum, line) => {
      const product = line.product_data;
      const effective =
        product?.price_special_raw != null &&
        product?.price_raw != null &&
        product.price_special_raw < product.price_raw
          ? product.price_special_raw
          : (product?.price_raw ?? 0);
      return sum + effective * line.quantity;
    }, 0),
  };
}


const demoApi: VendreApi = {
  mode: "demo",
  getMenus: async () => mockMenus,
  getCategory: async (id, query) => mockCategory(id, query),
  getProduct: async (id) => mockProduct(id),
  getProductVariants: async (productId) => mockProductVariants(String(productId)),
  getVariantProduct: async (productId) => mockProduct(String(productId)),
  getProductSpecifications: async (productId) =>
    (await mockProduct(String(productId)))?.specifications ?? [],
  getPageContent: async (id) => mockPageContent(id),
  getPageTree: async () => mockPageTree(),
  getCart: async () => demoCart,
  addToCart: async (productId, quantity = 1) => {
    const id = String(productId);
    const existing = demoCart.products.find((line) => line.id === id);
    if (existing) existing.quantity += quantity;
    else {
      const data = mockProduct(id);
      demoCart.products = [
        ...demoCart.products,
        {
          id,
          productId: Number(id),
          quantity,
          attributes: [],
          data: null,
          ...(data ? { product_data: data } : {}),
        },
      ];
    }
    recalcDemoCart();
  },
  updateQty: async (line, quantity) => {
    demoCart.products = demoCart.products
      .map((item) => (item.id === line.id ? { ...item, quantity } : item))
      .filter((item) => item.quantity > 0);
    recalcDemoCart();
  },
  removeLine: async (line) => {
    demoCart.products = demoCart.products.filter((item) => item.id !== line.id);
    recalcDemoCart();
  },
  getSessionContext: async () => mockSessionContext,
  searchProducts: async (query, options = {}) => {
    const limit = options.limit ?? 12;
    if (query.trim().length < SEARCH_MIN_CHARS) return paginate([], limit, 1);
    return mockSearch(query, limit, options.page ?? 1);
  },
  checkoutUrl: async () => null,
};

/* ------------------------------------------------------------------ hooks -- */

export function useVendreApi(): VendreApi {
  const { isConfigured } = useOnboarding();
  return useMemo(() => (isConfigured ? liveApi : demoApi), [isConfigured]);
}

export function useMenus() {
  const api = useVendreApi();
  return useQuery({
    queryKey: ["vendre", api.mode, "menus"],
    queryFn: () => api.getMenus(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMenuTree() {
  const { data } = useMenus();
  return useMemo(() => buildMenuTree(data ?? []), [data]);
}

/** Header navigation: product categories only. */
export function useCategoryMenu() {
  const { data } = useMenus();
  return useMemo(
    () => buildMenuTree((data ?? []).filter((item) => item.menu_type === "category")),
    [data],
  );
}

/** CMS page tree; static and read-heavy, so cached like menus. */
export function usePageTree() {
  const api = useVendreApi();
  return useQuery({
    queryKey: ["vendre", api.mode, "page-tree"],
    queryFn: () => api.getPageTree(),
    staleTime: 10 * 60 * 1000,
  });
}

export type PageGroup = { id: number; title: string; children: PageTreeNode[] };

/**
 * Footer navigation: only top-level pages that are real menu headings
 * (`is_menu: true`) AND have active child pages. Ordinary content pages such as
 * "Inspiration" are excluded even though navigation/menus lists them.
 */
export function usePageMenu(): PageGroup[] {
  const { data } = usePageTree();
  return useMemo(() => {
    if (!data) return [];
    const nodes = data.tree?.length ? data.tree : (data.pages ?? []);
    const flat = data.pages?.length ? data.pages : flattenTree(nodes);
    const childrenOf = (id: number) =>
      (nodes.find((node) => node.id === id)?.children ?? []).length
        ? (nodes.find((node) => node.id === id)?.children ?? [])
        : flat.filter((page) => page.parent_id === id);

    return nodes
      .filter((node) => (node.parent_id ?? 0) === 0 && node.is_menu)
      .map((node) => ({ id: node.id, title: node.title, children: childrenOf(node.id) }))
      .filter((group) => group.children.length > 0);
  }, [data]);
}

function flattenTree(nodes: PageTreeNode[]): PageTreeNode[] {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children ?? [])]);
}

/**
 * Nests menu items by parent. Keys include the source, because a category and
 * an information_page can share the same numeric id in the same menu payload.
 */
export function buildMenuTree(items: MenuItem[]): MenuNode[] {
  const key = (source: string | null, id: number) => `${source ?? "category"}:${id}`;
  const nodes = new Map<string, MenuNode>();
  for (const item of items) nodes.set(key(item.source, item.id), { ...item, children: [] });
  const roots: MenuNode[] = [];
  for (const node of nodes.values()) {
    const parent =
      node.parent_id != null
        ? nodes.get(key(node.parent_source ?? node.source, node.parent_id))
        : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

/** CMS page content; static and read-heavy, so cached like categories. */
export function usePageContent(id: number) {
  const api = useVendreApi();
  return useQuery({
    queryKey: ["vendre", api.mode, "page-content", id],
    queryFn: () => api.getPageContent(id),
    staleTime: 10 * 60 * 1000,
  });
}

/** The menu item describing a CMS page (used for the title and breadcrumbs). */
export function usePageMenuItem(id: number) {
  const { data } = useMenus();
  return useMemo(
    () =>
      (data ?? []).find(
        (item) => item.menu_type === "information_page" && Number(item.entity_id) === id,
      ) ?? null,
    [data, id],
  );
}

/**
 * Cache scope for price-bearing data: market, currency, language and VAT mode
 * change what the store returns, so they belong in every cache key.
 */
export function useCacheScope() {
  const { data } = useSessionContext();
  return useMemo(
    () =>
      data
        ? [data.market?.id ?? null, data.currency?.code ?? null, data.language?.code ?? null, data.prices_include_vat]
        : null,
    [data],
  );
}

export function useCategory(id: number, query?: CategoryQuery) {
  const api = useVendreApi();
  const scope = useCacheScope();
  return useQuery({
    queryKey: ["vendre", api.mode, "category", id, query ?? null, scope],
    queryFn: () => api.getCategory(id, query),
    staleTime: 5 * 60 * 1000,
    placeholderData: (previous) => previous,
  });
}

export function useProduct(id: string, categoryId?: number) {
  const api = useVendreApi();
  const scope = useCacheScope();
  return useQuery({
    // categoryId only steers the fallback lookup, not the result, so it stays
    // out of the key — parent and variant reads then share one cache entry.
    queryKey: ["vendre", api.mode, "product", String(id), scope],
    queryFn: () => api.getProduct(id, categoryId),
    staleTime: 5 * 60 * 1000,
    // The scope is part of the key, so fetching before the session context has
    // landed would fetch once under `null` and again under the real scope.
    enabled: Boolean(id) && scope != null,
  });
}

/** Variant children are separate products, cached under the same product key. */
export function useVariantProduct(productId: number | null) {
  const api = useVendreApi();
  const scope = useCacheScope();
  return useQuery({
    queryKey: ["vendre", api.mode, "product", String(productId), scope],
    queryFn: () => api.getVariantProduct(productId as number),
    staleTime: 5 * 60 * 1000,
    enabled: productId != null && scope != null,
  });
}

/**
 * Specifications for the product currently shown on the PDP. The product read
 * already carries them, so this only runs when the record came from a category
 * listing (which has no specifications).
 */
export function useProductSpecifications(
  productId: string | number | null,
  enabled = true,
) {
  const api = useVendreApi();
  const scope = useCacheScope();
  return useQuery({
    queryKey: ["vendre", api.mode, "product-specifications", String(productId), scope],
    queryFn: () => api.getProductSpecifications(productId as string | number),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && productId != null && productId !== "" && scope != null,
  });
}


export function useProductVariants(id: string) {
  const api = useVendreApi();
  const scope = useCacheScope();
  return useQuery({
    // Keep the normalisation version in the key. React Query preserves data
    // through hot reloads, so an older unfiltered tree must not keep inactive
    // products selectable after the response rules change.
    queryKey: ["vendre", api.mode, "product-variants", "status-filter-v2", id, scope],
    queryFn: () => api.getProductVariants(id),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(id) && scope != null,
  });
}


/** Never cached — the cart is live state. */
export function useCart() {
  const api = useVendreApi();
  return useQuery({
    queryKey: ["vendre", api.mode, "cart"],
    queryFn: () => api.getCart(),
    staleTime: 0,
    gcTime: 0,
  });
}

export function useSessionContext() {
  const api = useVendreApi();
  return useQuery({
    queryKey: ["vendre", api.mode, "session-context"],
    queryFn: () => api.getSessionContext(),
    staleTime: 0,
    gcTime: 0,
  });
}

const cartMutationQueue = { current: Promise.resolve() as Promise<unknown> };

export function useCartMutations() {
  const api = useVendreApi();
  const queryClient = useQueryClient();
  const cartKey = ["vendre", api.mode, "cart"] as const;

  // Every mutation is serialized and followed by a fresh store read, so the
  // totals shown always come from the store's own response for the final state
  // (no client-side arithmetic, no stale total from an out-of-order refetch).
  const chain = cartMutationQueue;

  const run = <T,>(mutate: () => Promise<T>) => {
    const next = chain.current
      .catch(() => undefined)
      .then(async () => {
        await mutate();
        await queryClient.cancelQueries({ queryKey: cartKey });
        const cart = await api.getCart();
        queryClient.setQueryData(cartKey, cart);
        return cart;
      });
    chain.current = next;
    return next;
  };

  const add = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string | number; quantity?: number }) =>
      run(() => {
        // The cart query is always live in the app, so the current quantity is
        // read from its cache instead of costing an extra store round-trip.
        const cached = queryClient.getQueryData<Cart>(cartKey);
        const known = cached
          ? (cached.products ?? [])
              .filter(
                (line) =>
                  Number(line.productId) === Number(productId) &&
                  (line.attributes?.length ?? 0) === 0,
              )
              .reduce((sum, line) => sum + (line.quantity ?? 0), 0)
          : undefined;
        return api.addToCart(productId, quantity ?? 1, known);
      }),
  });
  const update = useMutation({
    mutationFn: ({ line, quantity }: { line: CartLine; quantity: number }) =>
      run(() => api.updateQty(line, quantity)),
  });
  const remove = useMutation({
    mutationFn: ({ line }: { line: CartLine }) => run(() => api.removeLine(line)),
  });

  return { add, update, remove };
}


export function useFeaturedProducts(count = 4) {
  const api = useVendreApi();
  return useQuery({
    queryKey: ["vendre", api.mode, "featured", count],
    queryFn: async () => {
      if (api.mode === "demo") return mockFeaturedProducts(count);
      const menus = await api.getMenus();
      const first = menus.find((item) => item.menu_type === "category" && !item.has_children);
      if (!first) return [];
      // The request is rounded up to a page size the store accepts; the view
      // still shows exactly `count` products.
      const category = await api.getCategory(first.id, { limit: count });
      return category.product_list.slice(0, count);
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Store images are served through our own origin, so the browser never sees the
 * store hostname and the proxy can cache them. External URLs pass through.
 */
export function resolveImageUrl(path: string | null | undefined) {
  if (!path) return null;

  if (/^https?:\/\//.test(path)) {
    if (!storeBaseUrl || !path.startsWith(storeBaseUrl)) return path;
    const rest = path.slice(storeBaseUrl.length).replace(/^\/+/, "");
    return `/api/vendre/image/${rest}`;
  }

  return `/api/vendre/image/${path.replace(/^\/+/, "")}`;
}

export function formatPrice(product: Pick<Product, "price" | "price_raw">) {
  return product.price ?? (product.price_raw != null ? formatAmount(product.price_raw) : "—");
}

export { formatAmount };

/**
 * Product search. Runs only from SEARCH_MIN_CHARS characters and shares the
 * PLP cache scope, since prices depend on market/currency/language/VAT.
 */
export function useProductSearch(
  query: string,
  options: SearchQuery & { enabled?: boolean } = {},
) {
  const api = useVendreApi();
  const scope = useCacheScope();
  const term = query.trim();
  const limit = options.limit ?? 12;
  const page = options.page ?? 1;
  const enabled = (options.enabled ?? true) && term.length >= SEARCH_MIN_CHARS;

  return useQuery({
    queryKey: ["vendre", api.mode, "search", term, limit, page, scope],
    queryFn: () => api.searchProducts(term, { limit, page }),
    enabled,
    staleTime: 60 * 1000,
    placeholderData: (previous) => previous,
  });
}
