"use client";

import dynamic from "next/dynamic";
import { ExecutiveHeader } from "@/components/layout/ExecutiveHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import {
  SidebarCollapseProvider,
  useSidebarCollapse,
} from "@/components/layout/SidebarCollapseContext";
import { cn } from "@/lib/utils";

/** Só no cliente: evita erro de hidratação quando o HTML do servidor é novo mas um chunk antigo ainda referencia texto de menu anterior. */
const DashboardSidebar = dynamic(
  () =>
    import("@/components/layout/DashboardSidebar").then((m) => m.DashboardSidebar),
  {
    ssr: false,
    loading: () => (
      <aside
        className="fixed left-0 top-16 z-20 hidden h-[calc(100dvh-4rem)] w-64 flex-col border-r border-line-subtle/90 bg-gradient-to-b from-surface-container-low/95 to-background/98 shadow-[4px_0_24px_-8px_rgba(0,0,0,0.35)] backdrop-blur-md lg:flex dark:shadow-[4px_0_32px_-12px_rgba(0,0,0,0.5)]"
        aria-hidden
      />
    ),
  },
);

type Props = {
  children: React.ReactNode;
  appwriteConfigured: boolean;
};

/**
 * Estrutura do app: rail lateral (256px ou 64px recolhido) + header + conteúdo.
 */
export function DashboardShellInner({
  children,
  appwriteConfigured,
}: Props) {
  return (
    <SidebarCollapseProvider>
      <DashboardShellLayout appwriteConfigured={appwriteConfigured}>
        {children}
      </DashboardShellLayout>
    </SidebarCollapseProvider>
  );
}

function DashboardShellLayout({
  children,
  appwriteConfigured,
}: Props) {
  const { collapsed } = useSidebarCollapse();

  return (
    <div
      className={cn(
        "min-h-dvh bg-background text-on-background transition-[padding] duration-200 ease-out",
        collapsed ? "lg:pl-16" : "lg:pl-64",
      )}
    >
      <DashboardSidebar appwriteConfigured={appwriteConfigured} />
      <ExecutiveHeader appwriteConfigured={appwriteConfigured} />
      <div className="relative z-10 flex min-h-dvh min-w-0 flex-col pt-16">
        <PageContainer className="flex min-h-0 flex-1 flex-col max-w-none px-4 pb-12 pt-6 md:px-8 md:pt-7">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
        </PageContainer>
      </div>
    </div>
  );
}
