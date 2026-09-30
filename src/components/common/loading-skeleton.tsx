import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function KpiSkeletons({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} className="p-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-4 h-7 w-24" />
          <Skeleton className="mt-3 h-4 w-14" />
        </Card>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return <Skeleton className="w-full" style={{ height }} />;
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <KpiSkeletons />
      <Card className="p-5">
        <Skeleton className="mb-4 h-4 w-32" />
        <ChartSkeleton />
      </Card>
    </div>
  );
}
