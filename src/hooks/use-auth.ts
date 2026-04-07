// Auth hook wrapping NextAuth's useSession
// Adds typed role checking and redirect helpers

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@prisma/client";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const user = session?.user ?? null;
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  const isRole = (...roles: UserRole[]) =>
    !!user && roles.includes(user.role as UserRole);

  const isTeacher = isRole("TEACHER");
  const isSchool = isRole("SCHOOL_ADMIN");
  const isAdmin = isRole("ADMIN");

  const requireAuth = (redirectTo = "/auth/signin") => {
    if (!isLoading && !isAuthenticated) {
      router.push(`${redirectTo}?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return false;
    }
    return true;
  };

  const logout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return { user, session, status, isLoading, isAuthenticated, isTeacher, isSchool, isAdmin, isRole, requireAuth, logout };
}
