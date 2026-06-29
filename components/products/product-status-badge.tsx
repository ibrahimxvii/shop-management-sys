import { Badge } from "@/components/ui/badge";
import type { ProductStatus } from "@/types/products";

interface ProductStatusBadgeProps {
  status: ProductStatus;
}

const config: Record<ProductStatus, { label: string; variant: "success" | "ghost" | "warning" }> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "ghost" },
  draft: { label: "Draft", variant: "warning" },
};

export function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
  const { label, variant } = config[status] ?? config.inactive;
  return <Badge variant={variant}>{label}</Badge>;
}
