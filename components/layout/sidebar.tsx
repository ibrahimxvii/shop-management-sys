"use client";

import * as React from "react";
import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen, Store } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui.store";
import { useIsMobile } from "@/hooks/use-media-query";
import { useAuthStore } from "@/store/auth.store";
import { SidebarNav } from "./sidebar-nav";
import type { UserRole } from "@/types/auth";
import { Button } from "@/components/ui/button";

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 64;

export function Sidebar() {
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen, toggleSidebarCollapsed } =
    useUiStore();
  const { profile } = useAuthStore();
  const isMobile = useIsMobile();

  // Close mobile sidebar on outside click
  const overlayRef = React.useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar — Desktop */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen sticky top-0",
          "bg-sidebar border-r border-sidebar-border",
          "transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0"
        )}
        style={{
          width: sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        }}
        aria-label="Sidebar"
      >
        <SidebarContent
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
          role={profile?.role ?? null}
        />
      </aside>

      {/* Sidebar — Mobile Drawer */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.aside
            initial={{ x: -SIDEBAR_WIDTH }}
            animate={{ x: 0 }}
            exit={{ x: -SIDEBAR_WIDTH }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className={cn(
              "fixed left-0 top-0 z-40 flex h-screen flex-col lg:hidden",
              "bg-sidebar border-r border-sidebar-border"
            )}
            style={{ width: SIDEBAR_WIDTH }}
            aria-label="Mobile sidebar"
          >
            <SidebarContent
              collapsed={false}
              onNavigate={() => setSidebarOpen(false)}
              role={profile?.role ?? null}
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

interface SidebarContentProps {
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
  role?: string | null;
}

function SidebarContent({ collapsed, onToggleCollapse, onNavigate, role }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border flex-shrink-0",
          collapsed ? "justify-center px-0" : "px-4 gap-3"
        )}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-primary rounded-lg"
          onClick={onNavigate}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground flex-shrink-0">
            <Store className="h-4 w-4" aria-hidden="true" />
          </div>
          {!collapsed && (
            <span className="text-base font-semibold text-sidebar-foreground tracking-tight">
              ShopFlow
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3">
        <SidebarNav collapsed={collapsed} onNavigate={onNavigate} role={role as UserRole | null} />
      </div>

      {/* Collapse toggle — desktop only */}
      {onToggleCollapse && (
        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            onClick={onToggleCollapse}
            className={cn(
              "w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              collapsed && "justify-center"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
