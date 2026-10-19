import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, MapPin, Package, User, UserCog } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n";
import { useAccountMutations, useAuth } from "@/lib/vendre/account";

export function AccountMenu() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { isAuthenticated, name } = useAuth();
  const { logout } = useAccountMutations();

  if (!isAuthenticated) {
    return (
      <Link to="/logga-in" className="grid size-10 place-items-center rounded-full text-foreground hover:bg-accent lg:text-primary" aria-label={t("account.signIn")}>
        <User className="size-6" strokeWidth={1.5} />
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="grid size-10 place-items-center rounded-full text-foreground hover:bg-accent lg:text-primary" aria-label={t("account.title")}>
          <User className="size-6" strokeWidth={1.5} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{name || t("account.title")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/mitt-konto">
            <UserCog className="size-4" />
            {t("account.title")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/mitt-konto/$view" params={{ view: "ordrar" }}>
            <Package className="size-4" />
            {t("account.orders")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/mitt-konto/$view" params={{ view: "adresser" }}>
            <MapPin className="size-4" />
            {t("account.addresses")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            void logout.mutateAsync().then(() => navigate({ to: "/" }));
          }}
        >
          <LogOut className="size-4" />
          {t("account.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
