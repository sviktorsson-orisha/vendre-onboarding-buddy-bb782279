import { createFileRoute } from "@tanstack/react-router";

import ProductPage from "@/pages/ProductPage";

export const Route = createFileRoute("/produkt/$id")({
  head: () => ({
    meta: [
      { title: "Product – Vendre Storefront" },
      {
        name: "description",
        content:
          "Product page with price, stock status, variants and buy button – connected to your Vendre store.",
      },
      { property: "og:title", content: "Product – Vendre Storefront" },
      {
        property: "og:description",
        content: "Price, stock status and variants from your Vendre store.",
      },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductRoute,
});

function ProductRoute() {
  const { id } = Route.useParams();
  return <ProductPage id={id} />;
}
