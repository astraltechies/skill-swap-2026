import { PageContainer } from "@/components/shell/page";
import { LoadingLabel, PageHeaderSkeleton, RowSkeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <PageContainer width="narrow">
      <LoadingLabel>Loading your chats</LoadingLabel>
      <PageHeaderSkeleton withSubtitle={false} />

      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    </PageContainer>
  );
}
