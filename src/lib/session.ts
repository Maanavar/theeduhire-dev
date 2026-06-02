import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import type { UserRole } from "@prisma/client";
import { prisma } from "./prisma";

// Get typed session on server
export async function getSession() {
  return getServerSession(authOptions);
}

// Check if user is authenticated and has required role
export async function requireAuth(allowedRoles?: UserRole[]) {
  const session = await getSession();

  if (!session?.user) {
    return { error: "Authentication required", status: 401 as const };
  }

  // Enforce server-side session revocation checks for JWT sessions.
  const sessionToken = session.user.sessionToken;
  if (!sessionToken) {
    return { error: "Session is invalid. Please sign in again.", status: 401 as const };
  }

  const db = prisma as any;

  // Single round-trip: validate session + fetch suspension state together.
  const [activeSession, accountState] = await Promise.all([
    db.userSession.findFirst({
      where: { userId: session.user.id, sessionToken, revokedAt: null },
      select: { id: true },
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { isSuspended: true, suspendedUntil: true },
    }),
  ]);

  if (!activeSession) {
    return { error: "Session was revoked. Please sign in again.", status: 401 as const };
  }

  const suspensionActive =
    !!accountState?.isSuspended &&
    (!accountState.suspendedUntil || accountState.suspendedUntil.getTime() > Date.now());

  if (suspensionActive) {
    return { error: "Your account is temporarily unavailable. Please contact EduHire support.", status: 403 as const };
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return { error: "Insufficient permissions", status: 403 as const };
  }

  return { user: session.user };
}
