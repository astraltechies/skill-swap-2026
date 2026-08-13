"use client";

import { BlockButton } from "@/components/safety/block-button";
import { ReportDialog } from "@/components/safety/report-dialog";
import { cn } from "@/lib/utils";
import { MoreVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Report and block, folded behind a single control beside the person's name.
 *
 * They used to sit as two buttons under the message box, which put destructive
 * actions permanently in reach of the thumb that is trying to type — and cost a
 * row of vertical space on the screen where there is least of it. Tucking them
 * into a menu at the top matches where people already look for "things about
 * this conversation".
 */
export function SafetyMenu({
  targetUid,
  targetName,
  blocked,
  contentType,
  contentRef = null,
}: {
  targetUid: string;
  targetName: string;
  blocked: boolean;
  contentType: "profile" | "message" | "session";
  contentRef?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More options for ${targetName}`}
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
          aria-label={`Options for ${targetName}`}
          className={cn(
            "absolute right-0 top-full z-40 mt-1.5 w-52 overflow-hidden rounded-xl",
            "border border-line bg-surface p-1 shadow-lg",
            "motion-safe:animate-(--animate-scale-in) origin-top-right",
          )}
        >
          {/*
            Both children bring their own trigger button, so the menu only has
            to give them full-width rows. The menu deliberately does NOT close
            on click: blocking has a confirm step that renders in place, and
            closing would throw the user out mid-decision. Escape and an
            outside click are the ways out.

            The span selector stacks that confirm step vertically — its two
            buttons sit side by side elsewhere, which would squeeze in a menu
            this narrow.
          */}
          <div
            className={cn(
              "[&_button]:w-full [&_button]:justify-start",
              "[&>span]:flex [&>span]:flex-col [&>span]:items-stretch [&>span]:gap-1",
            )}
          >
            <ReportDialog
              reportedUserId={targetUid}
              reportedName={targetName}
              contentType={contentType}
              contentRef={contentRef}
            />
            <BlockButton
              targetUid={targetUid}
              targetName={targetName}
              initiallyBlocked={blocked}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
