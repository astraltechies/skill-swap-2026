"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserStatus } from "@/types/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";

type Action = "suspend" | "ban" | "reinstate";

/**
 * Moderating an account that hasn't been reported.
 *
 * The queue handles the usual case, but a moderator who can already see a
 * problem shouldn't have to wait for someone to file a report first — and an
 * account that was banned has no open report left to act through.
 *
 * Every action here still writes the same audit row the queue does.
 */
export function UserActions({
  uid,
  name,
  status,
  isAdmin,
}: {
  uid: string;
  name: string;
  status: UserStatus;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Action | null>(null);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState<Action | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent | TouchEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setConfirming(null);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setConfirming(null);
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // An admin moderating themselves would be a way to lock the whole team out.
  if (isAdmin) return null;

  async function run(action: Action) {
    setError("");
    setPending(action);
    try {
      const response = await fetch("/api/admin/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid, action, notes: `From the student list` }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "That didn't work.");
      }
      setOpen(false);
      setConfirming(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Moderate ${name}`}
        className={cn(
          "pressable flex size-9 items-center justify-center rounded-xl",
          "text-muted transition-colors duration-(--duration-fast)",
          "hover:bg-surface-sunk hover:text-ink",
          open && "bg-surface-sunk text-ink",
        )}
      >
        <MoreVertical className="size-[18px]" aria-hidden />
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-full z-40 mt-1.5 w-56 rounded-xl border border-line",
            "bg-surface p-1.5 shadow-lg motion-safe:animate-(--animate-scale-in) origin-top-right",
          )}
        >
          {error ? (
            <p className="px-2 py-1.5 text-xs text-danger" role="alert">
              {error}
            </p>
          ) : null}

          {status === "active" ? (
            confirming ? (
              <div className="space-y-1.5 p-1">
                <p className="text-xs text-muted">
                  {confirming === "ban"
                    ? `Ban ${name}? They'll be signed out immediately and hidden from the site.`
                    : `Suspend ${name}? They keep their account but can't book or message.`}
                </p>
                <Button
                  size="sm"
                  fullWidth
                  variant={confirming === "ban" ? "danger" : "primary"}
                  loading={pending === confirming}
                  onClick={() => run(confirming)}
                >
                  Yes, {confirming}
                </Button>
                <Button size="sm" fullWidth variant="ghost" onClick={() => setConfirming(null)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setConfirming("suspend")}
                >
                  Suspend account
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start text-danger"
                  onClick={() => setConfirming("ban")}
                >
                  Ban account
                </Button>
              </>
            )
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start"
              loading={pending === "reinstate"}
              onClick={() => run("reinstate")}
            >
              Reinstate account
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
