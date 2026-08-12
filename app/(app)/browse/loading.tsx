import { PageContainer } from "@/components/shell/page";
import {
  LoadingLabel,
  PageHeaderSkeleton,
  Skeleton,
  SwapCardSkeleton,
} from "@/components/ui/skeleton";

export default function BrowseLoading() {
  return (
    <PageContainer width="wide">
      <LoadingLabel>Loading students</LoadingLabel>
      <PageHeaderSkeleton />

      <Skeleton className="h-11 w-full rounded-xl" />
      {/* Varied widths so the filter row reads as chips rather than a bar. */}
      <div className="mt-3 flex gap-2 overflow-hidden">
        {["w-16", "w-28", "w-24", "w-20", "w-26"].map((w) => (
          <Skeleton key={w} className={`h-10 shrink-0 rounded-full ${w}`} />
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SwapCardSkeleton key={i} />
        ))}
      </div>
    </PageContainer>
  );
}
