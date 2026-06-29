import { Loader2 } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Loader2 className="h-5 w-5 animate-spin text-primary-foreground" aria-hidden="true" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Loading ShopFlow…</p>
      </div>
    </div>
  );
}
