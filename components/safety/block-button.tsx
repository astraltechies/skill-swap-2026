"use client";

import { useFirebaseUser } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { clientDb } from "@/lib/firebase/client";
import { deleteDoc, doc, setDoc } from "firebase/firestore";
import { Ban, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Blocking writes directly to Firestore rather than through an API route.
 * The security rules allow exactly this one write, which means blocking still
 * works if a server route is down — the thing you least want failing is the
 * button someone presses when they want contact to stop.
 */
export function BlockButton({
  targetUid,
  targetName,
  initiallyBlocked,
}: {
  targetUid: string;
  targetName: string;
  initiallyBlocked: boolean;
}) {
  const { user } = useFirebaseUser();
  const router = useRouter();
  const [blocked, setBlocked] = useState(initiallyBlocked);
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function toggle() {
    if (!user) return;
    setPending(true);
    const ref = doc(clientDb(), "users", user.uid, "blocks", targetUid);
    try {
      if (blocked) {
        await deleteDoc(ref);
        setBlocked(false);
      } else {
        await setDoc(ref, { createdAt: Date.now() });
        setBlocked(true);
      }
      setConfirming(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (blocked) {
    return (
      <Button variant="ghost" size="sm" loading={pending} onClick={toggle}>
        <Undo2 className="size-4" aria-hidden />
        Unblock
      </Button>
    );
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-2">
        <Button variant="danger" size="sm" loading={pending} onClick={toggle}>
          Block {targetName}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </span>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
      <Ban className="size-4" aria-hidden />
      Block
    </Button>
  );
}
