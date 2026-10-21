import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu, Search, ShoppingCart } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AccountMenu } from "@/components/store/account-menu";
import { SearchBox } from "@/components/store/search-box";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n";
import {
  resolveImageUrl,
  useCart,
  useCategoryMenu,
  usePrefetchCategory,
  useSessionContext,
} from "@/lib/vendre/api";
import { useIntent } from "@/lib/vendre/use-intent";
import { cn } from "@/lib/utils";
import type { MenuNode } from "@/types/vendre";

/** Full-viewport-width mega menu panel for one top-level category. */
function MegaPanel({ node, onNavigate }: { node: MenuNode; onNavigate: () => void }) {
  const { t } = useI18n();
  const columns = node.children;
  const intent = useIntent(usePrefetchCategory());

  return (
    <div
      className="absolute inset-x-0 top-full z-40 max-h-[70vh] overflow-y-auto border-b border-border bg-card"
      onClick={onNavigate}
    >
      <div className="mx-auto w-full max-w-6xl xl:max-w-[88rem] px-5 py-8 sm:px-6">
        <div className="mb-6">
          <Link
            to="/kategori/$id"
            params={{ id: String(node.id) }}
            {...intent(node.id)}
            className="inline-flex items-center text-sm font-normal text-foreground underline"
          >
            {t("store.viewAllIn", { name: node.name })}
          </Link>
        </div>
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {columns.map((child) => (
            <div key={`${child.source}:${child.id}`} className="min-w-0">
              <Link
                to="/kategori/$id"
                params={{ id: String(child.id) }}
                {...intent(child.id)}
                className="block truncate text-sm font-bold text-foreground hover:underline"
              >
                {child.name}
              </Link>
              {child.children.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {child.children.map((leaf) => (
                    <li key={`${leaf.source}:${leaf.id}`}>
                      <Link
                        to="/kategori/$id"
                        params={{ id: String(leaf.id) }}
                        {...intent(leaf.id)}
                        className="block truncate rounded-md py-1 text-sm text-muted-foreground hover:text-foreground"
                      >
                        {leaf.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

/** Category list for the mobile drawer: nodes with children collapse as accordions. */
function MobileNavList({
  nodes,
  onNavigate,
  depth = 0,
}: {
  nodes: MenuNode[];
  onNavigate: () => void;
  depth?: number;
}) {
  const intent = useIntent(usePrefetchCategory());
  return (
    <div className={depth === 0 ? "" : "ml-3 border-l border-border pl-3"}>
      <Accordion type="multiple" className="w-full">
        {nodes.map((node) => {
          const key = `${node.source}:${node.id}`;
          if (node.children.length === 0) {
            return (
              <Link
                key={key}
                to="/kategori/$id"
                params={{ id: String(node.id) }}
                {...intent(node.id)}
                onClick={onNavigate}
                className={cn(
                  "block rounded-md px-2 py-2 hover:bg-accent",
                  depth === 0
                    ? "text-sm font-semibold text-foreground"
                    : "text-sm text-muted-foreground",
                )}
              >
                {node.name}
              </Link>
            );
          }

          return (
            <AccordionItem key={key} value={key} className="border-b-0">
              <div className="flex items-center gap-1">
                <Link
                  to="/kategori/$id"
                  params={{ id: String(node.id) }}
                  {...intent(node.id)}
                  onClick={onNavigate}
                  className={cn(
                    "min-w-0 flex-1 truncate rounded-md px-2 py-2 hover:bg-accent",
                    depth === 0
                      ? "text-sm font-semibold text-foreground"
                      : "text-sm text-muted-foreground",
                  )}
                >
                  {node.name}
                </Link>
                <AccordionTrigger className="shrink-0 rounded-md px-2 py-2 hover:bg-accent" />
              </div>
              <AccordionContent className="pb-1">
                <MobileNavList nodes={node.children} onNavigate={onNavigate} depth={depth + 1} />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

export function StoreHeader() {

  const { t } = useI18n();
  const tree = useCategoryMenu();
  const { data: cart } = useCart();
  const { data: session } = useSessionContext();
  const storeName = session?.configuration?.STORE_NAME ?? session?.STORE_NAME ?? "Vendre";
  const logoUrl = resolveImageUrl(session?.configuration?.SHOP_LOGO ?? session?.SHOP_LOGO);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const count = cart?.cart_count ?? 0;
  const categoryIntent = useIntent(usePrefetchCategory());
  const activeNode = tree.find((node) => node.id === openId && node.children.length > 0) ?? null;

  useEffect(() => {
    if (openId === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openId]);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card">
      <div className="bg-brand-pink text-primary-foreground">
        <div className="mx-auto grid w-full max-w-6xl xl:max-w-[88rem] grid-cols-1 px-5 py-2.5 text-center text-xs md:px-8 md:py-3.5 md:text-sm lg:grid-cols-3 lg:py-2.5">
          <p className="truncate">{t("store.announcement")}</p>
          <p className="hidden truncate lg:block">{t("store.announcement")}</p>
          <p className="hidden truncate lg:block">{t("store.announcement")}</p>
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-6xl xl:max-w-[88rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 md:px-8 md:py-5 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-8 lg:py-6">
        <Link to="/" className="flex min-w-0 items-center" aria-label={storeName}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={storeName}
              className="h-7 w-auto max-w-[130px] object-contain md:h-8 md:max-w-[150px] lg:h-10 lg:max-w-[190px]"
            />
          ) : (
            <span className="brand-wordmark text-xl text-foreground md:text-2xl lg:text-3xl">vendre</span>
          )}
        </Link>

        <SearchBox className="hidden w-full max-w-xl justify-self-center lg:block" />

        <div className="flex shrink-0 items-center justify-end gap-1 justify-self-end md:gap-3 lg:gap-5">
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full text-foreground hover:bg-accent lg:hidden"
            aria-label={t("store.search")}
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((value) => !value)}
          >
            <Search className="size-6" strokeWidth={1.5} />
          </button>
          <AccountMenu />
          <button
            type="button"
            className="relative grid size-10 place-items-center rounded-full text-foreground hover:bg-accent"
            onClick={() => setCartOpen(true)}
            aria-label={t("store.cart")}
          >
            <ShoppingCart className="size-6" strokeWidth={1.5} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-5 min-w-5 items-center justify-center rounded-full bg-brand-blue px-1 text-[10px] font-semibold text-foreground">
                {count}
              </span>
            )}
          </button>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full text-foreground hover:bg-accent lg:hidden"
            aria-label={t("store.menu")}
            onClick={() => setMobileOpen((value) => !value)}
          >
            <Menu className="size-6" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="mx-auto w-full max-w-6xl xl:max-w-[88rem] px-5 pb-4 md:px-8 lg:hidden">
          <SearchBox autoFocus />
        </div>
      )}

      <nav
        className="relative hidden lg:block"
        onMouseLeave={() => setOpenId(null)}
      >
        <ul className="mx-auto flex w-full max-w-6xl xl:max-w-[88rem] flex-wrap items-center gap-x-6 px-5 pb-4 md:px-8 xl:gap-x-10">
          {tree.map((node) => {
            const hasChildren = node.children.length > 0;
            const isOpen = openId === node.id;
            return (
              <li key={node.id} className="min-w-0 max-w-full" onMouseEnter={() => setOpenId(hasChildren ? node.id : null)}>
                <Link
                  to="/kategori/$id"
                  params={{ id: String(node.id) }}
                  className="flex min-w-0 items-center gap-1 px-2 py-2 text-base font-normal text-foreground transition-colors [overflow-wrap:anywhere] hover:underline"
                  aria-haspopup={hasChildren ? "true" : undefined}
                  aria-expanded={hasChildren ? isOpen : undefined}
                  {...categoryIntent(node.id)}
                  onFocus={() => setOpenId(hasChildren ? node.id : null)}
                  onClick={() => setOpenId(null)}
                >
                  {node.name}
                  {hasChildren && (
                    <ChevronDown
                      className={cn(
                        "size-3.5 shrink-0 text-muted-foreground transition-transform",
                        isOpen && "rotate-180",
                      )}
                      aria-hidden
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {activeNode && <MegaPanel node={activeNode} onNavigate={() => setOpenId(null)} />}
      </nav>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-sm lg:hidden">
          <SheetHeader>
            <SheetTitle>{t("store.menu")}</SheetTitle>
          </SheetHeader>
          <nav className="mt-4 flex-1 overflow-y-auto pb-6">
            <MobileNavList nodes={tree} onNavigate={() => setMobileOpen(false)} />
          </nav>

        </SheetContent>
      </Sheet>


      <LazyCartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
}

// Cart panel code loads the first time the cart is opened, then stays mounted.
const CartSheet = lazy(() =>
  import("@/components/store/cart-sheet").then((m) => ({ default: m.CartSheet })),
);

function LazyCartSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [loaded, setLoaded] = useState(open);
  useEffect(() => {
    if (open) setLoaded(true);
  }, [open]);
  if (!loaded) return null;
  return (
    <Suspense fallback={null}>
      <CartSheet open={open} onOpenChange={onOpenChange} />
    </Suspense>
  );
}
