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
    const verified = searchParams.get("verified");
    const verificationStatus = searchParams.get("verificationStatus");
    const suspended = searchParams.get("suspended");

    const where: any = {};
    if (search) {
      where.OR = [
        { schoolName: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (verified === "true") where.verified = true;
    if (verified === "false") where.verified = false;
    if (verificationStatus) where.verificationStatus = verificationStatus;
    if (suspended === "true") where.user = { ...(where.user || {}), isSuspended: true };
    if (suspended === "false") where.user = { ...(where.user || {}), isSuspended: false };

    const [schools, total] = await Promise.all([
      db.schoolProfile.findMany({
        where,
        select: {
          id: true,
          schoolName: true,
          city: true,
          board: true,
          verified: true,
          verificationStatus: true,
          verificationSubmittedAt: true,
          verificationTimestamp: true,
          verificationNotes: true,
          verificationRejectionReason: true,
          user: {
            select: {
              id: true,
              email: true,
              createdAt: true,
              isSuspended: true,
              suspendedAt: true,
              suspendedUntil: true,
              suspensionReason: true,
            },
          },
          _count: { select: { jobPostings: true } },
        },
        orderBy: [
          { verificationSubmittedAt: "desc" },
          { user: { createdAt: "desc" } },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.schoolProfile.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: schools, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("GET /api/admin/schools error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch schools" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    const { schoolId, action, notes, reason, suspendedUntil } = await req.json();
    if (!schoolId || !action) {
      return NextResponse.json({ success: false, error: "schoolId and action required" }, { status: 400 });
    }

    const school = await db.schoolProfile.findUnique({
      where: { id: schoolId },
      select: { id: true, userId: true, schoolName: true },
    });
    if (!school) {
      return NextResponse.json({ success: false, error: "School not found" }, { status: 404 });
    }

    const now = new Date();
    let data: Record<string, unknown> | null = null;

    if (action === "approve" || action === "verify") {
      data = {
        verified: true,
        verificationStatus: "VERIFIED",
        verificationNotes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
        verificationRejectionReason: null,
        verificationTimestamp: now,
        verifiedByAdminId: auth.user.id,
      };
    } else if (action === "reject") {
      if (!reason || typeof reason !== "string" || !reason.trim()) {
        return NextResponse.json({ success: false, error: "A rejection reason is required" }, { status: 400 });
      }
      data = {
        verified: false,
        verificationStatus: "REJECTED",
        verificationNotes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
        verificationRejectionReason: reason.trim(),
        verificationTimestamp: now,
        verifiedByAdminId: auth.user.id,
      };
    } else if (action === "mark-pending") {
      data = {
        verified: false,
        verificationStatus: "PENDING",
        verificationNotes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
        verificationRejectionReason: null,
        verificationTimestamp: null,
        verifiedByAdminId: null,
      };
    } else if (action === "unverify") {
      data = {
        verified: false,
        verificationStatus: "UNVERIFIED",
        verificationNotes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
        verificationRejectionReason: null,
        verificationTimestamp: now,
        verifiedByAdminId: auth.user.id,
      };
    }

    const auditActionMap: Record<string, string> = {
      approve: "school.approve", verify: "school.verify", unverify: "school.unverify",
      reject: "school.reject", "mark-pending": "school.mark_pending",
      suspend: "school.suspend", unsuspend: "school.unsuspend",
    };

    if (data) {
      await db.schoolProfile.update({ where: { id: schoolId }, data });
    } else if (action === "suspend") {
      await prisma.user.update({
        where: { id: school.userId },
        data: {
          isSuspended: true,
          suspendedAt: now,
          suspendedUntil: suspendedUntil ? new Date(suspendedUntil) : null,
          suspensionReason: typeof reason === "string" && reason.trim() ? reason.trim() : "Suspended by EduHire admin",
          suspendedByAdminId: auth.user.id,
        },
      });
      await db.userSession.updateMany({
        where: { userId: school.userId, revokedAt: null },
        data: { revokedAt: now },
      });
    } else if (action === "unsuspend") {
      await prisma.user.update({
        where: { id: school.userId },
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
      entityType: "school",
      entityId: schoolId,
      entityLabel: school.schoolName,
      reason: typeof reason === "string" && reason.trim() ? reason.trim() : undefined,
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/admin/schools error:", error);
    return NextResponse.json({ success: false, error: "Action failed" }, { status: 500 });
  }
}
