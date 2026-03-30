"use client";

import { create } from "zustand";
import type { GlobalFilters } from "@/types/filters";

const defaultFilters: GlobalFilters = {
  dateFrom: null,
  dateTo: null,
  projectKey: null,
  responsibleId: null,
};

type FilterState = GlobalFilters & {
  setFilters: (partial: Partial<GlobalFilters>) => void;
  reset: () => void;
};

export const useFilterStore = create<FilterState>((set) => ({
  ...defaultFilters,
  setFilters: (partial) => set((s) => ({ ...s, ...partial })),
  reset: () => set(defaultFilters),
}));
