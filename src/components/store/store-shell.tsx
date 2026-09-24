import { useEffect, type ReactNode } from "react";

import { StoreFooter } from "@/components/store/store-footer";
import { StoreHeader } from "@/components/store/store-header";
import { SetupNoticeBar } from "@/components/vendre/setup-notice-bar";
import { useOnboarding } from "@/context/onboarding-context";
import { GuideLanguageScope, setStoreLanguage } from "@/lib/i18n";
import { useSessionContext } from "@/lib/vendre/api";

/** Store UI language follows the store session (demo mode stays Swedish). */
function useSessionLanguageSync() {
  const { isConfigured } = useOnboarding();
  const { data } = useSessionContext();
  const code = isConfigured ? data?.language?.code : "sv";
  useEffect(() => {
    if (code) setStoreLanguage(code);
  }, [code]);
}

/** Chrome for every storefront page: notice bar, header, content, footer. */
export function StoreShell({ children }: { children: ReactNode }) {
  useSessionLanguageSync();
  return (
    <div className="brand-canvas flex min-h-screen flex-col">
      <GuideLanguageScope>
        <SetupNoticeBar />
      </GuideLanguageScope>
      <StoreHeader />
      <main className="grow">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6 sm:py-12">{children}</div>
      </main>
      <StoreFooter />
    </div>
  );
}
