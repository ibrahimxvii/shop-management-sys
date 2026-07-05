"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { useShortcutsModalStore } from "@/store/shortcuts-modal.store";

const SHORTCUTS: { keys: string[]; description: string }[] = [
  { keys: ["⌘", "K"], description: "Open search / command palette" },
  { keys: ["↑", "↓"], description: "Navigate results in the command palette" },
  { keys: ["Enter"], description: "Select the highlighted result" },
  { keys: ["Esc"], description: "Close the current dialog" },
  { keys: ["?"], description: "Show this shortcuts reference" },
];

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
}

export function KeyboardShortcutsModal() {
  const { isOpen, open, close } = useShortcutsModalStore();

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === "?" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !isTypingTarget(e.target)
      ) {
        e.preventDefault();
        open();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <Modal
      open={isOpen}
      onOpenChange={(next) => (next ? open() : close())}
      title="Keyboard Shortcuts"
      description="Move around ShopFlow faster."
      size="sm"
    >
      <div className="space-y-1">
        {SHORTCUTS.map((shortcut) => (
          <div
            key={shortcut.description}
            className="flex items-center justify-between gap-4 py-1.5"
          >
            <span className="text-sm text-muted-foreground">{shortcut.description}</span>
            <div className="flex items-center gap-1 shrink-0">
              {shortcut.keys.map((key) => (
                <kbd
                  key={key}
                  className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground"
                >
                  {key}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
