// POST /api/alerts/send
// Background job to send daily/weekly alert digests
// Should be called by a cron job (e.g., 8 AM daily)
// For testing: can be called manually
// No auth required (call from backend/cron only)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendJobAlertDigest } from "@/lib/email";

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Find active alerts that should be sent today
    const isMonday = dayOfWeek === 1;
    const alerts = await prisma.jobAlert.findMany({
      where: {
        isActive: true,
        OR: [
          { frequency: "DAILY_DIGEST" },
          // Send weekly digest on Mondays only
          ...(isMonday ? [{ frequency: "WEEKLY_DIGEST" }] : []),
        ],
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    let sentCount = 0;
    let errorCount = 0;

    for (const alert of alerts) {
      try {
        // Build job filter query
        const jobFilter: any = {
          status: "ACTIVE",
          postedAt: {
            // Get jobs posted in last 24 hours for daily, last 7 days for weekly
            gte: new Date(now.getTime() - (alert.frequency === "DAILY_DIGEST" ? 24 : 7 * 24) * 60 * 60 * 1000),
          },
        };

        if (alert.subject) jobFilter.subject = alert.subject;
        if (alert.city) jobFilter.school = { city: alert.city };
        if (alert.board) jobFilter.board = alert.board;
        if (alert.gradeLevel) jobFilter.gradeLevel = alert.gradeLevel;
        if (alert.jobType) jobFilter.jobType = alert.jobType;

        if (alert.salaryMin || alert.salaryMax) {
          jobFilter.AND = [];
          if (alert.salaryMin) {
            jobFilter.AND.push({ salaryMax: { gte: alert.salaryMin } });
          }
          if (alert.salaryMax) {
            jobFilter.AND.push({ salaryMin: { lte: alert.salaryMax } });
          }
        }

        // Find matching jobs
        const jobs = await prisma.jobPosting.findMany({
          where: jobFilter,
          include: {
            school: {
              select: { schoolName: true, city: true },
            },
          },
          take: 20, // limit to 20 jobs per email
        });

        if (jobs.length === 0) {
          // No matching jobs, skip this alert
          continue;
        }

        // Format jobs for email
        const jobsForEmail = jobs.map((job: any) => ({
          id: job.id,
          title: job.title,
          subject: job.subject,
          city: job.school.city,
          schoolName: job.school.schoolName,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          description: job.description,
        }));

        // Send email
        await sendJobAlertDigest({
          teacherEmail: alert.user.email,
          alertName: alert.name,
          jobs: jobsForEmail,
          frequency: alert.frequency,
        });

        // Log to AlertHistory
        await prisma.alertHistory.create({
          data: {
            alertId: alert.id,
            jobIds: jobs.map((j: any) => j.id),
          },
        });

        sentCount++;
      } catch (error) {
        console.error(`Failed to send alert ${alert.id}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sentCount} alerts, ${errorCount} errors`,
      data: { sentCount, errorCount, totalAlerts: alerts.length },
    });
  } catch (error) {
    console.error("POST /api/alerts/send error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send alerts" },
      { status: 500 }
    );
  }
}
