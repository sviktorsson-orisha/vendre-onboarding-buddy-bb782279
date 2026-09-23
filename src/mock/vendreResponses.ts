/**
 * Dummy data used while the store is not connected (Demo Mode).
 *
 * Shapes mirror real responses read from a live Vendre store:
 * navigation/menus, categories/{id}, shopping-cart and session/context.
 * Replace nothing here manually — once CORS and credentials are green the
 * app switches to live data through the same adapter (src/lib/vendre/api.ts).
 */
import type {
  Cart,
  CategoryHeader,
  CategoryQuery,
  CategoryResponse,
  MenuItem,
  PageContent,
  PageTreeNode,
  PageTreeResponse,
  Product,
  ProductVariantType,
  SessionContext,
} from "@/types/vendre";

export const mockSessionContext: SessionContext = {
  authenticated: false,
  cart_item_count: 0,
  customer: null,
  customer_type: "consumer",
  currency: { code: "SEK" },
  language: { id: 1, code: "sv" },
  market: { id: 0 },
  prices_include_vat: true,
  STORE_NAME: "Demo Store",
  countries: [
    { id: 208, code: "DK", name: "Denmark" },
    { id: 246, code: "FI", name: "Finland" },
    { id: 276, code: "DE", name: "Germany" },
    { id: 578, code: "NO", name: "Norway" },
    { id: 752, code: "SE", name: "Sweden" },
  ],
};

export const mockMenus: MenuItem[] = [
  m(90, null, "Kläder", "klader/", true),
  m(163, 90, "Herr", "herr/", true),
  m(166, 163, "Kavajer", "kavajer/", false),
  m(91, 163, "Jackor", "jackor/", false),
  m(92, 163, "T-shirts", "t-shirts/", false),
  m(164, 90, "Dam", "dam/", true),
  m(162, 164, "Klänningar", "klanningar/", false),
  m(120, 164, "Toppar", "toppar/", false),
  m(200, null, "Skor", "skor/", false),
  m(210, null, "Accessoarer", "accessoarer/", false),
  // information_page items are CMS pages (galleries) — footer only.
  p(17, null, "Information", true),
  p(25, 17, "Om oss", false),
  p(30, 17, "Villkor", false),
  p(16, null, "Kundservice", true),
  p(81, 16, "Kontakta oss", false),
  p(84, 16, "Frakt och leverans", false),
  p(80, 16, "Integritetspolicy", false),
];

function p(id: number, parent: number | null, name: string, hasChildren: boolean): MenuItem {
  return {
    id,
    entity_id: id,
    source: "information_page",
    parent_id: parent,
    parent_source: parent ? "information_page" : null,
    menu_type: "information_page",
    name,
    icon: null,
    target: null,
    route: null,
    has_children: hasChildren,
  };
}

/** Demo page descriptions (mirrors `description` from galleries/{id}/pages). */
const mockPages: Record<number, { title: string; description: string }> = {
  17: { title: "Information", description: "<p>Samlad information om butiken. I demoläge visas exempeltext – när Vendre-kopplingen är aktiv hämtas sidans description från butikens CMS-sidor.</p>" },
  25: { title: "Om oss", description: "<p>Vi är en demobutik byggd på Vendre Surface API v2. Den här texten kommer från sidans description (galleries/{id}/pages).</p>" },
  30: { title: "Villkor", description: "<p>Köpvillkor, ångerrätt och returer beskrivs här. Innehållet redigeras i Vendre-administrationen.</p>" },
  16: { title: "Kundservice", description: "<p>Här hittar du hjälp med order, leverans och retur.</p>" },
  81: { title: "Kontakta oss", description: "<p>Mejla support@example.com eller ring 08-000 00 00.</p>" },
  84: { title: "Frakt och leverans", description: "<p>Leveranstid 2–4 arbetsdagar. Fri frakt över 999 kr.</p>" },
  80: { title: "Integritetspolicy", description: "<p>Vi behandlar personuppgifter enligt GDPR.</p>" },
};


/**
 * Demo page tree (GET galleries/pagetree). Mirrors a live store: two real menu
 * headings with children plus a content page ("Inspiration") that is not a menu
 * heading and therefore must not appear in the footer.
 */
export function mockPageTree(): PageTreeResponse {
  const node = (
    id: number,
    parent: number,
    title: string,
    isMenu: boolean,
    children: PageTreeNode[] = [],
  ): PageTreeNode => ({ id, parent_id: parent, title, href: null, is_menu: isMenu, children });

  const tree: PageTreeNode[] = [
    node(17, 0, "Information", true, [node(25, 17, "Om oss", false), node(30, 17, "Villkor", false)]),
    node(16, 0, "Kundservice", true, [
      node(81, 16, "Kontakta oss", false),
      node(84, 16, "Frakt och leverans", false),
      node(80, 16, "Integritetspolicy", false),
    ]),
    node(76, 0, "Inspiration", false, [node(77, 76, "Stilguide", false)]),
  ];

  const flatten = (nodes: PageTreeNode[]): PageTreeNode[] =>
    nodes.flatMap((n) => [n, ...flatten(n.children ?? [])]);

  return { tree, pages: flatten(tree) };
}

export function mockPageContent(id: number): PageContent {
  const page = mockPages[id];
  return {
    id,
    title: page?.title ?? null,
    description:
      page?.description ??
      "<p>Den här sidan finns inte i demodatan. När butiken är kopplad hämtas sidans description från Vendre.</p>",
  };
}


function m(
  id: number,
  parent: number | null,
  name: string,
  target: string,
  hasChildren: boolean,
): MenuItem {
  return {
    id,
    entity_id: id,
    source: "category",
    parent_id: parent,
    parent_source: parent ? "category" : null,
    menu_type: "category",
    name,
    icon: null,
    target,
    route: null,
    has_children: hasChildren,
  };
}

function price(value: number) {
  return `${value} kr`;
}

function product(
  id: number,
  name: string,
  amount: number,
  categoryId: number,
  opts: { original?: number; stock?: number; short?: string; attributes?: Product["attributes"] } = {},
): Product {
  const stock = opts.stock ?? 24;
  return {
    id: String(id),
    name,
    model: `DEMO-${id}`,
    description: `<p>${name} från demosortimentet. Beskrivningen kommer från butikens produktdata när Vendre-kopplingen är aktiv.</p>`,
    description_short: opts.short ?? "Demoprodukt – ersätts av butikens riktiga sortiment.",
    // opts.original = ordinary price; amount then acts as the special (sale) price.
    price: opts.original ? price(opts.original) : price(amount),
    price_raw: opts.original ?? amount,
    price_original: opts.original ? price(opts.original) : price(amount),
    price_original_raw: opts.original ?? amount,
    price_special: opts.original ? price(amount) : null,
    price_special_raw: opts.original ? amount : null,
    final_price_excl_raw: Math.round((amount / 1.25) * 100) / 100,
    tax: 25,
    unit: "st",
    image: null,
    images: [],
    stock_total: stock,
    stock_allow_checkout: stock > 0,
    seo_link: null,
    categories_id: String(categoryId),
    has_attributes: Boolean(opts.attributes?.length),
    child_count: opts.attributes?.length ? opts.attributes.length : 0,
    ...(opts.attributes ? { attributes: opts.attributes } : {}),
    specifications: [
      { id: 1, name: "Material", value: "100% bomull" },
      { id: 2, name: "Tvättråd", value: "40 grader" },
    ],
  };
}

const sizeAttribute: Product["attributes"] = [
  {
    id: 1,
    name: "Storlek",
    values: [
      { id: "s", name: "S" },
      { id: "m", name: "M" },
      { id: "l", name: "L" },
      { id: "xl", name: "XL" },
    ],
  },
];

const products: Product[] = [
  product(1001, "Linnetröja Oversize", 899, 92, { original: 1099, attributes: sizeAttribute }),
  product(1002, "T-shirt med tryck", 299, 92, { attributes: sizeAttribute }),
  product(1003, "Piké i bomull", 549, 92),
  product(1004, "Ullkavaj Marin", 2499, 166, { attributes: sizeAttribute }),
  product(1005, "Blazer Slim Fit", 1899, 166),
  product(1006, "Parkas Vinter", 2999, 91, { original: 3499 }),
  product(1007, "Skinnjacka Svart", 3899, 91, { stock: 0 }),
  product(1008, "Klänning Midi", 1299, 162, { attributes: sizeAttribute }),
  product(1009, "Sommarklänning Blom", 999, 162),
  product(1010, "Topp i siden", 799, 120),
  product(1011, "Sneakers Vit", 1499, 200, { attributes: sizeAttribute }),
  product(1012, "Loafers Brun", 1999, 200),
  product(1013, "Läderbälte", 499, 210),
  product(1014, "Ullhalsduk", 399, 210),
];

function header(id: number, name: string, text = ""): CategoryHeader {
  return {
    id,
    name,
    alternative_name: null,
    text,
    image: null,
    images: [],
    meta_title: null,
    meta_description: null,
    href: null,
  };
}

const categoryHeaders: Record<number, CategoryHeader> = {
  90: header(90, "Kläder", "<p>Hela demosortimentet av kläder.</p>"),
  163: header(163, "Herr"),
  164: header(164, "Dam"),
  166: header(166, "Kavajer"),
  91: header(91, "Jackor"),
  92: header(92, "T-shirts"),
  162: header(162, "Klänningar"),
  120: header(120, "Toppar"),
  200: header(200, "Skor"),
  210: header(210, "Accessoarer"),
};

function descendantIds(id: number): number[] {
  const children = mockMenus.filter((item) => item.parent_id === id).map((item) => item.id);
  return [id, ...children.flatMap(descendantIds)];
}

/** Demo spec value (mirrors a type 4 spec filter from a live store). */
function productMaterial(p: Product): string {
  return (Number(p.id) % 2 === 0 ? "Bomull" : "Lin");
}

/** Filter values a demo product matches (mirrors tag ids from a live store). */
function productTags(p: Product): string[] {
  const sizes = (p.attributes ?? []).flatMap((attr) => attr.values.map((v) => String(v.id)));
  return sizes;
}

/**
 * Demo listing. Sorting, filtering and pagination happen here so the PLP behaves
 * exactly like it does against `GET categories/{id}` in live mode.
 */
export function mockCategory(id: number, query: CategoryQuery = {}): CategoryResponse {
  const ids = new Set(descendantIds(id).map(String));
  const inCategory = products.filter((p) => ids.has(p.categories_id ?? ""));

  const tags = (query.tags ?? []).map(String);
  let list = inCategory.filter((p) => {
    if (tags.length && !tags.some((tag) => productTags(p).includes(tag))) return false;
    for (const values of Object.values(query.specs ?? {})) {
      if (values.length && !values.includes(productMaterial(p))) return false;
    }
    return true;
  });

  const sortBy = query.sort_by ?? "name";
  const sortOrder = (query.sort_order ?? "ASC").toUpperCase() === "DESC" ? -1 : 1;
  list = [...list].sort((a, b) => {
    const diff =
      sortBy === "price"
        ? (a.price_raw ?? 0) - (b.price_raw ?? 0)
        : a.name.localeCompare(b.name, "sv");
    return diff * sortOrder;
  });

  const limit = query.limit && query.limit > 0 ? query.limit : 12;
  const pageCount = Math.max(1, Math.ceil(list.length / limit));
  const pageIndex = Math.min(Math.max(query.page ?? 1, 1), pageCount);
  const paged = list.slice((pageIndex - 1) * limit, pageIndex * limit);

  const count = (tag: string) => inCategory.filter((p) => productTags(p).includes(tag)).length;

  return {
    header: categoryHeaders[id] ?? header(id, "Kategori"),
    product_list: paged,
    product_count: list.length,
    page_index: pageIndex,
    page_count: pageCount,
    page_limit: limit,
    page_limits: [12, 24, 48].map((value) => ({
      name: value,
      limit: value,
      selected: value === limit,
    })),
    sort_by: sortBy,
    sort_order: sortOrder === -1 ? "DESC" : "ASC",
    subcategory_list: mockMenus
      .filter((item) => item.parent_id === id)
      .map((item) => categoryHeaders[item.id] ?? header(item.id, item.name)),
    filters: [
      {
        id: "size",
        name: "Storlek",
        type: 1,
        options: ["s", "m", "l", "xl"]
          .map((value) => ({
            id: value,
            name: value.toUpperCase(),
            count: count(value),
            selected: tags.includes(value),
          }))
          .filter((value) => value.count > 0),
      },
      {
        id: "44",
        name: "Material",
        type: "4",
        options: ["Bomull", "Lin"]
          .map((value) => ({
            id: value,
            name: value,
            count: inCategory.filter((p) => productMaterial(p) === value).length,
          }))
          .filter((value) => value.count > 0),
      },
    ].filter((filter) => filter.options.length > 0),
  };
}

export function mockProduct(id: string): Product | null {
  return products.find((p) => p.id === id) ?? null;
}

/**
 * Demo variants shaped like the VQL response. Each choice points back at the
 * parent product id so the demo cart still works.
 */
export function mockProductVariants(id: string): ProductVariantType[] {
  const product = products.find((p) => p.id === id);
  const attribute = product?.attributes?.[0];
  if (!product || !attribute) return [];
  return [
    {
      id: 1,
      name: attribute.name,
      sort_order: 1,
      product_variant_choices: attribute.values.map((value, index) => ({
        id: index + 1,
        name: value.name,
        sort_order: index + 1,
        products: [{ id: Number(product.id), in_stock: index !== 1, active: true }],
      })),
    },
  ];
}

export function mockFeaturedProducts(count = 4): Product[] {
  return products.slice(0, count);
}

export const mockTopCategories = [90, 200, 210].map((id) => categoryHeaders[id]!);

export const emptyCart: Cart = { products: [], cart_count: 0, cart_total: 0 };

/** Demo search: free-text match on name and model, paginated like a live listing. */
export function mockSearch(query: string, limit = 5, page = 1) {
  const needle = query.trim().toLowerCase();
  const list = needle
    ? products.filter((p) =>
        `${p.name} ${p.model ?? ""}`.toLowerCase().includes(needle),
      )
    : [];
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
