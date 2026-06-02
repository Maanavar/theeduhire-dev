// POST /api/cron/cleanup
// Purge stale rate-limit events and expired idempotency keys to prevent unbounded table growth.
// Schedule: daily at 2 AM (see vercel.json).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CRON_SECRET = process.env.CRON_SECRET;

function isCronAuthorized(req: NextRequest): boolean {
  if (!CRON_SECRET) return false;
  return req.headers.get("x-cron-secret") === CRON_SECRET;
}

export async function POST(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = prisma as any;
  const now = new Date();

  // Keep rate-limit events for 7 days (longest window any endpoint uses).
  const rateLimitCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const { count: deletedRateLimit } = await db.rateLimitEvent.deleteMany({
    where: { createdAt: { lt: rateLimitCutoff } },
  });

  // Idempotency keys expire after 24 hours by convention.
  const idempotencyCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const { count: deletedIdempotency } = await db.idempotencyKey.deleteMany({
    where: { createdAt: { lt: idempotencyCutoff } },
  });

  return NextResponse.json({
    success: true,
    deletedRateLimitEvents: deletedRateLimit,
    deletedIdempotencyKeys: deletedIdempotency,
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
