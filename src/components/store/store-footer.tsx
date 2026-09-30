import { Link } from "@tanstack/react-router";

import { useI18n } from "@/lib/i18n";
import { usePageMenu, usePrefetchPage } from "@/lib/vendre/api";
import { useIntent } from "@/lib/vendre/use-intent";
import type { PageTreeNode } from "@/types/vendre";

/** CMS pages (galleries) route to /sida/$id — never to href/target. */
function PageColumn({ title, items }: { title: string; items: PageTreeNode[] }) {
  const intent = useIntent(usePrefetchPage());
  return (
    <div>
      <h2 className="brand-eyebrow text-muted-foreground">{title}</h2>
      <ul className="mt-3 space-y-1.5">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              to="/sida/$id"
              params={{ id: String(item.id) }}
              {...intent(item.id)}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StoreFooter() {
  const { t } = useI18n();
  // Only top-level pages flagged is_menu in the page tree, and only when they
  // have active child pages.
  const groups = usePageMenu();

  return (
    <footer className="border-t border-border bg-secondary">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <span className="brand-wordmark text-xl text-foreground">vendre</span>
          <p className="mt-2 text-sm text-muted-foreground">{t("store.footerNote")}</p>
        </div>

        {groups.map((group) => (
          <PageColumn key={group.id} title={group.title} items={group.children} />
        ))}
      </div>
    </footer>
  );
}
