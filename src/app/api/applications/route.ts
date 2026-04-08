import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(["TEACHER", "ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    // Parse query params for filtering
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");
    const includeHistory = searchParams.get("includeHistory") === "true";

    // Build where clause
    const where: any = { applicantId: auth.user.id };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.appliedAt = {};
      if (fromDate) {
        where.appliedAt.gte = new Date(fromDate);
      }
      if (toDate) {
        const toDateTime = new Date(toDate);
        toDateTime.setHours(23, 59, 59, 999);
        where.appliedAt.lte = toDateTime;
      }
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        job: {
          select: {
            id: true, title: true, subject: true, board: true, gradeLevel: true,
            jobType: true, salaryMin: true, salaryMax: true, status: true,
            school: { select: { schoolName: true, city: true, verified: true } },
          },
        },
        statusHistory: includeHistory
          ? {
              include: { changedByUser: { select: { name: true } } },
              orderBy: { changedAt: "asc" },
            }
          : false,
      },
      orderBy: { appliedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: applications });
  } catch (error) {
    console.error("GET /api/applications error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch applications" }, { status: 500 });
  }
}
