/**
 * Campos corporativos estendidos (persistidos localmente até vínculo Appwrite/metadata).
 * Não substituem o cadastro oficial de RH — uso operacional no painel.
 */
export type CorporatePersonal = {
  phone: string;
  mobile: string;
  jobTitle: string;
  department: string;
  employeeId: string;
  internalEmailAlias: string;
};

export type CorporateOrganization = {
  companyLegalName: string;
  businessUnit: string;
  area: string;
  costCenter: string;
  managerName: string;
  managerEmail: string;
  location: string;
  country: string;
};

export type CorporateNotifications = {
  emailProjectUpdates: boolean;
  emailWeeklyDigest: boolean;
  emailSecurityAlerts: boolean;
  inAppMentions: boolean;
};

export type CorporatePreferences = {
  language: "pt-BR" | "en-US" | "es";
  timezone: string;
  dateDisplayHint: string;
};

export type ActivityItem = {
  id: string;
  at: string;
  action: string;
  detail: string;
};
