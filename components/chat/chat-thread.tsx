"use client";

import { useFirebaseUser } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { clientDb } from "@/lib/firebase/client";
import { cn, timeAgo } from "@/lib/utils";
import type { ChatMessage } from "@/types/firestore";
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { SendHorizonal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MAX_LENGTH = 2000;

/**
 * Messages are written straight to Firestore rather than through an API route,
 * so they appear instantly for both people with no server round trip. The
 * security rules do the checking a route would have done — membership,
 * consent, blocking and message shape.
 */
export function ChatThread({
  threadId,
  otherName,
  blocked,
}: {
  threadId: string;
  otherName: string;
  blocked: boolean;
}) {
  const { user, loading } = useFirebaseUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const messagesQuery = query(
      collection(clientDb(), "chatThreads", threadId, "messages"),
      orderBy("createdAt", "asc"),
      limit(200),
    );

    return onSnapshot(
      messagesQuery,
      (snapshot) => {
        setMessages(
          snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as ChatMessage),
        );
      },
      () => setError("Lost connection to the chat. Refresh to reconnect."),
    );
  }, [threadId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const body = text.trim();
    if (!body || !user || sending) return;

    setSending(true);
    setError("");
    // Cleared optimistically so the field is ready for the next message.
    setText("");

    try {
      const now = Date.now();
      await addDoc(collection(clientDb(), "chatThreads", threadId, "messages"), {
        senderId: user.uid,
        text: body,
        createdAt: now,
      });
      await updateDoc(doc(clientDb(), "chatThreads", threadId), {
        lastMessage: body.slice(0, 120),
        lastMessageAt: now,
        lastSenderId: user.uid,
      });
    } catch {
      setError("That message didn't send. Check your connection and try again.");
      setText(body);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-[60dvh] flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto py-2">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            No messages yet. Say hello to {otherName}.
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.senderId === user?.uid;
            return (
              <div
                key={message.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm",
                    mine
                      ? "rounded-br-md bg-learn text-white"
                      : "rounded-bl-md border border-line bg-surface text-ink",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                  <p
                    className={cn(
                      "mt-1 text-[0.6875rem]",
                      mine ? "text-white/70" : "text-muted",
                    )}
                  >
                    {timeAgo(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <p className="mb-2 rounded-lg bg-danger-wash px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {blocked ? (
        <p className="rounded-xl border border-line bg-surface-sunk px-3.5 py-3 text-sm text-muted">
          You&apos;ve blocked {otherName}. Unblock them to send messages.
        </p>
      ) : (
        <form
          onSubmit={send}
          className="sticky bottom-0 flex items-end gap-2 border-t border-line bg-paper pb-2 pt-3"
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends on desktop; Shift+Enter makes a new line. On a
              // phone the on-screen keyboard's Enter inserts a newline as
              // usual, since there is no Shift key to pair with it.
              if (e.key === "Enter" && !e.shiftKey && !("ontouchstart" in window)) {
                e.preventDefault();
                send(e);
              }
            }}
            rows={1}
            maxLength={MAX_LENGTH}
            placeholder={`Message ${otherName}`}
            aria-label="Message"
            className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-base focus:border-learn focus:outline-none focus:ring-2 focus:ring-learn/25"
          />
          <Button
            type="submit"
            variant="learn"
            disabled={!text.trim() || sending}
            aria-label="Send"
            className="size-11 shrink-0 p-0"
          >
            <SendHorizonal className="size-4" aria-hidden />
          </Button>
        </form>
      )}
    </div>
  );
}
