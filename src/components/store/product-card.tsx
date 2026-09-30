import { Link } from "@tanstack/react-router";

import { ProductPrice } from "@/components/store/product-price";
import { StoreImage } from "@/components/store/store-image";
import { useCartMutations } from "@/lib/vendre/api";
import { useI18n } from "@/lib/i18n";
import type { Product } from "@/types/vendre";

export function ProductCard({ product }: { product: Product }) {
  const { t } = useI18n();
  const { add } = useCartMutations();
  const soldOut = product.stock_total === 0 && product.stock_allow_checkout === false;
  const hasVariants = (product.child_count ?? 0) > 0;
  const readMoreOnly = hasVariants || soldOut;

  return (
    <article className="brand-card group flex flex-col overflow-hidden p-0">
      <Link
        to="/produkt/$id"
        params={{ id: String(product.id) }}
        className="block aspect-4/5 overflow-hidden"
      >
        <StoreImage          size="card"          image={product.image ?? product.images[0] ?? null}
          alt={product.name}
          label={product.name}
          className="size-full transition-transform duration-300 group-hover:scale-105"
        />
      </Link>
      <div className="flex grow flex-col gap-2 p-4">
        <Link
          to="/produkt/$id"
          params={{ id: String(product.id) }}
          className="text-sm font-semibold text-foreground hover:text-primary"
        >
          {product.name}
        </Link>
        <ProductPrice product={product} size="md" />
        {readMoreOnly ? (
          <Link
            to="/produkt/$id"
            params={{ id: String(product.id) }}
            className="brand-button-ghost mt-auto w-full justify-center"
          >
            {t("store.readMore")}
          </Link>
        ) : (
          <button
            type="button"
            className="brand-button mt-auto w-full justify-center"
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
