import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(["TEACHER", "ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            title: true,
            postedBy: true,
            school: { select: { schoolName: true } },
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    }

    const isTeacherOwner = auth.user.role === "TEACHER" && application.applicantId === auth.user.id;
    const isAdmin = auth.user.role === "ADMIN";
    if (!isTeacherOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
    }

    if (application.status === "HIRED") {
      return NextResponse.json(
        { success: false, error: "Hired applications cannot be withdrawn" },
        { status: 400 }
      );
    }

    await prisma.application.delete({ where: { id } });

    if (auth.user.role === "TEACHER") {
      await prisma.notification.create({
        data: {
          userId: application.job.postedBy,
          type: "APPLICATION",
          title: "Application withdrawn",
          body: `${application.job.title} - ${application.job.school.schoolName}`,
          payload: {
            applicationId: application.id,
            status: "WITHDRAWN",
          },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/applications/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to withdraw application" }, { status: 500 });
  }
}
