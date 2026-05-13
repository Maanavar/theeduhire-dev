import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/admin-audit";

const db = prisma as any;

export async function GET(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 25;
    const search = searchParams.get("search") || "";
    const verificationStatus = searchParams.get("verificationStatus");
    const suspended = searchParams.get("suspended");

    const where: any = {};
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { city: { contains: search, mode: "insensitive" } },
        { subjects: { hasSome: [search] } },
      ];
    }
    if (verificationStatus) where.verificationStatus = verificationStatus;
    if (suspended === "true") where.user = { ...(where.user || {}), isSuspended: true };
    if (suspended === "false") where.user = { ...(where.user || {}), isSuspended: false };

    const [teachers, total] = await Promise.all([
      db.teacherProfile.findMany({
        where,
        select: {
          id: true,
          userId: true,
          qualification: true,
          city: true,
          subjects: true,
          demoVideoUrl: true,
          lessonPlanUrl: true,
          pocsoAcknowledged: true,
          referenceCheckDone: true,
          codeOfConductSigned: true,
          safetyBadgeGranted: true,
          verificationStatus: true,
          verificationSubmittedAt: true,
          verificationTimestamp: true,
          verificationNotes: true,
          verificationRejectionReason: true,
          user: {
            select: {
              name: true,
              email: true,
              createdAt: true,
              isSuspended: true,
              suspendedAt: true,
              suspendedUntil: true,
              suspensionReason: true,
            },
          },
          _count: {
            select: {
              experiences: true,
              certifications: true,
            },
          },
        },
        orderBy: [
          { verificationSubmittedAt: "desc" },
          { updatedAt: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.teacherProfile.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: teachers, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("GET /api/admin/teachers error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch teachers" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    const { teacherUserId, action, notes, reason, suspendedUntil, grantSafetyBadge } = await req.json();
    if (!teacherUserId || !action) {
      return NextResponse.json({ success: false, error: "teacherUserId and action required" }, { status: 400 });
    }

    const teacher = await db.teacherProfile.findUnique({
      where: { userId: teacherUserId },
      select: { id: true, userId: true },
    });
    if (!teacher) {
      return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });
    }

    const now = new Date();
    let data: Record<string, unknown> | null = null;

    if (action === "approve") {
      data = {
        verificationStatus: "VERIFIED",
        verificationSubmittedAt: now,
        verificationTimestamp: now,
        verificationNotes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
        verificationRejectionReason: null,
        verifiedByAdminId: auth.user.id,
        safetyBadgeGranted: grantSafetyBadge !== false,
      };
    } else if (action === "reject") {
      if (!reason || typeof reason !== "string" || !reason.trim()) {
        return NextResponse.json({ success: false, error: "A rejection reason is required" }, { status: 400 });
      }
      data = {
        verificationStatus: "REJECTED",
        verificationTimestamp: now,
        verificationNotes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
        verificationRejectionReason: reason.trim(),
        verifiedByAdminId: auth.user.id,
        safetyBadgeGranted: false,
      };
    } else if (action === "mark-pending") {
      data = {
        verificationStatus: "PENDING",
        verificationNotes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
        verificationRejectionReason: null,
        verificationTimestamp: null,
        verifiedByAdminId: null,
        safetyBadgeGranted: false,
      };
    } else if (action === "revoke-badge") {
      data = {
        safetyBadgeGranted: false,
        verificationNotes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
        verifiedByAdminId: auth.user.id,
      };
    }

    const auditActionMap: Record<string, string> = {
      approve: "teacher.approve", reject: "teacher.reject", "mark-pending": "teacher.mark_pending",
      "revoke-badge": "teacher.revoke_badge", suspend: "teacher.suspend", unsuspend: "teacher.unsuspend",
    };

    const teacherUser = await prisma.user.findUnique({
      where: { id: teacherUserId },
      select: { name: true },
    });

    if (data) {
      await db.teacherProfile.update({ where: { userId: teacherUserId }, data });
    } else if (action === "suspend") {
      await prisma.user.update({
        where: { id: teacherUserId },
        data: {
          isSuspended: true,
          suspendedAt: now,
          suspendedUntil: suspendedUntil ? new Date(suspendedUntil) : null,
          suspensionReason: typeof reason === "string" && reason.trim() ? reason.trim() : "Suspended by EduHire admin",
          suspendedByAdminId: auth.user.id,
        },
      });
      await db.userSession.updateMany({
        where: { userId: teacherUserId, revokedAt: null },
        data: { revokedAt: now },
      });
    } else if (action === "unsuspend") {
      await prisma.user.update({
        where: { id: teacherUserId },
        data: {
          isSuspended: false, suspendedAt: null, suspendedUntil: null,
          suspensionReason: null, suspendedByAdminId: null,
        },
      });
    } else {
      return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }

    await logAdminAction({
      adminId: auth.user.id,
      action: auditActionMap[action] as any,
      entityType: "teacher",
      entityId: teacherUserId,
      entityLabel: teacherUser?.name ?? teacherUserId,
      reason: typeof reason === "string" && reason.trim() ? reason.trim() : undefined,
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/admin/teachers error:", error);
    return NextResponse.json({ success: false, error: "Action failed" }, { status: 500 });
  }
}
