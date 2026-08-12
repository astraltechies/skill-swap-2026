import { PageContainer } from "@/components/shell/page";
import { LoadingLabel, PageHeaderSkeleton, RowSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function SessionsLoading() {
  return (
    <PageContainer>
      <LoadingLabel>Loading your sessions</LoadingLabel>
      <PageHeaderSkeleton withSubtitle={false} />

      <Skeleton className="mb-3 h-6 w-28" />
      <div className="space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    </PageContainer>
  );
}
