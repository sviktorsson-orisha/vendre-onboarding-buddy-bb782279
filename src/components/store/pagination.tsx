import { ChevronLeft, ChevronRight } from "lucide-react";

import { useI18n } from "@/lib/i18n";

/** Pagination driven by page_index / page_count from the API response. */
export function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  const { t } = useI18n();
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).filter(
    (value) => value === 1 || value === pageCount || Math.abs(value - page) <= 1,
  );

  return (
    <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Pagination">
      <button
        type="button"
        className="brand-button-ghost h-9 py-0"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="size-4" aria-hidden /> {t("store.prev")}
      </button>
      {pages.map((value, index) => (
        <span key={value} className="flex items-center gap-1">
          {index > 0 && value - pages[index - 1]! > 1 && (
            <span className="px-1 text-muted-foreground">…</span>
          )}
          <button
            type="button"
            aria-current={value === page ? "page" : undefined}
            className={
              value === page
                ? "brand-button size-9 justify-center px-0 py-0"
                : "brand-button-ghost size-9 justify-center px-0 py-0"
            }
            onClick={() => onPageChange(value)}
          >
            {value}
          </button>
        </span>
      ))}
      <button
        type="button"
        className="brand-button-ghost h-9 py-0"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        {t("store.next")} <ChevronRight className="size-4" aria-hidden />
      </button>
    </nav>
  );
}
