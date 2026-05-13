import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/admin-audit";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 25;
    const status = searchParams.get("status") as any | null;
    const search = searchParams.get("search") || "";
    const hidden = searchParams.get("hidden");

    const where: any = {};
    if (status) where.status = status;
    if (hidden === "true") where.isHidden = true;
    if (hidden === "false") where.isHidden = false;
    if (search) where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { school: { schoolName: { contains: search, mode: "insensitive" } } },
    ];

    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        select: {
          id: true, title: true, status: true, postedAt: true, subject: true, isHidden: true, moderationNotes: true,
          school: { select: { schoolName: true, city: true, verified: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { postedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.jobPosting.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: jobs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("GET /api/admin/jobs error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch jobs" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    const { jobId, action, notes } = await req.json();
    if (!jobId || !action) return NextResponse.json({ success: false, error: "jobId and action required" }, { status: 400 });

    const auditActionMap: Record<string, string> = {
      close: "job.close", activate: "job.activate", hide: "job.hide", show: "job.show", delete: "job.delete",
    };

    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      select: { title: true },
    });

    if (action === "close") {
      await prisma.jobPosting.update({ where: { id: jobId }, data: { status: "CLOSED", moderationNotes: typeof notes === "string" ? notes.trim() || null : undefined } });
    } else if (action === "activate") {
      await prisma.jobPosting.update({ where: { id: jobId }, data: { status: "ACTIVE", isHidden: false, hiddenAt: null, hiddenByAdminId: null, moderationNotes: typeof notes === "string" ? notes.trim() || null : undefined } });
    } else if (action === "hide") {
      await prisma.jobPosting.update({
        where: { id: jobId },
        data: { isHidden: true, hiddenAt: new Date(), hiddenByAdminId: auth.user.id, moderationNotes: typeof notes === "string" ? notes.trim() || null : undefined },
      });
    } else if (action === "show") {
      await prisma.jobPosting.update({
        where: { id: jobId },
        data: { isHidden: false, hiddenAt: null, hiddenByAdminId: null, moderationNotes: typeof notes === "string" ? notes.trim() || null : undefined },
      });
    } else if (action === "delete") {
      await prisma.jobPosting.delete({ where: { id: jobId } });
    } else {
      return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }

    await logAdminAction({
      adminId: auth.user.id,
      action: auditActionMap[action] as any,
      entityType: "job",
      entityId: jobId,
      entityLabel: job?.title ?? jobId,
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/admin/jobs error:", error);
    return NextResponse.json({ success: false, error: "Action failed" }, { status: 500 });
  }
}
