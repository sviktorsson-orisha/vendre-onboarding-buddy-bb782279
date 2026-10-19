import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vendre Storefront – shop online" },
      {
        name: "description",
        content:
          "Store built on Vendre Surface API v2: categories, products and cart. Demo data is shown until the store connection is verified.",
      },
      { property: "og:title", content: "Vendre Storefront – shop online" },
      {
        property: "og:description",
        content:
          "Categories, products and cart in a ready headless store built on Vendre Surface API v2.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },

    ],
  }),
  component: Index,
});
