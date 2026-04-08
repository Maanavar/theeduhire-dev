// POST /api/alerts — Create job alert
// GET /api/alerts — List all alerts for user
// Auth: TEACHER

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAlertSchema = z.object({
  name: z.string().min(1, "Alert name required"),
  subject: z.string().optional(),
  city: z.string().optional(),
  board: z.enum(["CBSE", "ICSE", "STATE_BOARD", "IB", "CAMBRIDGE", "OTHER"]).optional(),
  gradeLevel: z.string().optional(),
  jobType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "VISITING_FACULTY"]).optional(),
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
  frequency: z.enum(["IMMEDIATE", "DAILY_DIGEST", "WEEKLY_DIGEST"]).default("DAILY_DIGEST"),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(["TEACHER"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const parsed = createAlertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const alert = await prisma.jobAlert.create({
      data: {
        userId: auth.user.id,
        name: parsed.data.name,
        subject: parsed.data.subject || null,
        city: parsed.data.city || null,
        board: parsed.data.board as any || null,
        gradeLevel: parsed.data.gradeLevel || null,
        jobType: parsed.data.jobType as any || null,
        salaryMin: parsed.data.salaryMin || null,
        salaryMax: parsed.data.salaryMax || null,
        frequency: parsed.data.frequency as any,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: alert }, { status: 201 });
  } catch (error) {
    console.error("POST /api/alerts error:", error);
    return NextResponse.json({ success: false, error: "Failed to create alert" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(["TEACHER"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const alerts = await prisma.jobAlert.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: alerts });
  } catch (error) {
    console.error("GET /api/alerts error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch alerts" }, { status: 500 });
  }
}
