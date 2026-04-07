import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(["TEACHER", "ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const applications = await prisma.application.findMany({
      where: { applicantId: auth.user.id },
      include: {
        job: {
          select: {
            id: true, title: true, subject: true, board: true, gradeLevel: true,
            jobType: true, salaryMin: true, salaryMax: true, status: true,
            school: { select: { schoolName: true, city: true, verified: true } },
          },
        },
      },
      orderBy: { appliedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: applications });
  } catch (error) {
    console.error("GET /api/applications error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch applications" }, { status: 500 });
  }
}
