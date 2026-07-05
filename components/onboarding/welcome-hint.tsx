"use client";

import * as React from "react";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";

export function WelcomeHint() {
  const [dismissed, setDismissed] = useLocalStorage("shopflow_onboarding_dismissed", false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || dismissed) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 w-full max-w-xs rounded-xl border bg-popover p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-start gap-2.5 pr-4">
        <div className="mt-0.5 rounded-lg bg-primary/10 p-1.5 shrink-0">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold">Welcome to ShopFlow</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Press{" "}
            <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">⌘K</kbd>{" "}
            to search or jump anywhere, or{" "}
            <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">?</kbd>{" "}
            anytime for all shortcuts.
          </p>
          <Button size="sm" variant="outline" className="mt-1 h-7 text-xs" onClick={() => setDismissed(true)}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
