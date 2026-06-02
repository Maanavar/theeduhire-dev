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
  const now = new Date();
  const windowStart = new Date(now.getTime() - input.windowMs);

  // Count existing events in the window first, without creating a new one.
  const count = await db.rateLimitEvent.count({
    where: {
      key: input.key,
      createdAt: { gte: windowStart },
    },
  });

  const allowed = count < input.limit;

  // Only record the event when the request is allowed — denied requests must
  // not write rows, otherwise the table grows unbounded on hammered endpoints.
  if (allowed) {
    await db.rateLimitEvent.create({
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
}
