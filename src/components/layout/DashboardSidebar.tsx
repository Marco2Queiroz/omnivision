"use client";

import { useDashboardAccess } from "@/contexts/DashboardAccessContext";
import { useSidebarCollapse } from "@/components/layout/SidebarCollapseContext";
import { DASHBOARD_TABS } from "@/lib/dashboard-tabs";
import { cn } from "@/lib/utils";
import { account } from "@/lib/appwrite";
import {
  Activity,
  Compass,
  Crosshair,
  HelpCircle,
  LayoutDashboard,
  type LucideIcon,
  LogOut,
  Pin,
  PinOff,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type Props = {
  appwriteConfigured: boolean;
};

const SIDEBAR_TAB_ORDER = [
  "todos",
  "operacional",
  "tatica",
  "estrategica",
] as const;

type SidebarTabId = (typeof SIDEBAR_TAB_ORDER)[number];

const SIDEBAR_ICONS: Record<SidebarTabId, LucideIcon> = {
  todos: LayoutDashboard,
  operacional: Activity,
  tatica: Crosshair,
  estrategica: Compass,
};

/**
 * Rail lateral com recolhimento: pino fixa o menu expandido; desafixar recolhe para ícones.
 */
export function DashboardSidebar({ appwriteConfigured }: Props) {
  const { showFullPortfolioNav } = useDashboardAccess();
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, toggle } = useSidebarCollapse();

  async function signOut() {
    if (!appwriteConfigured) {
      router.push("/login");
      return;
    }
    try {
      await account.deleteSession({ sessionId: "current" });
    } catch {
      /* ignore */
    }
    router.push("/login");
    router.refresh();
  }

  const sidebarOrder: readonly SidebarTabId[] = showFullPortfolioNav
    ? [...SIDEBAR_TAB_ORDER]
    : ["todos"];
  const sidebarItems = sidebarOrder
    .map((id) => DASHBOARD_TABS.find((t) => t.id === id))
    .filter(
      (t): t is (typeof DASHBOARD_TABS)[number] => t != null,
    );

  function isTabActive(path: string): boolean {
    return pathname === path || pathname.startsWith(`${path}/`);
  }

  return (
    <aside
      className={cn(
        /* top-16: abaixo do header fixo (z-30); antes top-0 o header cobria o pino e bloqueava cliques */
        "fixed left-0 top-16 z-20 hidden h-[calc(100dvh-4rem)] flex-col overflow-y-auto overflow-x-hidden border-r border-line-subtle/90 bg-gradient-to-b from-surface-container-low/95 to-background/98 py-3 shadow-[4px_0_24px_-8px_rgba(0,0,0,0.35)] backdrop-blur-md transition-[width] duration-200 ease-out dark:shadow-[4px_0_32px_-12px_rgba(0,0,0,0.5)] lg:flex",
        collapsed ? "w-16" : "w-64",
      )}
      aria-label="Console"
    >
      {/* Controle fixar / recolher */}
      <div
        className={cn(
          "mb-4 flex shrink-0 items-center px-2",
          collapsed ? "justify-center" : "justify-end px-4",
        )}
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle();
          }}
          className={cn(
            "relative z-10 inline-flex cursor-pointer items-center justify-center rounded-lg p-2 text-primary transition-colors",
            "hover:bg-surface-bright/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          )}
          aria-expanded={!collapsed}
          aria-label={
            collapsed
              ? "Expandir e fixar menu lateral"
              : "Recolher menu lateral"
          }
          title={
            collapsed
              ? "Expandir e fixar menu lateral"
              : "Recolher menu lateral"
          }
        >
          {collapsed ? (
            <Pin className="h-5 w-5" aria-hidden />
          ) : (
            <PinOff className="h-5 w-5" aria-hidden />
          )}
        </button>
      </div>

      {/* Marca */}
      <div
        className={cn(
          "mb-8 shrink-0",
          collapsed ? "flex justify-center px-2" : "px-6",
        )}
      >
        {collapsed ? (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20"
            aria-hidden
          >
            <span className="font-headline text-sm font-bold text-tertiary">O</span>
          </div>
        ) : (
          <div className="min-w-0">
            <h2 className="font-headline text-xs font-bold uppercase tracking-wide text-tertiary">
              OmniVision
            </h2>
            <p className="text-[10px] font-medium text-on-surface-variant">
              Portfólio de TI
            </p>
          </div>
        )}
      </div>

      <nav
        className={cn(
          "flex flex-1 flex-col",
          collapsed ? "items-center space-y-1 px-2" : "space-y-1",
        )}
      >
        {sidebarItems.map((tab) => {
          const active = isTabActive(tab.path);
          const Icon = SIDEBAR_ICONS[tab.id as SidebarTabId] ?? LayoutDashboard;
          return (
            <Link
              key={tab.id}
              href={tab.path}
              className={cn(
                "group flex items-center font-label text-xs font-semibold uppercase tracking-wide transition-colors",
                collapsed
                  ? "justify-center rounded-lg px-2 py-3"
                  : "gap-3 px-6 py-3",
                active
                  ? collapsed
                    ? "bg-surface-container text-primary"
                    : "rounded-r-full border-l-4 border-primary bg-surface-container text-primary"
                  : "text-on-surface-variant hover:bg-surface-container/50 hover:text-on-background",
              )}
              title={tab.label}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  collapsed ? "" : "h-4 w-4",
                  !active && !collapsed && "group-hover:text-on-background",
                )}
                aria-hidden
              />
              {collapsed ? (
                <span className="sr-only">{tab.label}</span>
              ) : (
                tab.label
              )}
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "mt-auto border-t border-line-subtle pt-4",
          collapsed && "flex flex-col items-center",
        )}
      >
        <a
          href="https://www.vamos.com.br"
          target="_blank"
          rel="noreferrer"
          className={cn(
            "flex items-center text-on-surface-variant transition-colors hover:bg-surface-container/50",
            collapsed
              ? "justify-center rounded-lg p-3"
              : "gap-3 px-6 py-3",
          )}
          title="Suporte"
        >
          <HelpCircle className="h-5 w-5 shrink-0" aria-hidden />
          {!collapsed ? (
            <span className="font-label text-xs font-semibold uppercase tracking-wide">
              Suporte
            </span>
          ) : (
            <span className="sr-only">Suporte</span>
          )}
        </a>
        <button
          type="button"
          onClick={() => void signOut()}
          className={cn(
            "flex items-center text-on-surface-variant transition-colors hover:bg-surface-container/50 hover:text-error",
            collapsed
              ? "justify-center rounded-lg p-3"
              : "w-full gap-3 px-6 py-3",
          )}
          title="Sair"
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden />
          {!collapsed ? (
            <span className="font-label text-xs font-semibold uppercase tracking-wide">
              Sair
            </span>
          ) : (
            <span className="sr-only">Sair</span>
          )}
        </button>
      </div>
    </aside>
  );
}
