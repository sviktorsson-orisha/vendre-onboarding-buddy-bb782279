import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { useI18n } from "@/lib/i18n";
import { usePrefetchCategory } from "@/lib/vendre/api";
import { useIntent } from "@/lib/vendre/use-intent";

export type Crumb = {
  id: number;
  name: string;
  /** Leaf that is not a category (e.g. the product name) — never linked. */
  current?: boolean;
};

/** Category breadcrumbs + BreadcrumbList JSON-LD (see .vendre/skills/ecommerce-seo.md). */
export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  const { t } = useI18n();
  const intent = useIntent(usePrefetchCategory());

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t("store.home"), item: "/" },
      ...trail.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 2,
        name: crumb.name,
        ...(crumb.current ? {} : { item: `/kategori/${crumb.id}` }),
      })),
    ],
  };

  return (
    <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link to="/" className="hover:text-primary">
            {t("store.home")}
          </Link>
        </li>
        {trail.map((crumb, index) => (
          <li key={crumb.id} className="flex items-center gap-1">
            <ChevronRight className="size-3" aria-hidden />
            {index === trail.length - 1 ? (
              <span aria-current="page" className="font-medium text-foreground">
                {crumb.name}
              </span>
            ) : (
              <Link
                to="/kategori/$id"
                params={{ id: String(crumb.id) }}
                {...intent(crumb.id)}
                className="hover:text-primary"
              >
                {crumb.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </nav>
  );
}
