import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import type { UserRole } from "@prisma/client";

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

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return { error: "Insufficient permissions", status: 403 as const };
  }

  return { user: session.user };
}
