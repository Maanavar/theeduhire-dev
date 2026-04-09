import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateInterviewSchema } from "@/lib/validators/interview";
import { sendInterviewConfirmation, sendInterviewCancellation } from "@/lib/email";

/**
 * PATCH /api/interviews/[id]
 * Update interview status (confirm, cancel, complete, no-show)
 * Requires: SCHOOL_ADMIN (can set status), TEACHER (can confirm/decline), or ADMIN
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const { id } = await params;
    const body = await req.json();

    // Validate input
    const parsed = updateInterviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request data" },
        { status: 400 }
      );
    }

    const { status, teacherNotes, schoolNotes } = parsed.data;

    // Get interview with related data
    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            job: { include: { school: true, poster: true } },
            applicant: true,
          },
        },
      },
    });

    if (!interview) {
      return NextResponse.json(
        { success: false, error: "Interview not found" },
        { status: 404 }
      );
    }

    // Permission checks
    const isTeacher = user.role === "TEACHER" && user.id === interview.application.applicantId;
    const isSchoolAdmin =
      user.role === "SCHOOL_ADMIN" &&
      (await prisma.schoolProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      }))?.id === interview.application.job.schoolId;
    const isAdmin = user.role === "ADMIN";

    if (!isTeacher && !isSchoolAdmin && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Teachers can only CONFIRM or decline; schools/admins can set any status
    if (isTeacher && !["CONFIRMED", "CANCELLED"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Teachers can only confirm or decline interviews" },
        { status: 400 }
      );
    }

    // Update interview
    const updatedInterview = await prisma.interview.update({
      where: { id },
      data: {
        status,
        teacherNotes: teacherNotes || interview.teacherNotes,
        schoolNotes: schoolNotes || interview.schoolNotes,
      },
      include: {
        application: {
          include: {
            job: { include: { school: true, poster: true } },
            applicant: true,
          },
        },
      },
    });

    // Send confirmation emails based on status change
    if (status === "CONFIRMED" && isTeacher) {
      // Teacher confirmed → notify school
      sendInterviewConfirmation({
        schoolEmail: interview.application.job.poster.email,
        schoolName: interview.application.job.school.schoolName,
        teacherName: interview.application.applicant.name,
        jobTitle: interview.application.job.title,
        scheduledAt: interview.scheduledAt,
      }).catch((err) => console.error("[Confirmation Email Error]", err));
    } else if (status === "CANCELLED") {
      // Interview cancelled → notify both parties
      sendInterviewCancellation({
        email: interview.application.applicant.email,
        recipientName: interview.application.applicant.name,
        candidateName: interview.application.applicant.name,
        jobTitle: interview.application.job.title,
        schoolName: interview.application.job.school.schoolName,
        reason: teacherNotes,
      }).catch((err) => console.error("[Cancellation Email Error]", err));

      sendInterviewCancellation({
        email: interview.application.job.poster.email,
        recipientName: interview.application.job.school.schoolName,
        candidateName: interview.application.applicant.name,
        jobTitle: interview.application.job.title,
        schoolName: interview.application.job.school.schoolName,
        reason: schoolNotes,
      }).catch((err) => console.error("[Cancellation Email Error]", err));
    }

    return NextResponse.json({
      success: true,
      data: updatedInterview,
    });
  } catch (error) {
    console.error("[Update Interview Error]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update interview" },
      { status: 500 }
    );
  }
}
