/**
 * Minimal Vendre Surface v2 browser client.
 *
 * Rules:
 * - The browser never talks to the store directly. Every Surface call goes to
 *   our own /api/vendre/surface/* proxy, which adds the OAuth token server-side.
 * - No credential, access token or store URL is exposed to the client.
 * - The mutation protection token lives in a module variable, never localStorage.
 */

let mutationProtectionToken: string | null = null;
let baseUrlState: string | null = null;
let baseUrlInflight: Promise<string | null> | null = null;

export class VendreError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public missing: string[] = [],
  ) {
    super(message);
    this.name = "VendreError";
  }
}

export function getMutationProtectionToken() {
  return mutationProtectionToken;
}

export function setMutationProtectionToken(token: string | null) {
  mutationProtectionToken = token;
}

export function resetVendreClient() {
  mutationProtectionToken = null;
  baseUrlState = null;
  baseUrlInflight = null;
}

/**
 * The store base URL, read from our own status endpoint. Only used for
 * store-hosted links (checkout, images) — never for API calls.
 */
export async function fetchStoreBaseUrl(force = false): Promise<string | null> {
  if (!force && baseUrlState) return baseUrlState;
  if (baseUrlInflight) return baseUrlInflight;

  baseUrlInflight = fetch("/api/vendre/status", { headers: { accept: "application/json" } })
    .then(async (res) => {
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        baseUrl?: string | null;
        missing?: string[];
      };
      if (!res.ok || !data.ok) {
        throw new VendreError(
          "The store is not connected.",
          res.status,
          "not_connected",
          data.missing ?? [],
        );
      }
      baseUrlState = data.baseUrl ? data.baseUrl.replace(/\/+$/, "") : null;
      return baseUrlState;
    })
    .finally(() => {
      baseUrlInflight = null;
    });

  return baseUrlInflight;
}

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Calls a Surface v2 endpoint through our server proxy. `path` is relative to /surface/2/. */
export async function surfaceFetch(
  path: string,
  init: RequestInit & { method?: string } = {},
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  // Mutating calls — plus the documented GET exception — carry the protection token.
  const needsProtection = MUTATING.has(method) || path.startsWith("accounts/me/forgot-password");
  if (needsProtection && mutationProtectionToken) {
    headers.set("Surface-Mutation-Protection-Token", mutationProtectionToken);
  }

  return fetch(`/api/vendre/surface/${path.replace(/^\/+/, "")}`, {
    ...init,
    method,
    headers,
    credentials: "same-origin",
  });
}


export async function surfaceJson<T = unknown>(
  path: string,
  init?: RequestInit & { method?: string },
): Promise<T> {
  const res = await surfaceFetch(path, init);
  const body = (await res.json().catch(() => null)) as
    | (T & { errors?: { code?: string; title?: string; status?: string }[] })
    | null;

  if (!res.ok) {
    const first = body?.errors?.[0];
    throw new VendreError(first?.title ?? `Surface request failed (${res.status})`, res.status, first?.code);
  }

  return body as T;
}
