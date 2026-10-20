import { useNavigate, useSearch } from "@tanstack/react-router";

import { Pagination } from "@/components/store/pagination";
import { ProductCard } from "@/components/store/product-card";
import { SearchBox } from "@/components/store/search-box";
import { StoreShell } from "@/components/store/store-shell";
import { useI18n } from "@/lib/i18n";
import { SEARCH_MIN_CHARS, useProductSearch } from "@/lib/vendre/api";

export default function SearchPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const search = useSearch({ from: "/sok" });
  const q = (search.q ?? "").trim();
  const page = search.page ?? 1;

  const { data, isFetching, isError } = useProductSearch(q, { limit: 12, page });
  const enough = q.length >= SEARCH_MIN_CHARS;

  return (
    <StoreShell>
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {enough ? t("search.for", { q }) : t("search.title")}
        </h1>

        <div className="mt-4 max-w-xl md:hidden">
          <SearchBox />
        </div>

        {!enough && <p className="mt-4 text-sm text-muted-foreground">{t("search.minChars")}</p>}

        {enough && (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              {isFetching && !data
                ? t("search.searching")
                : t("search.hits", { count: data?.product_count ?? 0 })}
            </p>

            {isError && (
              <p className="mt-6 text-sm text-destructive">{t("store.loadError")}</p>
            )}

            {data && data.products.length === 0 && !isFetching && (
              <p className="mt-10 text-sm text-muted-foreground">{t("search.noHits", { q })}</p>
            )}

            {data && data.products.length > 0 && (
              <div
                className={`mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${
                  isFetching ? "opacity-60" : ""
                }`}
              >
                {data.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {data && (
              <Pagination
                page={data.page_index}
                pageCount={data.page_count}
                onPageChange={(next) =>
                  void navigate({ to: "/sok", search: { q, page: next } })
                }
              />
            )}
          </>
        )}
      </div>
    </StoreShell>
  );
}
