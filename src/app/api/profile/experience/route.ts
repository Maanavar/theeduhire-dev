// POST /api/profile/experience
// Create work experience entry
// Auth: TEACHER

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { experienceSchema } from "@/lib/validators/profile";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(["TEACHER"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const parsed = experienceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User profile not found. Please log out and log in again." },
        { status: 404 }
      );
    }

    // Get or create TeacherProfile
    let teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: auth.user.id },
    });

    if (!teacherProfile) {
      teacherProfile = await prisma.teacherProfile.create({
        data: { userId: auth.user.id },
      });
    }

    const { schoolName, role, startDate, endDate, isCurrent, description } = parsed.data;

    const experience = await prisma.experience.create({
      data: {
        teacherProfileId: teacherProfile.id,
        schoolName,
        role,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isCurrent,
        description: description || null,
      },
    });

    return NextResponse.json({ success: true, data: { experience } });
  } catch (error) {
    console.error("POST /api/profile/experience error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create experience" },
      { status: 500 }
    );
  }
}
