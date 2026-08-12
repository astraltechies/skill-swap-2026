import { PageContainer } from "@/components/shell/page";
import { LoadingLabel, Skeleton } from "@/components/ui/skeleton";

export default function SessionLoading() {
  return (
    <PageContainer width="narrow">
      <LoadingLabel>Loading this session</LoadingLabel>

      <Skeleton className="mb-4 h-4 w-28" />

      <div className="mb-5 space-y-2.5">
        <div className="flex gap-2">
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
        <Skeleton className="size-11 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      <Skeleton className="mb-5 h-40 w-full rounded-2xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </PageContainer>
  );
}
