"use client";

import { cn } from "@/lib/utils";
import {
  Activity,
  Bell,
  Building2,
  ChevronRight,
  SlidersHorizontal,
  User,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    href: "/dashboard/profile/dados",
    label: "Dados pessoais",
    description: "Identidade e contato corporativo",
    icon: User,
  },
  {
    href: "/dashboard/profile/organizacao",
    label: "Organização",
    description: "Estrutura, gestão e centro de custo",
    icon: Building2,
  },
  {
    href: "/dashboard/profile/seguranca",
    label: "Segurança",
    description: "Senha e proteção da conta",
    icon: Shield,
  },
  {
    href: "/dashboard/profile/notificacoes",
    label: "Notificações",
    description: "Canais e alertas",
    icon: Bell,
  },
  {
    href: "/dashboard/profile/preferencias",
    label: "Preferências",
    description: "Idioma, fuso e formato",
    icon: SlidersHorizontal,
  },
  {
    href: "/dashboard/profile/atividade",
    label: "Atividade",
    description: "Histórico recente",
    icon: Activity,
  },
] as const;

export function ProfileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="border-b border-slate-200/80 pb-6 dark:border-outline-variant/20">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">
          Conta
        </p>
        <h1 className="mt-1 font-headline text-2xl font-extrabold tracking-tight text-slate-900 dark:text-on-surface">
          Perfil do usuário
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-on-surface-variant">
          Dados corporativos e preferências do colaborador. Campos locais são
          sincronizados neste dispositivo até integração com RH/Appwrite
          metadata.
        </p>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <nav
          className="shrink-0 lg:w-64"
          aria-label="Seções do perfil"
        >
          <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0 lg:pr-0">
            {NAV.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <li key={item.href} className="shrink-0 lg:w-full">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition lg:w-full",
                      active
                        ? "border-cyan-500/40 bg-cyan-50/90 text-cyan-900 dark:border-cyan-800/50 dark:bg-cyan-950/30 dark:text-cyan-100"
                        : "border-transparent bg-slate-50/60 text-slate-700 hover:border-slate-200 hover:bg-white dark:bg-surface-container-low/40 dark:text-on-surface-variant dark:hover:border-outline-variant/30",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-80" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-headline text-xs font-bold uppercase tracking-wide">
                        {item.label}
                      </span>
                      <span className="hidden text-[10px] font-normal text-slate-500 dark:text-outline lg:line-clamp-2">
                        {item.description}
                      </span>
                    </span>
                    <ChevronRight className="hidden h-4 w-4 shrink-0 opacity-40 lg:block" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 flex-1 space-y-6">{children}</div>
      </div>
    </div>
  );
}
