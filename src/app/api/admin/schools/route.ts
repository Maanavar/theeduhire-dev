import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 25;
    const search = searchParams.get("search") || "";
    const verified = searchParams.get("verified");

    const where: any = {};
    if (search) where.OR = [
      { schoolName: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
    ];
    if (verified === "true") where.verified = true;
    if (verified === "false") where.verified = false;

    const [schools, total] = await Promise.all([
      prisma.schoolProfile.findMany({
        where,
        select: {
          id: true, schoolName: true, city: true, board: true, verified: true,
          user: { select: { email: true, createdAt: true } },
          _count: { select: { jobPostings: true } },
        },
        orderBy: { user: { createdAt: "desc" } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.schoolProfile.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: schools, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch schools" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    const { schoolId, action } = await req.json();
    if (!schoolId || !action) return NextResponse.json({ success: false, error: "schoolId and action required" }, { status: 400 });

    if (action === "verify") {
      await prisma.schoolProfile.update({ where: { id: schoolId }, data: { verified: true } });
    } else if (action === "unverify") {
      await prisma.schoolProfile.update({ where: { id: schoolId }, data: { verified: false } });
    } else {
      return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Action failed" }, { status: 500 });
  }
}
