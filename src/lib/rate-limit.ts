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

  const [count] = await Promise.all([
    db.rateLimitEvent.count({
      where: {
        key: input.key,
        createdAt: { gte: windowStart },
      },
    }),
    db.rateLimitEvent.create({
      data: {
        key: input.key,
        action: input.action,
        actorKey: input.actorKey || null,
      },
    }),
  ]);

  const nextCount = count + 1;
  return {
    allowed: nextCount <= input.limit,
    remaining: Math.max(0, input.limit - nextCount),
    resetAt: now.getTime() + input.windowMs,
  };
}
