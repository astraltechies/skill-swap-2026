import { apiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/firebase/admin";
import { NextResponse } from "next/server";

/**
 * Whether the current session already has a profile. Used right after Google
 * sign-in to decide between the dashboard and the consent step.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({
      profile: user
        ? { username: user.username, displayName: user.displayName, role: user.role }
        : null,
    });
  } catch (error) {
    return apiError(error);
  }
}
