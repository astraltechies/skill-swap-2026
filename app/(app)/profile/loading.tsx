import { PageContainer } from "@/components/shell/page";
import { LoadingLabel, Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <PageContainer width="narrow">
      <LoadingLabel>Loading your profile</LoadingLabel>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
        <Skeleton className="size-24 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2.5">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>

      {[0, 1].map((section) => (
        <div key={section} className="mb-6">
          <Skeleton className="mb-2.5 h-3 w-24" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>
        </div>
      ))}

      <Skeleton className="mb-3 h-6 w-20" />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    </PageContainer>
  );
}
