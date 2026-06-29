"use client";

import { useUiStore } from "@/store/ui.store";
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from "./sidebar";

export function DashboardContent({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUiStore();
  const width = sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <div
      className="flex flex-1 flex-col min-w-0 min-h-screen transition-[margin-left] duration-300 ease-in-out lg:ml-[var(--sidebar-w)]"
      style={{ "--sidebar-w": `${width}px` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
