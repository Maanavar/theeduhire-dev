import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { canManageJob } from "@/lib/policies/job-policy";
import { getSchoolProfileIdForUser } from "@/lib/policies/application-policy";
import { getTeacherDocumentAccessPath } from "@/lib/storage";
import { canViewContactDetails } from "@/lib/subscription";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(["SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id: jobId } = await params;

    // Verify the job belongs to this school admin
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      select: { postedBy: true, schoolId: true },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }
    const schoolProfileId = auth.user.role === "SCHOOL_ADMIN"
      ? await getSchoolProfileIdForUser(prisma, auth.user.id)
      : null;
    if (!canManageJob(auth.user, { postedBy: job.postedBy, schoolId: job.schoolId }, schoolProfileId)) {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
    }

    // ADMIN always gets contact details; schools need Growth+ plan
    const contactAllowed = auth.user.role === "ADMIN" || await canViewContactDetails(auth.user.id);

    const applications = await prisma.application.findMany({
      where: { jobId },
      include: {
        screeningAnswers: {
          include: {
            question: {
              select: { id: true, question: true, required: true, sortOrder: true },
            },
          },
        },
        applicant: {
          select: {
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            teacherProfile: {
              select: {
                qualification: true,
                experience: true,
                currentSchool: true,
                city: true,
                demoVideoUrl: true,
                lessonPlanUrl: true,
              },
            },
          },
        },
      },
      orderBy: { appliedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: applications.map((application) => ({
        ...application,
        applicant: {
          ...application.applicant,
          // Contact details gated to Growth+ plan
          phone: contactAllowed ? application.applicant.phone : null,
          whatsappNumber: (application.applicant as any).whatsappNumber
            ? contactAllowed ? (application.applicant as any).whatsappNumber : null
            : null,
          contactHidden: !contactAllowed,
          teacherProfile: application.applicant.teacherProfile
            ? {
                ...application.applicant.teacherProfile,
                demoVideoUrl: application.applicant.teacherProfile.demoVideoUrl
                  ? getTeacherDocumentAccessPath("demo-video", application.applicantId)
                  : null,
                lessonPlanUrl: application.applicant.teacherProfile.lessonPlanUrl
                  ? getTeacherDocumentAccessPath("lesson-plan", application.applicantId)
                  : null,
              }
            : null,
        },
      })),
      meta: { contactHidden: !contactAllowed },
    });
  } catch (error) {
    console.error("GET /api/jobs/[id]/applicants error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch applicants" }, { status: 500 });
  }
}
