import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET() {
  try {
    const auth = await requireAuth(["TEACHER", "SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (auth.user.role === "TEACHER") {
      const apps = await prisma.application.findMany({
        where: { applicantId: auth.user.id },
        select: {
          job: { select: { school: { select: { user: { select: { id: true, name: true, role: true } }, schoolName: true } } } },
        },
      });
      const dedup = new Map<string, { id: string; name: string; role: string; subtitle: string }>();
      for (const app of apps) {
        const u = app.job.school.user;
        dedup.set(u.id, { id: u.id, name: u.name, role: u.role, subtitle: app.job.school.schoolName });
      }
      return NextResponse.json({ success: true, data: Array.from(dedup.values()) });
    }

    if (auth.user.role === "SCHOOL_ADMIN") {
      const apps = await prisma.application.findMany({
        where: { job: { school: { userId: auth.user.id } } },
        select: {
          applicant: { select: { id: true, name: true, role: true } },
          job: { select: { title: true } },
        },
      });
      const dedup = new Map<string, { id: string; name: string; role: string; subtitle: string }>();
      for (const app of apps) {
        const u = app.applicant;
        if (!dedup.has(u.id)) {
          dedup.set(u.id, { id: u.id, name: u.name, role: u.role, subtitle: `Applicant for ${app.job.title}` });
        }
      }
      return NextResponse.json({ success: true, data: Array.from(dedup.values()) });
    }

    const users = await prisma.user.findMany({ where: { id: { not: auth.user.id } }, select: { id: true, name: true, role: true }, take: 50 });
    return NextResponse.json({ success: true, data: users.map((u) => ({ ...u, subtitle: u.role })) });
  } catch (error) {
    console.error("GET /api/messages/contacts error:", error);
    return NextResponse.json({ success: false, error: "Failed to load contacts" }, { status: 500 });
  }
}
