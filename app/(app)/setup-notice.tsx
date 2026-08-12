import { Logo } from "@/components/brand/logo";
import { Card, CardBody } from "@/components/ui/card";

/**
 * Shown instead of a stack trace when the app runs without Firebase
 * credentials — the state every new clone starts in.
 */
export function SetupNotice() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-paper px-4">
      <div className="w-full max-w-lg">
        <Logo className="mb-6" />
        <Card>
          <CardBody className="space-y-4">
            <div>
              <h1 className="font-display text-xl font-semibold">Connect Firebase to continue</h1>
              <p className="mt-1.5 text-sm text-muted">
                The signed-in area needs a Firebase project. It takes about five minutes and
                costs nothing.
              </p>
            </div>

            <ol className="space-y-3 text-sm text-ink-soft">
              <li className="flex gap-3">
                <span className="tabular shrink-0 font-medium text-muted">1</span>
                <span>
                  Create a project at{" "}
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-ink underline underline-offset-2"
                  >
                    console.firebase.google.com
                  </a>
                  , then turn on Authentication, Firestore and Storage. Stay on the free
                  Spark plan — no card needed.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="tabular shrink-0 font-medium text-muted">2</span>
                <span>
                  Copy <code className="rounded bg-surface-sunk px-1 py-0.5 text-xs">.env.local.example</code>{" "}
                  to <code className="rounded bg-surface-sunk px-1 py-0.5 text-xs">.env.local</code> and
                  fill in the values from Project settings.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="tabular shrink-0 font-medium text-muted">3</span>
                <span>
                  Run <code className="rounded bg-surface-sunk px-1 py-0.5 text-xs">npm run seed</code>{" "}
                  to load the skill catalogue, then restart the dev server.
                </span>
              </li>
            </ol>

            <p className="border-t border-line pt-3 text-xs text-muted">
              Public pages work without this. Only the signed-in area needs credentials.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
