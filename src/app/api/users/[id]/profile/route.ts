// GET /api/users/[id]/profile
// Public teacher profile — no auth required
// Does NOT return: phone, email, resume URLs (privacy)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { name: true, avatarUrl: true, role: true },
    });

    if (!user || user.role !== "TEACHER") {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    const profile = await prisma.teacherProfile.findUnique({
      where: { userId: id },
      include: {
        experiences: {
          select: {
            id: true,
            schoolName: true,
            role: true,
            startDate: true,
            endDate: true,
            isCurrent: true,
            description: true,
          },
          orderBy: { startDate: "desc" },
        },
        certifications: {
          select: {
            id: true,
            name: true,
            issuedBy: true,
            issuedAt: true,
            expiresAt: true,
          },
          orderBy: { issuedAt: "desc" },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    // Count resumes (don't expose URLs publicly)
    const resumeCount = await prisma.resume.count({
      where: { userId: id },
    });

    const data = {
      user: {
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      profile: {
        qualification: profile.qualification,
        experience: profile.experience,
        currentSchool: profile.currentSchool,
        city: profile.city,
        bio: profile.bio,
        subjects: profile.subjects,
        preferredBoards: profile.preferredBoards,
        preferredGrades: profile.preferredGrades,
        expectedSalary: profile.expectedSalary,
        availabilityStatus: profile.availabilityStatus,
        experiences: profile.experiences,
        certifications: profile.certifications,
      },
      resumeCount,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/users/[id]/profile error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
