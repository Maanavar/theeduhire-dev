import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/admin-audit";
import { hash } from "bcryptjs";

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

    // Notification messages to send to the school user after action
    const schoolNotifications: Record<string, { title: string; body: string }> = {
      approve: { title: "School verified ✓", body: `${school.schoolName} has been verified by EduHire. Your jobs now carry verified trust signals.` },
      verify: { title: "School verified ✓", body: `${school.schoolName} has been verified by EduHire. Your jobs now carry verified trust signals.` },
      reject: { title: "Verification not approved", body: reason?.trim() ? `Reason: ${reason.trim()}` : `${school.schoolName} verification was not approved. Update your profile and resubmit.` },
      unverify: { title: "School verification revoked", body: `${school.schoolName} verification has been revoked by admin.` },
      suspend: { title: "Account suspended", body: typeof reason === "string" && reason.trim() ? reason.trim() : "Your account has been suspended by EduHire admin." },
      unsuspend: { title: "Account reinstated", body: "Your school account has been reinstated. You can log in and post jobs again." },
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

    // Send notification to school user
    const notifMsg = schoolNotifications[action];
    if (notifMsg) {
      await prisma.notification.create({
        data: {
          userId: school.userId,
          type: "SYSTEM",
          title: notifMsg.title,
          body: notifMsg.body,
          payload: { action, schoolId },
        },
      });
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

export async function POST(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const { name, email, password, phone, schoolName, city, board, address, website, about, udiseCode } = body;
    if (!name?.trim() || !email?.trim() || !password?.trim() || !schoolName?.trim() || !city?.trim()) {
      return NextResponse.json({ success: false, error: "name, email, password, schoolName and city are required" }, { status: 400 });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ success: false, error: "An account with this email already exists" }, { status: 409 });
    }
    const hashedPassword = await hash(password, 12);
    const user = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          hashedPassword,
          role: "SCHOOL_ADMIN",
          phone: phone?.trim() || null,
          emailVerified: true,
        },
      });
      await tx.schoolProfile.create({
        data: {
          userId: newUser.id,
          schoolName: schoolName.trim(),
          city: city.trim(),
          board: board || "CBSE",
          address: address?.trim() || null,
          website: website?.trim() || null,
          about: about?.trim() || null,
          udiseCode: udiseCode?.trim() || null,
        },
      });
      return newUser;
    });

    await logAdminAction({
      adminId: auth.user.id,
      action: "school.create",
      entityType: "school",
      entityId: user.id,
      entityLabel: schoolName.trim(),
    });

    return NextResponse.json({ success: true, data: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/schools error:", error);
    return NextResponse.json({ success: false, error: "Failed to create school account" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const { schoolId, name, email, phone, password, schoolName, city, board, address, website, about, udiseCode } = body;
    if (!schoolId) return NextResponse.json({ success: false, error: "schoolId required" }, { status: 400 });

    const school = await db.schoolProfile.findUnique({
      where: { id: schoolId },
      select: { id: true, userId: true, schoolName: true },
    });
    if (!school) return NextResponse.json({ success: false, error: "School not found" }, { status: 404 });

    const userUpdate: Record<string, unknown> = {};
    if (name?.trim()) userUpdate.name = name.trim();
    if (email?.trim()) {
      const normalizedEmail = email.toLowerCase().trim();
      const conflict = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (conflict && conflict.id !== school.userId) {
        return NextResponse.json({ success: false, error: "Email already in use by another account" }, { status: 409 });
      }
      userUpdate.email = normalizedEmail;
    }
    if (phone !== undefined) userUpdate.phone = phone?.trim() || null;
    if (password?.trim()) userUpdate.hashedPassword = await hash(password, 12);

    const profileUpdate: Record<string, unknown> = {};
    if (schoolName?.trim()) profileUpdate.schoolName = schoolName.trim();
    if (city?.trim()) profileUpdate.city = city.trim();
    if (board) profileUpdate.board = board;
    if (address !== undefined) profileUpdate.address = address?.trim() || null;
    if (website !== undefined) profileUpdate.website = website?.trim() || null;
    if (about !== undefined) profileUpdate.about = about?.trim() || null;
    if (udiseCode !== undefined) profileUpdate.udiseCode = udiseCode?.trim() || null;

    await prisma.$transaction(async (tx: any) => {
      if (Object.keys(userUpdate).length) await tx.user.update({ where: { id: school.userId }, data: userUpdate });
      if (Object.keys(profileUpdate).length) await tx.schoolProfile.update({ where: { id: schoolId }, data: profileUpdate });
    });

    await logAdminAction({
      adminId: auth.user.id,
      action: "school.edit",
      entityType: "school",
      entityId: schoolId,
      entityLabel: (profileUpdate.schoolName as string) ?? school.schoolName,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/admin/schools error:", error);
    return NextResponse.json({ success: false, error: "Failed to update school" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");
    if (!schoolId) return NextResponse.json({ success: false, error: "schoolId required" }, { status: 400 });

    const school = await db.schoolProfile.findUnique({
      where: { id: schoolId },
      select: { id: true, userId: true, schoolName: true },
    });
    if (!school) return NextResponse.json({ success: false, error: "School not found" }, { status: 404 });

    await prisma.user.delete({ where: { id: school.userId } });

    await logAdminAction({
      adminId: auth.user.id,
      action: "school.delete",
      entityType: "school",
      entityId: schoolId,
      entityLabel: school.schoolName,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/schools error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete school" }, { status: 500 });
  }
}
