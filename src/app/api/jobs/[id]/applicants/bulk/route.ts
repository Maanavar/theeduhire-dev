import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { bulkStatusUpdateSchema } from "@/lib/validators/application";
import { publishDomainEvent } from "@/lib/domain-events";
import { canManageJob } from "@/lib/policies/job-policy";
import { getSchoolProfileIdForUser } from "@/lib/policies/application-policy";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(["SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id: jobId } = await params;
    const body = await req.json();
    const parsed = bulkStatusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    // Verify job ownership
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      select: {
        postedBy: true,
        schoolId: true,
        title: true,
        school: { select: { schoolName: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    const schoolProfileId = auth.user.role === "SCHOOL_ADMIN"
      ? await getSchoolProfileIdForUser(prisma, auth.user.id)
      : null;
    if (!canManageJob(auth.user, { postedBy: job.postedBy, schoolId: job.schoolId }, schoolProfileId)) {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
    }

    // Verify all application IDs belong to this job
    const applicationsToUpdate = await prisma.application.findMany({
      where: {
        id: { in: parsed.data.applicationIds },
        jobId: jobId,
      },
      select: {
        id: true,
        applicantId: true,
        status: true,
      },
    });

    if (applicationsToUpdate.length !== parsed.data.applicationIds.length) {
      return NextResponse.json(
        { success: false, error: "Some applications don't belong to this job" },
        { status: 400 }
      );
    }

    // Atomic transaction: update all applications + create history entries
    const historyEntries = applicationsToUpdate.map((app) => ({
      applicationId: app.id,
      fromStatus: app.status,
      toStatus: parsed.data.status,
      changedBy: auth.user.id,
      note: parsed.data.note,
      rejectionReason: parsed.data.rejectionReason ?? undefined,
    }));

    await prisma.$transaction(async (tx: any) => {
      await tx.application.updateMany({
        where: {
          id: { in: parsed.data.applicationIds },
        },
        data: {
          status: parsed.data.status,
          rejectionReason: parsed.data.rejectionReason ?? undefined,
          reviewedAt: new Date(),
        },
      });

      for (const entry of historyEntries) {
        await tx.applicationStatusHistory.create({ data: entry });
      }

      for (const app of applicationsToUpdate) {
        await publishDomainEvent(tx, {
          eventType: "application_status_changed",
          aggregateType: "application",
          aggregateId: app.id,
          actorId: auth.user.id,
          payload: {
            applicationId: app.id,
            jobId,
            applicantId: app.applicantId,
            fromStatus: app.status,
            toStatus: parsed.data.status,
            rejectionReason: parsed.data.rejectionReason ?? null,
            note: parsed.data.note ?? null,
          },
          metadata: {
            source: "api.jobs.applicants.bulk",
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        updated: applicationsToUpdate.length,
        failed: parsed.data.applicationIds.length - applicationsToUpdate.length,
      },
    });
  } catch (error) {
    console.error("POST /api/jobs/[id]/applicants/bulk error:", error);
    return NextResponse.json({ success: false, error: "Failed to update applications" }, { status: 500 });
  }
}
