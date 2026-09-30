import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { StoreShell } from "@/components/store/store-shell";
import { useI18n } from "@/lib/i18n";
import { usePageContent, usePageMenuItem } from "@/lib/vendre/api";
import { prepareCmsHtml } from "@/lib/vendre/html";

/**
 * CMS page (Vendre gallery page). Only the page's own `description` from
 * GET /surface/2/galleries/{id}/pages is rendered — content blocks are not used.
 */
export default function ContentPage({ id }: { id: number }) {
  const { t } = useI18n();
  const { data, isLoading, isError } = usePageContent(id);
  const menuItem = usePageMenuItem(id);

  if (isLoading) {
    return (
      <StoreShell>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> {t("store.loading")}
        </p>
      </StoreShell>
    );
  }

  if (isError || !data) {
    return (
      <StoreShell>
        <p className="text-sm text-muted-foreground">{t("store.pageNotFound")}</p>
        <Link to="/" className="brand-button mt-4">
          {t("store.backToStore")}
        </Link>
      </StoreShell>
    );
  }

  const title = data.title ?? menuItem?.name ?? null;
  const description = prepareCmsHtml(data.description);

  return (
    <StoreShell>
      <article className="w-full max-w-3xl">
        {title && <h1 className="text-3xl font-extrabold text-foreground">{title}</h1>}
        <div className="mt-6 space-y-6 text-sm leading-relaxed text-muted-foreground [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:font-semibold [&_h3]:text-foreground [&_a]:text-primary [&_a]:underline [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          {description ? (
            <div className="cms-prose" dangerouslySetInnerHTML={{ __html: description }} />
          ) : (
            <p>{t("store.pageEmpty")}</p>
          )}
        </div>
      </article>
    </StoreShell>
  );
}
