import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";

import { ProductPrice } from "@/components/store/product-price";
import { StoreImage } from "@/components/store/store-image";
import { useI18n } from "@/lib/i18n";
import {
  SEARCH_MIN_CHARS,
  SEARCH_SUGGESTION_LIMIT,
  useProductSearch,
} from "@/lib/vendre/api";
import { cn } from "@/lib/utils";

/** Header search with autocomplete: 5 suggestions from 3 characters + "show all". */
export function SearchBox({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const [value, setValue] = useState("");
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const timer = window.setTimeout(() => setTerm(value.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const { data, isFetching } = useProductSearch(term, { limit: SEARCH_SUGGESTION_LIMIT });
  const suggestions = data?.products ?? [];
  const showPanel = open && value.trim().length >= SEARCH_MIN_CHARS;

  const goToResults = () => {
    const q = value.trim();
    if (q.length < SEARCH_MIN_CHARS) return;
    setOpen(false);
    void navigate({ to: "/sok", search: { q, page: 1 } });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!showPanel || suggestions.length === 0) return;
      event.preventDefault();
      const delta = event.key === "ArrowDown" ? 1 : -1;
      setActive((index) => {
        const next = index + delta;
        if (next < 0) return suggestions.length - 1;
        if (next >= suggestions.length) return 0;
        return next;
      });
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const picked = suggestions[active];
      if (showPanel && picked) {
        setOpen(false);
        void navigate({ to: "/produkt/$id", params: { id: String(picked.id) } });
      } else {
        goToResults();
      }
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        autoFocus={autoFocus}
        value={value}
        placeholder={t("store.search")}
        onChange={(event) => {
          setValue(event.target.value);
          setActive(-1);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-hidden focus:border-primary"
      />

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          {suggestions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              {isFetching ? t("search.searching") : t("search.noHits", { q: value.trim() })}
            </p>
          ) : (
            <ul id={listId} role="listbox" aria-label={t("search.suggestions")} className="py-1">
              {suggestions.map((product, index) => (
                <li key={product.id} role="option" aria-selected={index === active}>
                  <Link
                    to="/produkt/$id"
                    params={{ id: String(product.id) }}
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => setActive(index)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2",
                      index === active ? "bg-accent" : "hover:bg-accent",
                    )}
                  >
                    <span className="size-10 shrink-0 overflow-hidden rounded-md">
                      <StoreImage                        size="thumb"                        image={product.image ?? product.images[0] ?? null}
                        alt={product.name}
                        label={product.name}
                        className="size-full"
                      />
                    </span>
                    <span className="min-w-0 grow truncate text-sm text-foreground">
                      {product.name}
                    </span>
                    <ProductPrice
                      product={product}
                      size="sm"
                      className="shrink-0"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={goToResults}
            className="block w-full border-t border-border px-4 py-2.5 text-left text-sm font-semibold text-primary hover:bg-accent"
          >
            {t("search.viewAll", { q: value.trim() })}
          </button>
        </div>
      )}
    </div>
  );
}
