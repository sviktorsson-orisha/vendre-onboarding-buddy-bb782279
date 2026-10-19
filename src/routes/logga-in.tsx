import { createFileRoute } from "@tanstack/react-router";

import LoginPage from "@/pages/LoginPage";

export const Route = createFileRoute("/logga-in")({
  head: () => ({
    meta: [
      { title: "Sign in or create account – Vendre Storefront" },
      {
        name: "description",
        content:
          "Sign in to your customer account or create one to track orders, save addresses and shop faster.",
      },
      { property: "og:title", content: "Sign in or create account – Vendre Storefront" },
      {
        property: "og:description",
        content: "Sign in or register a customer account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});
