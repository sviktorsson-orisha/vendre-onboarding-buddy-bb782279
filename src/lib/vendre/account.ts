/**
 * Customer auth + account adapter (Surface v2).
 *
 * Same demo/live split as src/lib/vendre/api.ts:
 *   demo -> src/mock/vendreAccount.ts
 *   live -> /surface/2/accounts*, login/email, logout
 *
 * Rules from .vendre/knowledge/api-reference.md and .vendre/skills/account-auth.md:
 * - Auth state comes from GET session/context, never from the login response alone.
 * - The mutation token is replaced after login/logout and customer queries invalidated.
 * - Surface-Mutation-Protection-Token on every mutation, including GET forgot-password.
 * - Account data and order history are never cached (staleTime: 0, gcTime: 0).
 * - accounts/me is normalised from flat / nested / alias shapes before use.
 */
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useOnboarding } from "@/context/onboarding-context";
import {
  mockAccount,
  mockAddresses,
  mockOrderDetails,
  mockOrders,
  mockSubUsers,
} from "@/mock/vendreAccount";
import type {
  Account,
  Address,
  AddressBook,
  FieldErrors,
  OrderDetail,
  OrderSummary,
  RegisterInput,
  SubUser,
} from "@/types/vendre-account";
import type { SessionContext } from "@/types/vendre";

import { guarded, resetSessionGate, useSessionContext } from "./api";
import { setMutationProtectionToken, surfaceFetch } from "./client";

/* ------------------------------------------------------------- errors ---- */

export class VendreAccountError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: FieldErrors = {},
  ) {
    super(message);
    this.name = "VendreAccountError";
  }
}

type SurfaceErrors = {
  errors?: { code?: string; title?: string; status?: string; source?: { parameter?: string } }[];
};

async function call<T>(path: string, init: RequestInit & { method?: string } = {}): Promise<T> {
  const res = await surfaceFetch(path, init);
  const body = (await res.json().catch(() => null)) as (T & SurfaceErrors) | null;

  if (!res.ok) {
    const fields: FieldErrors = {};
    for (const error of body?.errors ?? []) {
      const parameter = error.source?.parameter;
      if (parameter && error.title) fields[parameter] = error.title;
    }
    const first = body?.errors?.[0];
    throw new VendreAccountError(
      first?.title ?? `Surface-anrop misslyckades (${res.status})`,
      res.status,
      fields,
    );
  }

  return body as T;
}

/* -------------------------------------------------------- normalising ---- */

type Bag = Record<string, unknown>;

function isBag(value: unknown): value is Bag {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Flattens the account payload across the flat / nested response shapes. */
function flatten(payload: unknown): Bag {
  if (!isBag(payload)) return {};
  const out: Bag = { ...payload };
  for (const key of ["account", "customer", "address", "default_address", "data", "attributes", "order"]) {
    const nested = payload[key];
    if (isBag(nested)) Object.assign(out, flatten(nested));
  }
  return out;
}

function pick(bag: Bag, keys: string[]): string {
  for (const key of keys) {
    const value = bag[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return "";
}

/**
 * The country can arrive as an id, an ISO code, a name, or an object
 * ({ id, code, name }) depending on the endpoint.
 */
function pickCountry(bag: Bag): string {
  const keys = ["country_id", "countries_id", "country", "country_code", "country_name"];
  for (const key of keys) {
    const value = bag[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
    if (isBag(value)) {
      const inner = pick(value as Bag, ["id", "code", "name"]);
      if (inner) return inner;
    }
  }
  return "";
}

export function normalizeAccount(payload: unknown): Account {
  const bag = flatten(payload);
  return {
    firstname: pick(bag, ["firstname", "first_name", "given_name"]),
    lastname: pick(bag, ["lastname", "last_name", "family_name"]),
    email: pick(bag, ["email", "email_address"]),
    telephone: pick(bag, ["telephone", "phone"]),
    mobile: pick(bag, ["mobile", "cellphone", "phone_mobile"]),
    company: pick(bag, ["company", "company_name"]),
    street_address: pick(bag, ["street_address", "street", "address", "address_1"]),
    street_address2: pick(bag, ["street_address2", "address_2", "street2"]),
    postcode: pick(bag, ["postcode", "zip", "postal_code", "zipcode"]),
    city: pick(bag, ["city", "town"]),
    country: pickCountry(bag),
    personnummer: pick(bag, ["personnummer", "social_security_number"]),
    type: pick(bag, ["type", "customer_type"]) || "private",
    newsletter: Boolean(bag["newsletter"]),
    raw: bag,
  };
}

function normalizeAddress(payload: unknown, index: number): Address {
  const bag = flatten(payload);
  const account = normalizeAccount(payload);
  return {
    id: (bag["id"] as string | number) ?? index,
    label: pick(bag, ["label", "name", "type"]),
    firstname: account.firstname,
    lastname: account.lastname,
    company: account.company,
    street_address: account.street_address,
    postcode: account.postcode,
    city: account.city,
    country: account.country,
    telephone: account.telephone || account.mobile,
    is_default_shipping: Boolean(bag["is_default_shipping"] ?? bag["default_shipping"]),
    is_default_billing: Boolean(bag["is_default_billing"] ?? bag["default_billing"]),
    raw: bag,
  };
}

function asArray(payload: unknown, ...keys: string[]): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (isBag(payload)) {
    for (const key of keys) {
      const value = payload[key];
      if (Array.isArray(value)) return value;
    }
  }
  return [];
}

const ADDRESS_LIST_KEYS = [
  "addresses",
  "address_book",
  "addressbook",
  "address_list",
  "items",
  "entries",
  "results",
  "rows",
  "data",
];

function looksLikeAddress(value: unknown): boolean {
  if (!isBag(value)) return false;
  const bag = flatten(value);
  return ["street_address", "street", "postcode", "zip", "city", "address_1"].some(
    (key) => typeof bag[key] === "string" && (bag[key] as string).trim(),
  );
}

/**
 * The address book comes back as an array, as an object wrapping one of many
 * list keys (sometimes one level deeper), or as an object keyed by address id.
 */
function extractAddressList(payload: unknown, depth = 0): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isBag(payload) || depth > 2) return [];

  for (const key of ADDRESS_LIST_KEYS) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (isBag(value)) {
      const nested = extractAddressList(value, depth + 1);
      if (nested.length) return nested;
    }
  }

  // Object keyed by id: { "12": {...}, "13": {...} }
  const values = Object.values(payload);
  if (values.length && values.every(looksLikeAddress)) return values;

  // Single address object returned bare.
  if (looksLikeAddress(payload)) return [payload];

  for (const value of values) {
    if (isBag(value) || Array.isArray(value)) {
      const nested = extractAddressList(value, depth + 1);
      if (nested.length) return nested;
    }
  }

  return [];
}

function dedupeAddresses(list: Address[]): Address[] {
  const seen = new Set<string>();
  return list.filter((address) => {
    const key = [
      address.id,
      address.street_address,
      address.postcode,
      address.city,
    ]
      .join("|")
      .toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}


function normalizeOrder(payload: unknown, index: number): OrderSummary {
  const bag = flatten(payload);
  return {
    id: (bag["id"] as string | number) ?? index,
    order_number: pick(bag, ["order_number", "orders_id", "number", "id"]),
    date: pick(bag, ["date", "date_purchased", "created_at", "order_date"]),
    status: pick(bag, ["status", "order_status", "state"]),
    total: pick(bag, ["total", "order_total", "grand_total", "sum"]),
  };
}

/** Pulls an image path out of the many shapes a store can use on an order line. */
function pickLineImage(bag: Bag): string | null {
  const direct = pick(bag, ["image", "image_url", "thumbnail", "thumb", "picture", "photo"]);
  if (direct) return direct;
  for (const key of ["image", "images", "media"]) {
    const value = bag[key];
    if (isBag(value)) {
      const nested = pick(value, ["image", "path", "url", "src"]);
      if (nested) return nested;
    }
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0];
      if (typeof first === "string" && first.trim()) return first;
      if (isBag(first)) {
        const nested = pick(first, ["image", "path", "url", "src"]);
        if (nested) return nested;
      }
    }
  }
  return null;
}

/** Total rows come either as a `totals` array or as single fields on the order. */
function normalizeTotals(bag: Bag): { title: string; value: string }[] {
  const raw = asArray(bag["totals"] ?? bag["order_totals"] ?? bag["summary"]);
  return raw
    .map((entry) => {
      const totalBag = flatten(entry);
      return {
        title: pick(totalBag, ["title", "label", "name", "text"]),
        value: pick(totalBag, ["text", "value", "value_formatted", "amount", "total"]),
      };
    })
    .filter((row) => row.title || row.value);
}

/**
 * Order lines only carry raw numbers (`price_each` / `price_total`, excl. VAT)
 * while the totals rows are pre-formatted by the store. Reuse a total row as the
 * formatting sample so line prices look like the rest of the order.
 */
function moneyFormatter(sample: string) {
  const trimmed = (sample ?? "").trim();
  const match = /^([^\d\s-]*)\s*[-\d\s.,\u00a0]+\s*([^\d\s]*)$/.exec(trimmed);
  const prefix = match?.[1] ?? "";
  const suffix = match?.[2] ?? "";
  // Follow the store's own rounding: if the totals are shown without decimals,
  // the line prices must be too, otherwise the rows and the total look
  // inconsistent (e.g. "399,20 kr" rows under a "752 kr" total).
  const decimals = /[.,](\d+)\s*[^\d]*$/.exec(trimmed)?.[1]?.length ?? 0;
  return (value: number) => {
    const number = new Intl.NumberFormat("sv-SE", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
    return [prefix, number, suffix].filter(Boolean).join(prefix && !suffix ? "" : " ").trim();
  };
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/\s|\u00a0/g, "").replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizeOrderDetail(payload: unknown, id: string): OrderDetail {
  const bag = flatten(payload);
  const summary = normalizeOrder(payload, 0);
  const totals = normalizeTotals(bag);
  const format = moneyFormatter(totals[totals.length - 1]?.value ?? summary.total ?? "");
  const lines = asArray(
    bag["products"] ?? bag["order_products"] ?? bag["lines"] ?? bag["items"] ?? bag["rows"],
  ).map((line, index) => {
    const lineBag = flatten(line);
    const quantity = Number(lineBag["quantity"] ?? lineBag["qty"] ?? 1);
    const formatted = pick(lineBag, [
      "total_final_price",
      "final_price",
      "row_total",
      "total",
      "price",
    ]);
    const each = toNumber(lineBag["price_each"]);
    const rowExcl = toNumber(lineBag["price_total"]) ?? (each != null ? each * quantity : null);
    const tax = toNumber(lineBag["tax"]) ?? 0;
    const rowIncl = rowExcl != null ? rowExcl * (1 + tax / 100) : null;
    return {
      id: (lineBag["id"] as string | number) ?? index,
      product_id: toNumber(lineBag["product_id"]),
      name: pick(lineBag, ["name", "product_name", "title", "model"]),
      quantity,
      price: rowIncl != null ? format(rowIncl) : formatted,
      price_incl: rowIncl != null ? format(rowIncl) : formatted,
      price_excl: rowExcl != null ? format(rowExcl) : "",
      image: pickLineImage(lineBag),
    };
  });
  return {
    ...summary,
    id: summary.id || id,
    order_number: summary.order_number || id,
    lines,
    totals,
    shipping_total: pick(bag, ["shipping_total", "shipping"]),
    tax_total: pick(bag, ["tax_total", "tax"]),
    shipping_address: bag["shipping_address"]
      ? normalizeAddress(bag["shipping_address"], 0)
      : null,
    billing_address: bag["billing_address"] ? normalizeAddress(bag["billing_address"], 1) : null,
  };
}

function normalizeSubUser(payload: unknown, index: number): SubUser {
  const bag = flatten(payload);
  const account = normalizeAccount(payload);
  return {
    id: (bag["id"] as string | number) ?? index,
    name: [account.firstname, account.lastname].filter(Boolean).join(" ") || pick(bag, ["name"]),
    email: account.email,
    role: pick(bag, ["role", "type", "permission"]),
  };
}

/**
 * Order lines have no image at all — only `product_id`. Look the images up in a
 * single VQL call. A failure here must never break the order view.
 */
async function withLineImages(lines: OrderDetail["lines"]): Promise<OrderDetail["lines"]> {
  const ids = Array.from(
    new Set(lines.map((line) => line.product_id).filter((id): id is number => !!id)),
  );
  if (ids.length === 0) return lines;
  try {
    const data = await guarded(() =>
      call<{ query?: { products?: { id: number; image?: { href?: string | null } | null }[] } }>(
        "vql",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            query: {
              products: {
                filters: { where: { id: ids } },
                fields: ["id", { image: { fields: ["id", "name", "href"] } }],
              },
            },
          }),
        },
      ),
    );
    const byId = new Map<number, string | null>(
      (data?.query?.products ?? []).map((product) => [product.id, product.image?.href ?? null]),
    );
    return lines.map((line) =>
      line.image || !line.product_id
        ? line
        : { ...line, image: byId.get(line.product_id) ?? null },
    );
  } catch {
    return lines;
  }
}

/* ------------------------------------------------------- register body --- */

/**
 * Fallback country ids (ISO 3166-1 numeric), used only when the store session
 * does not carry a `countries` list. The live list comes from
 * GET session/context and is read through useCountryOptions().
 */
export const COUNTRY_IDS: Record<string, number> = {
  SE: 752,
  NO: 578,
  DK: 208,
  FI: 246,
  DE: 276,
};

/** Fallback country choices, replaced by the store's own list when present. */
export const COUNTRY_OPTIONS: { id: number; label: string }[] = [
  { id: 752, label: "Sweden" },
  { id: 578, label: "Norway" },
  { id: 208, label: "Denmark" },
  { id: 246, label: "Finland" },
  { id: 276, label: "Germany" },
];

/** Default country id used before the customer picks one. */
export const DEFAULT_COUNTRY_ID = COUNTRY_IDS["SE"]!;

/**
 * Country options for the register and edit-account forms. The store ships the
 * full list in session/context; the fixed list above is only a fallback.
 */
export function useCountryOptions(): { id: number; label: string }[] {
  const session = useSessionContext();
  const countries = session.data?.countries;
  if (!countries || countries.length === 0) return COUNTRY_OPTIONS;
  return countries
    .map((country) => ({ id: country.id, label: country.name || country.code }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * The store returns the account's country as an id, an ISO code or a plain
 * name, so match on all three before the select can preselect it.
 */
export function matchCountryOption(
  value: string | number | null | undefined,
  options: { id: number; label: string }[],
  countries?: { id: number; code: string; name: string }[],
): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const byId = options.find((option) => String(option.id) === raw);
  if (byId) return String(byId.id);
  const lower = raw.toLowerCase();
  const byName = options.find((option) => option.label.toLowerCase() === lower);
  if (byName) return String(byName.id);
  const byCode = countries?.find((country) => country.code.toLowerCase() === lower);
  if (byCode) return String(byCode.id);
  const fallback = COUNTRY_IDS[raw.toUpperCase()];
  return fallback && options.some((option) => option.id === fallback) ? String(fallback) : "";
}

/** The raw country list from the session, for code-based matching. */
export function useCountryList(): { id: number; code: string; name: string }[] {
  return useSessionContext().data?.countries ?? [];
}




function countryId(value: string | number | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = String(value ?? "").trim();
  if (/^\d+$/.test(raw)) return Number(raw);
  return COUNTRY_IDS[raw.toUpperCase()] ?? COUNTRY_IDS["SE"]!;
}

/* ------------------------------------------ registration constraints --- */

/**
 * Which fields the create-account form shows, which are required and their
 * length limits. Filled from GET /surface/2/accounts/form, which mirrors the
 * store's admin settings (company, personnummer, VAT number and so on).
 */
export type RegisterConstraints = {
  visible: string[];
  required: string[];
  limits: Record<string, { min?: number; max?: number }>;
};

/** Fields the register form knows how to render, keyed by our own field name. */
export const REGISTER_FIELDS = [
  "firstname",
  "lastname",
  "email_address",
  "password",
  "confirmation",
  "personnummer",
  "company",
  "telephone",
  "mobile",
  "street_address",
  "street_address2",
  "postcode",
  "city",
  "country_id",
] as const;

/** Optional fields that are only sent when the visitor filled them in. */
const OPTIONAL_FIELDS = [
  "personnummer",
  "company",
  "telephone",
  "mobile",
  "street_address2",
];

/** Used until (or unless) the store answers on accounts/form. */
export const DEFAULT_REGISTER_CONSTRAINTS: RegisterConstraints = {
  visible: [
    "firstname",
    "lastname",
    "email_address",
    "password",
    "confirmation",
    "personnummer",
    "street_address",
    "postcode",
    "city",
    "country_id",
    "consent_personal_data_policy",
  ],
  required: [
    "firstname",
    "lastname",
    "email_address",
    "password",
    "confirmation",
    "personnummer",
    "street_address",
    "postcode",
    "city",
    "country_id",
    "consent_personal_data_policy",
  ],
  limits: {},
};

type FormFieldRule = {
  display?: boolean;
  required?: boolean;
  min_length?: number;
  max_length?: number;
};

/**
 * Normalises the accounts/form payload into `RegisterConstraints`. Fields the
 * form cannot render are ignored; the policy consent is a frontend concern and
 * always stays on.
 */
export function normalizeRegisterConstraints(payload: unknown): RegisterConstraints {
  if (!isBag(payload)) return DEFAULT_REGISTER_CONSTRAINTS;

  const visible: string[] = [];
  const required: string[] = [];
  const limits: RegisterConstraints["limits"] = {};

  for (const [rawKey, rawRule] of Object.entries(payload)) {
    const key = rawKey;
    if (!(REGISTER_FIELDS as readonly string[]).includes(key)) continue;
    if (!isBag(rawRule)) continue;
    const rule = rawRule as FormFieldRule;
    if (rule.display === false) continue;

    visible.push(key);
    if (rule.required) required.push(key);
    const min = typeof rule.min_length === "number" && rule.min_length > 0 ? rule.min_length : undefined;
    const max = typeof rule.max_length === "number" && rule.max_length > 0 ? rule.max_length : undefined;
    if (min !== undefined || max !== undefined) limits[key] = { ...(min !== undefined && { min }), ...(max !== undefined && { max }) };
  }

  if (visible.length === 0) return DEFAULT_REGISTER_CONSTRAINTS;

  // Not a store field: the policy consent is always shown and always required.
  visible.push("consent_personal_data_policy");
  required.push("consent_personal_data_policy");

  return { visible, required, limits };
}

/**
 * Maps the registration form to the payload the store accepts. The store
 * validates the whole body and answers SURFACE_ACCOUNT_MALFORMED_BODY (422)
 * when a field it requires is missing. Optional fields are only sent when
 * filled; sending them blank is rejected too.
 */
export function buildRegisterBody(
  input: RegisterInput,
  constraints: RegisterConstraints = DEFAULT_REGISTER_CONSTRAINTS,
): Record<string, unknown> {
  const isBusiness = Number(input.customer_type ?? 0) === 1;
  const body: Record<string, unknown> = {
    email_address: input.email_address.trim(),
    password: input.password,
    confirmation: input.confirmation,
    firstname: input.firstname.trim(),
    lastname: input.lastname.trim(),
    street_address: input.street_address.trim(),
    postcode: input.postcode.trim(),
    city: input.city.trim(),
    // The store rejects `country`; the only accepted key is `country_id`.
    country_id: countryId(input.country_id),
    // Customer type: 0 = private person, 1 = business.
    type: isBusiness ? 1 : 0,
    consent_personal_data_policy: Boolean(input.consent_personal_data_policy),
  };

  for (const field of OPTIONAL_FIELDS) {
    // Company name and VAT number only apply to business customers.
    if (!isBusiness && field === "company") continue;
    // Every other optional field follows the store's own accounts/form list.
    if (!constraints.visible.includes(field)) continue;
    const value = String((input as Record<string, unknown>)[field] ?? "").trim();
    if (value) body[field] = value;
  }

  return body;
}







/** True when the account is a business customer (the store answers "business"). */
export function isBusinessAccount(account: Pick<Account, "type">): boolean {
  const value = String(account.type ?? "").toLowerCase();
  return value === "business" || value === "company" || value === "1";
}

/**
 * Maps the edit-account form to the PUT accounts/me body. Same rules as
 * registration minus password/confirmation: only fields the store shows are
 * sent, blank optionals are left out, and company/VAT are business-only.
 * The store accepts `country_id` here just like on create (verified live).
 */
export function buildAccountBody(
  account: Account,
  constraints: RegisterConstraints = DEFAULT_REGISTER_CONSTRAINTS,
): Record<string, unknown> {
  const isBusiness = isBusinessAccount(account);
  const body: Record<string, unknown> = {
    firstname: account.firstname.trim(),
    lastname: account.lastname.trim(),
    email_address: account.email.trim(),
    street_address: account.street_address.trim(),
    postcode: account.postcode.trim(),
    city: account.city.trim(),
    country_id: countryId(account.country),
    type: isBusiness ? 1 : 0,
  };

  for (const field of OPTIONAL_FIELDS) {
    if (!isBusiness && field === "company") continue;
    if (!constraints.visible.includes(field)) continue;
    const value = String((account as unknown as Record<string, unknown>)[field] ?? "").trim();
    if (value) body[field] = value;
  }

  return body;
}

/* ------------------------------------------------------------- adapter --- */

/**
 * Login/logout response. Surface v2 standardised these on snake_case; the
 * camelCase spellings are kept as a fallback for installs on the older build.
 */
type LoginResponse = {
  mutation_protection_token?: string;
  mutationProtectionToken?: string;
};

function freshToken(data: LoginResponse | null | undefined) {
  return data?.mutation_protection_token ?? data?.mutationProtectionToken ?? null;
}

/** "pending" = the store created the account inactive, awaiting review. */
export type RegisterResult = { status: "active" | "pending" };

const PENDING_WORDS = ["pending", "inactive", "awaiting", "review", "not_active", "disabled"];
const ACTIVE_WORDS = ["active", "approved", "ok", "created", "complete"];

/**
 * Reads the account status out of a create-account response. Stores differ:
 * the status may sit at the top level or inside `account`/`customer`/`data`,
 * and some report a boolean `active` flag instead of a status string.
 */
function registrationStatus(payload: unknown): "active" | "pending" | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;

  for (const key of ["status", "account_status", "state"]) {
    const value = record[key];
    if (typeof value === "string") {
      const text = value.toLowerCase();
      if (PENDING_WORDS.some((word) => text.includes(word))) return "pending";
      if (ACTIVE_WORDS.some((word) => text === word)) return "active";
    }
  }

  for (const key of ["active", "is_active", "enabled", "approved"]) {
    const value = record[key];
    if (typeof value === "boolean") return value ? "active" : "pending";
    if (value === 0 || value === "0") return "pending";
    if (value === 1 || value === "1") return "active";
  }

  for (const key of ["account", "customer", "data"]) {
    const nested = registrationStatus(record[key]);
    if (nested) return nested;
  }

  return null;
}

/**
 * Reads the registration field list from the store (GET accounts/form) so the
 * form mirrors the admin settings. Cached per page load; a failure falls back
 * to the documented default set so sign-up keeps working.
 */
let constraintsCache: Promise<RegisterConstraints> | null = null;

function loadRegisterConstraints(): Promise<RegisterConstraints> {
  constraintsCache ??= guarded(() => call<unknown>("accounts/form"))
    .then(normalizeRegisterConstraints)
    .catch(() => {
      constraintsCache = null;
      return DEFAULT_REGISTER_CONSTRAINTS;
    });
  return constraintsCache;
}


/** Main-address payload in the shape the store accepts. */
function addressBody(address: Address): Record<string, unknown> {
  return {
    id: address.id,
    firstname: address.firstname,
    lastname: address.lastname,
    company: address.company,
    street_address: address.street_address,
    postcode: address.postcode,
    city: address.city,
    country_id: countryId(address.country),
    telephone: address.telephone,
  };
}

function putMainAddress(body: Record<string, unknown>) {
  return call("accounts/me/addresses", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ addresses: [body] }),
  });
}

/**
 * The store drops `company` from the create-account body whenever the field is
 * switched off in admin, so a business customer's company name would be lost.
 * Writing it onto the freshly created main address keeps it.
 */
async function saveCompanyOnAddress(company: string) {
  const data = await call<unknown>("accounts/me/addresses");
  const current = extractAddressList(data).map(normalizeAddress)[0];
  if (!current) return;
  await putMainAddress({ ...addressBody(current), company });
}

export type AccountApi = {
  mode: "demo" | "live";
  getSession: () => Promise<{ authenticated: boolean; name: string }>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (input: RegisterInput) => Promise<RegisterResult>;
  getRegisterConstraints: () => Promise<RegisterConstraints>;
  forgotPassword: (email: string) => Promise<void>;
  getAccount: () => Promise<Account>;
  updateAccount: (account: Account) => Promise<void>;
  getAddresses: () => Promise<AddressBook>;
  updateAddress: (address: Address) => Promise<void>;
  getOrders: () => Promise<OrderSummary[]>;
  getOrder: (id: string) => Promise<OrderDetail | null>;
  getSubUsers: () => Promise<SubUser[]>;
};

const liveAccountApi: AccountApi = {
  mode: "live",
  getSession: async () => {
    const context = await guarded(() => call<SessionContext>("session/context"));
    const name = [context.customer?.first_name, context.customer?.last_name]
      .filter(Boolean)
      .join(" ");
    return { authenticated: Boolean(context.authenticated), name };
  },
  login: async (email, password) => {
    const data = await guarded(() =>
      call<LoginResponse>("login/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      }),
    );
    const token = freshToken(data);
    if (token) setMutationProtectionToken(token);
  },
  logout: async () => {
    const data = await guarded(() => call<LoginResponse>("logout", { method: "POST" }));
    const token = freshToken(data);
    if (token) setMutationProtectionToken(token);
    else resetSessionGate();
  },
  getRegisterConstraints: () => loadRegisterConstraints(),
  register: async (input) => {
    const constraints = await loadRegisterConstraints();
    const data = await guarded(() =>
      call<unknown>("accounts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildRegisterBody(input, constraints)),
      }),
    );

    const company = String(input.company ?? "").trim();
    if (Number(input.customer_type ?? 0) === 1 && company) {
      // Registration is signed in straight away, so the address write works
      // here; a failure must never break an otherwise successful sign-up.
      try {
        await saveCompanyOnAddress(company);
      } catch {
        /* keep the account, the company name can be set from My account */
      }
    }

    const explicit = registrationStatus(data);
    if (explicit) return { status: explicit };

    // The answer did not say either way: an approved account is signed in
    // straight away, a pending one is not. Ask the store which it is.
    resetSessionGate();
    try {
      const context = await guarded(() => call<SessionContext>("session/context"));
      return { status: context.authenticated ? "active" : "pending" };
    } catch {
      return { status: "pending" };
    }
  },

  forgotPassword: async (email) => {
    await guarded(() =>
      call(`accounts/me/forgot-password?email=${encodeURIComponent(email)}`),
    );
  },
  getAccount: () => guarded(() => call<unknown>("accounts/me")).then(normalizeAccount),
  updateAccount: async (account) => {
    const constraints = await loadRegisterConstraints();
    const body = buildAccountBody(account, constraints);

    await guarded(() =>
      call("accounts/me", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
  },
  getAddresses: async () => {
    /** Fetches one candidate endpoint, logging the raw shape in dev. */
    const probe = async (path: string): Promise<Address[]> => {
      try {
        const data = await guarded(() => call<unknown>(path));
        if (import.meta.env.DEV) {
          console.debug(`[vendre] ${path} raw response`, data);
        }
        return dedupeAddresses(extractAddressList(data).map(normalizeAddress));
      } catch (error) {
        if (import.meta.env.DEV) {
          console.debug(`[vendre] ${path} failed`, error);
        }
        return [];
      }
    };

    // `accounts/me/addresses` holds the customer's main address; the address
    // book holds the alternative addresses. Keep them apart.
    const [main, alternatives] = await Promise.all([
      probe("accounts/me/addresses"),
      probe("accounts/me/address-book"),
    ]);
    return { main: main[0] ?? null, alternatives };
  },


  updateAddress: async (address) => {
    // The store only accepts the wrapped `{ addresses: [...] }` shape with
    // `country_id`; a flat body answers 422 SURFACE_ACCOUNT_MALFORMED_BODY.
    await guarded(() => putMainAddress(addressBody(address)));
  },
  getOrders: () =>
    guarded(() => call<unknown>("accounts/me/order-history")).then((data) =>
      asArray(data, "orders", "order_history", "data").map(normalizeOrder),
    ),
  getOrder: async (id) => {
    const data = await guarded(() => call<unknown>(`accounts/me/order-history/${id}`));
    const order = normalizeOrderDetail(data, id);
    return { ...order, lines: await withLineImages(order.lines) };
  },
  getSubUsers: () =>
    guarded(() => call<unknown>("accounts/me/users"))
      .then((data) => asArray(data, "users", "data").map(normalizeSubUser))
      .catch(() => []),
};

/* ---------------------------------------------------------------- demo --- */

let demoAuthenticated = false;
let demoAccount: Account = { ...mockAccount };
let demoAddresses: Address[] = mockAddresses.map((address) => ({ ...address }));
const demoListeners = new Set<() => void>();

function emitDemo() {
  for (const listener of demoListeners) listener();
}

export function useDemoAuthenticated() {
  return useSyncExternalStore(
    (listener) => {
      demoListeners.add(listener);
      return () => demoListeners.delete(listener);
    },
    () => demoAuthenticated,
    () => false,
  );
}

const demoAccountApi: AccountApi = {
  mode: "demo",
  getSession: async () => ({
    authenticated: demoAuthenticated,
    name: `${demoAccount.firstname} ${demoAccount.lastname}`.trim(),
  }),
  login: async () => {
    demoAuthenticated = true;
    emitDemo();
  },
  logout: async () => {
    demoAuthenticated = false;
    emitDemo();
  },
  register: async (input) => {
    demoAccount = {
      ...demoAccount,
      firstname: input.firstname,
      lastname: input.lastname,
      email: input.email_address,
      street_address: input.street_address,
      postcode: input.postcode,
      city: input.city,
      country: String(input.country_id),
    };
    demoAuthenticated = true;
    emitDemo();
    return { status: "active" };
  },
  getRegisterConstraints: async () => DEFAULT_REGISTER_CONSTRAINTS,

  forgotPassword: async () => {},
  getAccount: async () => demoAccount,
  updateAccount: async (account) => {
    demoAccount = { ...account };
    emitDemo();
  },
  getAddresses: async () => ({
    main: demoAddresses[0] ?? null,
    alternatives: demoAddresses.slice(1),
  }),
  updateAddress: async (address) => {
    demoAddresses = demoAddresses.map((item) => (item.id === address.id ? address : item));
    emitDemo();
  },
  getOrders: async () => mockOrders,
  getOrder: async (id) => mockOrderDetails[id] ?? null,
  getSubUsers: async () => mockSubUsers,
};

/* --------------------------------------------------------------- hooks --- */

export function useAccountApi(): AccountApi {
  const { isConfigured } = useOnboarding();
  return useMemo(() => (isConfigured ? liveAccountApi : demoAccountApi), [isConfigured]);
}

const NO_CACHE = { staleTime: 0, gcTime: 0 } as const;

export function useAuth() {
  const api = useAccountApi();
  const demoAuth = useDemoAuthenticated();

  // Live mode reads the session that the storefront already fetches, so a page
  // load makes one GET session/context call instead of two identical ones.
  const session = useSessionContext();
  const demoQuery = useQuery({
    queryKey: ["vendre", "demo", "auth", demoAuth],
    queryFn: () => demoAccountApi.getSession(),
    enabled: api.mode === "demo",
    ...NO_CACHE,
  });

  if (api.mode === "demo") {
    return {
      mode: api.mode,
      isLoading: demoQuery.isLoading,
      isAuthenticated: demoQuery.data?.authenticated ?? false,
      name: demoQuery.data?.name ?? "",
    };
  }

  const customer = session.data?.customer;
  return {
    mode: api.mode,
    isLoading: session.isLoading,
    isAuthenticated: Boolean(session.data?.authenticated),
    name: [customer?.first_name, customer?.last_name].filter(Boolean).join(" "),
  };
}

export function useAccountMutations() {
  const api = useAccountApi();
  const queryClient = useQueryClient();

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["vendre", api.mode] });
  }, [api.mode, queryClient]);

  const login = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.login(email, password),
    onSuccess: invalidate,
  });

  const logout = useMutation({
    mutationFn: () => api.logout(),
    onSuccess: invalidate,
  });

  const register = useMutation({
    mutationFn: (input: RegisterInput) => api.register(input),
    onSuccess: invalidate,
  });

  const forgotPassword = useMutation({
    mutationFn: (email: string) => api.forgotPassword(email),
  });

  const updateAccount = useMutation({
    mutationFn: (account: Account) => api.updateAccount(account),
    onSuccess: invalidate,
  });

  const updateAddress = useMutation({
    mutationFn: (address: Address) => api.updateAddress(address),
    onSuccess: invalidate,
  });

  return { login, logout, register, forgotPassword, updateAccount, updateAddress };
}

/**
 * The store decides which registration fields are shown and required. Cached
 * for the session — it is configuration, not customer data.
 */
export function useRegisterConstraints() {
  const api = useAccountApi();
  return useQuery({
    queryKey: ["vendre", api.mode, "register-constraints"],
    queryFn: () => api.getRegisterConstraints(),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Customer data only exists for a signed-in visitor. Without this gate a
 * signed-out (or pending, not yet approved) visitor fires accounts/me,
 * addresses and order calls that can only answer 401.
 */
function useCustomerQueriesEnabled(enabled: boolean) {
  const { isAuthenticated, isLoading, mode } = useAuth();
  return enabled && !isLoading && (isAuthenticated || mode === "demo");
}

export function useAccount(enabled = true) {
  const api = useAccountApi();
  return useQuery({
    queryKey: ["vendre", api.mode, "account"],
    queryFn: () => api.getAccount(),
    enabled: useCustomerQueriesEnabled(enabled),
    ...NO_CACHE,
  });
}

export function useAddresses(enabled = true) {
  const api = useAccountApi();
  return useQuery({
    queryKey: ["vendre", api.mode, "addresses"],
    queryFn: () => api.getAddresses(),
    enabled: useCustomerQueriesEnabled(enabled),
    ...NO_CACHE,
  });
}

export function useOrders(enabled = true) {
  const api = useAccountApi();
  return useQuery({
    queryKey: ["vendre", api.mode, "orders"],
    queryFn: () => api.getOrders(),
    enabled: useCustomerQueriesEnabled(enabled),
    ...NO_CACHE,
  });
}

export function useOrder(id: string | null) {
  const api = useAccountApi();
  return useQuery({
    queryKey: ["vendre", api.mode, "order", id],
    queryFn: () => (id ? api.getOrder(id) : Promise.resolve(null)),
    enabled: useCustomerQueriesEnabled(Boolean(id)),
    ...NO_CACHE,
  });
}

export function useSubUsers(enabled = true) {
  const api = useAccountApi();
  return useQuery({
    queryKey: ["vendre", api.mode, "sub-users"],
    queryFn: () => api.getSubUsers(),
    enabled: useCustomerQueriesEnabled(enabled),
    ...NO_CACHE,
  });
}

