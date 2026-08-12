import { PageContainer } from "@/components/shell/page";
import { LoadingLabel, PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function WalletLoading() {
  return (
    <PageContainer width="narrow">
      <LoadingLabel>Loading your wallet</LoadingLabel>
      <PageHeaderSkeleton withSubtitle={false} />

      {/* Matches the balance hero so the big number doesn't jump into place. */}
      <div className="mb-4 overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="flex flex-col items-center gap-2 bg-surface-sunk px-5 py-6">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="grid grid-cols-2 gap-4 p-4">
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>

      <Skeleton className="mb-3 h-6 w-20" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
          >
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
