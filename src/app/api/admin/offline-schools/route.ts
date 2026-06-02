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

    const where: any = { isOfflineManaged: true };
    if (search) {
      where.OR = [
        { schoolName: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { offlineContactName: { contains: search, mode: "insensitive" } },
        { offlineContactPhone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [schools, total] = await Promise.all([
      db.schoolProfile.findMany({
        where,
        select: {
          id: true,
          schoolName: true,
          city: true,
          board: true,
          address: true,
          website: true,
          about: true,
          udiseCode: true,
          isOfflineManaged: true,
          offlineContactName: true,
          offlineContactPhone: true,
          offlineContactEmail: true,
          verified: true,
          createdAt: true,
          user: { select: { id: true, email: true, name: true } },
          _count: { select: { jobPostings: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.schoolProfile.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: schools, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("GET /api/admin/offline-schools error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch offline schools" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const { schoolName, city, board, address, website, about, udiseCode, offlineContactName, offlineContactPhone, offlineContactEmail } = body;
    if (!schoolName?.trim() || !city?.trim()) {
      return NextResponse.json({ success: false, error: "schoolName and city are required" }, { status: 400 });
    }

    // Create a ghost user account to own this school (no real login)
    const ghostEmail = `offline.${Date.now()}@eduhire.internal`;
    const hashedPassword = await hash(Math.random().toString(36), 12);

    const result = await prisma.$transaction(async (tx: any) => {
      const ghostUser = await tx.user.create({
        data: {
          name: offlineContactName?.trim() || schoolName.trim(),
          email: ghostEmail,
          hashedPassword,
          role: "SCHOOL_ADMIN",
          emailVerified: false,
          isSuspended: true, // ghost accounts can't log in
        },
      });
      const school = await tx.schoolProfile.create({
        data: {
          userId: ghostUser.id,
          schoolName: schoolName.trim(),
          city: city.trim(),
          board: board || "CBSE",
          address: address?.trim() || null,
          website: website?.trim() || null,
          about: about?.trim() || null,
          udiseCode: udiseCode?.trim() || null,
          isOfflineManaged: true,
          offlineContactName: offlineContactName?.trim() || null,
          offlineContactPhone: offlineContactPhone?.trim() || null,
          offlineContactEmail: offlineContactEmail?.trim() || null,
          verified: true,
        },
      });
      return school;
    });

    await logAdminAction({
      adminId: auth.user.id,
      action: "offline_school.create",
      entityType: "offline_school",
      entityId: result.id,
      entityLabel: schoolName.trim(),
    });

    return NextResponse.json({ success: true, data: { id: result.id, schoolName: result.schoolName } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/offline-schools error:", error);
    return NextResponse.json({ success: false, error: "Failed to create offline school" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const { schoolId, schoolName, city, board, address, website, about, udiseCode, offlineContactName, offlineContactPhone, offlineContactEmail } = body;
    if (!schoolId) return NextResponse.json({ success: false, error: "schoolId required" }, { status: 400 });

    const school = await db.schoolProfile.findUnique({
      where: { id: schoolId, isOfflineManaged: true },
      select: { id: true, schoolName: true },
    });
    if (!school) return NextResponse.json({ success: false, error: "Offline school not found" }, { status: 404 });

    const profileUpdate: Record<string, unknown> = {};
    if (schoolName?.trim()) profileUpdate.schoolName = schoolName.trim();
    if (city?.trim()) profileUpdate.city = city.trim();
    if (board) profileUpdate.board = board;
    if (address !== undefined) profileUpdate.address = address?.trim() || null;
    if (website !== undefined) profileUpdate.website = website?.trim() || null;
    if (about !== undefined) profileUpdate.about = about?.trim() || null;
    if (udiseCode !== undefined) profileUpdate.udiseCode = udiseCode?.trim() || null;
    if (offlineContactName !== undefined) profileUpdate.offlineContactName = offlineContactName?.trim() || null;
    if (offlineContactPhone !== undefined) profileUpdate.offlineContactPhone = offlineContactPhone?.trim() || null;
    if (offlineContactEmail !== undefined) profileUpdate.offlineContactEmail = offlineContactEmail?.trim() || null;

    await db.schoolProfile.update({ where: { id: schoolId }, data: profileUpdate });

    await logAdminAction({
      adminId: auth.user.id,
      action: "offline_school.edit",
      entityType: "offline_school",
      entityId: schoolId,
      entityLabel: (profileUpdate.schoolName as string) ?? school.schoolName,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/admin/offline-schools error:", error);
    return NextResponse.json({ success: false, error: "Failed to update offline school" }, { status: 500 });
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
      where: { id: schoolId, isOfflineManaged: true },
      select: { id: true, userId: true, schoolName: true },
    });
    if (!school) return NextResponse.json({ success: false, error: "Offline school not found" }, { status: 404 });

    await prisma.user.delete({ where: { id: school.userId } });

    await logAdminAction({
      adminId: auth.user.id,
      action: "offline_school.delete",
      entityType: "offline_school",
      entityId: schoolId,
      entityLabel: school.schoolName,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/offline-schools error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete offline school" }, { status: 500 });
  }
}
