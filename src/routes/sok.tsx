import { createFileRoute } from "@tanstack/react-router";

import SearchPage from "@/pages/SearchPage";

export type StoreSearch = {
  q?: string | undefined;
  page?: number | undefined;
};

export const Route = createFileRoute("/sok")({
  validateSearch: (search: Record<string, unknown>): StoreSearch => {
    const q = typeof search["q"] === "string" ? search["q"] : "";
    const page = Number(search["page"]);
    return {
      ...(q ? { q } : {}),
      ...(Number.isFinite(page) && page > 1 ? { page } : {}),
    };
  },
  head: () => ({
    meta: [
      { title: "Search products – Vendre Storefront" },
      {
        name: "description",
        content:
          "Search the full range: type three characters for instant suggestions and see all matches on the results page.",
      },
      { property: "og:title", content: "Search products – Vendre Storefront" },
      {
        property: "og:description",
        content: "Find products in your Vendre store with autocomplete and a full results page.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});
