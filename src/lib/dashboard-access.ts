import {
  getAccessProfileByUserId,
  isAccessLayerConfigured,
} from "@/lib/access-service";
import { getRequestHost, getSessionUser } from "@/lib/auth-session-server";
import { shouldSkipAuthServer } from "@/lib/auth-policy";
import {
  canAccessSettingsConsole,
  canCustomizeDashboardUi,
  canViewFullPortfolioNav,
  type AccessRole,
} from "@/types/access";
import { cache } from "react";

export type DashboardAccessState = {
  role: AccessRole;
  canCustomizeDashboard: boolean;
  canOpenSettings: boolean;
  showFullPortfolioNav: boolean;
};

/**
 * Papel e permissões da UI do dashboard (cache por request RSC).
 */
export const getDashboardAccessState: () => Promise<DashboardAccessState> =
  cache(async (): Promise<DashboardAccessState> => {
    const host = await getRequestHost();
    if (shouldSkipAuthServer(host)) {
      return {
        role: "master",
        canCustomizeDashboard: true,
        canOpenSettings: true,
        showFullPortfolioNav: true,
      };
    }

    if (!isAccessLayerConfigured()) {
      return {
        role: "master",
        canCustomizeDashboard: true,
        canOpenSettings: false,
        showFullPortfolioNav: true,
      };
    }

    const user = await getSessionUser();
    if (!user) {
      return {
        role: "leitor",
        canCustomizeDashboard: false,
        canOpenSettings: false,
        showFullPortfolioNav: false,
      };
    }

    const profile = await getAccessProfileByUserId(user.$id);
    if (profile && !profile.active) {
      return {
        role: "leitor",
        canCustomizeDashboard: false,
        canOpenSettings: false,
        showFullPortfolioNav: false,
      };
    }

    const role: AccessRole = profile?.role ?? "leitor";

    return {
      role,
      canCustomizeDashboard: canCustomizeDashboardUi(role),
      canOpenSettings: canAccessSettingsConsole(role),
      showFullPortfolioNav: canViewFullPortfolioNav(role),
    };
  });
