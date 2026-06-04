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

const COMMON_PASSWORDS = new Set([
  "password",
  "password123",
  "qwerty123",
  "admin123",
  "letmein123",
  "welcome123",
  "changeme123",
  "eduhire123",
  "eduhire@123",
  "testpass123",
  "smoketest123",
]);

export function validatePasswordStrength(
  password: string,
  context: { email?: string | null; name?: string | null } = {}
): string | null {
  const normalized = password.trim();
  const lower = normalized.toLowerCase();

  if (normalized.length < 12) {
    return "Password must be at least 12 characters. Long passphrases are supported.";
  }

  if (normalized.length > 256) {
    return "Password must be 256 characters or fewer.";
  }

  if (COMMON_PASSWORDS.has(lower)) {
    return "Choose a less common password.";
  }

  if (/^(.)\1{11,}$/.test(normalized)) {
    return "Password cannot be a repeated single character.";
  }

  if (/^(?:1234567890|0123456789|qwertyuiop|abcdefghijklmnopqrstuvwxyz)/i.test(normalized)) {
    return "Password cannot start with a common sequence.";
  }

  const emailLocalPart = context.email?.split("@")[0]?.toLowerCase().trim();
  if (emailLocalPart && emailLocalPart.length >= 4 && lower.includes(emailLocalPart)) {
    return "Password cannot contain your email name.";
  }

  const nameParts = context.name?.toLowerCase().split(/\s+/).filter((part) => part.length >= 4) ?? [];
  if (nameParts.some((part) => lower.includes(part))) {
    return "Password cannot contain your name.";
  }

  return null;
}
