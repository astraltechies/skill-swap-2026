import "server-only";

import { AuthError } from "@/lib/firebase/admin";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

/**
 * One place where every route turns a thrown error into a response, so no
 * handler leaks a stack trace or an internal Firestore message to the client.
 */
export function apiError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ZodError) {
    const first = error.issues[0];
    return NextResponse.json(
      {
        error: first?.message ?? "Check the form and try again.",
        field: first?.path.join("."),
      },
      { status: 400 },
    );
  }

  if (error instanceof HandledError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error("[api] unhandled error:", error);
  return NextResponse.json(
    { error: "Something went wrong. Try again in a moment." },
    { status: 500 },
  );
}

/** An error whose message is safe to show the user. */
export class HandledError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new HandledError("Expected a JSON body.", 400);
  }
  return schema.parse(raw);
}

export function ok<T extends Record<string, unknown>>(data: T = {} as T) {
  return NextResponse.json({ ok: true, ...data });
}
