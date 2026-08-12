import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { PauseCircle } from "lucide-react";
import Link from "next/link";

/**
 * Shown to a suspended account instead of the app. Deliberately says what is
 * happening and what to do next — a student who hits this should not be left
 * guessing whether the site is broken or they are in trouble.
 */
export function SuspendedNotice() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md">
        <Logo className="mb-6" />
        <Card>
          <CardBody className="space-y-4">
            <PauseCircle className="size-8 text-muted" aria-hidden />
            <div>
              <h1 className="font-display text-xl font-semibold">
                Your account is paused
              </h1>
              <p className="mt-1.5 text-sm text-muted">
                A moderator is reviewing a report about this account. You can&apos;t book
                sessions or message anyone while that&apos;s happening.
              </p>
            </div>
            <p className="text-sm text-muted">
              If you think this is a mistake, talk to the teacher who runs Skill Swap at
              your school.
            </p>
            <div className="flex gap-2 pt-1">
              <Button asChild variant="outline">
                <Link href="/logout">Sign out</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/terms">Read the rules</Link>
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
