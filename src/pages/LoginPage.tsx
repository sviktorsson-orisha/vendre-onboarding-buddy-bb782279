import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";

import { StoreShell } from "@/components/store/store-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import {
  DEFAULT_COUNTRY_ID,
  useCountryOptions,
  DEFAULT_REGISTER_CONSTRAINTS,
  useAccountMutations,
  useAuth,
  useRegisterConstraints,
  VendreAccountError,
} from "@/lib/vendre/account";
import type { FieldErrors, RegisterInput } from "@/types/vendre-account";

function errorsOf(error: unknown): { message: string; fields: FieldErrors } {
  if (error instanceof VendreAccountError) return { message: error.message, fields: error.fields };
  if (error instanceof Error) return { message: error.message, fields: {} };
  return { message: "", fields: {} };
}

function FieldError({ message }: { message?: string | undefined }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}


export default function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { login, register, forgotPassword } = useAccountMutations();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const [form, setForm] = useState<RegisterInput>({
    email_address: "",
    password: "",
    confirmation: "",
    firstname: "",
    lastname: "",
    street_address: "",
    street_address2: "",
    postcode: "",
    city: "",
    country_id: DEFAULT_COUNTRY_ID,
    customer_type: 0,
    personnummer: "",
    company: "",
    telephone: "",
    mobile: "",
    consent_personal_data_policy: false,
  });

  const [registerError, setRegisterError] = useState("");
  const [registerFields, setRegisterFields] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  // Countries come from the store session; the fixed list is only a fallback.
  const countryOptions = useCountryOptions();

  // The store decides which fields the create-account form shows and requires.
  const { data: constraints = DEFAULT_REGISTER_CONSTRAINTS } = useRegisterConstraints();
  const shown = (field: string) => constraints.visible.includes(field);
  const needed = (field: string) => constraints.required.includes(field);
  /** Length limits straight from the store, so the browser flags them early. */
  const limit = (field: string) => {
    const rule = constraints.limits[field];
    return {
      ...(rule?.min !== undefined && { minLength: rule.min }),
      ...(rule?.max !== undefined && { maxLength: rule.max }),
    };
  };


  useEffect(() => {
    if (!isLoading && isAuthenticated) void navigate({ to: "/mitt-konto", replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  const set = <K extends keyof RegisterInput>(key: K, value: RegisterInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  /** Business customers fill in an organisation number and a company name. */
  const isBusiness = form.customer_type === 1;

  /** Renders a text field the store can switch on or off in admin. */
  const optionalField = (
    field: keyof RegisterInput & string,
    labelKey: TranslationKey,
    options?: { hide?: boolean },
  ) =>
    !options?.hide && shown(field) ? (
      <div key={field} className="space-y-1.5">
        <Label htmlFor={field}>{t(labelKey)}</Label>
        <Input
          id={field}
          required={needed(field)}
          {...limit(field)}
          value={String(form[field] ?? "")}
          onChange={(event) => set(field, event.target.value as RegisterInput[typeof field])}
        />
        <FieldError message={registerFields[field]} />
      </div>
    ) : null;


  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setLoginError("");
    try {
      await login.mutateAsync({ email, password });
      await navigate({ to: "/mitt-konto" });
    } catch (error) {
      setLoginError(errorsOf(error).message);
    }
  }

  async function handleRegister(event: FormEvent) {
    event.preventDefault();
    setRegisterError("");
    setRegisterFields({});
    if (form.password && form.password !== form.confirmation) {
      setRegisterFields({ confirmation: t("account.mismatch") });
      return;
    }
    if (needed("consent_personal_data_policy") && !form.consent_personal_data_policy) {
      setRegisterFields({ consent_personal_data_policy: t("account.consent") });
      return;
    }

    try {
      const result = await register.mutateAsync(form);
      // A pending account has no session yet — the store activates it manually.
      if (result.status === "pending") {
        setPending(true);
        return;
      }
      await navigate({ to: "/mitt-konto" });
    } catch (error) {
      const { message, fields } = errorsOf(error);
      // The store answers one generic 422 for every rejected body — most often a
      // duplicate email or ID number. Say that instead of the opaque title.
      setRegisterError(Object.keys(fields).length ? message : t("account.malformed"));
      setRegisterFields(fields);
    }

  }

  return (
    <StoreShell>
      <div className="mx-auto w-full max-w-xl px-5 py-10 sm:px-6">
        <h1 className="brand-heading text-3xl text-foreground">{t("account.title")}</h1>

        <Tabs defaultValue="login" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">
              {t("account.signIn")}
            </TabsTrigger>
            <TabsTrigger value="register" className="flex-1">
              {t("account.signUp")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form
              onSubmit={handleLogin}
              className="space-y-2.5 rounded-xl border border-border bg-card p-6"
            >
              <p className="text-sm text-muted-foreground">{t("account.loginIntro")}</p>
              <div className="space-y-1.5">
                <Label htmlFor="login-email">{t("account.email")}</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password">{t("account.password")}</Label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <FieldError message={loginError} />
              <Button type="submit" className="w-full" disabled={login.isPending}>
                {t("account.signIn")}
              </Button>
              <button
                type="button"
                className="text-xs text-muted-foreground underline"
                onClick={() => {
                  setResetSent(true);
                  void forgotPassword.mutateAsync(email).catch(() => undefined);
                }}
              >
                {t("account.forgot")}
              </button>
              {resetSent && (
                <p className="text-xs text-muted-foreground">{t("account.forgotSent")}</p>
              )}
            </form>
          </TabsContent>

          <TabsContent value="register">
            {pending ? (
              <div className="space-y-2 rounded-xl border border-border bg-card p-6">
                <h2 className="brand-heading text-lg text-foreground">
                  {t("account.pendingTitle")}
                </h2>
                <p className="text-sm text-muted-foreground">{t("account.pendingBody")}</p>
              </div>
            ) : (
            <form
              onSubmit={handleRegister}
              className="space-y-2.5 rounded-xl border border-border bg-card p-6"
            >
              <p className="text-sm text-muted-foreground">{t("account.registerIntro")}</p>

              <div className="space-y-1.5">
                <Label>{t("account.customerType")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {([0, 1] as const).map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant={form.customer_type === value ? "default" : "outline"}
                      onClick={() => set("customer_type", value)}
                    >
                      {t(value === 1 ? "account.business" : "account.private")}
                    </Button>
                  ))}
                </div>
              </div>


              {(shown("firstname") || shown("lastname")) && (
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="firstname">{t("account.firstname")}</Label>
                  <Input
                    id="firstname"
                    required={needed("firstname")}
                    value={form.firstname}
                    onChange={(event) => set("firstname", event.target.value)}
                  />
                  <FieldError message={registerFields["firstname"]} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastname">{t("account.lastname")}</Label>
                  <Input
                    id="lastname"
                    required={needed("lastname")}
                    value={form.lastname}
                    onChange={(event) => set("lastname", event.target.value)}
                  />
                  <FieldError message={registerFields["lastname"]} />
                </div>
              </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="register-email">{t("account.email")}</Label>
                <Input
                  id="register-email"
                  type="email"
                  required
                  value={form.email_address}
                  onChange={(event) => set("email_address", event.target.value)}
                />
                <FieldError message={registerFields["email_address"]} />
              </div>

              {shown("password") && (
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="register-password">{t("account.password")}</Label>
                  <Input
                    id="register-password"
                    type="password"
                    autoComplete="new-password"
                    required={needed("password")}
                    value={form.password}
                    onChange={(event) => set("password", event.target.value)}
                  />
                  <FieldError message={registerFields["password"]} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmation">{t("account.confirm")}</Label>
                  <Input
                    id="confirmation"
                    type="password"
                    autoComplete="new-password"
                    required={Boolean(form.password)}
                    value={form.confirmation}
                    onChange={(event) => set("confirmation", event.target.value)}
                  />
                  <FieldError message={registerFields["confirmation"]} />
                </div>
              </div>
              )}

              {optionalField(
                "personnummer",
                isBusiness ? "account.orgnumber" : "account.personnummer",
              )}
              {optionalField("company", "account.company", { hide: !isBusiness })}

              {(shown("telephone") || shown("mobile")) && (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {optionalField("telephone", "account.phone")}
                  {optionalField("mobile", "account.mobile")}
                </div>
              )}

              {shown("street_address") && (
              <div className="space-y-1.5">
                <Label htmlFor="street">{t("account.street")}</Label>
                <Input
                  id="street"
                  required={needed("street_address")}
                  {...limit("street_address")}
                  value={form.street_address}
                  onChange={(event) => set("street_address", event.target.value)}
                />
                <FieldError message={registerFields["street_address"]} />
              </div>
              )}

              {optionalField("street_address2", "account.street2")}


              {(shown("postcode") || shown("city")) && (
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="postcode">{t("account.postcode")}</Label>
                  <Input
                    id="postcode"
                    required={needed("postcode")}
                    value={form.postcode}
                    onChange={(event) => set("postcode", event.target.value)}
                  />
                  <FieldError message={registerFields["postcode"]} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">{t("account.city")}</Label>
                  <Input
                    id="city"
                    required={needed("city")}
                    value={form.city}
                    onChange={(event) => set("city", event.target.value)}
                  />
                  <FieldError message={registerFields["city"]} />
                </div>
              </div>
              )}

              {shown("country_id") && (
              <div className="space-y-1.5">
                <Label htmlFor="country_id">{t("account.country")}</Label>
                <select
                  id="country_id"
                  required={needed("country_id")}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                  value={form.country_id}
                  onChange={(event) => set("country_id", Number(event.target.value))}
                >
                  {countryOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FieldError message={registerFields["country_id"]} />
              </div>
              )}

              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox
                  checked={form.consent_personal_data_policy}
                  onCheckedChange={(value) => set("consent_personal_data_policy", value === true)}
                />
                {t("account.consent")}
              </label>
              <FieldError message={registerFields["consent_personal_data_policy"]} />


              <FieldError message={registerError} />
              <Button
                type="submit"
                className="w-full"
                disabled={
                  register.isPending ||
                  (needed("consent_personal_data_policy") && !form.consent_personal_data_policy)
                }
              >
                {t("account.signUp")}
              </Button>
            </form>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </StoreShell>
  );
}
