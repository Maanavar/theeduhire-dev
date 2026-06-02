import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { getSchoolPlan, POST_LIMITS } from "@/lib/subscription";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET() {
  try {
    const auth = await requireAuth(["SCHOOL_ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const rl = await checkRateLimit({
      key: `billing:plan:${auth.user.id}`,
      action: "billing.plan.get",
      actorKey: auth.user.id,
      limit: 60,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 });
    }

    const { plan, status, postsUsed, cycleResetAt } = await getSchoolPlan(auth.user.id);
    const postsLimit = POST_LIMITS[plan];

    return NextResponse.json({
      success: true,
      data: {
        plan,
        status,
        postsUsed,
        postsLimit: postsLimit === Infinity ? null : postsLimit,
        cycleResetAt: cycleResetAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("GET /api/billing/plan error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch billing info" }, { status: 500 });
  }
}
