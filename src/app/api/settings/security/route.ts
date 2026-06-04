import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";

export async function GET() {
  const auth = await requireAuth(["TEACHER", "SCHOOL_ADMIN", "ADMIN"]);
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  return NextResponse.json({
    success: true,
    data: {
      endpoints: {
        password: "/api/settings/security/password",
        sessions: "/api/settings/security/sessions",
        revokeSession: "/api/settings/security/sessions/revoke",
      },
    },
  });
}
