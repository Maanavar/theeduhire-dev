import { prisma } from "@/lib/prisma";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

type RateLimitInput = {
  key: string;
  action: string;
  limit: number;
  windowMs: number;
  actorKey?: string | null;
};

const db = prisma as any;

export async function checkRateLimit(input: RateLimitInput): Promise<RateLimitResult> {
  return db.$transaction(async (tx: any) => {
    const now = new Date();
    const windowStart = new Date(now.getTime() - input.windowMs);

    // Serialize count+insert per key so concurrent bursts cannot all pass.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.key}))`;

    const count = await tx.rateLimitEvent.count({
      where: {
        key: input.key,
        createdAt: { gte: windowStart },
      },
    });

    const allowed = count < input.limit;

    // Only record allowed requests so denied traffic cannot grow the table.
    if (allowed) {
      await tx.rateLimitEvent.create({
        data: {
          key: input.key,
          action: input.action,
          actorKey: input.actorKey || null,
        },
      });
    }

    return {
      allowed,
      remaining: Math.max(0, input.limit - count - (allowed ? 1 : 0)),
      resetAt: now.getTime() + input.windowMs,
    };
  });
}
