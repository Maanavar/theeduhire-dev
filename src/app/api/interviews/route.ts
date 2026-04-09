import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { scheduleInterviewSchema } from "@/lib/validators/interview";
import { sendInterviewInvite, sendNewApplicationAlert } from "@/lib/email";
import { createEvent } from "ics";

/**
 * POST /api/interviews
 * Schedule an interview for an application
 * Requires: SCHOOL_ADMIN (owner of job) or ADMIN
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(["SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const body = await req.json();

    // Validate input
    const parsed = scheduleInterviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request data" },
        { status: 400 }
      );
    }

    const { applicationId, scheduledAt, durationMins, type, meetingLink, location } = parsed.data;

    // Get application with job and applicant details
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: { school: true, poster: true },
        },
        applicant: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    // Permission check: SCHOOL_ADMIN must own the job
    if (user.role === "SCHOOL_ADMIN") {
      const schoolProfile = await prisma.schoolProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!schoolProfile || schoolProfile.id !== application.job.schoolId) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 403 }
        );
      }
    }

    // Create interview record
    const interview = await prisma.interview.create({
      data: {
        applicationId,
        scheduledAt: new Date(scheduledAt),
        durationMins,
        type,
        meetingLink: meetingLink || null,
        location: location || null,
      },
      include: {
        application: {
          include: {
            job: { include: { school: true } },
            applicant: true,
          },
        },
      },
    });

    // Update application status to INTERVIEW_SCHEDULED
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: "INTERVIEW_SCHEDULED" },
    });

    // Generate .ics calendar file
    let icsBuffer: Buffer | undefined;
    try {
      const event = createEvent({
        title: `Interview: ${application.job.title}`,
        description: `Interview with ${application.job.school.schoolName} for ${application.job.title} position`,
        start: [
          new Date(scheduledAt).getUTCFullYear(),
          new Date(scheduledAt).getUTCMonth() + 1,
          new Date(scheduledAt).getUTCDate(),
          new Date(scheduledAt).getUTCHours(),
          new Date(scheduledAt).getUTCMinutes(),
        ] as [number, number, number, number, number],
        duration: { minutes: durationMins },
        location: location || (type === "VIDEO" && meetingLink ? meetingLink : "To be confirmed"),
        url: meetingLink || undefined,
      });

      if (event.error) {
        console.error("[ICS Generation Error]", event.error);
      } else if (event.value) {
        icsBuffer = Buffer.from(event.value);
      }
    } catch (err) {
      console.error("[ICS Creation Error]", err);
      // Continue without ICS if generation fails
    }

    // Send interview invite email to teacher (non-blocking)
    sendInterviewInvite({
      teacherEmail: application.applicant.email,
      teacherName: application.applicant.name,
      jobTitle: application.job.title,
      schoolName: application.job.school.schoolName,
      scheduledAt: new Date(scheduledAt),
      interviewType: type,
      meetingLink: meetingLink || null,
      location: location || null,
      icsData: icsBuffer,
    }).catch((err) => console.error("[Interview Invite Email Error]", err));

    // Send notification to school
    sendNewApplicationAlert({
      schoolEmail: application.job.poster.email,
      schoolName: application.job.school.schoolName,
      teacherName: application.applicant.name,
      jobTitle: `Interview scheduled: ${application.job.title}`,
      jobId: application.job.id,
    }).catch((err) => console.error("[Interview Notification Email Error]", err));

    return NextResponse.json({
      success: true,
      data: interview,
    });
  } catch (error) {
    console.error("[Schedule Interview Error]", error);
    return NextResponse.json(
      { success: false, error: "Failed to schedule interview" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/interviews
 * List interviews scoped by role
 * Teachers see their interviews, schools see their job's interviews, admins see all
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { user } = auth;

    let interviews;

    if (user.role === "TEACHER") {
      // Get teacher's interviews (for their applications)
      interviews = await prisma.interview.findMany({
        where: {
          application: {
            applicantId: user.id,
          },
        },
        include: {
          application: {
            include: {
              job: { include: { school: true } },
            },
          },
        },
        orderBy: { scheduledAt: "asc" },
      });
    } else if (user.role === "SCHOOL_ADMIN") {
      // Get school's interviews (for their jobs)
      const schoolProfile = await prisma.schoolProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!schoolProfile) {
        return NextResponse.json(
          { success: false, error: "School profile not found" },
          { status: 404 }
        );
      }

      interviews = await prisma.interview.findMany({
        where: {
          application: {
            job: {
              schoolId: schoolProfile.id,
            },
          },
        },
        include: {
          application: {
            include: {
              job: { include: { school: true } },
              applicant: true,
            },
          },
        },
        orderBy: { scheduledAt: "asc" },
      });
    } else {
      // ADMIN: see all interviews
      interviews = await prisma.interview.findMany({
        include: {
          application: {
            include: {
              job: { include: { school: true } },
              applicant: true,
            },
          },
        },
        orderBy: { scheduledAt: "asc" },
      });
    }

    return NextResponse.json({
      success: true,
      data: interviews,
    });
  } catch (error) {
    console.error("[Get Interviews Error]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch interviews" },
      { status: 500 }
    );
  }
}
