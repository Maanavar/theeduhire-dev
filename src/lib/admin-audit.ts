import { prisma } from "@/lib/prisma";

const db = prisma as any;

export type AdminAuditAction =
  // School
  | "school.approve" | "school.verify" | "school.unverify"
  | "school.reject" | "school.mark_pending"
  | "school.suspend" | "school.unsuspend"
  | "school.create" | "school.edit" | "school.delete"
  // Teacher
  | "teacher.approve" | "teacher.reject" | "teacher.mark_pending"
  | "teacher.revoke_badge" | "teacher.suspend" | "teacher.unsuspend"
  | "teacher.create" | "teacher.edit" | "teacher.delete"
  // Job
  | "job.close" | "job.activate" | "job.hide" | "job.show" | "job.delete"
  // Offline school
  | "offline_school.create" | "offline_school.edit" | "offline_school.delete"
  // Managed job
  | "managed_job.create" | "managed_job.edit" | "managed_job.delete" | "managed_job.status_change";

export type AdminAuditEntity = "school" | "teacher" | "job" | "offline_school" | "managed_job";

interface LogAdminActionParams {
  adminId: string;
  action: AdminAuditAction;
  entityType: AdminAuditEntity;
  entityId: string;
  entityLabel: string;
  reason?: string | null;
  notes?: string | null;
}

export async function logAdminAction({
  adminId,
  action,
  entityType,
  entityId,
  entityLabel,
  reason,
  notes,
}: LogAdminActionParams) {
  try {
    await db.domainEvent.create({
      data: {
        eventType: action,
        aggregateType: entityType,
        aggregateId: entityId,
        actorId: adminId,
        payload: {
          entityLabel,
          ...(reason ? { reason } : {}),
          ...(notes ? { notes } : {}),
        },
        metadata: { source: "admin_panel" },
      },
    });
  } catch {
    // Never let logging failure break the action
  }
}
