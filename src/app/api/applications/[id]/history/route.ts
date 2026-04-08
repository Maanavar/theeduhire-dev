import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    // Fetch the application with its job to verify ownership
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          select: { postedBy: true },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    }

    // Authorization: TEACHER (own application) | SCHOOL_ADMIN (their job) | ADMIN
    const isTeacherOwner = application.applicantId === auth.user.id;
    const isSchoolOwner = application.job.postedBy === auth.user.id && auth.user.role === "SCHOOL_ADMIN";
    const isAdmin = auth.user.role === "ADMIN";

    if (!isTeacherOwner && !isSchoolOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
    }

    // Fetch status history ordered by date ascending (oldest first)
    const history = await prisma.applicationStatusHistory.findMany({
      where: { applicationId: id },
      include: {
        changedByUser: {
          select: { name: true },
        },
      },
      orderBy: { changedAt: "asc" },
    });

    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    console.error("GET /api/applications/[id]/history error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch status history" }, { status: 500 });
  }
}
