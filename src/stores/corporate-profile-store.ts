import type {
  CorporateNotifications,
  CorporateOrganization,
  CorporatePersonal,
  CorporatePreferences,
} from "@/types/corporate-profile";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const defaultPersonal: CorporatePersonal = {
  phone: "",
  mobile: "",
  jobTitle: "",
  department: "",
  employeeId: "",
  internalEmailAlias: "",
};

const defaultOrg: CorporateOrganization = {
  companyLegalName: "Grupo Vamos",
  businessUnit: "",
  area: "",
  costCenter: "",
  managerName: "",
  managerEmail: "",
  location: "",
  country: "Brasil",
};

const defaultNotif: CorporateNotifications = {
  emailProjectUpdates: true,
  emailWeeklyDigest: false,
  emailSecurityAlerts: true,
  inAppMentions: true,
};

const defaultPrefs: CorporatePreferences = {
  language: "pt-BR",
  timezone: "America/Sao_Paulo",
  dateDisplayHint: "dd/MM/yyyy",
};

type Store = {
  personal: CorporatePersonal;
  organization: CorporateOrganization;
  notifications: CorporateNotifications;
  preferences: CorporatePreferences;
  setPersonal: (p: Partial<CorporatePersonal>) => void;
  setOrganization: (p: Partial<CorporateOrganization>) => void;
  setNotifications: (p: Partial<CorporateNotifications>) => void;
  setPreferences: (p: Partial<CorporatePreferences>) => void;
};

export const useCorporateProfileStore = create<Store>()(
  persist(
    (set) => ({
      personal: { ...defaultPersonal },
      organization: { ...defaultOrg },
      notifications: { ...defaultNotif },
      preferences: { ...defaultPrefs },
      setPersonal: (p) =>
        set((s) => ({ personal: { ...s.personal, ...p } })),
      setOrganization: (p) =>
        set((s) => ({ organization: { ...s.organization, ...p } })),
      setNotifications: (p) =>
        set((s) => ({ notifications: { ...s.notifications, ...p } })),
      setPreferences: (p) =>
        set((s) => ({ preferences: { ...s.preferences, ...p } })),
    }),
    {
      name: "vamos-corporate-profile",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        personal: s.personal,
        organization: s.organization,
        notifications: s.notifications,
        preferences: s.preferences,
      }),
    },
  ),
);
