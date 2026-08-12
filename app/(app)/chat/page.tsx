import { PageContainer, PageHeader } from "@/components/shell/page";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { requireUser } from "@/lib/firebase/admin";
import { getChatThreads, getUsersByIds } from "@/lib/queries";
import { timeAgo } from "@/lib/utils";
import { MessagesSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Chat",
  robots: { index: false, follow: false },
};

export default async function ChatListPage() {
  const me = await requireUser();
  const threads = await getChatThreads(me.uid);

  const others = await getUsersByIds(
    threads.map((t) => t.participantIds.find((id) => id !== me.uid) ?? ""),
  );

  return (
    <PageContainer width="narrow">
      <PageHeader title="Chat" />

      {threads.length > 0 ? (
        <ul className="space-y-2">
          {threads.map((thread) => {
            const otherId = thread.participantIds.find((id) => id !== me.uid) ?? "";
            const other = others.get(otherId);
            const unread = thread.lastSenderId !== me.uid && thread.lastSenderId !== "";

            return (
              <li key={thread.id}>
                <Link
                  href={`/chat/${thread.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition-colors hover:bg-surface-sunk"
                >
                  <Avatar name={other?.displayName ?? "Student"} src={other?.photoURL} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate font-medium">
                        {other?.displayName ?? "Student"}
                      </p>
                      <span className="shrink-0 text-xs text-muted">
                        {timeAgo(thread.lastMessageAt)}
                      </span>
                    </div>
                    <p className="truncate text-sm text-muted">{thread.lastMessage}</p>
                  </div>
                  {unread ? (
                    <span className="size-2 shrink-0 rounded-full bg-learn" aria-label="Unread" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          icon={<MessagesSquare className="size-7" aria-hidden />}
          title="No conversations yet"
          body="A chat opens once someone accepts your session request — or you accept theirs."
          action={
            <Button asChild variant="learn">
              <Link href="/browse">Find someone to learn from</Link>
            </Button>
          }
        />
      )}
    </PageContainer>
  );
}
