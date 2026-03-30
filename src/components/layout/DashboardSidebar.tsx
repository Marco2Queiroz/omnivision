"use client";

import { cn } from "@/lib/utils";
import {
  Crosshair,
  Gauge,
  LayoutDashboard,
  Menu,
  Radar,
  Target,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/dashboard", label: "Portal", icon: LayoutDashboard },
  { href: "/dashboard/strategy", label: "Estratégica", icon: Target },
  { href: "/dashboard/tactical", label: "Tática", icon: Radar },
  { href: "/dashboard/operational", label: "Operacional", icon: Gauge },
  { href: "/dashboard/geo", label: "Crise Geo", icon: Crosshair },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-24 z-40 rounded-lg border border-outline-variant/30 bg-surface-container/80 p-2 text-primary-container backdrop-blur md:hidden"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Fechar menu" : "Abrir menu"}
      >
        <Menu className="h-5 w-5" />
      </button>
      <aside
        className={cn(
          "fixed left-0 top-0 z-30 flex h-full w-56 flex-col border-r border-outline-variant/20 bg-surface-container/95 py-24 backdrop-blur-md transition-transform md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="px-4 pb-6">
          <p className="font-headline text-[10px] font-bold uppercase tracking-[0.3em] text-outline">
            Navegação
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-2">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 font-headline text-xs font-semibold uppercase tracking-wider transition",
                  active
                    ? "bg-secondary-container/40 text-primary-container shadow-glow"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
