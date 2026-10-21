import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";

import { Breadcrumbs } from "@/components/store/breadcrumbs";
import {
  CategoryFilters,
  type FilterProps,
} from "@/components/store/category-filters";
import { CategoryMobileControls } from "@/components/store/category-mobile-controls";
import { CategoryToolbar } from "@/components/store/category-toolbar";
import { Pagination } from "@/components/store/pagination";
import { ProductCard } from "@/components/store/product-card";
import { StoreImage } from "@/components/store/store-image";
import { StoreShell } from "@/components/store/store-shell";
import { useI18n } from "@/lib/i18n";
import { buildCategoryTrail } from "@/lib/vendre/breadcrumbs";
import { useCategory, useMenus } from "@/lib/vendre/api";

/** URL form: "44:Bomull,44:Lin" -> { "44": ["Bomull", "Lin"] } */
function parseSpecs(raw?: string): Record<string, string[]> {
  const specs: Record<string, string[]> = {};
  for (const part of (raw ?? "").split(",").filter(Boolean)) {
    const index = part.indexOf(":");
    if (index <= 0) continue;
    const key = part.slice(0, index);
    const value = part.slice(index + 1);
    (specs[key] ??= []).push(value);
  }
  return specs;
}

function stringifySpecs(specs: Record<string, string[]>) {
  const parts = Object.entries(specs).flatMap(([key, values]) =>
    values.map((value) => `${key}:${value}`),
  );
  return parts.length ? parts.join(",") : undefined;
}

export default function CategoryPage({ id }: { id: number }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const search = useSearch({ from: "/kategori/$id" });
  const { data: menus } = useMenus();

  const tags = search.tags ? search.tags.split(",").filter(Boolean) : [];
  const specs = parseSpecs(search.specs);
  const query = {
    page: search.page ?? 1,
    ...(search.sort_by ? { sort_by: search.sort_by } : {}),
    ...(search.sort_order ? { sort_order: search.sort_order } : {}),
    ...(tags.length ? { tags } : {}),
    ...(Object.keys(specs).length ? { specs } : {}),
    ...(search.pfrom != null ? { pfrom: search.pfrom } : {}),
    ...(search.pto != null ? { pto: search.pto } : {}),
  };

  const { data, isLoading, isFetching, error } = useCategory(id, query);

  const setSearch = (patch: Record<string, unknown>, resetPage = true) => {
    void navigate({
      to: "/kategori/$id",
      params: { id: String(id) },
      search: (prev: Record<string, unknown>) => {
        const next = { ...prev, ...patch };
        if (resetPage) next["page"] = 1;
        for (const key of Object.keys(next)) {
          const value = next[key];
          if (value == null || (Array.isArray(value) && value.length === 0)) delete next[key];
        }
        return next;
      },
    });
  };

  const trail = buildCategoryTrail(menus ?? [], id, data?.header.name ?? "");

  const filterProps = (response: NonNullable<typeof data>): FilterProps => ({
    filters: response.filters ?? [],
    selected: tags,
    selectedSpecs: specs,
    priceFrom: search.pfrom,
    priceTo: search.pto,
    onPriceChange: (from, to) => setSearch({ pfrom: from, pto: to }),
    onToggleTag: (tag) => {
      const next = tags.includes(tag) ? tags.filter((value) => value !== tag) : [...tags, tag];
      setSearch({ tags: next.length ? next.join(",") : undefined });
    },
    onToggleSpec: (filterId, value) => {
      const current = specs[filterId] ?? [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      setSearch({ specs: stringifySpecs({ ...specs, [filterId]: next }) });
    },
    onClear: () =>
      setSearch({ tags: undefined, specs: undefined, pfrom: undefined, pto: undefined }),
  });

  const hero = data?.header.image ? (
    <StoreImage
      image={data.header.image}
      alt={data.header.name}
      label={data.header.name}
      priority
      className="block h-40 w-full object-cover object-center md:h-56 lg:h-72"
    />
  ) : null;

  return (
    <StoreShell hero={hero}>
      {error && !data ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">{t("store.loadError")}</p>
          <Link to="/" className="brand-button mt-4 inline-flex">
            {t("store.backToStore")}
          </Link>
        </div>
      ) : isLoading || !data ? (
        <div className="space-y-6" aria-busy="true">
          <div className="h-8 w-56 animate-pulse rounded bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="aspect-4/5 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
          <p className="sr-only">{t("store.loading")}</p>
        </div>
      ) : (
        <>
          <Breadcrumbs trail={trail} />

          <header className="mt-4">
            <h1 className="text-3xl font-extrabold text-foreground">{data.header.name}</h1>
            {data.header.text && (
              <div className="mt-3 max-w-4xl">
                <div
                  className={`text-sm text-muted-foreground ${
                    expanded ? "" : "line-clamp-3 md:line-clamp-none"
                  }`}
                  dangerouslySetInnerHTML={{ __html: data.header.text }}
                />
                <button
                  type="button"
                  className="mt-1 text-sm font-semibold text-foreground underline md:hidden"
                  onClick={() => setExpanded((value) => !value)}
                >
                  {expanded ? t("store.showLess") : t("store.readMore")}
                </button>
              </div>
            )}

            {(data.subcategory_list?.length ?? 0) > 0 && (
              <nav className="mt-5" aria-label={t("store.subcategories")}>
                <div className="flex flex-wrap gap-2">
                  {(data.subcategory_list ?? []).map((sub) => (
                    <Link
                      key={sub.id}
                      to="/kategori/$id"
                      params={{ id: String(sub.id) }}
                      className="brand-button-ghost"
                      activeProps={{ "aria-current": "page" }}
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              </nav>
            )}
          </header>

          <div className="mt-8 flex flex-col gap-8 lg:flex-row">
            <CategoryFilters {...filterProps(data)} />

            <div className="min-w-0 grow">
              <CategoryToolbar
                data={data}
                onSortChange={(sortBy, sortOrder) =>
                  setSearch({ sort_by: sortBy, sort_order: sortOrder })
                }
              />

              <div className="mt-4">
                <CategoryMobileControls
                  data={data}
                  filterProps={filterProps(data)}
                  onSortChange={(sortBy, sortOrder) =>
                    setSearch({ sort_by: sortBy, sort_order: sortOrder })
                  }
                />
              </div>



              {(data.product_list?.length ?? 0) === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-muted-foreground">{t("store.noResults")}</p>
                  <button
                    type="button"
                    className="brand-button mt-4"
                    onClick={() =>
                      setSearch({
                        tags: undefined,
                        specs: undefined,
                        pfrom: undefined,
                        pto: undefined,
                      })
                    }
                  >
                    {t("store.clearFilters")}
                  </button>
                </div>
              ) : (
                <div
                  className={`mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${
                    isFetching ? "opacity-60" : ""
                  }`}
                >
                  {(data.product_list ?? []).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}

              <Pagination
                page={data.page_index}
                pageCount={data.page_count}
                onPageChange={(page) => setSearch({ page }, false)}
              />
            </div>
          </div>
        </>
      )}
    </StoreShell>
  );
}
