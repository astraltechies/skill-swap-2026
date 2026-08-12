import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type CoinTxType } from "@/types/firestore";
import type { Transaction } from "firebase-admin/firestore";

/**
 * Every coin movement writes two things in one transaction: the new balance on
 * the user, and an immutable row in `coinTransactions`. The ledger is the
 * record of truth — if the two ever disagree, the ledger is what gets replayed.
 *
 * Balances are never written outside this function.
 */
export function applyCoinDelta(
  tx: Transaction,
  params: {
    userId: string;
    currentBalance: number;
    amount: number;
    type: CoinTxType;
    description: string;
    relatedSessionId?: string | null;
  },
): number {
  const db = adminDb();
  const balanceAfter = params.currentBalance + params.amount;

  if (balanceAfter < 0) {
    throw new Error("INSUFFICIENT_COINS");
  }

  tx.update(db.collection(COLLECTIONS.users).doc(params.userId), {
    coinBalance: balanceAfter,
    updatedAt: Date.now(),
  });

  tx.create(db.collection(COLLECTIONS.coinTransactions).doc(), {
    userId: params.userId,
    amount: params.amount,
    type: params.type,
    description: params.description,
    relatedSessionId: params.relatedSessionId ?? null,
    balanceAfter,
    createdAt: Date.now(),
  });

  return balanceAfter;
}
