"use client";

import type { DashboardAccessState } from "@/lib/dashboard-access";
import { createContext, useContext } from "react";

const DashboardAccessContext = createContext<DashboardAccessState | null>(
  null,
);

type Props = {
  value: DashboardAccessState;
  children: React.ReactNode;
};

export function DashboardAccessProvider({ value, children }: Props) {
  return (
    <DashboardAccessContext.Provider value={value}>
      {children}
    </DashboardAccessContext.Provider>
  );
}

export function useDashboardAccess(): DashboardAccessState {
  const v = useContext(DashboardAccessContext);
  if (!v) {
    throw new Error("useDashboardAccess requer DashboardAccessProvider.");
  }
  return v;
}
