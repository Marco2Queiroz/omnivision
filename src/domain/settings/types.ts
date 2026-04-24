export type UiPreferences = {
  dateFormat: string;
  pageSize: number;
  /** Por slug de aba, lista de ids de coluna */
  defaultColumnsByTab?: Record<string, string[]>;
};

export type AppSettingsPayload = {
  hour_value: number;
  capex_formula: "actual_hours";
  ui_preferences: UiPreferences;
};
