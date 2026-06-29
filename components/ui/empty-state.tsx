import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "./button";

interface EmptyStateAction extends ButtonProps {
  label: string;
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "default",
}: EmptyStateProps) {
  const { label: actionLabel, ...actionProps } = action ?? { label: "" };
  const { label: secondaryLabel, ...secondaryActionProps } =
    secondaryAction ?? { label: "" };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "sm" && "py-8 px-4",
        size === "default" && "py-16 px-8",
        size === "lg" && "py-24 px-12",
        className
      )}
      role="status"
      aria-label={title}
    >
      {Icon && (
        <div
          className={cn(
            "mb-4 rounded-2xl bg-muted/60 p-4 text-muted-foreground",
            size === "sm" && "p-3 mb-3"
          )}
        >
          <Icon
            className={cn(
              size === "sm" ? "h-6 w-6" : "h-8 w-8"
            )}
            aria-hidden="true"
          />
        </div>
      )}
      <h3
        className={cn(
          "font-semibold text-foreground",
          size === "sm" ? "text-sm" : "text-base"
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "mt-1.5 text-muted-foreground max-w-sm",
            size === "sm" ? "text-xs" : "text-sm"
          )}
        >
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-6 flex items-center gap-3">
          {secondaryAction && (
            <Button variant="outline" {...secondaryActionProps}>
              {secondaryLabel}
            </Button>
          )}
          {action && (
            <Button {...actionProps}>{actionLabel}</Button>
          )}
        </div>
      )}
    </div>
  );
}
