"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Shield,
  Key,
  LogOut,
  History,
  Smartphone,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChangePasswordSettings } from "@/components/settings/change-password-settings";
import { logoutAllDevicesAction } from "@/app/actions/settings.actions";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";
import type { LoginHistoryEntry } from "@/types/settings";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface SecuritySettingsProps {
  profile: Profile | null;
  loginHistory: LoginHistoryEntry[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseUserAgent(ua: string | null): string {
  if (!ua) return "Unknown device";
  if (ua.includes("Edg/")) return "Microsoft Edge";
  if (ua.includes("Chrome")) return "Google Chrome";
  if (ua.includes("Firefox")) return "Mozilla Firefox";
  if (ua.includes("Safari")) return "Apple Safari";
  if (ua.includes("Opera")) return "Opera Browser";
  return "Web Browser";
}

export function SecuritySettings({
  profile,
  loginHistory,
}: SecuritySettingsProps) {
  const router = useRouter();
  const [logoutAllLoading, setLogoutAllLoading] = React.useState(false);
  const [confirmLogout, setConfirmLogout] = React.useState(false);

  const handleLogoutAll = async () => {
    if (!confirmLogout) {
      setConfirmLogout(true);
      return;
    }
    setLogoutAllLoading(true);
    try {
      const result = await logoutAllDevicesAction();
      if (!result.success) {
        toast.error(result.error ?? "Failed to logout from all devices");
        setConfirmLogout(false);
      } else {
        toast.success("Logged out from all devices");
        router.push("/login");
      }
    } finally {
      setLogoutAllLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Account Status */}
      <div className="rounded-xl border bg-card p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Account Status</h3>
              <p className="text-sm text-muted-foreground">
                {profile?.email}
              </p>
            </div>
          </div>
          <Badge
            className={cn(
              "flex-shrink-0 text-xs",
              profile?.is_active
                ? "bg-green-500/10 text-green-600 border-green-500/20"
                : "bg-muted text-muted-foreground"
            )}
          >
            {profile?.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground mb-1">Role</p>
            <p className="font-medium capitalize">{profile?.role ?? "—"}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground mb-1">Member Since</p>
            <p className="font-medium">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString()
                : "—"}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
            <p className="font-medium">
              {profile?.updated_at
                ? new Date(profile.updated_at).toLocaleDateString()
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-xl border bg-card p-6 shadow-card space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Key className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">Change Password</h3>
            <p className="text-sm text-muted-foreground">
              Update your account password
            </p>
          </div>
        </div>
        <ChangePasswordSettings />
      </div>

      {/* Active Sessions */}
      <div className="rounded-xl border bg-card p-6 shadow-card space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Active Sessions</h3>
              <p className="text-sm text-muted-foreground">
                Manage devices that currently have access to your account
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <Button
              variant={confirmLogout ? "destructive" : "outline"}
              size="sm"
              onClick={handleLogoutAll}
              disabled={logoutAllLoading}
              className={cn(
                "flex-shrink-0",
                !confirmLogout &&
                  "text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
              )}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {logoutAllLoading
                ? "Logging out..."
                : confirmLogout
                ? "Confirm Logout All"
                : "Logout All Devices"}
            </Button>
            {confirmLogout && (
              <button
                type="button"
                onClick={() => setConfirmLogout(false)}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {confirmLogout && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              This will immediately sign you out of all devices including this
              one. You will need to log in again.
            </span>
          </div>
        )}

        <div className="rounded-lg border border-border/60 p-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Current Session</p>
              <p className="text-xs text-muted-foreground">
                This device — Active now
              </p>
            </div>
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs flex-shrink-0">
              Current
            </Badge>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="rounded-xl border bg-card p-6 shadow-card space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium">Two-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs flex-shrink-0">
            Coming Soon
          </Badge>
        </div>

        <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Planned authentication methods:
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {[
              "Authenticator app (TOTP — Google Authenticator, Authy)",
              "SMS verification code",
              "Recovery backup codes",
              "Trusted device management",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Login History */}
      <div className="rounded-xl border bg-card p-6 shadow-card space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
            <History className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">Login History</h3>
            <p className="text-sm text-muted-foreground">
              Recent sign-in activity for your account
            </p>
          </div>
        </div>

        {loginHistory.length === 0 ? (
          <div className="rounded-lg border border-border/60 p-6 text-center text-sm text-muted-foreground">
            No login history available
          </div>
        ) : (
          <div className="divide-y divide-border/60 rounded-lg border border-border/60 overflow-hidden">
            {loginHistory.map((entry, idx) => (
              <div
                key={entry.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  idx === 0 && "bg-muted/20"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                    entry.status === "success"
                      ? "bg-green-500/10"
                      : "bg-destructive/10"
                  )}
                >
                  {entry.status === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {parseUserAgent(entry.user_agent)}
                    {idx === 0 && (
                      <span className="ml-2 text-xs text-green-600 font-normal">
                        (Current)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.ip_address ?? "Unknown IP"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
                  <Clock className="h-3 w-3" />
                  {formatDate(entry.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
