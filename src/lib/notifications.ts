import { prisma } from "@/lib/prisma";

type NotificationType = "GENERAL" | "APPLICATION" | "INTERVIEW" | "MESSAGE" | "SYSTEM";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
}

export async function createNotification(input: CreateNotificationInput, tx?: any) {
  const db = tx ?? prisma;
  return db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      payload: input.payload ?? {},
    },
  });
}

// Notify teacher when their application status changes
export async function notifyApplicationStatusChange(opts: {
  teacherId: string;
  jobTitle: string;
  schoolName: string;
  toStatus: string;
  applicationId: string;
  jobId: string;
  rejectionReason?: string | null;
}, tx?: any) {
  const statusMessages: Record<string, { title: string; body: string }> = {
    REVIEWED: {
      title: "Application reviewed",
      body: `${opts.schoolName} reviewed your application for ${opts.jobTitle}.`,
    },
    SHORTLISTED: {
      title: "You've been shortlisted!",
      body: `Great news — ${opts.schoolName} shortlisted you for ${opts.jobTitle}.`,
    },
    INTERVIEW_SCHEDULED: {
      title: "Interview scheduled",
      body: `${opts.schoolName} has scheduled an interview for ${opts.jobTitle}. Check your interviews page.`,
    },
    INTERVIEW_COMPLETED: {
      title: "Interview completed",
      body: `Your interview with ${opts.schoolName} for ${opts.jobTitle} has been marked complete.`,
    },
    REJECTED: {
      title: "Application update",
      body: opts.rejectionReason
        ? `${opts.schoolName} passed on your application for ${opts.jobTitle}: ${opts.rejectionReason}`
        : `${opts.schoolName} has moved forward with other candidates for ${opts.jobTitle}.`,
    },
    HIRED: {
      title: "Congratulations! You're hired",
      body: `${opts.schoolName} has marked you as hired for ${opts.jobTitle}. Welcome aboard!`,
    },
  };

  const msg = statusMessages[opts.toStatus];
  if (!msg) return;

  return createNotification(
    {
      userId: opts.teacherId,
      type: "APPLICATION",
      title: msg.title,
      body: msg.body,
      payload: { applicationId: opts.applicationId, jobId: opts.jobId },
    },
    tx
  );
}

// Notify teacher when an interview is scheduled
export async function notifyInterviewScheduled(opts: {
  teacherId: string;
  jobTitle: string;
  schoolName: string;
  scheduledAt: Date;
  interviewType: string;
  applicationId: string;
  interviewId: string;
}, tx?: any) {
  const dateStr = opts.scheduledAt.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const typeLabel = opts.interviewType === "VIDEO" ? "video call" : opts.interviewType === "PHONE" ? "phone call" : "in-person interview";

  return createNotification(
    {
      userId: opts.teacherId,
      type: "INTERVIEW",
      title: "Interview scheduled",
      body: `${opts.schoolName} has scheduled a ${typeLabel} for ${opts.jobTitle} on ${dateStr}.`,
      payload: { interviewId: opts.interviewId, applicationId: opts.applicationId },
    },
    tx
  );
}

// Notify school when a teacher applies
export async function notifyNewApplication(opts: {
  schoolUserId: string;
  teacherName: string;
  jobTitle: string;
  applicationId: string;
  jobId: string;
}, tx?: any) {
  return createNotification(
    {
      userId: opts.schoolUserId,
      type: "APPLICATION",
      title: "New application",
      body: `${opts.teacherName} applied for ${opts.jobTitle}.`,
      payload: { applicationId: opts.applicationId, jobId: opts.jobId },
    },
    tx
  );
}

// Notify teacher when their profile gets viewed by a school (only if they have profile views feature)
export async function notifyProfileViewedBySchool(opts: {
  teacherId: string;
  schoolName: string;
  viewerUserId: string;
}, tx?: any) {
  return createNotification(
    {
      userId: opts.teacherId,
      type: "GENERAL",
      title: "Someone viewed your profile",
      body: `${opts.schoolName} looked at your teacher profile.`,
      payload: { viewerUserId: opts.viewerUserId },
    },
    tx
  );
}
