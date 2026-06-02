import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getTeacherPlan } from "@/lib/subscription";

// POST /api/profile-views — log a profile view (called from public profile page)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teacherId } = body;
    if (!teacherId || typeof teacherId !== "string") {
      return NextResponse.json({ success: false, error: "teacherId required" }, { status: 400 });
    }

    // Don't log self-views
    const session = await getSession();
    const viewerId = session?.user?.id ?? null;
    if (viewerId === teacherId) {
      return NextResponse.json({ success: true });
    }

    const viewerRole = session?.user?.role ?? null;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentView = await prisma.profileView.findFirst({
      where: {
        teacherId,
        ...(viewerId ? { viewerId } : {}),
        viewedAt: { gte: oneHourAgo },
      },
      select: { id: true },
    });
    if (recentView) {
      return NextResponse.json({ success: true });
    }

    await prisma.profileView.create({
      data: { teacherId, viewerId, viewerRole },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/profile-views error:", err);
    return NextResponse.json({ success: false, error: "Failed to log view" }, { status: 500 });
  }
}

// GET /api/profile-views — teacher gets their own view stats
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check plan — only PRO teachers get full "who viewed" list
    const plan = await getTeacherPlan(userId);
    const isPro = plan.plan === "PRO" && plan.status !== "CANCELED" && plan.status !== "PAST_DUE";

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [total30d, total7d, recentViewers] = await Promise.all([
      prisma.profileView.count({ where: { teacherId: userId, viewedAt: { gte: thirtyDaysAgo } } }),
      prisma.profileView.count({ where: { teacherId: userId, viewedAt: { gte: sevenDaysAgo } } }),
      isPro
        ? prisma.profileView.findMany({
            where: { teacherId: userId, viewerId: { not: null } },
            orderBy: { viewedAt: "desc" },
            take: 10,
            select: {
              id: true,
              viewedAt: true,
              viewerRole: true,
              viewer: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                  schoolProfile: { select: { schoolName: true } },
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        total30d,
        total7d,
        isPro,
        recentViewers: isPro ? recentViewers : [],
      },
    });
  } catch (err) {
    console.error("GET /api/profile-views error:", err);
    return NextResponse.json({ success: false, error: "Failed to load view stats" }, { status: 500 });
  }
}
