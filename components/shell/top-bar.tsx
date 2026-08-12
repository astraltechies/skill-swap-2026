import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import type { UserProfile } from "@/types/firestore";
import { Coins } from "lucide-react";
import Link from "next/link";

/**
 * Phone-only header. The balance lives here because it is the number a student
 * checks most often — it decides whether they can book anything today.
 */
export function TopBar({ user }: { user: UserProfile }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur md:hidden">
      <Link href="/dashboard" aria-label="Skill Swap home">
        <Logo showWordmark={false} className="scale-110" />
      </Link>

      <div className="flex items-center gap-2">
        <Link
          href="/wallet"
          className="flex items-center gap-1.5 rounded-full border border-teach/30 bg-teach-wash px-3 py-1.5"
        >
          <Coins className="size-4 text-teach-ink" aria-hidden />
          <span className="tabular text-sm font-semibold text-teach-ink">
            {user.coinBalance}
          </span>
          <span className="sr-only">SkillCoins</span>
        </Link>

        <Link href="/profile" aria-label="Your profile">
          <Avatar name={user.displayName} src={user.photoURL} size="sm" />
        </Link>
      </div>
    </header>
  );
}
