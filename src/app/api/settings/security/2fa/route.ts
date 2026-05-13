import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";

function isTwoFactorEnabled() {
  const raw = (process.env.FF_2FA ?? process.env.NEXT_PUBLIC_FF_2FA ?? "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

export async function GET() {
  try {
    const auth = await requireAuth(["TEACHER", "SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    if (!isTwoFactorEnabled()) {
      return NextResponse.json(
        {
          success: false,
          error: "Two-factor authentication is disabled in this environment.",
          data: { available: false, enabled: false },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        available: false,
        enabled: false,
        method: "totp",
        recoveryCodesCount: 0,
        setupState: "not_configured",
        message: "Two-factor authentication is not yet available in this environment.",
      },
    });
  } catch (error) {
    console.error("GET /api/settings/security/2fa error:", error);
    return NextResponse.json({ success: false, error: "Failed to load 2FA status" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const auth = await requireAuth(["TEACHER", "SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    if (!isTwoFactorEnabled()) {
      return NextResponse.json(
        {
          success: false,
          error: "Two-factor authentication is disabled in this environment.",
          data: { available: false },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        available: false,
        status: "2FA is not enabled yet.",
      },
    }, { status: 501 });
  } catch (error) {
    console.error("POST /api/settings/security/2fa error:", error);
    return NextResponse.json({ success: false, error: "Failed to bootstrap 2FA" }, { status: 500 });
  }
}
