import { create } from "zustand";

interface ShortcutsModalStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useShortcutsModalStore = create<ShortcutsModalStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
