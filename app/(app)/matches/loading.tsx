import { PageContainer } from "@/components/shell/page";
import {
  LoadingLabel,
  PageHeaderSkeleton,
  Skeleton,
  SwapCardSkeleton,
} from "@/components/ui/skeleton";

export default function MatchesLoading() {
  return (
    <PageContainer width="wide">
      <LoadingLabel>Finding your matches</LoadingLabel>
      <PageHeaderSkeleton />

      <Skeleton className="mb-3 h-6 w-40" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SwapCardSkeleton key={i} />
        ))}
      </div>
    </PageContainer>
  );
}
