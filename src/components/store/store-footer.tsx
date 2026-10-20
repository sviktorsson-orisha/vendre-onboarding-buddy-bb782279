import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Music2, Send, Youtube } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useI18n } from "@/lib/i18n";
import { resolveImageUrl, usePageMenu, usePrefetchPage, useSessionContext } from "@/lib/vendre/api";
import { useIntent } from "@/lib/vendre/use-intent";
import type { PageTreeNode } from "@/types/vendre";

const SOCIALS = [
  { label: "Facebook", Icon: Facebook },
  { label: "Instagram", Icon: Instagram },
  { label: "YouTube", Icon: Youtube },
  { label: "TikTok", Icon: Music2 },
];
const PAYMENTS = ["Mastercard", "Maestro", "iDEAL", "Apple Pay", "Klarna", "Sofort", "UnionPay"];
const CARRIERS = ["DHL", "PostNord", "FedEx", "UPS"];
/** Desktop columns = page menus (max 4) + 1 socials column, always evenly spread. */
const DESKTOP_COLS: Record<number, string> = {
  0: "lg:grid-cols-1",
  1: "lg:grid-cols-2",
  2: "lg:grid-cols-3",
  3: "lg:grid-cols-4",
  4: "lg:grid-cols-5",
};

/** CMS pages (galleries) route to /sida/$id — never to href/target. */
function PageLinks({ items }: { items: PageTreeNode[] }) {
  const intent = useIntent(usePrefetchPage());
  return (
    <ul className="space-y-3 lg:mt-5 lg:space-y-4">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            to="/sida/$id"
            params={{ id: String(item.id) }}
            {...intent(item.id)}
            className="text-base text-muted-foreground hover:text-primary"
          >
            {item.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Socials() {
  return (
    <div className="flex flex-wrap gap-3 lg:gap-2 xl:gap-3">
      {SOCIALS.map(({ label, Icon }) => (
        <a
          key={label}
          href="#"
          aria-label={label}
          className="grid size-12 shrink-0 place-items-center rounded-full lg:size-10 xl:size-11 bg-secondary text-primary hover:bg-accent"
        >
          <Icon className="size-6" />
        </a>
      ))}
    </div>
  );
}

function PaymentBadges() {
  return (
    <ul className="flex flex-wrap justify-center gap-2">
      {PAYMENTS.map((name) => (
        <li
          key={name}
          className="rounded-sm border border-border bg-card px-1.5 py-1 text-[9px] font-semibold text-foreground"
        >
          {name}
        </li>
      ))}
    </ul>
  );
}

export function StoreFooter() {
  const { t } = useI18n();
  const groups = usePageMenu();
  const { data: session } = useSessionContext();
  const storeName = session?.configuration?.STORE_NAME ?? session?.STORE_NAME ?? "Vendre";
  const logoUrl = resolveImageUrl(session?.configuration?.SHOP_LOGO ?? session?.SHOP_LOGO);
  const copyright = t("store.copyright", { year: String(new Date().getFullYear()), name: storeName });

  return (
    <footer className="bg-card">
      <div className="mx-auto w-full max-w-6xl xl:max-w-[88rem] px-5 pt-8 md:px-8 lg:pt-2">
        {/* Logo + socials (phone/tablet only) */}
        <div className="flex flex-col gap-5 border-b border-border pb-6 lg:hidden">
          {logoUrl ? (
            <img src={logoUrl} alt={storeName} className="h-7 w-auto max-w-[130px] self-start object-contain md:h-8 md:max-w-[150px]" />
          ) : (
            <span className="brand-wordmark text-xl text-primary md:text-2xl">vendre</span>
          )}
          <Socials />
        </div>

        {/* Link groups: accordions on mobile/tablet, columns on desktop */}
        <div className="lg:hidden">
          <Accordion type="multiple" defaultValue={groups[0] ? [String(groups[0].id)] : []}>
            {groups.map((group) => (
              <AccordionItem key={group.id} value={String(group.id)} className="border-border last:border-b-0">
                <AccordionTrigger className="py-5 text-base font-semibold text-foreground hover:no-underline">
                  {group.title}
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  <PageLinks items={group.children} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div
          className={`hidden gap-8 border-b border-border py-8 lg:grid ${
            DESKTOP_COLS[Math.min(groups.length, 4)] ?? "lg:grid-cols-1"
          }`}
        >
          {groups.slice(0, 4).map((group) => (
            <div key={group.id} className="min-w-0">
              <h2 className="text-base font-semibold text-foreground">{group.title}</h2>
              <PageLinks items={group.children} />
            </div>
          ))}
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">{t("store.followSocials")}</h2>
            <div className="mt-5">
              <Socials />
            </div>
          </div>
        </div>

        <div className="hidden items-center justify-between gap-6 py-8 text-base text-muted-foreground lg:flex">
          <span className="min-w-0 truncate">{t("store.footerNote")}</span>
          <span className="shrink-0">{copyright}</span>
        </div>
      </div>

      {/* Mobile/tablet bottom bar */}
      <div className="mt-6 bg-primary px-5 py-6 text-center text-primary-foreground md:px-8 lg:hidden">
        <PaymentBadges />
        <p className="mt-4 text-sm md:text-base">{copyright}</p>
      </div>

      {/* Desktop payment strip */}
      <div className="hidden bg-secondary lg:block">
        <div className="mx-auto flex w-full max-w-6xl xl:max-w-[88rem] items-center justify-between gap-6 px-8 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="shrink-0 text-sm text-muted-foreground">{t("store.paySafe")}</span>
            <PaymentBadges />
          </div>
          <ul className="flex shrink-0 gap-4 text-xs font-bold italic text-primary">
            {CARRIERS.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
