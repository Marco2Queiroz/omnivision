"use client";

import { useDashboardAccess } from "@/contexts/DashboardAccessContext";
import { ExecutiveNavTabs } from "@/components/layout/ExecutiveNavTabs";
import { SettingsButton } from "@/components/layout/SettingsButton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type Props = {
  appwriteConfigured: boolean;
};

/**
 * Top bar única: marca + abas (sublinhado) + ações.
 * Variantes “midnight/default” nos ícones só refinam contraste por tema.
 */
export function ExecutiveHeader({ appwriteConfigured }: Props) {
  const { showFullPortfolioNav } = useDashboardAccess();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chrome =
    mounted && resolvedTheme === "light" ? "default" : "midnight";

  return (
    <header className="fixed left-0 right-0 top-0 z-30 h-16 border-b border-line-subtle/80 bg-background/80 shadow-[0_1px_0_0_rgba(145,171,255,0.06)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/75 dark:shadow-[0_4px_30px_-8px_rgba(0,0,0,0.45)]">
      <div className="mx-auto flex h-full min-h-[4rem] max-w-[1600px] items-center justify-between gap-3 px-4 md:px-8">
        <div className="flex min-w-0 shrink-0 items-center gap-6 md:gap-8">
          <Link
            href="/dashboard/todos"
            className="group flex min-w-0 max-w-[min(100%,18rem)] shrink-0 items-center gap-2.5 rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary/40 sm:max-w-[22rem] md:gap-3"
          >
            <Image
              src="/logo-omni.png"
              alt="OmniVision"
              width={400}
              height={100}
              className="h-10 w-auto max-h-[3.5rem] object-contain object-left sm:h-12 md:h-[3.5rem]"
              sizes="(max-width: 640px) 220px, (max-width: 768px) 280px, 320px"
              priority
              unoptimized
            />
            <span className="hidden font-label text-[10px] font-medium uppercase tracking-widest text-on-surface-variant transition-colors group-hover:text-on-surface sm:inline">
              Projetos de TI
            </span>
          </Link>

          <ExecutiveNavTabs
            variant="underline"
            className="min-w-0 flex-1 pl-1"
            showFullPortfolioNav={showFullPortfolioNav}
          />
        </div>

        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <button
            type="button"
            className={cn(
              "hidden rounded-lg p-2 text-primary transition-colors sm:inline-flex",
              chrome === "midnight"
                ? "hover:bg-surface-bright/60"
                : "hover:bg-surface-container-high",
            )}
            aria-label="Notificações (em breve)"
            disabled
          >
            <Bell className="h-5 w-5 opacity-50" />
          </button>
          <ThemeToggle variant={chrome === "midnight" ? "midnight" : "default"} />
          <SettingsButton
            variant={chrome === "midnight" ? "midnight" : "default"}
          />
          <UserMenu
            appwriteConfigured={appwriteConfigured}
            variant={chrome === "midnight" ? "midnight" : "default"}
          />
        </div>
      </div>
    </header>
  );
}
