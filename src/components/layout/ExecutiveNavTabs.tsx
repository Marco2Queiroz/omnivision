"use client";

import { DASHBOARD_TABS } from "@/lib/dashboard-tabs";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavTabsVariant =
  | "underline"
  /** @deprecated use `underline` — shell único */
  | "midnight"
  /** Abas estilo “pasta” (legado / alternativo) */
  | "crystal";

type Props = {
  variant?: NavTabsVariant;
  className?: string;
  /** Se falso, mostra só a aba «Dashboard» (todos). */
  showFullPortfolioNav?: boolean;
};

/**
 * `underline` — navegação principal do app (mesma estrutura em claro/escuro).
 * `crystal` — variante com borda inferior no container (legado).
 */
export function ExecutiveNavTabs({
  variant = "underline",
  className,
  showFullPortfolioNav = true,
}: Props) {
  const pathname = usePathname();
  const useUnderline = variant === "underline" || variant === "midnight";
  const tabs = showFullPortfolioNav
    ? DASHBOARD_TABS
    : DASHBOARD_TABS.filter((t) => t.id === "todos");

  if (useUnderline) {
    return (
      <nav
        className={cn(
          "scrollbar-hide flex gap-3 overflow-x-auto sm:gap-4 md:gap-6",
          className,
        )}
        aria-label="Áreas do portfólio"
      >
        {tabs.map((tab) => {
          const active =
            pathname === tab.path || pathname.startsWith(`${tab.path}/`);
          return (
            <Link
              key={tab.id}
              href={tab.path}
              prefetch
              className={cn(
                "shrink-0 whitespace-nowrap font-headline text-sm font-bold uppercase tracking-tight transition-all duration-200",
                active
                  ? "border-b-2 border-primary pb-1.5 text-primary [text-shadow:0_0_24px_rgba(145,171,255,0.2)]"
                  : "border-b-2 border-transparent pb-1.5 text-on-surface-variant hover:border-b-primary/25 hover:text-on-background",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      className={cn(
        "scrollbar-hide flex max-w-[min(100vw-12rem,56rem)] gap-1 overflow-x-auto border-b border-outline-variant/20 pb-px md:max-w-none",
        className,
      )}
      aria-label="Áreas do portfólio"
    >
      {tabs.map((tab) => {
        const active =
          pathname === tab.path || pathname.startsWith(`${tab.path}/`);
        return (
          <Link
            key={tab.id}
            href={tab.path}
            prefetch
            className={cn(
              "shrink-0 whitespace-nowrap rounded-t-md px-3 py-2 font-headline text-[10px] font-bold uppercase tracking-wider transition",
              active
                ? "border border-b-0 border-outline-variant/25 bg-surface-container-lowest text-primary"
                : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
