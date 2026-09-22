import { Link } from "@tanstack/react-router";

import { ProductCard } from "@/components/store/product-card";

import { StoreShell } from "@/components/store/store-shell";
import { useI18n } from "@/lib/i18n";
import { useFeaturedProducts, useMenuTree } from "@/lib/vendre/api";

export default function Index() {
  const { t } = useI18n();
  const tree = useMenuTree();
  const { data: featured = [] } = useFeaturedProducts(4);

  return (
    <StoreShell>
      <section className="brand-card overflow-hidden p-8 sm:p-12">
        <p className="brand-eyebrow inline-flex rounded-md bg-primary/10 px-3 py-1 text-primary">vendre</p>
        <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.05] text-foreground sm:text-5xl">
          {t("store.heroTitle")}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">{t("store.heroBody")}</p>
        {tree[0] && (
          <Link
            to="/kategori/$id"
            params={{ id: String(tree[0].id) }}
            className="brand-button brand-button-green mt-6"
          >
            {t("store.heroCta")}
          </Link>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground">{t("store.featured")}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </StoreShell>
  );
}
