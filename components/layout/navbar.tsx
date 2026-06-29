"use client";

import * as React from "react";
import Image from "next/image";
import { Menu, Search, Moon, Sun, Monitor, ChevronDown, LogOut, User, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export function Navbar() {
  const { toggleSidebar } = useUiStore();
  const { profile, clearAuth } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      clearAuth();
      router.push("/login");
      toast.success("Signed out successfully");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const ThemeIcon = !mounted
    ? Monitor
    : theme === "dark"
      ? Moon
      : theme === "light"
        ? Sun
        : Monitor;

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/95 backdrop-blur-sm flex-shrink-0">
      <div className="flex h-full items-center gap-3 px-4 lg:px-6">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search */}
        <div className="flex-1 max-w-sm hidden sm:block">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search…"
              className={cn(
                "w-full h-9 rounded-lg border border-input bg-muted/50 pl-9 pr-4 text-sm",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background",
                "transition-all duration-150"
              )}
              aria-label="Search"
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-1.5">
          {/* Mobile search */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            aria-label="Search"
          >
            <Search className="h-4.5 w-4.5" />
          </Button>

          {/* Theme toggle */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button variant="ghost" size="icon" aria-label="Toggle theme">
                <ThemeIcon className="h-4.5 w-4.5" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className={cn(
                  "z-50 min-w-[140px] overflow-hidden rounded-lg border bg-popover p-1 shadow-lg",
                  "data-[state=open]:animate-in data-[state=closed]:animate-out",
                  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                  "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                )}
              >
                {(
                  [
                    { value: "light", label: "Light", Icon: Sun },
                    { value: "dark", label: "Dark", Icon: Moon },
                    { value: "system", label: "System", Icon: Monitor },
                  ] as const
                ).map(({ value, label, Icon }) => (
                  <DropdownMenu.Item
                    key={value}
                    onSelect={() => setTheme(value)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      theme === value && "text-primary font-medium"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {label}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* Notifications */}
          <NotificationDropdown />

          {/* User menu */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
                  "hover:bg-accent transition-colors duration-150 cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
                aria-label="User menu"
              >
                <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold flex-shrink-0 overflow-hidden">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile?.full_name ?? "User avatar"}
                      fill
                      className="object-cover"
                      sizes="28px"
                    />
                  ) : profile?.full_name ? (
                    getInitials(profile.full_name)
                  ) : (
                    "U"
                  )}
                </div>
                <span className="hidden md:block font-medium text-foreground truncate max-w-[120px]">
                  {profile?.full_name ?? profile?.email ?? "User"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" aria-hidden="true" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className={cn(
                  "z-50 min-w-[200px] overflow-hidden rounded-lg border bg-popover shadow-lg p-1",
                  "data-[state=open]:animate-in data-[state=closed]:animate-out",
                  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                  "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                )}
              >
                <div className="px-3 py-2 border-b mb-1">
                  <p className="text-xs text-muted-foreground">Signed in as</p>
                  <p className="text-sm font-medium truncate">{profile?.email}</p>
                  {profile?.role && (
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">{profile.role}</p>
                  )}
                </div>
                {[
                  { label: "Profile", href: "/profile", Icon: User },
                  { label: "Settings", href: "/settings", Icon: Settings },
                ].map(({ label, href, Icon }) => (
                  <DropdownMenu.Item
                    key={href}
                    onSelect={() => router.push(href)}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    {label}
                  </DropdownMenu.Item>
                ))}
                <DropdownMenu.Separator className="my-1 h-px bg-border" />
                <DropdownMenu.Item
                  onSelect={handleLogout}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  Sign out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </header>
  );
}
