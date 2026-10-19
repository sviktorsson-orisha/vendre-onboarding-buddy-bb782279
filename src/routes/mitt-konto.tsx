import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/mitt-konto")({
  head: () => ({
    meta: [
      { title: "My account – Vendre Storefront" },
      {
        name: "description",
        content:
          "Manage your orders, addresses, users and account details in your Vendre store.",
      },
      { property: "og:title", content: "My account – Vendre Storefront" },
      { property: "og:description", content: "Orders, addresses and account details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Outlet />,
});
