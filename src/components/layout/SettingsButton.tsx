"use client";

import { cn } from "@/lib/utils";
import { Settings } from "lucide-react";
import Link from "next/link";

type Props = {
  variant?: "default" | "midnight";
};

export function SettingsButton({ variant = "default" }: Props) {
  const midnight = variant === "midnight";
  return (
    <Link
      href="/settings"
      className={cn(
        "inline-flex items-center justify-center text-primary transition-all duration-200",
        midnight
          ? "rounded-lg p-2 hover:bg-surface-bright/60"
          : "h-9 w-9 rounded-lg border border-line-field/90 bg-surface-container-high/85 shadow-sm ring-primary/0 hover:border-primary/45 hover:ring-1 hover:ring-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
      )}
      aria-label="Configurações"
      title="Configurações"
    >
      <Settings className={midnight ? "h-5 w-5" : "h-4 w-4"} />
    </Link>
  );
}
