import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, ChevronDown, Copy, ExternalLink, Loader2, Lock, PartyPopper } from "lucide-react";
import { useRouter } from "@tanstack/react-router";

import { PublishOriginField } from "@/components/vendre/publish-origin-field";
import { LanguagePicker } from "@/components/vendre/language-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOnboarding } from "@/context/onboarding-context";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { useSetupProgress } from "@/lib/vendre/setup-progress";
import { testVendreConnection, type ConnectionResult, type ConnectionStep } from "@/lib/vendre";
import { cn } from "@/lib/utils";

const PROJECT_ID = "b680686f-4945-4ee5-a18e-4b6fffe4e625";
const SECRET_NAMES = ["VENDRE_BASE_URL", "VENDRE_CLIENT_ID", "VENDRE_CLIENT_SECRET"];
/** Labels shown in the guide; the real secret names stay unchanged. */
const SECRET_LABELS: Record<string, string> = {
  VENDRE_CLIENT_ID: "CLIENT_ID",
  VENDRE_CLIENT_SECRET: "CLIENT_SECRET",
};
const secretLabel = (name: string) => SECRET_LABELS[name] ?? name;
const POLICIES = [
  "oauth",
  "bootstrap",
  "session",
  "customer",
  "shopping_cart",
  "checkout",
  "categories",
  "navigation_menus",
  "galleries",
  "vendre_query_language",
  "login",
  "email/contact",
  "default",
];
const TITLE_KEYS: TranslationKey[] = [
  "step1.title",
  "step2.title",
  "step3.title",
  "step4.title",
  "step5.title",
  "step6.title",
];

type GuideState = "done" | "current" | "pending";

/** Once an origin is copied the label stays on "Copied" so the user can keep track. */
function CopyButton({ value }: { value: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={cn("brand-button-ghost", copied && "text-emerald-700")}
      onClick={() => void navigator.clipboard.writeText(value).then(() => setCopied(true))}
    >
      {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}{" "}
      {copied ? t("action.copied") : t("action.copy")}
    </button>
  );
}

function StepResult({ step }: { step: ConnectionStep }) {
  const color =
    step.status === "ok"
      ? "bg-emerald-500"
      : step.status === "warning"
        ? "bg-amber-500"
        : step.status === "failed"
          ? "bg-destructive"
          : "bg-muted-foreground/40";
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-sm">
      <div className="flex items-center gap-2">
        <span className={cn("size-2 shrink-0 rounded-full", color)} />
        <span className="font-medium text-foreground">{step.label}</span>
      </div>
      <p className="mt-1 text-muted-foreground">{step.detail}</p>
    </div>
  );
}

function GuideStep({
  index,
  title,
  state,
  open,
  onToggle,
  verdict,
  children,
}: {
  index: number;
  title: string;
  state: GuideState;
  open: boolean;
  onToggle: () => void;
  verdict: string;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const done = state === "done";
  const current = state === "current";
  return (
    <li
      className={cn(
        "brand-card relative p-5 pl-16 transition-all",
        current && "border-primary/60 ring-2 ring-primary/20",
        state === "pending" && !open && "opacity-70",
      )}
    >
      {index > 1 && (
        <span className="pointer-events-none absolute -top-4 left-[2.3rem] h-4 w-px bg-border" aria-hidden />
      )}
      <span
        className={cn(
          "absolute left-5 top-5 flex size-9 items-center justify-center rounded-lg border font-display text-sm font-bold",
          done
            ? "border-emerald-500 bg-emerald-500 text-primary-foreground"
            : current
              ? "border-transparent bg-primary text-primary-foreground shadow-lg shadow-primary/30"
              : "border-border bg-card text-muted-foreground",
        )}
      >
        {done ? <Check className="size-4" /> : state === "pending" ? <Lock className="size-3.5" /> : index}
      </span>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-2 text-left">
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <span
          className={cn(
            "brand-eyebrow rounded-md px-2 py-0.5",
            done
              ? "bg-emerald-500/10 text-emerald-700"
              : current
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
          )}
        >
          {done ? t("state.done") : current ? t("state.current") : t("state.pending")}
        </span>
        <ChevronDown className={cn("ml-auto size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      <p
        className={cn(
          "mt-1 flex items-center gap-2 text-sm font-medium",
          done ? "text-emerald-700" : current ? "text-primary" : "text-muted-foreground",
        )}
      >
        <span
          className={cn("size-2 rounded-full", done ? "bg-emerald-500" : current ? "bg-primary" : "bg-muted-foreground/40")}
        />
        {verdict}
      </p>
      {open && <div className="mt-4 space-y-4 text-sm text-muted-foreground">{children}</div>}
    </li>
  );
}

function AdminLink({ path, baseUrl, children }: { path: string; baseUrl?: string | null; children: ReactNode }) {
  // Until the store URL is known there is nothing to link to — show the path
  // as plain text and turn it into a real link once the credentials are saved.
  if (!baseUrl) {
    return <span className="font-mono text-xs text-muted-foreground">{children}</span>;
  }
  const href = `${baseUrl.replace(/\/+$/, "")}${path}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 font-mono text-xs text-primary underline underline-offset-4"
    >
      {children}
      <ExternalLink className="size-3" />
    </a>
  );
}


/** The setup guide body. Rendered inside the modal opened from the notice bar. */
export function SetupWizard({ onFinish }: { onFinish?: () => void }) {
  const { t } = useI18n();
  const { markConfigured } = useOnboarding();
  const preview = `https://project--${PROJECT_ID}-dev.lovable.app`;
  const published = `https://project--${PROJECT_ID}.lovable.app`;
  const { progress, loaded, update } = useSetupProgress();
  const router = useRouter();
  // Shared with every visitor/domain: the origin is stored server-side too.
  const publishedOrigin = progress.publishedOrigin;
  const setPublishedOrigin = (value: string) => update({ publishedOrigin: value });
  const [open, setOpen] = useState(0);
  const [checking, setChecking] = useState(false);
  const [secretStatus, setSecretStatus] = useState<{ ok: boolean; missing: string[] } | null>(null);
  const [adminBaseUrl, setAdminBaseUrl] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ConnectionResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const adminDone = progress.adminDone;
  const corsDone = progress.corsDone;
  const setAdminDone = (value: boolean) => update({ adminDone: value });
  const setCorsDone = (value: boolean) => update({ corsDone: value });
  const secretsOk = secretStatus ? secretStatus.ok : progress.secretsOk;
  const connectionOk = result ? result.ok : progress.connectionOk;

  const origins = useMemo(() => {
    const list = [
      publishedOrigin,
      publishedOrigin ? publishedOrigin.replace("https://", "https://preview--") : "",
      published,
      preview,
      `https://id-preview--${PROJECT_ID}.lovable.app`,
      `https://${PROJECT_ID}.lovableproject.com`,
      typeof window !== "undefined" ? window.location.origin : "",
    ].filter(Boolean);
    return Array.from(new Set(list));
  }, [publishedOrigin, preview, published]);

  // Steps 5 and 6 must never go green before CORS has been confirmed.
  const verified = corsDone && connectionOk;
  const done = [adminDone, secretsOk, publishedOrigin !== "", corsDone, verified, verified];
  const total = TITLE_KEYS.length;
  const active = Math.max(done.findIndex((value) => !value), 0);
  const completedCount = done.filter(Boolean).length;
  const states = done.map((value, index): GuideState => (value ? "done" : index === active ? "current" : "pending"));
  const activeTitle = t(TITLE_KEYS[active] ?? "step1.title");

  // Once everything is green the final step opens itself.
  useEffect(() => {
    if (verified) setOpen(5);
  }, [verified]);

  // Resume where the guide was left off after a refresh.
  const [resumed, setResumed] = useState(false);
  useEffect(() => {
    if (!loaded || resumed) return;
    setResumed(true);
    setOpen(active);
  }, [loaded, resumed, active]);

  // Read the stored base URL once so the admin deep links point at the right store.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/vendre/status", { headers: { accept: "application/json" } })
      .then((response) => response.json() as Promise<{ baseUrl?: string | null }>)
      .then((data) => {
        if (!cancelled) setAdminBaseUrl(data.baseUrl ?? null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const checkSecrets = async () => {
    setChecking(true);
    try {
      const response = await fetch("/api/vendre/status", { headers: { accept: "application/json" } });
      const data = (await response.json()) as {
        secretsOk?: boolean;
        ok?: boolean;
        missing?: string[];
        baseUrl?: string | null;
      };
      setAdminBaseUrl(data.baseUrl ?? null);
      const ok = data.secretsOk ?? data.ok ?? false;
      setSecretStatus({ ok, missing: data.missing ?? [] });
      update({ secretsOk: ok });
      if (ok) setOpen(2);
    } catch {
      setSecretStatus({ ok: false, missing: SECRET_NAMES });
      update({ secretsOk: false });
    } finally {
      setChecking(false);
    }
  };


  const runTest = async () => {
    setTesting(true);
    setTestError(null);
    try {
      const next = await testVendreConnection();
      setResult(next);
      await update({ connectionOk: next.ok });
      if (next.ok) setOpen(5);
      // The storefront mode is decided by the root loader — refresh it now so
      // demo data is replaced immediately, without a manual reload.
      await router.invalidate();

    } catch (error) {
      setTestError((error as Error).message);
    } finally {
      setTesting(false);
    }
  };

  const startBuilding = () => {
    markConfigured();
    onFinish?.();
  };

  return (
    <div>
      <header>
        <p className="brand-eyebrow inline-flex rounded-md bg-primary/10 px-3 py-1 text-primary">{t("hero.eyebrow")}</p>
        <h2 className="mt-4 text-3xl font-extrabold leading-tight text-foreground">
          {t("hero.title")} <span className="brand-gradient-text">{t("hero.titleAccent")}</span>
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{t("hero.intro")}</p>
      </header>

      <section className="brand-card mt-8 overflow-hidden bg-card/95 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-bold text-foreground">{t("panel.title")}</h3>
              <span className="brand-eyebrow rounded-md bg-primary/10 px-2.5 py-1 text-primary">
                {t("panel.step", { current: Math.min(active + 1, total), total })}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {verified ? t("panel.verified") : t("panel.progress", { done: completedCount, total })}
            </p>
            {progress.storageOk === false && (
              <p className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {t("panel.storageWarning")}
              </p>
            )}
            {!verified && (
              <p className="mt-3 inline-flex rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground">
                {t("panel.next")} {active + 1}. {activeTitle}
              </p>
            )}
          </div>
          <button type="button" onClick={runTest} disabled={testing || !corsDone} className="brand-button">
            {testing && <Loader2 className="size-4 animate-spin" />}
            {testing ? t("panel.testing") : t("panel.retest")}
          </button>
        </div>
        <div className="mt-5 flex gap-1.5">
          {states.map((state, index) => (
            <span
              key={TITLE_KEYS[index]}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                state === "done"
                  ? "bg-emerald-500"
                  : state === "current"
                    ? "bg-linear-to-r from-primary via-brand-pink to-brand-blue"
                    : "bg-muted",
              )}
            />
          ))}
        </div>
      </section>

      {verified && (
        <section className="brand-card mt-6 border-emerald-500/40 bg-emerald-500/5 p-5">
          <div className="flex items-start gap-3">
            <PartyPopper className="mt-0.5 size-5 text-emerald-600" aria-hidden />
            <div>
              <h3 className="text-lg font-bold text-foreground">{t("complete.title")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("complete.body")}</p>
              <button type="button" className="brand-button mt-4" onClick={startBuilding}>
                {t("complete.cta")}
              </button>
            </div>
          </div>
        </section>
      )}

      <ol className="mt-6 space-y-4">
        <GuideStep
          index={1}
          title={t("step1.title")}
          state={states[0] ?? "current"}
          open={open === 0}
          onToggle={() => setOpen(open === 0 ? -1 : 0)}
          verdict={adminDone ? t("step1.verdictDone") : t("step1.verdict")}
        >
          <p>
            {t("step1.body")} <code className="font-mono text-xs text-foreground">client_secret</code> {t("step1.bodyEnd")}
          </p>
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <p className="font-medium text-foreground">{t("step1.adminPath")}</p>
            <AdminLink path="/Admin/headless/auth/oauth-clients" baseUrl={adminBaseUrl}>/Admin/headless/auth/oauth-clients</AdminLink>
          </div>
          <label className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-foreground">
            <input
              type="checkbox"
              checked={adminDone}
              onChange={(event) => {
                setAdminDone(event.target.checked);
                if (event.target.checked) setOpen(1);
              }}
              className="mt-0.5 size-4 accent-primary"
            />
            {t("step1.check")}
          </label>
        </GuideStep>

        <GuideStep
          index={2}
          title={t("step2.title")}
          state={states[1] ?? "pending"}
          open={open === 1}
          onToggle={() => setOpen(open === 1 ? -1 : 1)}
          verdict={secretStatus?.ok ? t("step2.verdictDone") : t("step2.verdict")}
        >
          <p className="font-medium text-foreground">{t("step2.where")}</p>
          <p>{t("step2.reopen")}</p>
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-3">
            <code className="break-all font-mono text-xs text-foreground">{t("step2.reopenPrompt")}</code>
            <CopyButton value={t("step2.reopenPrompt")} />
          </div>
          <p>{t("step2.body")}</p>
          <ul className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            {SECRET_NAMES.map((name) => {
              const missing = secretStatus?.missing.includes(name);
              return (
                <li key={name}>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        !secretStatus ? "bg-muted-foreground/40" : missing ? "bg-destructive" : "bg-emerald-500",
                      )}
                    />
                    <code className="font-mono text-xs text-foreground">{secretLabel(name)}</code>
                  </div>
                  <p className="mt-1 pl-4 text-xs">
                    {t(name === "VENDRE_BASE_URL" ? "step2.baseUrl" : "step2.clientKeys")}
                  </p>
                </li>
              );
            })}
          </ul>
          <button type="button" className="brand-button" disabled={checking || !adminDone} onClick={checkSecrets}>
            {checking && <Loader2 className="size-4 animate-spin" />}
            {checking ? t("step2.checking") : t("step2.check")}
          </button>
          {secretStatus && !secretStatus.ok && (
            <p className="rounded-md bg-destructive/10 p-3 text-destructive">
              {t("step2.missing")} {secretStatus.missing.map(secretLabel).join(", ")}
            </p>
          )}
        </GuideStep>

        <GuideStep
          index={3}
          title={t("step3.title")}
          state={states[2] ?? "pending"}
          open={open === 2}
          onToggle={() => setOpen(open === 2 ? -1 : 2)}
          verdict={publishedOrigin ? t("step3.verdictDone", { origin: publishedOrigin }) : t("step3.verdict")}
        >
          <ol className="list-decimal space-y-1 pl-5">
            <li>{t("step3.how1")}</li>
            <li>{t("step3.how2")}</li>
            <li className="font-medium text-foreground">{t("step3.how3")}</li>
            <li>{t("step3.how4")}</li>
          </ol>
          <p>{t("step3.note")}</p>
          <PublishOriginField
            origin={publishedOrigin}
            onSave={(value) => {
              setPublishedOrigin(value);
              if (value) setOpen(3);
            }}
          />
          {!publishedOrigin && <p className="text-xs">{t("step3.manual")}</p>}
        </GuideStep>

        <GuideStep
          index={4}
          title={t("step4.title")}
          state={states[3] ?? "pending"}
          open={open === 3}
          onToggle={() => setOpen(open === 3 ? -1 : 3)}
          verdict={corsDone ? t("step4.verdictDone") : t("step4.verdict")}
        >
          <p>{t("step4.intro")}</p>
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <p className="font-medium text-foreground">{t("step4.settings")}</p>
            {adminBaseUrl ? (
              <a
                href={`${adminBaseUrl.replace(/\/+$/, "")}/Admin/headless/cors`}
                target="_blank"
                rel="noreferrer"
                className="brand-button mt-3"
              >
                {t("step4.openCors")} <ExternalLink className="size-4" aria-hidden />
              </a>
            ) : (
              <>
                <button type="button" className="brand-button mt-3" disabled>
                  {t("step4.openCors")} <ExternalLink className="size-4" aria-hidden />
                </button>
                <p className="mt-2 text-xs">{t("step4.openCorsDisabled")}</p>
              </>
            )}
          </div>
          <ol className="list-decimal space-y-1 pl-5">
            <li>{t("step4.how1")}</li>
            <li>{t("step4.how2")}</li>
            <li>{t("step4.how3")}</li>
            <li>{t("step4.how4")}</li>
          </ol>
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="brand-eyebrow text-muted-foreground">{t("step4.originsLabel")}</span>
            </div>
            <ul className="mt-2 space-y-2">
              {origins.map((origin) => (
                <li
                  key={origin}
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-3"
                >
                  <code className="break-all font-mono text-xs text-foreground">{origin}</code>
                  <CopyButton value={origin} />
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs">{t("step4.originsHint")}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <p className="font-medium text-foreground">{t("step4.policiesLabel")}</p>
            <p className="mt-1 text-xs">{t("step4.policiesHint")}</p>
            <p className="mt-2 break-words font-mono text-xs text-foreground">{POLICIES.join(", ")}</p>
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-foreground">
            <input
              type="checkbox"
              checked={corsDone}
              onChange={(event) => {
                const checked = event.target.checked;
                void Promise.resolve(setCorsDone(checked)).then(() => router.invalidate());
                if (checked) setOpen(4);
              }}
              disabled={!publishedOrigin}
              className="mt-0.5 size-4 accent-primary"
            />
            {t("step4.check")}
          </label>
        </GuideStep>

        <GuideStep
          index={5}
          title={t("step5.title")}
          state={states[4] ?? "pending"}
          open={open === 4}
          onToggle={() => setOpen(open === 4 ? -1 : 4)}
          verdict={verified ? t("step5.verdictDone") : t("step5.verdict")}
        >
          <p>{t("step5.body")}</p>
          <button type="button" className="brand-button" disabled={testing || !corsDone} onClick={runTest}>
            {testing && <Loader2 className="size-4 animate-spin" />}
            {testing ? t("step5.running") : t("step5.run")}
          </button>
          {testError && <p className="rounded-md bg-destructive/10 p-3 text-destructive">{testError}</p>}
          {result && (
            <div className="space-y-2">
              {result.steps.map((step) => (
                <StepResult key={step.id} step={step} />
              ))}
            </div>
          )}
        </GuideStep>

        <GuideStep
          index={6}
          title={t("step6.title")}
          state={states[5] ?? "pending"}
          open={open === 5}
          onToggle={() => setOpen(open === 5 ? -1 : 5)}
          verdict={verified ? t("step6.verdictDone") : t("step6.verdict")}
        >
          {verified ? (
            <>
              <p className="rounded-md bg-emerald-500/10 p-3 font-medium text-emerald-700">{t("step6.done")}</p>
              <button type="button" className="brand-button" onClick={startBuilding}>
                {t("complete.cta")}
              </button>
            </>
          ) : (
            <p>{t("step6.pending")}</p>
          )}
        </GuideStep>
      </ol>

      <div className="mt-6 space-y-3 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">{t("remove.title")}</p>
        <p>{t("remove.body")}</p>
        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-3">
          <code className="break-all font-mono text-xs text-foreground">{t("remove.prompt")}</code>
          <CopyButton value={t("remove.prompt")} />
        </div>
        <p className="text-xs">{t("remove.hint")}</p>
      </div>
    </div>
  );
}

export function SetupWizardDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Vendre setup</DialogTitle>
        </DialogHeader>
        <div className="-mb-2 flex justify-end pr-8">
          <LanguagePicker />
        </div>
        <SetupWizard onFinish={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
