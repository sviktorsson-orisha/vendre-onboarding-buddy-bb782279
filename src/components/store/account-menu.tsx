import { Link } from "@tanstack/react-router";
import { User } from "lucide-react";

import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/vendre/account";

export function AccountMenu() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const className = "grid size-10 place-items-center rounded-full text-foreground";

  if (!isAuthenticated) {
    return (
      <Link to="/logga-in" className={className} aria-label={t("account.signIn")}>
        <User className="size-6" strokeWidth={1.5} />
      </Link>
    );
  }

  return (
    <Link to="/mitt-konto" className={className} aria-label={t("account.title")}>
      <User className="size-6" strokeWidth={1.5} />
    </Link>
  );
}
