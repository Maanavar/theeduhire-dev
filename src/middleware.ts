import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Dashboard routes require authentication
    if (path.startsWith("/dashboard")) {
      if (!token) {
        const signInUrl = new URL("/auth/signin", req.url);
        signInUrl.searchParams.set("callbackUrl", path);
        return NextResponse.redirect(signInUrl);
      }

      // School-only routes
      const schoolRoutes = ["/dashboard/school", "/dashboard/post-job", "/dashboard/my-jobs"];
      if (schoolRoutes.some((r) => path.startsWith(r)) && token.role !== "SCHOOL_ADMIN" && token.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard/applications", req.url));
      }

      // Teacher-only routes
      const teacherRoutes = ["/dashboard/applications", "/dashboard/saved", "/dashboard/resumes", "/dashboard/alerts"];
      if (teacherRoutes.some((r) => path.startsWith(r)) && token.role !== "TEACHER" && token.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard/my-jobs", req.url));
      }
    }

    // Redirect authenticated users away from auth pages
    if (path.startsWith("/auth/") && token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Redirect authenticated users from home to dashboard
    if (path === "/" && token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Dashboard requires auth
        if (path.startsWith("/dashboard")) {
          return !!token;
        }

        // All other routes are public
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*", "/api/admin/:path*", "/admin/:path*"],
};
