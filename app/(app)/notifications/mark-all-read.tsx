"use client";

import { useFirebaseUser } from "@/hooks/use-firebase-user";
import { Button } from "@/components/ui/button";
import { clientDb } from "@/lib/firebase/client";
import { doc, writeBatch } from "firebase/firestore";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Marks everything read, straight from the browser.
 *
 * No API route because the security rules already permit exactly this and
 * nothing more: a user may update their own notifications, and only the `read`
 * field. Routing it through the server would add a hop to enforce a rule the
 * database is already enforcing.
 */
export function MarkAllRead({ ids }: { ids: string[] }) {
  const { user } = useFirebaseUser();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function markAll() {
    if (!user || ids.length === 0) return;
    setPending(true);
    try {
      // One batch rather than a write each, so the list updates in a single
      // step instead of flickering row by row.
      const batch = writeBatch(clientDb());
      for (const id of ids) {
        batch.update(doc(clientDb(), "users", user.uid, "notifications", id), {
          read: true,
        });
      }
      await batch.commit();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" loading={pending} onClick={markAll}>
      <Check className="size-4" aria-hidden />
      Mark all read
    </Button>
  );
}
