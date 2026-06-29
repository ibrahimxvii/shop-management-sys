"use client";

import {
  Database,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BackupDataItem {
  label: string;
  description: string;
  size: string;
}

const BACKUP_ITEMS: BackupDataItem[] = [
  {
    label: "Products & Inventory",
    description: "Products, categories, brands, inventory history",
    size: "~2.3 MB",
  },
  {
    label: "Orders & Customers",
    description: "All orders, order items, and customer records",
    size: "~5.1 MB",
  },
  {
    label: "Employees & Profiles",
    description: "Employee records and user profiles",
    size: "~0.4 MB",
  },
  {
    label: "Settings & Preferences",
    description: "Shop settings, user preferences, configurations",
    size: "~0.1 MB",
  },
  {
    label: "Activity Logs",
    description: "Full audit trail of all user actions",
    size: "~1.2 MB",
  },
];

const PLANNED_FEATURES = [
  "Daily, weekly, or monthly automated backups via pg_dump",
  "S3-compatible storage integration (AWS S3, Cloudflare R2, Backblaze B2)",
  "Point-in-time recovery support",
  "Email notifications for backup success and failure",
  "Retention policy management (7 / 30 / 90 / 365 days)",
  "One-click database restore with dry-run preview",
  "Encrypted backup files at rest",
];

export function BackupPanel() {
  return (
    <div className="space-y-5">
      {/* Status overview */}
      <div className="rounded-xl border bg-card p-6 shadow-card">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium">Backup System</h3>
              <Badge variant="secondary" className="text-xs">
                Architecture Preview
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              The backup system architecture is implemented and ready for
              integration with external storage providers. All data structures
              are in place for scheduled automated backups.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground mb-1">Last Backup</p>
            <p className="font-medium text-muted-foreground">Not configured</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground mb-1">Frequency</p>
            <p className="font-medium text-muted-foreground">Not configured</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground mb-1">Storage Provider</p>
            <p className="font-medium text-muted-foreground">Not configured</p>
          </div>
        </div>
      </div>

      {/* Export data */}
      <div className="rounded-xl border bg-card p-6 shadow-card space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">Export System Data</h3>
            <p className="text-sm text-muted-foreground">
              Download your data as JSON or CSV files
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {BACKUP_ITEMS.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-lg border border-border/60 p-3 gap-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{item.label}</p>
                <p className="text-xs text-muted-foreground">
                  {item.description} · Est. {item.size}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="text-xs h-8"
                  title="Export as JSON — coming soon"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="text-xs h-8"
                  title="Export as CSV — coming soon"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  CSV
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Restore */}
      <div className="rounded-xl border bg-card p-6 shadow-card space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium">Restore from Backup</h3>
            <p className="text-sm text-muted-foreground">
              Restore your data from a previous backup file
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border/60 bg-muted/20 p-8 text-center">
          <Database className="h-10 w-10 text-muted-foreground/50" />
          <div>
            <p className="text-sm font-medium">Drop backup file here</p>
            <p className="text-xs text-muted-foreground mt-1">
              Supported formats: .json, .sql, .zip
            </p>
          </div>
          <Button variant="outline" size="sm" disabled>
            <Upload className="h-4 w-4 mr-2" />
            Select Backup File
          </Button>
          <p className="text-xs text-muted-foreground">
            Restore functionality coming in a future release
          </p>
        </div>
      </div>

      {/* Planned features */}
      <div className="rounded-xl border bg-card p-6 shadow-card space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium">Automated Backups</h3>
            <p className="text-sm text-muted-foreground">
              Scheduled backups to external storage
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-muted/30 border border-dashed border-border/60 p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Planned Features
          </p>
          <ul className="space-y-2">
            {PLANNED_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 opacity-40" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg bg-muted/20 border border-border/60 p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Integration Ready
          </p>
          <div className="flex flex-wrap gap-2">
            {["AWS S3", "Cloudflare R2", "Supabase Storage", "Google Cloud Storage", "Backblaze B2"].map(
              (provider) => (
                <span
                  key={provider}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs text-muted-foreground"
                >
                  <RefreshCw className="h-3 w-3 opacity-50" />
                  {provider}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
