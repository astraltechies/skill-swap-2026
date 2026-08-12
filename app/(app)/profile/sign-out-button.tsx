"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      loading={pending}
      onClick={async () => {
        setPending(true);
        await signOut();
        router.push("/");
        router.refresh();
      }}
    >
      <LogOut className="size-4" aria-hidden />
      Sign out
    </Button>
  );
}
