"use client";

import { PageContainer } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

/**
 * Catches errors inside the signed-in area so the nav shell survives.
 *
 * Without this boundary, anything that threw escaped to the root error page
 * and unmounted the sidebar, top bar and tab bar — turning a single failed
 * query into what looked like the whole app crashing.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app]", error);
  }, [error]);

  return (
    <PageContainer width="narrow">
      <Card>
        <CardBody className="space-y-4">
          <AlertTriangle className="size-7 text-muted" aria-hidden />
          <div>
            <h1 className="font-display text-xl font-semibold">That didn&apos;t load</h1>
            <p className="mt-1.5 text-sm text-muted">
              Something went wrong fetching this page. Trying again usually sorts it.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={reset}>Try again</Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          </div>
        </CardBody>
      </Card>
    </PageContainer>
  );
}
