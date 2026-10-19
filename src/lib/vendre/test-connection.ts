import {
  VendreError,
  fetchStoreBaseUrl,
  setMutationProtectionToken,
  surfaceFetch,
} from "./client";


export type StepId = "token" | "cors" | "session" | "read";
export type StepStatus = "ok" | "warning" | "failed" | "skipped";

export type ConnectionStep = {
  id: StepId;
  label: string;
  status: StepStatus;
  detail: string;
};

export type ConnectionResult = {
  ok: boolean;
  steps: ConnectionStep[];
  missing: string[];
  origin: string;
  baseUrl: string | null;
};

const LABELS: Record<StepId, string> = {
  token: "Token",
  cors: "CORS",
  session: "Session",
  read: "Read permissions",
};

function step(id: StepId, status: StepStatus, detail: string): ConnectionStep {
  return { id, label: LABELS[id], status, detail };
}

/**
 * Runs the setup verification chain: token → cors → session → read.
 * Implements .vendre/skills/setup.md step 2/3.
 */
export async function testVendreConnection(): Promise<ConnectionResult> {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const steps: ConnectionStep[] = [];
  let missing: string[] = [];
  let baseUrl: string | null = null;

  // 1. Token (server-side minted; the browser only learns whether it worked).
  try {
    baseUrl = await fetchStoreBaseUrl(true);
    steps.push(step("token", "ok", `Server is connected to ${baseUrl ?? "the store"}`));

  } catch (error) {
    const err = error as VendreError;
    missing = err.missing ?? [];
    const detail = missing.length
      ? `Missing secrets: ${missing.join(", ")}`
      : err.status === 429
        ? "The store is rate limiting (429). Wait a minute and try again."
        : err.status === 401 || err.status === 400
          ? "Client id/secret was rejected — verify them in Vendre Admin."
          : err.message;
    steps.push(step("token", "failed", detail));
    steps.push(step("cors", "skipped", "Not run — no connection."));
    steps.push(step("session", "skipped", "Not run — no connection."));
    steps.push(step("read", "skipped", "Not run — no connection."));
    return { ok: false, steps, missing, origin, baseUrl };
  }

  // 2 + 3. Session bootstrap through our own server proxy.
  const corsOk = true;
  try {
    const res = await surfaceFetch("session/bootstrap", { method: "POST" });
    const body = (await res.json().catch(() => null)) as
      | {
          surface_mutation_protection_token?: string;
          mutationProtectionToken?: string;
          errors?: { title?: string }[];
        }
      | null;

    if (!res.ok) {
      steps.push(
        step(
          "cors",
          "ok",
          "All store requests go through our server — no CORS allowlist is needed for store data.",
        ),
      );
      steps.push(
        step(
          "session",
          "failed",
          body?.errors?.[0]?.title ??
            `session/bootstrap responded ${res.status}. Check the bootstrap and session policies.`,
        ),
      );
      steps.push(step("read", "skipped", "Not run — no session."));
      return { ok: false, steps, missing, origin, baseUrl };
    }

    const token = body?.surface_mutation_protection_token ?? body?.mutationProtectionToken ?? null;
    setMutationProtectionToken(token);
    steps.push(
      step(
        "cors",
        "ok",
        `Store requests go through our server (${origin}). The CORS allowlist is only needed for the checkout session handover.`,
      ),
    );
    steps.push(
      step(
        "session",
        token ? "ok" : "warning",
        token
          ? "Session started and mutation protection token received."
          : "Session started but no mutation protection token was returned.",
      ),
    );
  } catch {
    steps.push(step("cors", "ok", "Store requests go through our server."));
    steps.push(step("session", "failed", "session/bootstrap could not be reached through the server."));
    steps.push(step("read", "skipped", "Not run — no session."));
    return { ok: false, steps, missing, origin, baseUrl };
  }


  // 4. Read permission.
  try {
    const res = await surfaceFetch("navigation/menus");
    if (!res.ok) {
      steps.push(
        step(
          "read",
          "failed",
          `navigation/menus responded ${res.status}. Check the navigation_menus policy and that a menu is published.`,
        ),
      );
      return { ok: false, steps, missing, origin, baseUrl };
    }
    steps.push(step("read", "ok", "Reading navigation/menus works."));
  } catch {
    steps.push(step("read", "failed", "navigation/menus could not be reached — check the navigation_menus policy."));
    return { ok: false, steps, missing, origin, baseUrl };
  }

  const ok = corsOk && steps.every((s) => s.status === "ok" || s.status === "warning");
  return { ok, steps, missing, origin, baseUrl };
}
