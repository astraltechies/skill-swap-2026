import { ChatThread } from "@/components/chat/chat-thread";
import { SafetyMenu } from "@/components/safety/safety-menu";
import { PageContainer } from "@/components/shell/page";
import { Avatar } from "@/components/ui/avatar";
import { adminDb, requireConsentedUser } from "@/lib/firebase/admin";
import { getBlockedIds, getUserById } from "@/lib/queries";
import { COLLECTIONS, type ChatThread as Thread } from "@/types/firestore";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Chat",
  robots: { index: false, follow: false },
};

export default async function ChatThreadPage({ params }: PageProps<"/chat/[threadId]">) {
  const { threadId } = await params;
  const me = await requireConsentedUser();

  const snap = await adminDb().collection(COLLECTIONS.chatThreads).doc(threadId).get();
  if (!snap.exists) notFound();

  const thread = snap.data() as Thread;
  if (!thread.participantIds.includes(me.uid)) notFound();

  const otherId = thread.participantIds.find((id) => id !== me.uid) ?? "";
  const [other, blocked] = await Promise.all([
    getUserById(otherId),
    getBlockedIds(me.uid),
  ]);

  const otherName = other?.displayName ?? "Student";

  return (
    <PageContainer width="narrow" className="flex min-h-[calc(100dvh-8rem)] flex-col">
      <div className="mb-3 flex items-center gap-3 border-b border-line pb-3">
        <Link
          href="/chat"
          className="rounded-lg p-1.5 text-muted hover:bg-surface-sunk hover:text-ink"
          aria-label="Back to chats"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>

        <Link href={`/u/${other?.username ?? ""}`} className="flex min-w-0 flex-1 items-center gap-2.5">
          <Avatar name={otherName} src={other?.photoURL} size="sm" />
          <span className="min-w-0">
            <span className="block truncate font-medium">{otherName}</span>
            <span className="block truncate text-xs text-muted">
              @{other?.username ?? "unknown"}
            </span>
          </span>
        </Link>

        <SafetyMenu
          targetUid={otherId}
          targetName={otherName}
          blocked={blocked.has(otherId)}
          contentType="message"
          contentRef={threadId}
        />
      </div>

      <p className="mb-3 flex items-start gap-2 rounded-xl bg-surface-sunk px-3 py-2 text-xs text-muted">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>
          Keep it on Skill Swap. Don&apos;t share your phone number, address or social handles —
          moderators can only help with what happens here.
        </span>
      </p>

      <ChatThread
        threadId={threadId}
        otherName={otherName}
        blocked={blocked.has(otherId)}
      />
    </PageContainer>
  );
}
