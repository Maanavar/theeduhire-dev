import type { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";

function safeEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authorization = req.headers.get("authorization") || "";
  const bearerToken = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
  const legacyHeaderToken = req.headers.get("x-cron-secret") || "";

  return safeEquals(bearerToken, secret) || safeEquals(legacyHeaderToken, secret);
}
