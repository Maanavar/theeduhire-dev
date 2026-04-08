// PUT /api/alerts/[id] — Update alert
// DELETE /api/alerts/[id] — Delete alert
// Auth: TEACHER

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateAlertSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().optional(),
  city: z.string().optional(),
  board: z.enum(["CBSE", "ICSE", "STATE_BOARD", "IB", "CAMBRIDGE", "OTHER"]).optional(),
  gradeLevel: z.string().optional(),
  jobType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "VISITING_FACULTY"]).optional(),
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
  frequency: z.enum(["IMMEDIATE", "DAILY_DIGEST", "WEEKLY_DIGEST"]).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    const auth = await requireAuth(["TEACHER"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    // Check ownership
    const alert = await prisma.jobAlert.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!alert || alert.userId !== auth.user.id) {
      return NextResponse.json({ success: false, error: "Alert not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateAlertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.subject !== undefined) updateData.subject = parsed.data.subject || null;
    if (parsed.data.city !== undefined) updateData.city = parsed.data.city || null;
    if (parsed.data.board !== undefined) updateData.board = parsed.data.board || null;
    if (parsed.data.gradeLevel !== undefined) updateData.gradeLevel = parsed.data.gradeLevel || null;
    if (parsed.data.jobType !== undefined) updateData.jobType = parsed.data.jobType || null;
    if (parsed.data.salaryMin !== undefined) updateData.salaryMin = parsed.data.salaryMin || null;
    if (parsed.data.salaryMax !== undefined) updateData.salaryMax = parsed.data.salaryMax || null;
    if (parsed.data.frequency !== undefined) updateData.frequency = parsed.data.frequency;
    if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;

    const updated = await prisma.jobAlert.update({
      where: { id: resolvedParams.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/alerts/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to update alert" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    const auth = await requireAuth(["TEACHER"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    // Check ownership
    const alert = await prisma.jobAlert.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!alert || alert.userId !== auth.user.id) {
      return NextResponse.json({ success: false, error: "Alert not found" }, { status: 404 });
    }

    await prisma.jobAlert.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ success: true, message: "Alert deleted" });
  } catch (error) {
    console.error("DELETE /api/alerts/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete alert" }, { status: 500 });
  }
}
