import { PageContainer } from "@/components/shell/page";
import { LoadingLabel, PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <PageContainer width="wide">
      <LoadingLabel>Loading admin data</LoadingLabel>
      <PageHeaderSkeleton />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-surface p-4">
            <Skeleton className="mb-2 h-8 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
