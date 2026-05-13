import type { NextRequest } from "next/server";
import { createHash, randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { PASSWORD_HASH_ROUNDS } from "@/config/constants";

export function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

export function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export function generateOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString("hex");
}

export function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  return hash(password, PASSWORD_HASH_ROUNDS);
}
