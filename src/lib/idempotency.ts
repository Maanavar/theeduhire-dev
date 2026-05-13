import { createHash, randomUUID } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

type IdempotencyStatus = "PENDING" | "COMPLETED";

type IdempotencyRow = {
  id: string;
  request_hash: string;
  status: IdempotencyStatus;
  response_status: number | null;
  response_body: unknown;
};

export type BeginIdempotencyResult =
  | { kind: "started"; recordId: string; key: string }
  | { kind: "replay"; responseStatus: number; responseBody: unknown; key: string }
  | { kind: "conflict"; status: number; error: string; key: string };

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortValue((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }

  return value;
}

export function stableHash(value: unknown): string {
  return sha256(JSON.stringify(sortValue(value)));
}

export function getIdempotencyKey(rawKey: string | null | undefined, fallbackSeed: string): string {
  const normalized = rawKey?.trim();
  if (normalized) return normalized;
  return sha256(fallbackSeed);
}

export async function beginIdempotentRequest(
  db: DbClient,
  input: {
    scope: string;
    actorKey: string;
    key: string;
    requestHash: string;
  }
): Promise<BeginIdempotencyResult> {
  const inserted = await db.$queryRaw<Array<{ id: string }>>`
    INSERT INTO "idempotency_keys" (
      "id",
      "scope",
      "actor_key",
      "idempotency_key",
      "request_hash",
      "status",
      "created_at",
      "updated_at"
    )
    VALUES (
      ${randomUUID()}::uuid,
      ${input.scope},
      ${input.actorKey},
      ${input.key},
      ${input.requestHash},
      'PENDING',
      NOW(),
      NOW()
    )
    ON CONFLICT ("scope", "actor_key", "idempotency_key") DO NOTHING
    RETURNING "id"
  `;

  if (inserted.length > 0) {
    return { kind: "started", recordId: inserted[0].id, key: input.key };
  }

  const existing = await db.$queryRaw<IdempotencyRow[]>`
    SELECT
      "id",
      "request_hash",
      "status",
      "response_status",
      "response_body"
    FROM "idempotency_keys"
    WHERE
      "scope" = ${input.scope}
      AND "actor_key" = ${input.actorKey}
      AND "idempotency_key" = ${input.key}
    LIMIT 1
  `;

  const row = existing[0];
  if (!row) {
    return { kind: "conflict", status: 409, error: "Unable to establish idempotency state", key: input.key };
  }

  if (row.request_hash !== input.requestHash) {
    return { kind: "conflict", status: 409, error: "Idempotency key was already used for a different request", key: input.key };
  }

  if (row.status === "COMPLETED" && row.response_status) {
    return {
      kind: "replay",
      responseStatus: row.response_status,
      responseBody: row.response_body,
      key: input.key,
    };
  }

  return { kind: "conflict", status: 409, error: "A matching request is already being processed", key: input.key };
}

export async function completeIdempotentRequest(
  db: DbClient,
  recordId: string,
  responseStatus: number,
  responseBody: unknown
): Promise<void> {
  await db.$executeRaw`
    UPDATE "idempotency_keys"
    SET
      "status" = 'COMPLETED',
      "response_status" = ${responseStatus},
      "response_body" = ${JSON.stringify(responseBody)}::jsonb,
      "completed_at" = NOW(),
      "updated_at" = NOW()
    WHERE "id" = ${recordId}::uuid
  `;
}

export async function releaseIdempotentRequest(db: DbClient, recordId: string): Promise<void> {
  await db.$executeRaw`
    DELETE FROM "idempotency_keys"
    WHERE "id" = ${recordId}::uuid
      AND "status" = 'PENDING'
  `;
}
