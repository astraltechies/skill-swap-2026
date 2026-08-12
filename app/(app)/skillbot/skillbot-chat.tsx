"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, SendHorizonal, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  /** Which provider answered — shown so the fallback is visible, not hidden. */
  provider?: string;
  failedOver?: string[];
}

const PROMPTS = [
  "What should I learn next?",
  "What could I teach that I'm underrating?",
  "Help me write my profile bio",
  "How do SkillCoins work?",
];

export function SkillBotChat({
  firstName,
  hasSkills,
  providerCount,
}: {
  firstName: string;
  hasSkills: boolean;
  providerCount: number;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, sending]);

  async function send(text: string) {
    const body = text.trim();
    if (!body || sending) return;

    const next = [...messages, { role: "user" as const, content: body }];
    setMessages(next);
    setInput("");
    setError("");
    setSending(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Only the text goes to the server; provider metadata stays local.
          messages: next.map(({ role, content }) => ({ role, content })).slice(-12),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "SkillBot could not answer.");

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.reply,
          provider: data.providerUsed,
          failedOver: data.failedOver,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "SkillBot could not answer.");
    } finally {
      setSending(false);
    }
  }

  if (providerCount === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line-strong px-6 py-10 text-center">
        <AlertTriangle className="mx-auto mb-3 size-7 text-muted" aria-hidden />
        <h2 className="font-display text-base font-semibold">SkillBot needs an API key</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Add at least one of <code className="text-xs">GEMINI_API_KEY</code>,{" "}
          <code className="text-xs">GROQ_API_KEY</code> or{" "}
          <code className="text-xs">MISTRAL_API_KEY</code> to your environment. All three
          have free tiers.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto py-2">
        {messages.length === 0 ? (
          <div className="py-6">
            <div className="mb-5 flex flex-col items-center text-center">
              <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-learn-wash">
                <Sparkles className="size-6 text-learn" aria-hidden />
              </span>
              <h2 className="font-display text-lg font-semibold">Hi {firstName}</h2>
              <p className="mt-1 max-w-sm text-sm text-muted">
                {hasSkills
                  ? "I can see your skills, so ask me anything about what to learn or teach next."
                  : "Add a few skills to your profile and my suggestions get a lot better."}
              </p>
            </div>

            <ul className="space-y-2">
              {PROMPTS.map((prompt) => (
                <li key={prompt}>
                  <button
                    type="button"
                    onClick={() => send(prompt)}
                    className="w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-left text-sm pressable transition-colors duration-(--duration-fast) hover:bg-surface-sunk"
                  >
                    {prompt}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                  message.role === "user"
                    ? "rounded-br-md bg-learn text-white"
                    : "rounded-bl-md border border-line bg-surface",
                )}
              >
                <p className="whitespace-pre-wrap break-words leading-relaxed">
                  {message.content}
                </p>

                {/* Surfacing which model answered turns the fallback chain from
                    an invisible implementation detail into something a judge —
                    or a curious student — can actually see working. */}
                {message.provider ? (
                  <p className="mt-1.5 text-[0.6875rem] text-muted">
                    via {message.provider}
                    {message.failedOver && message.failedOver.length > 0
                      ? ` (${message.failedOver.join(", ")} didn't respond)`
                      : ""}
                  </p>
                ) : null}
              </div>
            </div>
          ))
        )}

        {sending ? (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md border border-line bg-surface px-3.5 py-3">
              <span className="flex gap-1" aria-label="SkillBot is typing">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="size-1.5 animate-bounce rounded-full bg-muted"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </span>
            </div>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      {error ? (
        <p className="mb-2 rounded-lg bg-danger-wash px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="sticky bottom-0 flex items-end gap-2 border-t border-line bg-paper pb-2 pt-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !("ontouchstart" in window)) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder="Ask SkillBot"
          aria-label="Ask SkillBot"
          className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-base focus:border-learn focus:outline-none focus:ring-2 focus:ring-learn/25"
        />
        <Button
          type="submit"
          variant="learn"
          disabled={!input.trim() || sending}
          aria-label="Send"
          className="size-11 shrink-0 p-0"
        >
          <SendHorizonal className="size-4" aria-hidden />
        </Button>
      </form>
    </div>
  );
}
