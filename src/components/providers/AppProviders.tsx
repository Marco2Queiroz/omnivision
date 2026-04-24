"use client";

import { AppThemeProvider } from "./AppThemeProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <AppThemeProvider>{children}</AppThemeProvider>;
}
