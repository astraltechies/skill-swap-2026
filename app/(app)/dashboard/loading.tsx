import { PageContainer } from "@/components/shell/page";
import {
  LoadingLabel,
  PageHeaderSkeleton,
  RowSkeleton,
  Skeleton,
  SwapCardSkeleton,
} from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <PageContainer width="wide">
      <LoadingLabel>Loading your dashboard</LoadingLabel>
      <PageHeaderSkeleton />

      <section className="mb-8">
        <Skeleton className="mb-3 h-6 w-24" />
        <div className="space-y-2.5">
          <RowSkeleton />
          <RowSkeleton />
        </div>
      </section>

      <section>
        <Skeleton className="mb-3 h-6 w-32" />
        <div className="grid gap-3 sm:grid-cols-2">
          <SwapCardSkeleton />
          <SwapCardSkeleton />
        </div>
      </section>
    </PageContainer>
  );
}
