import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, MapPin, Package, User, UserCog } from "lucide-react";

import { StoreImage } from "@/components/store/store-image";
import { StoreShell } from "@/components/store/store-shell";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  useCountryOptions,
  DEFAULT_REGISTER_CONSTRAINTS,
  isBusinessAccount,
  useAccount,
  useAccountMutations,
  useAddresses,
  useAuth,
  useOrder,
  useOrders,
  useRegisterConstraints,
  VendreAccountError,
} from "@/lib/vendre/account";
import type { Account, Address, FieldErrors } from "@/types/vendre-account";

export type AccountView = "oversikt" | "ordrar" | "adresser" | "konto";

const NAV: { view: AccountView; label: TranslationKey; icon: typeof User }[] = [
  { view: "oversikt", label: "account.overview", icon: User },
  { view: "ordrar", label: "account.orders", icon: Package },
  { view: "adresser", label: "account.addresses", icon: MapPin },
  { view: "konto", label: "account.profile", icon: UserCog },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="brand-heading text-xl text-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------ overview -- */

function OverviewView() {
  const { t } = useI18n();
  const { name } = useAuth();
  const { data: orders } = useOrders();
  const latest = orders?.[0];

  return (
    <Section title={t("account.greeting", { name: name || "" }).trim()}>
      <p className="text-sm text-muted-foreground">{t("account.overviewBody")}</p>
      <div className="mt-5 rounded-lg border border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("account.latestOrder")}
        </p>
        {latest ? (
          <p className="mt-2 text-sm text-foreground">
            #{latest.order_number} · {latest.date} · {latest.status} · {latest.total}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">{t("account.noOrders")}</p>
        )}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/mitt-konto/$view" params={{ view: "ordrar" }}>
            {t("account.orders")}
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/mitt-konto/$view" params={{ view: "adresser" }}>
            {t("account.addresses")}
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/mitt-konto/$view" params={{ view: "konto" }}>
            {t("account.profile")}
          </Link>
        </Button>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------- orders -- */

function OrdersView() {
  const { t } = useI18n();
  const { data: orders, isLoading } = useOrders();
  const [selected, setSelected] = useState<string | null>(null);
  const { data: order } = useOrder(selected);

  if (selected && order) {
    return (
      <Section title={`${t("account.orderDetails")} #${order.order_number}`}>
        <button
          type="button"
          className="text-xs text-muted-foreground underline"
          onClick={() => setSelected(null)}
        >
          {t("account.back")}
        </button>
        {order.lines.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{t("account.noOrderLines")}</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="py-2">{t("account.name")}</th>
                <th className="py-2">{t("account.quantity")}</th>
                <th className="py-2 text-right">{t("account.price")}</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((line) => (
                <tr key={line.id} className="border-b border-border/60">
                  <td className="py-2">
                    <div className="flex items-center gap-3">
                      <StoreImage
                        image={
                          line.image
                            ? {
                                id: null,
                                path: null,
                                image: line.image,
                                alt: line.name,
                                alt_translated: null,
                              }
                            : null
                        }
                        alt={line.name}
                        label={line.name}
                        className="h-12 w-12 shrink-0 rounded-md"
                      />
                      <span className="text-foreground">{line.name}</span>
                    </div>
                  </td>
                  <td className="py-2 text-muted-foreground">{line.quantity}</td>
                  <td className="py-2 text-right text-foreground">
                    <div>{line.price_incl || line.price}</div>
                    {line.price_excl ? (
                      <div className="text-xs text-muted-foreground">
                        {line.price_excl} {t("account.exclVat")}
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <dl className="mt-4 space-y-1 text-sm">
          {order.totals.length > 0 ? (
            order.totals.map((row, index) => (
              <div
                key={`${row.title}-${index}`}
                className={cn(
                  "flex justify-between",
                  index === order.totals.length - 1 && "font-semibold text-foreground",
                )}
              >
                <dt className="text-muted-foreground">{row.title}</dt>
                <dd>{row.value}</dd>
              </div>
            ))
          ) : (
            <>
              {order.shipping_total && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("account.shipping")}</dt>
                  <dd>{order.shipping_total}</dd>
                </div>
              )}
              {order.tax_total && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("account.tax")}</dt>
                  <dd>{order.tax_total}</dd>
                </div>
              )}
              <div className="flex justify-between font-semibold">
                <dt>{t("account.total")}</dt>
                <dd>{order.total}</dd>
              </div>
            </>
          )}
        </dl>
      </Section>
    );
  }

  return (
    <Section title={t("account.orders")}>
      {isLoading && <p className="text-sm text-muted-foreground">…</p>}
      {!isLoading && (orders?.length ?? 0) === 0 && (
        <p className="text-sm text-muted-foreground">{t("account.noOrders")}</p>
      )}
      {(orders?.length ?? 0) > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="py-2">{t("account.order")}</th>
              <th className="py-2">{t("account.date")}</th>
              <th className="py-2">{t("account.status")}</th>
              <th className="py-2 text-right">{t("account.total")}</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer border-b border-border/60 hover:bg-accent"
                onClick={() => setSelected(String(row.id))}
              >
                <td className="py-2 font-medium text-foreground">#{row.order_number}</td>
                <td className="py-2 text-muted-foreground">{row.date}</td>
                <td className="py-2 text-muted-foreground">{row.status}</td>
                <td className="py-2 text-right text-foreground">{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}

/* ----------------------------------------------------------- addresses -- */

function AddressCard({ address }: { address: Address }) {
  const lines = [
    [address.firstname, address.lastname].filter(Boolean).join(" "),
    address.company,
    address.street_address,
    [address.postcode, address.city].filter(Boolean).join(" "),
    address.country,
  ].filter((line) => Boolean(line && String(line).trim()));

  return (
    <div className="rounded-lg border border-border p-4">
      <address className="space-y-0.5 text-sm not-italic text-foreground">
        {lines.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
      </address>
    </div>
  );
}

function AddressesView() {
  const { t } = useI18n();
  const { data } = useAddresses();
  const main = data?.main ?? null;
  const alternatives = data?.alternatives ?? [];

  return (
    <Section title={t("account.addresses")}>
      {!main && alternatives.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("account.noAddresses")}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>{main && <AddressCard address={main} />}</div>
          <div className="space-y-4">
            {alternatives.map((address) => (
              <AddressCard key={address.id} address={address} />
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}


/* ------------------------------------------------------------- profile -- */

function ProfileView() {
  const { t } = useI18n();
  const { data: account } = useAccount();
  const { data: addresses } = useAddresses();
  const { updateAccount } = useAccountMutations();
  const [form, setForm] = useState<Account | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<FieldErrors>({});

  // The profile endpoint carries name/email; street address, postcode and city
  // live on the customer's main address. Seed the form from both, profile first.
  const main = addresses?.main ?? null;
  useEffect(() => {
    if (!account) return;
    setForm((current) => {
      const base = current ?? account;
      // Only fill blanks, so a later address load never overwrites edits.
      const fill = (value: string, ...fallbacks: (string | undefined)[]) =>
        value && value.trim() ? value : (fallbacks.find((v) => v && v.trim()) ?? "");
      return {
        ...base,
        company: fill(base.company, main?.company),
        street_address: fill(base.street_address, main?.street_address),
        postcode: fill(base.postcode, main?.postcode),
        city: fill(base.city, main?.city),
        country: fill(base.country, main?.country),
      };
    });
  }, [account, main]);

  // Countries come from the store session; the fixed list is only a fallback.
  const countryOptions = useCountryOptions();

  // The store decides which fields the account form shows and requires.
  const { data: constraints = DEFAULT_REGISTER_CONSTRAINTS } = useRegisterConstraints();
  const shown = (field: string) => constraints.visible.includes(field);
  const needed = (field: string) => constraints.required.includes(field);
  const limit = (field: string) => {
    const rule = constraints.limits[field];
    return {
      ...(rule?.min !== undefined && { minLength: rule.min }),
      ...(rule?.max !== undefined && { maxLength: rule.max }),
    };
  };



  if (!form) return <Section title={t("account.profile")}>…</Section>;

  const isBusiness = isBusinessAccount(form);

  const field = (
    key: keyof Account,
    label: TranslationKey,
    errorKey: string,
    options?: { constrained?: boolean; hide?: boolean; as?: string },
  ) => {
    const name = options?.as ?? String(key);
    if (options?.hide) return null;
    if (options?.constrained && !shown(name)) return null;
    return (
      <div className="space-y-1.5">
        <Label htmlFor={`profile-${String(key)}`}>{t(label)}</Label>
        <Input
          id={`profile-${String(key)}`}
          {...(options?.constrained && { required: needed(name), ...limit(name) })}
          value={String(form[key] ?? "")}
          onChange={(event) => {
            setSaved(false);
            setForm((current) => (current ? { ...current, [key]: event.target.value } : current));
          }}
        />
        {fields[errorKey] && <p className="text-xs text-destructive">{fields[errorKey]}</p>}
      </div>
    );
  };

  const countryValue = matchCountryOption(form.country, countryOptions, countryList);

  return (
    <Section title={t("account.profile")}>
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          setFields({});
          try {
            await updateAccount.mutateAsync(form);
            setSaved(true);
          } catch (err) {
            if (err instanceof VendreAccountError) {
              setError(err.message);
              setFields(err.fields);
            } else if (err instanceof Error) {
              setError(err.message);
            }
          }
        }}
      >
        {/* The customer type is create-only in the store, so it is not shown
            here; isBusiness still drives which fields are visible. */}
        <div className="grid gap-4 sm:grid-cols-2">
          {field("firstname", "account.firstname", "firstname", { constrained: true })}
          {field("lastname", "account.lastname", "lastname", { constrained: true })}
          {field("email", "account.email", "email_address", {
            constrained: true,
            as: "email_address",
          })}
          {field(
            "personnummer",
            isBusiness ? "account.orgnumber" : "account.personnummer",
            "personnummer",
            { constrained: true },
          )}
          {field("company", "account.company", "company", {
            constrained: true,
            hide: !isBusiness,
          })}
          {field("telephone", "account.phone", "telephone", { constrained: true })}
          {field("mobile", "account.mobile", "mobile", { constrained: true })}
          {field("street_address", "account.street", "street_address", { constrained: true })}
          {field("street_address2", "account.street2", "street_address2", { constrained: true })}
          {field("postcode", "account.postcode", "postcode", { constrained: true })}
          {field("city", "account.city", "city", { constrained: true })}
          <div className="space-y-1.5">
            <Label htmlFor="profile-country">{t("account.country")}</Label>
            <select
              id="profile-country"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={countryValue}
              onChange={(event) => {
                setSaved(false);
                setForm((current) =>
                  current ? { ...current, country: event.target.value } : current,
                );
              }}
            >
              <option value="" />
              {countryOptions.map((option) => (
                <option key={option.id} value={String(option.id)}>
                  {option.label}
                </option>
              ))}
            </select>
            {fields["country_id"] && <p className="text-xs text-destructive">{fields["country_id"]}</p>}
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={updateAccount.isPending}>
            {updateAccount.isPending ? t("account.saving") : t("account.save")}
          </Button>
          {saved && <span className="text-xs text-muted-foreground">{t("account.saved")}</span>}
        </div>
      </form>
    </Section>
  );
}

/* ---------------------------------------------------------------- page -- */

export default function AccountPage({ view = "oversikt" }: { view?: AccountView }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, name, mode } = useAuth();
  const { logout } = useAccountMutations();

  // In demo mode the account area is browsable with dummy data; live mode requires a session.
  const allowed = isAuthenticated || mode === "demo";

  useEffect(() => {
    if (!isLoading && !allowed) void navigate({ to: "/logga-in", replace: true });
  }, [allowed, isLoading, navigate]);

  if (!allowed) {
    return (
      <StoreShell>
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6">
          <p className="text-sm text-muted-foreground">{t("account.signedOutBody")}</p>
        </div>
      </StoreShell>
    );
  }

  return (
    <StoreShell>
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-6">
        <h1 className="brand-heading text-3xl text-foreground">{t("account.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {name}
          {mode === "demo" ? ` · ${t("account.demoNote")}` : ""}
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
          <div className="lg:hidden">
            <Label className="text-xs text-muted-foreground">{t("account.title")}</Label>
            <Select
              value={view}
              onValueChange={(next) => {
                if (next === "oversikt") void navigate({ to: "/mitt-konto" });
                else void navigate({ to: "/mitt-konto/$view", params: { view: next as AccountView } });
              }}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NAV.map((item) => (
                  <SelectItem key={item.view} value={item.view}>
                    {t(item.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              className="mt-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                void logout.mutateAsync().then(() => navigate({ to: "/" }));
              }}
            >
              <LogOut className="size-4" />
              {t("account.signOut")}
            </button>
          </div>

          <nav className="hidden lg:block">

            <ul className="space-y-1">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active = item.view === view;
                return (
                  <li key={item.view}>
                    {item.view === "oversikt" ? (
                      <Link
                        to="/mitt-konto"
                        className={cn(
                          "flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent",
                          active ? "bg-accent font-semibold text-foreground" : "text-muted-foreground",
                        )}
                      >
                        <Icon className="size-4" />
                        {t(item.label)}
                      </Link>
                    ) : (
                      <Link
                        to="/mitt-konto/$view"
                        params={{ view: item.view }}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent",
                          active ? "bg-accent font-semibold text-foreground" : "text-muted-foreground",
                        )}
                      >
                        <Icon className="size-4" />
                        {t(item.label)}
                      </Link>
                    )}
                  </li>
                );
              })}
              <li>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
                  onClick={() => {
                    void logout.mutateAsync().then(() => navigate({ to: "/" }));
                  }}
                >
                  <LogOut className="size-4" />
                  {t("account.signOut")}
                </button>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="brand-heading mb-4 text-2xl text-foreground lg:hidden">
              {t(NAV.find((i) => i.view === view)?.label ?? "account.overview")}
            </h2>
            {view === "oversikt" && <OverviewView />}
            {view === "ordrar" && <OrdersView />}
            {view === "adresser" && <AddressesView />}
            {view === "konto" && <ProfileView />}
          </div>
        </div>
      </div>
    </StoreShell>
  );
}
