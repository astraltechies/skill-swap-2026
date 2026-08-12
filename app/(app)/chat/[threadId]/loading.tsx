import { PageContainer } from "@/components/shell/page";
import { LoadingLabel, Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Alternating bubble widths, so the thread reads as a conversation. */
const BUBBLES = [
  { mine: false, w: "w-48" },
  { mine: true, w: "w-32" },
  { mine: false, w: "w-56" },
  { mine: true, w: "w-40" },
  { mine: false, w: "w-36" },
];

export default function ChatThreadLoading() {
  return (
    <PageContainer width="narrow">
      <LoadingLabel>Loading this conversation</LoadingLabel>

      <div className="mb-3 flex items-center gap-3 border-b border-line pb-3">
        <Skeleton className="size-8 shrink-0 rounded-lg" />
        <Skeleton className="size-8 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      <div className="space-y-3 py-2">
        {BUBBLES.map((bubble, i) => (
          <div key={i} className={cn("flex", bubble.mine ? "justify-end" : "justify-start")}>
            <Skeleton className={cn("h-12 rounded-2xl", bubble.w)} />
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
