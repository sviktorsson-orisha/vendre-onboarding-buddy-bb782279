import { useEffect, useState } from "react";
import { ArrowRight, Rocket, Settings2 } from "lucide-react";

import { SetupWizardDialog } from "@/components/vendre/setup-wizard";
import { useOnboarding } from "@/context/onboarding-context";
import { useI18n } from "@/lib/i18n";

/** Top banner: demo-mode warning + entry point to the setup guide modal. */
export function SetupNoticeBar() {
  const { t } = useI18n();
  const { verified, guideDismissed } = useOnboarding();
  const [open, setOpen] = useState(false);

  // The guide is the first thing to do in a fresh project: open it automatically
  // while the setup is unfinished, unless the developer dismissed it themselves.
  useEffect(() => {
    if (!verified && !guideDismissed) setOpen(true);
  }, [verified, guideDismissed]);

  if (verified) {
    return (
      <>
        <div className="border-b border-border bg-linear-to-r from-primary/10 via-brand-pink/10 to-brand-blue/10">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-5 py-2.5 sm:px-6">
            <Rocket className="size-4 text-primary" aria-hidden />
            <span className="brand-eyebrow rounded-md bg-primary/10 px-2 py-0.5 text-primary">Vendre</span>
            <p className="text-sm text-muted-foreground">{t("panel.verified")}</p>
            <button type="button" className="brand-button-ghost ml-auto" onClick={() => setOpen(true)}>
              {t("notice.cta")}
            </button>
          </div>
        </div>
        <SetupWizardDialog open={open} onOpenChange={setOpen} />
      </>
    );
  }

  return (
    <>
      <div role="alert" className="border-b-2 border-primary bg-primary text-primary-foreground">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-5 py-3.5 sm:px-6">
          <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary-foreground/20" />
            <Settings2 className="relative size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold sm:text-base">
              <span className="rounded bg-primary-foreground/20 px-2 py-0.5 text-xs uppercase tracking-wide">
                {t("notice.title")}
              </span>
              {t("notice.headline")}
            </p>
            <p className="mt-0.5 text-sm opacity-90">{t("notice.body")}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary-foreground px-4 py-2 text-sm font-semibold text-primary shadow-sm transition hover:opacity-90"
          >
            {t("notice.ctaPending")}
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
      <SetupWizardDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
