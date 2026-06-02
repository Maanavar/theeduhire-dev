import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { getTeacherPlan } from "@/lib/subscription";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET() {
  try {
    const auth = await requireAuth(["TEACHER"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const rl = await checkRateLimit({
      key: `billing:teacher-plan:${auth.user.id}`,
      action: "billing.teacher-plan.get",
      actorKey: auth.user.id,
      limit: 60,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 });
    }

    const { plan, status } = await getTeacherPlan(auth.user.id);

    return NextResponse.json({
      success: true,
      data: { plan, status },
    });
  } catch (error) {
    console.error("GET /api/billing/teacher-plan error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch billing info" }, { status: 500 });
  }
}
