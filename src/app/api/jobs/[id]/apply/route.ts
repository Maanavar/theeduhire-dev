import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { applyJobSchema } from "@/lib/validators/application";
import { sendApplicationConfirmation, sendNewApplicationAlert } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(["TEACHER"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id: jobId } = await params;
    const body = await req.json();
    const parsed = applyJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      select: {
        id: true, status: true, title: true,
        school: { select: { schoolName: true } },
        poster: { select: { email: true, name: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }
    if (job.status !== "ACTIVE") {
      return NextResponse.json({ success: false, error: "This job is no longer accepting applications" }, { status: 400 });
    }

    const existing = await prisma.application.findUnique({
      where: { jobId_applicantId: { jobId, applicantId: auth.user.id } },
    });
    if (existing) {
      return NextResponse.json({ success: false, error: "You have already applied for this position" }, { status: 409 });
    }

    const application = await prisma.application.create({
      data: {
        jobId,
        applicantId: auth.user.id,
        coverLetter: parsed.data.coverLetter || null,
        resumeId: parsed.data.resumeId || null,
      },
    });

    // Get full teacher details for emails
    const teacher = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { email: true, name: true },
    });

    // Fire emails non-blocking
    if (teacher) {
      Promise.all([
        sendApplicationConfirmation({
          teacherEmail: teacher.email,
          teacherName: teacher.name,
          jobTitle: job.title,
          schoolName: job.school.schoolName,
          jobId,
        }),
        job.poster
          ? sendNewApplicationAlert({
              schoolEmail: job.poster.email,
              schoolName: job.school.schoolName,
              teacherName: teacher.name,
              jobTitle: job.title,
              jobId,
            })
          : Promise.resolve(),
      ]).catch((err) => console.error("Email send error:", err));
    }

    return NextResponse.json({ success: true, data: { id: application.id } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/jobs/[id]/apply error:", error);
    return NextResponse.json({ success: false, error: "Failed to submit application" }, { status: 500 });
  }
}
