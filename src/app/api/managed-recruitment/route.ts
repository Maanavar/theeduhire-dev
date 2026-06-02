import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendManagedRecruitmentNotification } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/security";
import {
  MANAGED_RECRUITMENT_IP_LIMIT,
  MANAGED_RECRUITMENT_RATE_LIMIT_WINDOW_MS,
} from "@/config/constants";

const schema = z.object({
  contactName: z.string().min(2).max(100),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(7).max(20),
  schoolName: z.string().min(2).max(200),
  jobTitle: z.string().min(2).max(200),
  jobDescription: z.string().min(30).max(5000),
  requirementsText: z.string().max(2000).optional(),
  salaryBudgetMin: z.number().int().positive().optional().nullable(),
  salaryBudgetMax: z.number().int().positive().optional().nullable(),
  targetJoinDate: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateLimit = await checkRateLimit({
      key: `managed-recruitment:${clientIp}`,
      action: "managed-recruitment.submit",
      actorKey: clientIp,
      limit: MANAGED_RECRUITMENT_IP_LIMIT,
      windowMs: MANAGED_RECRUITMENT_RATE_LIMIT_WINDOW_MS,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid form data", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      contactName,
      contactEmail,
      contactPhone,
      schoolName,
      jobTitle,
      jobDescription,
      requirementsText,
      salaryBudgetMin,
      salaryBudgetMax,
      targetJoinDate,
    } = parsed.data;

    const targetDate = targetJoinDate ? new Date(targetJoinDate) : null;

    await prisma.managedRecruitmentRequest.create({
      data: {
        contactName,
        contactEmail,
        contactPhone,
        schoolName,
        jobTitle,
        jobDescription,
        requirementsText: requirementsText ?? null,
        salaryBudgetMin: salaryBudgetMin ?? null,
        salaryBudgetMax: salaryBudgetMax ?? null,
        targetJoinDate: targetDate,
      },
    });

    await sendManagedRecruitmentNotification({
      contactName,
      contactEmail,
      contactPhone,
      schoolName,
      jobTitle,
      jobDescription,
      salaryBudgetMin,
      salaryBudgetMax,
      targetJoinDate: targetDate
        ? targetDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
        : null,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/managed-recruitment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit request. Please try again." },
      { status: 500 }
    );
  }
}
