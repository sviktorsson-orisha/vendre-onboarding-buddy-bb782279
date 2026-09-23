/**
 * Vendre Surface v2 response types.
 *
 * Field names below were read from the connected store
 * (GET /surface/2/navigation/menus, GET /surface/2/categories/{id},
 * GET /surface/2/shopping-cart, GET /surface/2/session/context).
 * Only the fields the storefront actually renders are typed; the API returns more.
 */

export type VendreImage = {
  id: string | null;
  path: string | null;
  /** Store-relative path, e.g. "/image/210/t-shirt.jpeg". Resolve against the store base URL. */
  image: string | null;
  alt: string | null;
  alt_translated: string | null;
};

export type MenuItem = {
  id: number;
  entity_id: number;
  source: string;
  parent_id: number | null;
  parent_source: string | null;
  /** "category" | "information_page" | ... */
  menu_type: string;
  name: string;
  icon: string | null;
  target: string | null;
  route: string | null;
  has_children: boolean;
};

export type MenusResponse = { menus: MenuItem[] };

/** Menu items nested by parent_id for multi-level dropdowns. */
export type MenuNode = MenuItem & { children: MenuNode[] };

/**
 * A CMS page as returned by GET /surface/2/galleries/{id}/pages — the endpoint
 * lists the pages that live inside a gallery, with their authored HTML.
 * Content blocks are deliberately NOT used; only `description` is rendered.
 */
export type GalleryPage = {
  id: number;
  parent_id: number | null;
  title: string;
  short_description: string | null;
  description: string | null;
  seo_link?: string | null;
};

export type GalleryPagesResponse = {
  gallery_id: number;
  pages: GalleryPage[];
};

/** Resolved content for /sida/{id}: the page's own title and description. */
export type PageContent = {
  id: number;
  title: string | null;
  description: string | null;
};


/**
 * CMS page tree (GET /surface/2/galleries/pagetree).
 * `is_menu` marks a real menu heading; ordinary content pages have `is_menu: false`.
 * Root nodes have `parent_id: 0`. `href` is a legacy absolute storefront URL —
 * never link to it, use the internal /sida/{id} route.
 */
export type PageTreeNode = {
  id: number;
  parent_id: number | null;
  title: string;
  href: string | null;
  is_menu: boolean;
  children?: PageTreeNode[];
};

export type PageTreeResponse = {
  tree: PageTreeNode[];
  pages: PageTreeNode[];
};

export type Product = {
  id: string;
  name: string;
  model: string | null;
  description: string | null;
  description_short: string | null;
  /** Formatted by the store, already in the session currency. */
  price: string | null;
  price_raw: number | null;
  price_original: string | null;
  price_original_raw: number | null;
  /** Sale price. Set (and lower than price_raw) only when the product is discounted. */
  price_special: string | null;
  price_special_raw: number | null;
  /** Price excluding VAT (raw). */
  final_price_excl_raw: number | null;
  tax: number | null;
  unit: string | null;
  image: VendreImage | null;
  images: VendreImage[];
  stock_total: number | null;
  stock_allow_checkout: boolean | null;
  seo_link: string | null;
  categories_id: string | null;
  has_attributes: boolean;
  /** Number of variant children. > 0 means the product must be configured on the PDP. */
  child_count?: number | null;
  /** Set on variant children: the id of the parent product that owns the variant tree. */
  parent_id?: number | null;
  /** Present on some installs; variant selectors render from it when available. */
  attributes?: ProductAttribute[];
  /** VQL relation `specifications` — name/value pairs shown on the PDP. */
  specifications?: ProductSpecification[];
};

/** POST /surface/2/vql → products.specifications */
export type ProductSpecification = {
  id: number;
  parent_id?: number | null;
  name: string;
  type?: number | null;
  short_value?: string | null;
  value: string | null;
};


/**
 * Variant data from POST /surface/2/vql (resource product_variant_types).
 * Each choice points at a real, buyable product: choice.products[0].id is the
 * id to add to cart — never the parent product id from the URL.
 */
export type ProductVariantChoice = {
  id: number;
  name: string;
  sort_order?: number | null;
  products: {
    id: number;
    in_stock?: boolean | null;
    quantity?: number | null;
    /** Vendre's activity flag: 0 = inactive. null/missing = active. */
    status?: boolean | number | null;
    /** null/missing means the store default: the product is active. */
    active?: boolean | number | null;
    /** null means "inherit the store default", which allows checkout. */
    stock_allow_checkout?: boolean | null;
  }[];
};

export type ProductVariantType = {
  id: number;
  name: string;
  sort_order?: number | null;
  product_variant_choices: ProductVariantChoice[];
};

export type ProductAttribute = {
  id: string | number;
  name: string;
  values: { id: string | number; name: string }[];
};

export type CategoryHeader = {
  id: number;
  name: string;
  alternative_name: string | null;
  text: string | null;
  image: VendreImage | null;
  images: VendreImage[];
  meta_title: string | null;
  meta_description: string | null;
  href: string | null;
};

/** Sort option as returned by the store, when the install provides a list. */
export type CategorySort = {
  name: string;
  /** Field passed as sort_by. */
  value?: string;
  sort_by?: string;
  sort_order?: string;
  selected?: boolean;
};

export type CategoryFilterOption = {
  id: string | number;
  name: string;
  count?: number;
  selected?: boolean;
  image?: VendreImage | null;
};

export type CategoryFilter = {
  id: string | number;
  name: string;
  /** 0 = category filter (subcategory links), 1 = tag filter, 2 = price range, 4 = spec filter. */
  type?: number | string;
  options?: CategoryFilterOption[];
  /** Price filters (type 2) return a range instead of options. */
  min?: number;
  max?: number;
  unit?: string;
};

export type CategoryResponse = {
  header: CategoryHeader;
  product_list: Product[];
  product_count: number;
  page_index: number;
  page_count: number;
  page_limit: number;
  page_limits: { name: string | number; limit: number; selected: boolean }[];
  sort_by: string;
  sort_order: string;
  /** Only some installs return a list of selectable sort options. */
  sort_options?: CategorySort[];
  sorts?: CategorySort[];
  subcategory_list: CategoryHeader[];
  filters: CategoryFilter[];
};

export type CartLine = {
  /** Cart line id (string), not always equal to productId. */
  id: string;
  productId: number;
  quantity: number;
  attributes: unknown[];
  data: unknown;
  product_data?: Product;
};

export type Cart = {
  products: CartLine[];
  cart_count: number;
  /** Store-calculated cart total (raw). The frontend never computes totals. */
  cart_total: number;
  /** Some installs return the total already formatted in the session currency. */
  cart_total_formatted?: string | null;
  /** Refreshed mutation protection token, when the store returns one. */
  mutationProtectionToken?: string;
};


export type SessionContext = {
  authenticated: boolean;
  cart_item_count: number;
  customer: { first_name?: string; last_name?: string } | null;
  customer_type: string | null;
  currency: { code: string };
  language: { id: number; code: string };
  market: { id: number };
  prices_include_vat: boolean;
  STORE_NAME?: string;
  SHOP_LOGO?: string;
  /** Store settings live here in Surface v2: { SHOP_LOGO, STORE_NAME }. */
  configuration?: { SHOP_LOGO?: string | null; STORE_NAME?: string | null } | null;
  /** Countries the store accepts, used for the country_id field in account forms. */
  countries?: { id: number; code: string; name: string }[];
};

export type CategoryQuery = {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: string;
  /** Selected tag filter values, sent as tags[]=64&tags[]=81. */
  tags?: (string | number)[];
  /** Selected spec filter values, sent as f[44][]=Bomull. */
  specs?: Record<string, string[]>;
  /** Price range from the type 2 filter, sent as pfrom/pto. */
  pfrom?: number;
  pto?: number;
};

export type SearchQuery = {
  page?: number;
  limit?: number;
};

export type SearchResult = {
  products: Product[];
  product_count: number;
  page_index: number;
  page_count: number;
};
