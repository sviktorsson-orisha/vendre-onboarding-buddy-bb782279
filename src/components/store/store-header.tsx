import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, Menu, Search, ShoppingBag } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AccountMenu } from "@/components/store/account-menu";
import { CartSheet } from "@/components/store/cart-sheet";
import { SearchBox } from "@/components/store/search-box";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n";
import { resolveImageUrl, useCart, useCategoryMenu, useSessionContext } from "@/lib/vendre/api";
import { cn } from "@/lib/utils";
import type { MenuNode } from "@/types/vendre";

/** Full-viewport-width mega menu panel for one top-level category. */
function MegaPanel({ node, onNavigate }: { node: MenuNode; onNavigate: () => void }) {
  const { t } = useI18n();
  const columns = node.children;

  return (
    <div
      className="absolute inset-x-0 top-full z-40 max-h-[70vh] overflow-y-auto border-b border-border bg-card shadow-xl"
      onClick={onNavigate}
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6">
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {columns.map((child) => (
            <div key={`${child.source}:${child.id}`} className="min-w-0">
              <Link
                to="/kategori/$id"
                params={{ id: String(child.id) }}
                className="block truncate text-sm font-bold text-foreground hover:text-primary"
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
                        className="block truncate rounded-md py-1 text-sm text-muted-foreground hover:text-primary"
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

        <div className="mt-8 border-t border-border pt-4">
          <Link
            to="/kategori/$id"
            params={{ id: String(node.id) }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            {t("store.viewAllIn", { name: node.name })}
            <ArrowRight className="size-4 shrink-0" aria-hidden />
          </Link>
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
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-5 py-3 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center" aria-label={storeName}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={storeName}
              className="h-6 w-auto max-w-[130px] object-contain lg:h-8 lg:max-w-[180px]"
            />
          ) : (
            <span className="brand-wordmark text-xl text-foreground lg:text-2xl">vendre</span>
          )}
        </Link>

        <SearchBox className="ml-2 hidden grow md:block" />

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="brand-button-ghost md:hidden"
            aria-label={t("store.search")}
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((value) => !value)}
          >
            <Search className="size-4" />
          </button>
          <AccountMenu />
          <button
            type="button"
            className="brand-button-ghost relative"
            onClick={() => setCartOpen(true)}
            aria-label={t("store.cart")}
          >
            <ShoppingBag className="size-4" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex size-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </button>
          <button
            type="button"
            className="brand-button-ghost lg:hidden"
            aria-label={t("store.menu")}
            onClick={() => setMobileOpen((value) => !value)}
          >
            <Menu className="size-4" />
          </button>
        </div>
      </div>


      {searchOpen && (
        <div className="mx-auto w-full max-w-6xl px-5 pb-3 sm:px-6 md:hidden">
          <SearchBox autoFocus />
        </div>
      )}

      <nav
        className="relative hidden border-t border-border lg:block"
        onMouseLeave={() => setOpenId(null)}
      >
        <ul className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-1 px-2 sm:px-3">
          {tree.map((node) => {
            const hasChildren = node.children.length > 0;
            const isOpen = openId === node.id;
            return (
              <li key={node.id} className="min-w-0 max-w-full" onMouseEnter={() => setOpenId(hasChildren ? node.id : null)}>
                <Link
                  to="/kategori/$id"
                  params={{ id: String(node.id) }}
                  className="flex min-w-0 items-center gap-1 px-3 py-2 text-sm font-semibold text-foreground transition-colors [overflow-wrap:anywhere] hover:text-primary"
                  aria-haspopup={hasChildren ? "true" : undefined}
                  aria-expanded={hasChildren ? isOpen : undefined}
                  onFocus={() => setOpenId(hasChildren ? node.id : null)}
                  onClick={() => setOpenId(null)}
                >
                  {node.name}
                  {hasChildren && (
                    <ChevronDown
                      className={cn(
                        "size-3.5 text-muted-foreground transition-transform",
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


      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
}
