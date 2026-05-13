import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { updateApplicationStatusSchema } from "@/lib/validators/application";
import { canManageApplication } from "@/lib/policies/application-policy";
import {
  beginIdempotentRequest,
  completeIdempotentRequest,
  getIdempotencyKey,
  releaseIdempotentRequest,
  stableHash,
} from "@/lib/idempotency";
import { publishDomainEvent } from "@/lib/domain-events";
import { cacheTags } from "@/lib/cache-tags";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let idempotencyRecordId: string | null = null;

  try {
    const auth = await requireAuth(["SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = updateApplicationStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const requestHash = stableHash({
      applicationId: id,
      status: parsed.data.status,
      schoolNotes: parsed.data.schoolNotes ?? null,
      rejectionReason: parsed.data.rejectionReason ?? null,
      note: parsed.data.note ?? null,
    });
    const idempotency = await beginIdempotentRequest(prisma, {
      scope: "applications.status",
      actorKey: auth.user.id,
      key: getIdempotencyKey(req.headers.get("idempotency-key"), requestHash),
      requestHash,
    });

    if (idempotency.kind === "replay") {
      return NextResponse.json(idempotency.responseBody, { status: idempotency.responseStatus });
    }

    if (idempotency.kind === "conflict") {
      return NextResponse.json({ success: false, error: idempotency.error }, { status: idempotency.status });
    }

    idempotencyRecordId = idempotency.recordId;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            postedBy: true,
            schoolId: true,
            school: { select: { schoolName: true } },
          },
        },
        applicant: {
          select: { email: true, name: true },
        },
      },
    });

    if (!application) {
      const responseBody = { success: false, error: "Application not found" };
      await completeIdempotentRequest(prisma, idempotency.recordId, 404, responseBody);
      return NextResponse.json(responseBody, { status: 404 });
    }

    const authorized = await canManageApplication(prisma, auth.user, {
      job: {
        postedBy: application.job.postedBy,
        schoolId: application.job.schoolId,
      },
    });
    if (!authorized) {
      const responseBody = { success: false, error: "Not authorized" };
      await completeIdempotentRequest(prisma, idempotency.recordId, 403, responseBody);
      return NextResponse.json(responseBody, { status: 403 });
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      const nextApplication = await tx.application.update({
        where: { id },
        data: {
          status: parsed.data.status,
          schoolNotes: parsed.data.schoolNotes ?? application.schoolNotes,
          rejectionReason: parsed.data.rejectionReason ?? undefined,
          reviewedAt: application.reviewedAt ?? new Date(),
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: id,
          fromStatus: application.status,
          toStatus: parsed.data.status,
          changedBy: auth.user.id,
          note: parsed.data.note,
          rejectionReason: parsed.data.rejectionReason ?? undefined,
        },
      });

      await publishDomainEvent(tx, {
        eventType: "application_status_changed",
        aggregateType: "application",
        aggregateId: application.id,
        actorId: auth.user.id,
        payload: {
          applicationId: application.id,
          jobId: application.job.id,
          applicantId: application.applicantId,
          fromStatus: application.status,
          toStatus: parsed.data.status,
          rejectionReason: parsed.data.rejectionReason ?? null,
          note: parsed.data.note ?? null,
        },
        metadata: {
          source: "api.applications.status",
        },
      });

      return nextApplication;
    });

    const responseBody = { success: true, data: updated };
    await completeIdempotentRequest(prisma, idempotency.recordId, 200, responseBody);
    revalidateTag(cacheTags.schoolAnalytics(application.job.schoolId));

    return NextResponse.json(responseBody);
  } catch (error) {
    if (idempotencyRecordId) {
      await releaseIdempotentRequest(prisma, idempotencyRecordId);
    }
    console.error("PATCH /api/applications/[id]/status error:", error);
    return NextResponse.json({ success: false, error: "Failed to update status" }, { status: 500 });
  }
}
