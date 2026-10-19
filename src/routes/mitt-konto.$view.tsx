import { createFileRoute } from "@tanstack/react-router";

import AccountPage, { type AccountView } from "@/pages/AccountPage";

const VIEWS: AccountView[] = ["oversikt", "ordrar", "adresser", "konto"];

export const Route = createFileRoute("/mitt-konto/$view")({
  head: () => ({
    meta: [
      { title: "My account – Vendre Storefront" },
      {
        name: "description",
        content: "Orders, addresses, users and account details for your customer account.",
      },
      { property: "og:title", content: "My account – Vendre Storefront" },
      { property: "og:description", content: "Manage your customer account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountViewRoute,
});

function AccountViewRoute() {
  const { view } = Route.useParams();
  const safe = (VIEWS as string[]).includes(view) ? (view as AccountView) : "oversikt";
  return <AccountPage view={safe} />;
}
