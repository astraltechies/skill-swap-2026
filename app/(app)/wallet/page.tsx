import { PageContainer, PageHeader } from "@/components/shell/page";
import { Card, CardBody, EmptyState } from "@/components/ui/card";
import { CoinAmount } from "@/components/ui/pill";
import { COINS } from "@/lib/constants";
import { requireUser } from "@/lib/firebase/admin";
import { getCoinTransactions } from "@/lib/queries";
import { formatSessionTime } from "@/lib/utils";
import type { CoinTxType } from "@/types/firestore";
import { ArrowDownLeft, ArrowUpRight, Coins, Gift, Wrench } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wallet",
  robots: { index: false, follow: false },
};

const TX_ICON: Record<CoinTxType, typeof Coins> = {
  welcome_bonus: Gift,
  session_earned: ArrowDownLeft,
  session_spent: ArrowUpRight,
  admin_adjustment: Wrench,
  refund: ArrowDownLeft,
};

export default async function WalletPage() {
  const me = await requireUser();
  const transactions = await getCoinTransactions(me.uid);

  const earned = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const spent = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <PageContainer width="narrow">
      <PageHeader title="Wallet" />

      {/* The balance is the one number worth setting large — it decides whether
          a student can book anything today. */}
      <Card className="mb-4 overflow-hidden">
        <div className="bg-teach-wash px-5 py-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-teach-ink/70">
            Balance
          </p>
          <p className="tabular mt-1 text-5xl font-semibold text-teach-ink">
            {me.coinBalance}
          </p>
          <p className="mt-1 text-sm text-teach-ink/80">SkillCoins</p>
        </div>
        <CardBody className="grid grid-cols-2 divide-x divide-line text-center">
          <div>
            <p className="tabular text-lg font-semibold text-teach-ink">+{earned}</p>
            <p className="text-xs text-muted">Earned teaching</p>
          </div>
          <div>
            <p className="tabular text-lg font-semibold text-learn-ink">−{spent}</p>
            <p className="text-xs text-muted">Spent learning</p>
          </div>
        </CardBody>
      </Card>

      <Card className="mb-6 border-dashed">
        <CardBody>
          <p className="text-sm text-muted">
            SkillCoins aren&apos;t money and can&apos;t be bought. You start with{" "}
            <span className="tabular font-medium text-ink">{COINS.welcomeBonus}</span>, earn{" "}
            <span className="tabular font-medium text-ink">{COINS.sessionReward}</span> each
            time you teach, and spend{" "}
            <span className="tabular font-medium text-ink">{COINS.sessionCost}</span> each
            time you learn.
          </p>
        </CardBody>
      </Card>

      <h2 className="mb-3 font-display text-lg font-semibold">History</h2>

      {transactions.length > 0 ? (
        <ul className="space-y-2">
          {transactions.map((tx) => {
            const Icon = TX_ICON[tx.type] ?? Coins;
            const credit = tx.amount > 0;
            return (
              <li
                key={tx.id}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                    credit ? "bg-teach-wash text-teach-ink" : "bg-learn-wash text-learn-ink"
                  }`}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{tx.description}</p>
                  <p className="text-xs text-muted">
                    {formatSessionTime(new Date(tx.createdAt))}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <CoinAmount amount={tx.amount} />
                  <p className="tabular text-xs text-muted">{tx.balanceAfter}</p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          icon={<Coins className="size-7" aria-hidden />}
          title="Nothing here yet"
          body="Your coin history will appear once you teach or learn your first session."
        />
      )}
    </PageContainer>
  );
}
