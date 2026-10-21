import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";

import { ProductPrice } from "@/components/store/product-price";
import { StoreImage } from "@/components/store/store-image";
import { useCartMutations, usePrefetchProduct } from "@/lib/vendre/api";
import { useI18n } from "@/lib/i18n";
import type { Product } from "@/types/vendre";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { t } = useI18n();
  const { add } = useCartMutations();
  const soldOut = product.stock_total === 0 && product.stock_allow_checkout === false;
  const hasVariants = (product.child_count ?? 0) > 0;
  const readMoreOnly = hasVariants || soldOut;

  // Hover/focus intent: fetch the product in the background after a short delay
  // so quick passes over the grid don't trigger store calls.
  const prefetch = usePrefetchProduct();
  const timer = useRef<number | null>(null);
  const cancel = () => {
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  const schedule = () => {
    cancel();
    timer.current = window.setTimeout(() => prefetch(product.id), 120);
  };
  useEffect(() => cancel, []);
  const intent = {
    onMouseEnter: schedule,
    onMouseLeave: cancel,
    onFocus: schedule,
    onTouchStart: () => prefetch(product.id),
  };

  const brand = (product.brand ?? product.manufacturer_name ?? "").trim();
  // Same box for both actions so cards line up regardless of which one shows.
  const action = "mt-auto box-border h-10 w-full justify-center px-4 py-0";

  return (
    <article className="brand-card group flex flex-col overflow-hidden rounded-none border-0 p-0">
      <Link
        to="/produkt/$id"
        params={{ id: String(product.id) }}
        {...intent}
        className="block aspect-square overflow-hidden"
      >
        <StoreImage
          size="card"
          priority={priority}
          image={product.image ?? product.images[0] ?? null}
          alt={product.name}
          label={product.name}
          className="size-full object-cover object-center"
        />
      </Link>
      <div className="flex grow flex-col gap-2 p-4">
        <div className="flex flex-col gap-0.5">
          {brand && <p className="text-sm text-muted-foreground">{brand}</p>}
          <Link
            to="/produkt/$id"
            params={{ id: String(product.id) }}
            {...intent}
            className="text-base font-semibold text-foreground hover:text-primary"
          >
            {product.name}
          </Link>
        </div>
        <ProductPrice product={product} size="md" />
        {readMoreOnly ? (
          <Link
            to="/produkt/$id"
            params={{ id: String(product.id) }}
            {...intent}
            className={`brand-button-ghost ${action}`}
          >
            {t("store.readMore")}
          </Link>
        ) : (
          <button
            type="button"
            className={`brand-button ${action}`}
            disabled={add.isPending}
            onClick={() => add.mutate({ productId: product.id })}
          >
            {t("store.addToCart")}
          </button>
        )}
      </div>
    </article>
  );
}
