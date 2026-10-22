import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Variant = "success" | "error" | "warning";

const styles: Record<Variant, string> = {
  success: "bg-success/12 text-success",
  error: "bg-alert/12 text-alert",
  warning: "bg-warning/25 text-foreground",
};

/** Reusable feedback box for forms. Always the same look; colours come from the global status tokens. */
export function FormMessage({
  variant,
  children,
  className,
}: {
  variant: Variant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "w-full rounded-[var(--radius)] px-4 py-3 text-center text-sm font-semibold",
        styles[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
