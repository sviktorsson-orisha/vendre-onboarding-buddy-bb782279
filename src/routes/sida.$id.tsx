import { createFileRoute } from "@tanstack/react-router";

import ContentPage from "@/pages/ContentPage";

export const Route = createFileRoute("/sida/$id")({
  head: () => ({
    meta: [
      { title: "Information – Vendre Storefront" },
      {
        name: "description",
        content:
          "Content page from the store's Vendre CMS – shipping, terms, customer service and more.",
      },
      { property: "og:title", content: "Information – Vendre Storefront" },
      {
        property: "og:description",
        content: "Content page loaded from Vendre Surface API v2.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContentRoute,
});

function ContentRoute() {
  const { id } = Route.useParams();
  return <ContentPage id={Number(id)} />;
}
