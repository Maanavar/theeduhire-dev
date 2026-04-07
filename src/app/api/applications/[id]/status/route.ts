import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { updateApplicationStatusSchema } from "@/lib/validators/application";
import { sendStatusUpdate } from "@/lib/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(["SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = updateApplicationStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            postedBy: true,
            school: { select: { schoolName: true } },
          },
        },
        applicant: {
          select: { email: true, name: true },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    }
    if (application.job.postedBy !== auth.user.id && auth.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: parsed.data.status,
        schoolNotes: parsed.data.schoolNotes ?? application.schoolNotes,
        reviewedAt: application.reviewedAt ?? new Date(),
      },
    });

    // Send status update email non-blocking
    sendStatusUpdate({
      teacherEmail: application.applicant.email,
      teacherName: application.applicant.name,
      jobTitle: application.job.title,
      schoolName: application.job.school.schoolName,
      newStatus: parsed.data.status,
      jobId: application.job.id,
    }).catch((err) => console.error("Status email error:", err));

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH /api/applications/[id]/status error:", error);
    return NextResponse.json({ success: false, error: "Failed to update status" }, { status: 500 });
  }
}
