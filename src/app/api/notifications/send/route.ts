// POST /api/notifications/send - internal notification router
// Delegates to email (Resend) - SMS/WhatsApp via MSG91 can be added later

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/session";
import { sendStatusUpdate, sendApplicationConfirmation } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { canManageApplication } from "@/lib/policies/application-policy";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  NOTIFICATION_SEND_RATE_LIMIT_WINDOW_MS,
  NOTIFICATION_SEND_USER_LIMIT,
} from "@/config/constants";

const applicationStatusSchema = z.enum([
  "PENDING",
  "REVIEWED",
  "SHORTLISTED",
  "REJECTED",
  "HIRED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_COMPLETED",
]);

const sendNotificationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("STATUS_CHANGED"),
    recipientId: z.string().uuid(),
    data: z.object({
      jobId: z.string().uuid(),
      status: applicationStatusSchema.optional(),
    }),
  }),
  z.object({
    type: z.literal("APPLICATION_RECEIVED"),
    recipientId: z.string().uuid(),
    data: z.object({
      jobId: z.string().uuid(),
    }),
  }),
]);

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN", "SCHOOL_ADMIN"]);
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const rateLimit = await checkRateLimit({
      key: `notifications.send:${auth.user.id}`,
      action: "notifications.send",
      actorKey: auth.user.id,
      limit: NOTIFICATION_SEND_USER_LIMIT,
      windowMs: NOTIFICATION_SEND_RATE_LIMIT_WINDOW_MS,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many notification requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = sendNotificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Invalid notification request" },
        { status: 400 }
      );
    }

    const { type, recipientId, data } = parsed.data;
    const application = await prisma.application.findUnique({
      where: {
        jobId_applicantId: {
          jobId: data.jobId,
          applicantId: recipientId,
        },
      },
      select: {
        status: true,
        applicant: { select: { email: true, name: true } },
        job: {
          select: {
            id: true,
            title: true,
            postedBy: true,
            schoolId: true,
            school: { select: { schoolName: true } },
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    }

    const authorized = await canManageApplication(prisma, auth.user, application);
    if (!authorized) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    if (type === "STATUS_CHANGED" && data.status && data.status !== application.status) {
      return NextResponse.json(
        { success: false, error: "Notification status does not match the current application status" },
        { status: 409 }
      );
    }

    switch (type) {
      case "STATUS_CHANGED":
        await sendStatusUpdate({
          teacherEmail: application.applicant.email,
          teacherName: application.applicant.name,
          jobTitle: application.job.title,
          schoolName: application.job.school.schoolName,
          newStatus: application.status,
          jobId: application.job.id,
        });
        break;
      case "APPLICATION_RECEIVED":
        await sendApplicationConfirmation({
          teacherEmail: application.applicant.email,
          teacherName: application.applicant.name,
          jobTitle: application.job.title,
          schoolName: application.job.school.schoolName,
          jobId: application.job.id,
        });
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/notifications/send error:", error);
    return NextResponse.json({ success: false, error: "Failed to send notification" }, { status: 500 });
  }
}
