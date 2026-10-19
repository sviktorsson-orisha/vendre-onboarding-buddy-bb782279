import { createFileRoute } from "@tanstack/react-router";

import AccountPage from "@/pages/AccountPage";

export const Route = createFileRoute("/mitt-konto/")({
  head: () => ({
    meta: [
      { title: "Overview – My account | Vendre Storefront" },
      {
        name: "description",
        content: "Overview of your customer account: recent orders, addresses and account details.",
      },
      { property: "og:title", content: "Overview – My account" },
      { property: "og:description", content: "Your account overview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AccountPage view="oversikt" />,
});
