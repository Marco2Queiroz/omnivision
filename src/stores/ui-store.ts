import { create } from "zustand";

type UiStore = {
  settingsDrawerOpen: boolean;
  setSettingsDrawerOpen: (v: boolean) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  settingsDrawerOpen: false,
  setSettingsDrawerOpen: (v) => set({ settingsDrawerOpen: v }),
}));
