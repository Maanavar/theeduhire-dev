// POST /api/cron/interview-reminders
// Send day-of (morning) and 1-hour-before in-app notifications for upcoming interviews.
// Deduplicates by tracking sentAt columns on the Interview row.
// Call this endpoint every 30-60 minutes from a cron (Vercel Cron / external scheduler).
// Secured with CRON_SECRET.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isCronAuthorized } from "@/lib/cron-auth";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

export async function POST(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Window: interviews in the next 25 hours that haven't had their day reminder sent
  const dayWindowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);
  const dayWindowStart = new Date(now.getTime() + 12 * 60 * 60 * 1000); // at least 12h away

  // Window: interviews in the next 70 minutes that haven't had their hour reminder sent
  const hourWindowEnd = new Date(now.getTime() + 70 * 60 * 1000);
  const hourWindowStart = new Date(now.getTime() + 30 * 60 * 1000); // at least 30min away

  const [dayInterviews, hourInterviews] = await Promise.all([
    prisma.interview.findMany({
      where: {
        scheduledAt: { gte: dayWindowStart, lte: dayWindowEnd },
        dayReminderSentAt: null,
        status: { not: "CANCELLED" as any },
      },
      include: {
        application: {
          include: {
            applicant: { select: { id: true, name: true } },
            job: {
              select: {
                title: true,
                school: { select: { schoolName: true } },
                poster: { select: { id: true } },
              },
            },
          },
        },
      },
    }),
    prisma.interview.findMany({
      where: {
        scheduledAt: { gte: hourWindowStart, lte: hourWindowEnd },
        hourReminderSentAt: null,
        status: { not: "CANCELLED" as any },
      },
      include: {
        application: {
          include: {
            applicant: { select: { id: true, name: true } },
            job: {
              select: {
                title: true,
                school: { select: { schoolName: true } },
                poster: { select: { id: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  let sent = 0;

  for (const interview of dayInterviews) {
    const { application } = interview;
    const teacherId = application.applicant.id;
    const schoolAdminId = application.job.poster?.id;
    const jobTitle = application.job.title;
    const schoolName = application.job.school.schoolName;
    const time = formatTime(interview.scheduledAt);
    const date = formatDate(interview.scheduledAt);

    const notifications: Array<{ userId: string; type: "INTERVIEW"; title: string; body: string; payload: object }> = [
      {
        userId: teacherId,
        type: "INTERVIEW",
        title: `Interview tomorrow — ${jobTitle}`,
        body: `Your interview with ${schoolName} is on ${date} at ${time}. Make sure you're ready!`,
        payload: { interviewId: interview.id },
      },
    ];

    if (schoolAdminId) {
      notifications.push({
        userId: schoolAdminId,
        type: "INTERVIEW",
        title: `Interview tomorrow — ${application.applicant.name}`,
        body: `Interview for ${jobTitle} scheduled on ${date} at ${time}.`,
        payload: { interviewId: interview.id },
      });
    }

    await prisma.$transaction([
      prisma.notification.createMany({ data: notifications }),
      prisma.interview.update({
        where: { id: interview.id },
        data: { dayReminderSentAt: now },
      }),
    ]);

    sent++;
  }

  for (const interview of hourInterviews) {
    const { application } = interview;
    const teacherId = application.applicant.id;
    const schoolAdminId = application.job.poster?.id;
    const jobTitle = application.job.title;
    const schoolName = application.job.school.schoolName;
    const time = formatTime(interview.scheduledAt);

    const notifications: Array<{ userId: string; type: "INTERVIEW"; title: string; body: string; payload: object }> = [
      {
        userId: teacherId,
        type: "INTERVIEW",
        title: `Interview in ~1 hour — ${jobTitle}`,
        body: `Your interview with ${schoolName} starts around ${time}. Best of luck!`,
        payload: { interviewId: interview.id },
      },
    ];

    if (schoolAdminId) {
      notifications.push({
        userId: schoolAdminId,
        type: "INTERVIEW",
        title: `Interview starting soon — ${application.applicant.name}`,
        body: `Interview for ${jobTitle} starts around ${time}. Joining link ready?`,
        payload: { interviewId: interview.id },
      });
    }

    await prisma.$transaction([
      prisma.notification.createMany({ data: notifications }),
      prisma.interview.update({
        where: { id: interview.id },
        data: { hourReminderSentAt: now },
      }),
    ]);

    sent++;
  }

  return NextResponse.json({
    success: true,
    sent,
    dayReminders: dayInterviews.length,
    hourReminders: hourInterviews.length,
  });
}

// Also support GET for simple health-check / Vercel Cron invocation
export async function GET(req: NextRequest) {
  return POST(req);
}
