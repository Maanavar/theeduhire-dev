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

    // Notification messages to send back to teacher after admin action
    const teacherNotifications: Record<string, { title: string; body: string }> = {
      approve: { title: "Profile verified ✓", body: `Your teacher profile has been verified by EduHire. You now have a verified badge visible to schools.` },
      reject: { title: "Verification not approved", body: reason?.trim() ? `Reason: ${reason.trim()}` : "Your teacher verification was not approved. Please update your profile and resubmit." },
      "revoke-badge": { title: "Safety badge revoked", body: notes?.trim() ? notes.trim() : "Your EduHire safety badge has been revoked by admin." },
      suspend: { title: "Account suspended", body: typeof reason === "string" && reason.trim() ? reason.trim() : "Your account has been suspended by EduHire admin." },
      unsuspend: { title: "Account reinstated", body: "Your teacher account has been reinstated. You can log in and apply for jobs." },
    };

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

    // Send notification to teacher
    const notifMsg = teacherNotifications[action];
    if (notifMsg) {
      await prisma.notification.create({
        data: {
          userId: teacherUserId,
          type: "SYSTEM",
          title: notifMsg.title,
          body: notifMsg.body,
          payload: { action, teacherUserId },
        },
      });
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

export async function POST(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const { name, email, password, phone, city, subjects, qualification, experience, bio } = body;
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json({ success: false, error: "name, email and password are required" }, { status: 400 });
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
          role: "TEACHER",
          phone: phone?.trim() || null,
          emailVerified: true,
        },
      });
      await tx.teacherProfile.create({
        data: {
          userId: newUser.id,
          city: city?.trim() || null,
          subjects: Array.isArray(subjects) ? subjects : [],
          qualification: qualification?.trim() || null,
          experience: experience?.trim() || null,
          bio: bio?.trim() || null,
        },
      });
      return newUser;
    });

    await logAdminAction({
      adminId: auth.user.id,
      action: "teacher.create",
      entityType: "teacher",
      entityId: user.id,
      entityLabel: user.name,
    });

    return NextResponse.json({ success: true, data: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/teachers error:", error);
    return NextResponse.json({ success: false, error: "Failed to create teacher" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const { userId, name, email, phone, password, city, subjects, qualification, experience, bio } = body;
    if (!userId) return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    const userUpdate: Record<string, unknown> = {};
    if (name?.trim()) userUpdate.name = name.trim();
    if (email?.trim()) {
      const normalizedEmail = email.toLowerCase().trim();
      const conflict = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (conflict && conflict.id !== userId) {
        return NextResponse.json({ success: false, error: "Email already in use by another account" }, { status: 409 });
      }
      userUpdate.email = normalizedEmail;
    }
    if (phone !== undefined) userUpdate.phone = phone?.trim() || null;
    if (password?.trim()) userUpdate.hashedPassword = await hash(password, 12);

    const profileUpdate: Record<string, unknown> = {};
    if (city !== undefined) profileUpdate.city = city?.trim() || null;
    if (subjects !== undefined) profileUpdate.subjects = Array.isArray(subjects) ? subjects : [];
    if (qualification !== undefined) profileUpdate.qualification = qualification?.trim() || null;
    if (experience !== undefined) profileUpdate.experience = experience?.trim() || null;
    if (bio !== undefined) profileUpdate.bio = bio?.trim() || null;

    await prisma.$transaction(async (tx: any) => {
      if (Object.keys(userUpdate).length) await tx.user.update({ where: { id: userId }, data: userUpdate });
      if (Object.keys(profileUpdate).length) await tx.teacherProfile.update({ where: { userId }, data: profileUpdate });
    });

    await logAdminAction({
      adminId: auth.user.id,
      action: "teacher.edit",
      entityType: "teacher",
      entityId: userId,
      entityLabel: (userUpdate.name as string) ?? user.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/admin/teachers error:", error);
    return NextResponse.json({ success: false, error: "Failed to update teacher" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, role: true } });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    if (user.role !== "TEACHER") return NextResponse.json({ success: false, error: "User is not a teacher" }, { status: 400 });

    await prisma.user.delete({ where: { id: userId } });

    await logAdminAction({
      adminId: auth.user.id,
      action: "teacher.delete",
      entityType: "teacher",
      entityId: userId,
      entityLabel: user.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/teachers error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete teacher" }, { status: 500 });
  }
}
