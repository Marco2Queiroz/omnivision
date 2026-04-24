"use client";

import { DashboardChrome } from "@/components/layout/DashboardChrome";
import { DashboardAccessProvider } from "@/contexts/DashboardAccessContext";
import type { DashboardAccessState } from "@/lib/dashboard-access";

type Props = {
  children: React.ReactNode;
  appwriteConfigured: boolean;
  access: DashboardAccessState;
};

export function DashboardShell({
  children,
  appwriteConfigured,
  access,
}: Props) {
  return (
    <DashboardAccessProvider value={access}>
      <DashboardChrome appwriteConfigured={appwriteConfigured}>
        {children}
      </DashboardChrome>
    </DashboardAccessProvider>
  );
}
