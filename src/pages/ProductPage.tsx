import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Breadcrumbs, type Crumb } from "@/components/store/breadcrumbs";
import { StoreImage } from "@/components/store/store-image";
import { StoreShell } from "@/components/store/store-shell";
import { useI18n } from "@/lib/i18n";
import { ProductPrice } from "@/components/store/product-price";
import { buildCategoryTrail } from "@/lib/vendre/breadcrumbs";
import {
  useCartMutations,
  useMenus,
  useProduct,
  useProductSpecifications,
  useProductVariants,
  useVariantProduct,
} from "@/lib/vendre/api";
import { cn } from "@/lib/utils";
import type { ProductVariantChoice } from "@/types/vendre";

export default function ProductPage({ id }: { id: string }) {
  const { t } = useI18n();
  const { data: product, isLoading } = useProduct(id);
  const { data: menus } = useMenus();
  // A variant child carries parent_id; the variant tree only exists on the parent.
  const variantOwnerId = product ? String(product.parent_id ?? product.id) : "";
  const { data: variantTypes = [] } = useProductVariants(variantOwnerId);
  const { add } = useCartMutations();
  /** typeId -> selected choice id */
  const [selection, setSelection] = useState<Record<number, number>>({});
  const [quantity, setQuantity] = useState(1);

  /** Landing directly on a variant: preselect the choices that resolve to it. */
  const landedVariantId = product?.parent_id != null ? Number(product.id) : null;
  const preselectKey = `${landedVariantId ?? ""}:${variantTypes.map((type) => type.id).join(",")}`;
  const [preselectedFor, setPreselectedFor] = useState<string | null>(null);
  if (landedVariantId != null && variantTypes.length > 0 && preselectedFor !== preselectKey) {
    const next: Record<number, number> = {};
    for (const type of variantTypes) {
      const choice = type.product_variant_choices.find((item) =>
        item.products.some((entry) => entry.id === landedVariantId),
      );
      if (choice) next[type.id] = choice.id;
    }
    setPreselectedFor(preselectKey);
    if (Object.keys(next).length > 0) setSelection(next);
  }

  const selectedChoices = useMemo(
    () =>
      variantTypes
        .map((type) =>
          type.product_variant_choices.find((choice) => choice.id === selection[type.id]),
        )
        .filter((choice): choice is ProductVariantChoice => Boolean(choice)),
    [variantTypes, selection],
  );

  const allSelected = variantTypes.length > 0 && selectedChoices.length === variantTypes.length;

  /**
   * Each choice lists every product carrying it. With several variant types the real
   * product is the one shared by all selected choices, so intersect the id lists.
   */
  const selectedVariantProductId = useMemo(() => {
    if (!allSelected) return null;
    const lists = selectedChoices.map((choice) => choice.products.map((item) => item.id));
    if (lists.length === 0) return null;
    const shared = lists.reduce((acc, ids) => acc.filter((id) => ids.includes(id)));
    return shared[0] ?? null;

  }, [allSelected, selectedChoices]);


  // A variant is its own product in Vendre — reload the full record on selection.
  const { data: variantProduct } = useVariantProduct(
    selectedVariantProductId != null && selectedVariantProductId !== landedVariantId
      ? selectedVariantProductId
      : null,
  );

  const buyableProduct = variantProduct ?? product;
  /** Everything on screen follows the selected variant when one is loaded. */
  const view = variantProduct ?? product;
  const activeProductId = selectedVariantProductId ?? product?.id ?? null;
  // A VQL-read product always carries a specifications array (possibly empty), so
  // the separate specifications call only runs for records that came from a
  // category listing, where the relation is absent altogether.
  const inlineSpecifications = view?.specifications ?? [];
  const { data: specificationList } = useProductSpecifications(
    activeProductId,
    view != null && view.specifications === undefined,
  );






  if (isLoading) {
    return (
      <StoreShell>
        <div aria-busy="true">
          <div className="h-3 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="aspect-square w-full animate-pulse rounded-xl bg-muted" />
            <div className="space-y-4">
              <div className="h-9 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-7 w-32 animate-pulse rounded bg-muted" />
              {[100, 92, 80].map((w) => (
                <div key={w} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${w}%` }} />
              ))}
              <div className="h-11 w-full animate-pulse rounded-md bg-muted" />
            </div>
          </div>
          <p className="sr-only">{t("store.loading")}</p>
        </div>
      </StoreShell>
    );
  }

  if (!product) {
    return (
      <StoreShell>
        <p className="text-sm text-muted-foreground">{t("store.notFound")}</p>
        <Link to="/" className="brand-button mt-4">
          {t("store.backToStore")}
        </Link>
      </StoreShell>
    );
  }

  /**
   * A variant with no stock may still be sold: stock_allow_checkout === false is the
   * only thing that blocks it, and null means "inherit the store default" (allowed).
   */
  const entryBlocked = (variant: ProductVariantChoice["products"][number]) => {
    if (variant.in_stock !== false) return false;
    const allow = variant.stock_allow_checkout ?? product?.stock_allow_checkout ?? true;
    return allow === false;
  };
  /**
   * A choice is unavailable when no buyable product carries it *together with*
   * the choices already picked in the other variant types. Picking Blue must grey
   * out a size that has no blue product, and vice versa.
   */
  const choiceBlocked = (typeId: number, choice: ProductVariantChoice) => {
    if (choice.products.length === 0) return true;
    const otherLists = variantTypes
      .filter((type) => type.id !== typeId)
      .map((type) => type.product_variant_choices.find((item) => item.id === selection[type.id]))
      .filter((item): item is ProductVariantChoice => Boolean(item))
      .map((item) => item.products.map((entry) => entry.id));
    return !choice.products.some(
      (entry) => !entryBlocked(entry) && otherLists.every((ids) => ids.includes(entry.id)),
    );
  };

  /** Keep a selection only while it still combines with the freshly picked choice. */
  const pickChoice = (typeId: number, choice: ProductVariantChoice) => {
    // `disabled` protects normal pointer/keyboard interaction. Keep the same
    // rule here as a data-level guard so stale events can never select a choice
    // whose only matching product is inactive.
    if (choiceBlocked(typeId, choice)) return;
    setSelection((prev) => {
      const choiceId = choice.id;
      const next: Record<number, number> = { ...prev, [typeId]: choiceId };
      const idsFor = (id: number, cid: number) =>
        variantTypes
          .find((type) => type.id === id)
          ?.product_variant_choices.find((item) => item.id === cid)
          ?.products.map((entry) => entry.id) ?? [];
      let kept = idsFor(typeId, choiceId);
      for (const type of variantTypes) {
        if (type.id === typeId) continue;
        const current = next[type.id];
        if (current == null) continue;
        const shared = idsFor(type.id, current).filter((id) => kept.includes(id));
        if (shared.length === 0) delete next[type.id];
        else kept = shared;
      }
      return next;
    });
  };

  const selectedInStock = selectedChoices.every((choice) =>
    choice.products.some((variant) => variant.in_stock !== false),
  );

  /** The exact combination that was picked, not just the individual choices. */
  const selectedEntries = selectedChoices
    .flatMap((choice) => choice.products)
    .filter((variant) => variant.id === selectedVariantProductId);
  const combinationBlocked =
    selectedEntries.length > 0 && selectedEntries.some(entryBlocked);
  /** The variant's own record wins once it is loaded. */
  const variantRecordBlocked =
    variantProduct != null &&
    variantProduct.stock_total === 0 &&
    variantProduct.stock_allow_checkout === false;

  const selectedBlocked =
    selectedChoices.some((choice) => choice.products.every(entryBlocked)) || combinationBlocked;
  const parentSoldOut = product.stock_total === 0 && product.stock_allow_checkout === false;
  const soldOut =
    variantTypes.length > 0
      ? (allSelected && selectedBlocked) || variantRecordBlocked
      : parentSoldOut;


  // Fallback for installs where VQL returns no variant types.
  const attributes = variantTypes.length > 0 ? [] : (product.attributes ?? []);
  /** Specifications follow whichever product is active (parent or selected variant). */
  const specifications =
    inlineSpecifications.length > 0 ? inlineSpecifications : (specificationList ?? []);

  const canBuy =
    (variantTypes.length === 0 || selectedVariantProductId != null) && !soldOut && Boolean(activeProductId);

  /** Same trail as the PLP, with the product name as the non-linked leaf. */
  const productName = view?.name ?? product.name;
  const categoryId = Number(view?.categories_id ?? product.categories_id ?? "");
  const trail: Crumb[] = [
    ...(Number.isFinite(categoryId) && categoryId > 0
      ? buildCategoryTrail(menus ?? [], categoryId, "").filter((crumb) => crumb.name)
      : []),
    { id: Number(product.id), name: productName, current: true },
  ];

  return (
    <StoreShell>
      <Breadcrumbs trail={trail} />

      <div className="mt-4 grid gap-10 lg:grid-cols-2">
        <StoreImage
          key={view?.id ?? product.id}
          image={view?.image ?? view?.images?.[0] ?? product.image ?? product.images[0] ?? null}
          alt={view?.name ?? product.name}
          label={view?.name ?? product.name}
          className="aspect-4/5 w-full rounded-2xl border border-border"
        />

        <div>
          <h1 className="text-3xl font-extrabold text-foreground">{view?.name ?? product.name}</h1>
          {(view?.description_short || product.description_short) && (
            <p className="mt-3 text-sm text-muted-foreground">
              {view?.description_short || product.description_short}
            </p>
          )}
          <ProductPrice
            product={buyableProduct ?? product}
            size="lg"
            className="mt-5"
          />
          {(variantTypes.length === 0 || allSelected) && (
            <p
              className={cn(
                "mt-1 text-sm",
                variantTypes.length > 0
                  ? selectedInStock
                    ? "text-emerald-700"
                    : "text-destructive"
                  : soldOut
                    ? "text-destructive"
                    : "text-emerald-700",
              )}
            >
              {(variantTypes.length > 0 ? !selectedInStock : soldOut)
                ? t("store.outOfStock")
                : t("store.inStock")}
            </p>
          )}

          {variantTypes.map((type) => (
            <div key={type.id} className="mt-6">
              <h2 className="brand-eyebrow text-muted-foreground">{type.name}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {type.product_variant_choices.map((choice) => {
                  const blocked = choiceBlocked(type.id, choice);
                  const active = selection[type.id] === choice.id;
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      disabled={blocked}
                      onClick={() => pickChoice(type.id, choice)}
                      className={cn(
                        "rounded-md border px-3 py-1.5 text-sm transition-colors",
                        blocked
                          ? "cursor-not-allowed border-border bg-muted text-muted-foreground line-through opacity-60"
                          : active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-foreground hover:bg-accent",
                      )}
                    >
                      {choice.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {attributes.map((attribute) => (
            <div key={attribute.id} className="mt-6">
              <h2 className="brand-eyebrow text-muted-foreground">{attribute.name}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {attribute.values.map((value) => (
                  <button
                    key={value.id}
                    type="button"
                    className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    {value.name}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-6 flex items-center gap-3">
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
              className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              aria-label="1"
            />
            <button
              type="button"
              className="brand-button"
              disabled={!canBuy || add.isPending}
              onClick={() =>
                activeProductId != null && add.mutate({ productId: activeProductId, quantity })
              }
            >
              {soldOut ? t("store.outOfStock") : t("store.addToCart")}
            </button>
          </div>
          {variantTypes.length > 0 && selectedVariantProductId == null && !soldOut && (
            <p className="mt-2 text-xs text-muted-foreground">{t("store.selectVariant")}</p>
          )}

          {(view?.description || product.description) && (
            <section className="mt-10">
              <h2 className="text-lg font-bold text-foreground">{t("store.description")}</h2>
              <div
                className="mt-2 text-sm leading-relaxed text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: view?.description ?? product.description ?? "" }}
              />
            </section>
          )}

          {specifications.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-bold text-foreground">{t("store.specifications")}</h2>
              <dl className="mt-3 divide-y divide-border border-y border-border text-sm">
                {specifications.map((spec) => (
                  <div key={spec.id} className="flex gap-4 py-2">
                    <dt className="w-1/2 font-medium text-foreground">{spec.name}</dt>
                    <dd className="w-1/2 text-muted-foreground">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

        </div>
      </div>
    </StoreShell>
  );
}
