import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;

const STEP_LABELS: Record<(typeof STEPS)[number], string> = {
  pending: "Order Placed",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

interface Props {
  status: string;
}

export function OrderTimeline({ status }: Props) {
  if (status === "cancelled" || status === "refunded") {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        This order has been {status}.
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(status as (typeof STEPS)[number]);

  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const isComplete = currentIndex >= 0 && i <= currentIndex;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs",
                  isComplete ? "border-primary bg-primary text-primary-foreground" : "border-muted text-muted-foreground"
                )}
              >
                {isComplete ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={cn("text-[11px] whitespace-nowrap", isComplete ? "font-medium" : "text-muted-foreground")}>
                {STEP_LABELS[step]}
              </span>
            </div>
            {!isLast && (
              <div className={cn("h-0.5 flex-1 mx-1", isComplete ? "bg-primary" : "bg-muted")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
