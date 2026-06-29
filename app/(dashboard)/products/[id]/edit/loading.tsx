import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function ProductEditLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-7 w-56" />
      </div>
      <SkeletonCard />
    </div>
  );
}
