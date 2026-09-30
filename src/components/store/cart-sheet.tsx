import { Link } from "@tanstack/react-router";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";


import { ProductPrice } from "@/components/store/product-price";
import { StoreImage } from "@/components/store/store-image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useOnboarding } from "@/context/onboarding-context";
import { useI18n } from "@/lib/i18n";
import {
  formatAmount,
  useCart,
  useCartMutations,
  useSessionContext,
  useVendreApi,
} from "@/lib/vendre/api";


export function CartSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useI18n();
  const api = useVendreApi();
  const { isConfigured } = useOnboarding();
  const { data: cart, isLoading, refetch } = useCart();
  const { data: session } = useSessionContext();
  const { update, remove } = useCartMutations();
  const [checkoutPending, setCheckoutPending] = useState(false);
  const lines = cart?.products ?? [];

  // The total always comes from the store — never summed in the frontend.
  // When we have to format it ourselves, match the decimals the store already
  // uses on the line prices so the sum never looks off next to them.
  const lineDecimals: 0 | 2 = lines.some((line: any) =>
    /[.,]\d/.test(String(line?.price_formatted ?? line?.price_total_formatted ?? "")),
  )
    ? 2
    : 0;
  const cartTotal =
    cart?.cart_total_formatted ??
    (cart?.cart_total != null
      ? formatAmount(cart.cart_total, session?.currency?.code, lineDecimals)
      : "—");


  const goToCheckout = async () => {
    setCheckoutPending(true);
    try {
      // Flush pending cart changes and read the store's truth before leaving.
      await refetch();
      // Checkout is a real browser navigation so the handover token (or the
      // store session cookie) follows.
      const url = await api.checkoutUrl();
      if (url) window.location.href = url;
    } finally {
      setCheckoutPending(false);
    }
  };


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("store.cart")}</SheetTitle>
        </SheetHeader>

        <div className="grow overflow-y-auto py-4">
          {isLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> {t("store.loading")}
            </p>
          ) : lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("store.cartEmpty")}</p>
          ) : (
            <ul className="space-y-4">
              {lines.map((line) => (
                <li key={line.id} className="flex gap-3">
                  <Link
                    to="/produkt/$id"
                    params={{ id: String(line.productId) }}
                    onClick={() => onOpenChange(false)}
                    className="shrink-0"
                  >
                    <StoreImage
                      image={line.product_data?.image ?? null}
                      alt={line.product_data?.name ?? `#${line.productId}`}
                      label={line.product_data?.name ?? "P"}
                      className="size-16 shrink-0 rounded-md"
                    />
                  </Link>
                  <div className="grow">
                    <Link
                      to="/produkt/$id"
                      params={{ id: String(line.productId) }}
                      onClick={() => onOpenChange(false)}
                      className="block text-sm font-semibold text-foreground transition-colors hover:text-primary"
                    >
                      {line.product_data?.name ?? `#${line.productId}`}
                    </Link>
                    {line.product_data && (
                      <ProductPrice
                        product={line.product_data}
                        size="sm"
                        className="mt-1 flex"
                      />
                    )}

                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="-"
                        className="brand-button-ghost size-7 justify-center p-0"
                        onClick={() => update.mutate({ line, quantity: line.quantity - 1 })}
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium text-foreground">{line.quantity}</span>
                      <button
                        type="button"
                        aria-label="+"
                        className="brand-button-ghost size-7 justify-center p-0"
                        onClick={() => update.mutate({ line, quantity: line.quantity + 1 })}
                      >
                        <Plus className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        className="brand-button-ghost ml-auto"
                        onClick={() => remove.mutate({ line })}
                      >
                        <Trash2 className="size-3.5" /> {t("store.remove")}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("store.total")}</span>
            <span className="text-lg font-bold text-foreground">{cartTotal}</span>
          </div>

          <button
            type="button"
            className="brand-button mt-4 w-full justify-center"
            disabled={!isConfigured || lines.length === 0 || checkoutPending}
            onClick={() => void goToCheckout()}
          >
            {checkoutPending && <Loader2 className="size-4 animate-spin" />}
            {t("store.checkout")}
          </button>

          {!isConfigured && <p className="mt-2 text-xs text-muted-foreground">{t("store.checkoutDemo")}</p>}
        </div>
      </SheetContent>
    </Sheet>
  );
}
