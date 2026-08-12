import { PageContainer } from "@/components/shell/page";
import { LoadingLabel, Skeleton } from "@/components/ui/skeleton";

export default function PublicProfileLoading() {
  return (
    <PageContainer>
      <LoadingLabel>Loading this profile</LoadingLabel>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
        <Skeleton className="size-24 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2.5">
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-4 w-36" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      </div>

      {[0, 1].map((section) => (
        <div key={section} className="mb-6">
          <Skeleton className="mb-2.5 h-3 w-24" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
        </div>
      ))}

      <div className="mb-8 border-y border-line py-4">
        <Skeleton className="h-12 w-48 rounded-xl" />
      </div>
    </PageContainer>
  );
}
