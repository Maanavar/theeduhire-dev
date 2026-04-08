// PATCH /api/jobs/[id]/status — Open, close, or draft a job listing
// Auth: SCHOOL_ADMIN + owner, or ADMIN

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { z } from "zod";
// import { JobStatus } from "@prisma/client";

const schema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED", "EXPIRED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(["SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const job = await prisma.jobPosting.findUnique({
      where: { id },
      select: { postedBy: true },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }
    if (job.postedBy !== auth.user.id && auth.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
    }

    const updated = await prisma.jobPosting.update({
      where: { id },
      data: { status: parsed.data.status },
      select: { id: true, status: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH /api/jobs/[id]/status error:", error);
    return NextResponse.json({ success: false, error: "Failed to update job status" }, { status: 500 });
  }
}
