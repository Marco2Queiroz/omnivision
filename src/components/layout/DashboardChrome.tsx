"use client";

import { DashboardShellInner } from "@/components/layout/DashboardShellInner";

type Props = {
  children: React.ReactNode;
  appwriteConfigured: boolean;
};

/**
 * Shell único do app: rail lateral + top bar + área de conteúdo.
 * Tema escuro/claro altera apenas tokens (globals.css), não a estrutura.
 */
export function DashboardChrome({ children, appwriteConfigured }: Props) {
  return (
    <DashboardShellInner appwriteConfigured={appwriteConfigured}>
      {children}
    </DashboardShellInner>
  );
}
