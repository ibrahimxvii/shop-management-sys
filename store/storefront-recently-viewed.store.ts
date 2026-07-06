import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RecentlyViewedItem {
  productId: string;
  name: string;
  price: number;
  image: string | null;
  viewedAt: string;
}

const MAX_ITEMS = 12;

interface StorefrontRecentlyViewedStore {
  items: RecentlyViewedItem[];
  record: (item: Omit<RecentlyViewedItem, "viewedAt">) => void;
  clear: () => void;
}

export const useStorefrontRecentlyViewedStore = create<StorefrontRecentlyViewedStore>()(
  persist(
    (set) => ({
      items: [],
      record: (item) =>
        set((state) => {
          const withoutExisting = state.items.filter((i) => i.productId !== item.productId);
          const next = [{ ...item, viewedAt: new Date().toISOString() }, ...withoutExisting];
          return { items: next.slice(0, MAX_ITEMS) };
        }),
      clear: () => set({ items: [] }),
    }),
    { name: "shopflow-storefront-recently-viewed" }
  )
);
