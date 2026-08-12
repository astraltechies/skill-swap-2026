import { PageContainer } from "@/components/shell/page";
import { LoadingLabel, PageHeaderSkeleton, RowSkeleton } from "@/components/ui/skeleton";

export default function LeaderboardLoading() {
  return (
    <PageContainer width="narrow">
      <LoadingLabel>Loading the leaderboard</LoadingLabel>
      <PageHeaderSkeleton />

      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    </PageContainer>
  );
}
