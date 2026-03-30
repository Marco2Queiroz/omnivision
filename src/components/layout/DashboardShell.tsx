"use client";

import { useFilterUrlSync } from "@/hooks/useFilterUrlSync";
import { Suspense } from "react";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";
import { FilterBar } from "./FilterBar";

type Props = {
  children: React.ReactNode;
  supabaseConfigured: boolean;
};

function FilterSync() {
  useFilterUrlSync();
  return null;
}

export function DashboardShell({ children, supabaseConfigured }: Props) {
  return (
    <div className="min-h-dvh bg-surface-dim text-on-surface">
      <Suspense fallback={null}>
        <FilterSync />
      </Suspense>
      <DashboardSidebar />
      <DashboardHeader supabaseConfigured={supabaseConfigured} />
      <div className="relative z-10 pt-24 md:pl-56">
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-4 md:px-6">
          <Suspense fallback={null}>
            <FilterBar />
          </Suspense>
          <div className="mt-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
