import { randomUUID } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

const EVENT_CONSUMERS: Record<string, string[]> = {
  application_created: ["notifications", "ai_match_refresh"],
  application_status_changed: ["notifications"],
  teacher_profile_updated: ["ai_match_refresh"],
  school_profile_updated: [],
  job_posted: ["ai_match_refresh"],
  job_updated: ["ai_match_refresh"],
};

export interface DomainEventInput {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  actorId?: string | null;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
}

export async function publishDomainEvent(db: DbClient, input: DomainEventInput): Promise<string> {
  const id = randomUUID();
  const occurredAt = input.occurredAt ?? new Date();
  const consumers = EVENT_CONSUMERS[input.eventType] ?? [];

  await db.$executeRaw`
    INSERT INTO "domain_events" (
      "id",
      "event_type",
      "aggregate_type",
      "aggregate_id",
      "actor_id",
      "payload",
      "metadata",
      "occurred_at",
      "created_at"
    )
    VALUES (
      ${id}::uuid,
      ${input.eventType},
      ${input.aggregateType},
      ${input.aggregateId},
      ${input.actorId ?? null}::uuid,
      ${JSON.stringify(input.payload)}::jsonb,
      ${JSON.stringify(input.metadata ?? null)}::jsonb,
      ${occurredAt}::timestamptz,
      NOW()
    )
  `;

  for (const consumerName of consumers) {
    await db.$executeRaw`
      INSERT INTO "domain_event_consumers" (
        "id",
        "event_id",
        "consumer_name",
        "status",
        "attempts",
        "created_at",
        "updated_at"
      )
      VALUES (
        ${randomUUID()}::uuid,
        ${id}::uuid,
        ${consumerName},
        'PENDING',
        0,
        NOW(),
        NOW()
      )
      ON CONFLICT ("event_id", "consumer_name") DO NOTHING
    `;
  }

  return id;
}
