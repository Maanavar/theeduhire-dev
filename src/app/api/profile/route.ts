import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { Board } from "@prisma/client";
import { teacherProfileSchema, schoolProfileSchema } from "@/lib/validators/profile";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    if (auth.user.role === "SCHOOL_ADMIN") {
      const profile = await prisma.schoolProfile.findUnique({
        where: { userId: auth.user.id },
      });
      return NextResponse.json({ success: true, data: profile });
    }

    // Teacher profile with relations
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { name: true, email: true, phone: true, avatarUrl: true },
    });

    const profile = await prisma.teacherProfile.findUnique({
      where: { userId: auth.user.id },
      include: {
        experiences: { orderBy: { startDate: "desc" } },
        certifications: { orderBy: { issuedAt: "desc" } },
      },
    });

    const resumes = await prisma.resume.findMany({
      where: { userId: auth.user.id },
      orderBy: { uploadedAt: "desc" },
    });

    // Flatten into single response
    const data = {
      ...profile,
      ...user,
      resumes,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await req.json();

    if (auth.user.role === "SCHOOL_ADMIN") {
      const parsed = schoolProfileSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const { schoolName, city, board, address, website, about } = parsed.data;

      // Update phone on User table if provided
      if (body.phone !== undefined && body.phone !== "") {
        await prisma.user.update({
          where: { id: auth.user.id },
          data: { phone: body.phone || null },
        });
      }

      const data = {
        ...(schoolName !== undefined && { schoolName }),
        ...(city !== undefined && { city }),
        ...(board !== undefined && { board }),
        ...(address !== undefined && { address }),
        ...(website !== undefined && { website }),
        ...(about !== undefined && { about }),
      };
      const profile = await prisma.schoolProfile.upsert({
        where: { userId: auth.user.id },
        update: data,
        create: {
          userId: auth.user.id,
          schoolName: schoolName || "",
          city: city || "",
          board: (board as Board) || Board.CBSE,
          address: address || null,
          website: website || null,
          about: about || null
        },
      });
      return NextResponse.json({ success: true, data: profile });
    }

    // Teacher profile — use Zod validation
    const parsed = teacherProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      qualification,
      experience,
      currentSchool,
      city,
      bio,
      phone,
      subjects,
      preferredBoards,
      preferredGrades,
      expectedSalary,
      availabilityStatus,
    } = parsed.data;

    // Update phone on User table
    if (phone !== undefined && phone !== "") {
      await prisma.user.update({
        where: { id: auth.user.id },
        data: { phone: phone || null },
      });
    }

    // Update TeacherProfile
    const profileData = {
      ...(qualification !== undefined && { qualification }),
      ...(experience !== undefined && { experience }),
      ...(currentSchool !== undefined && { currentSchool }),
      ...(city !== undefined && { city }),
      ...(bio !== undefined && { bio }),
      ...(subjects !== undefined && { subjects }),
      ...(preferredBoards !== undefined && { preferredBoards }),
      ...(preferredGrades !== undefined && { preferredGrades }),
      ...(expectedSalary !== undefined && { expectedSalary }),
      ...(availabilityStatus !== undefined && { availabilityStatus }),
    };

    const profile = await prisma.teacherProfile.upsert({
      where: { userId: auth.user.id },
      update: profileData,
      create: {
        userId: auth.user.id,
        qualification: qualification || null,
        experience: experience || null,
        currentSchool: currentSchool || null,
        city: city || null,
        bio: bio || null,
        subjects: subjects || [],
        preferredBoards: preferredBoards || [],
        preferredGrades: preferredGrades || [],
        expectedSalary: expectedSalary || null,
        availabilityStatus: availabilityStatus || "NOT_LOOKING",
      },
      include: {
        experiences: { orderBy: { startDate: "desc" } },
        certifications: { orderBy: { issuedAt: "desc" } },
      },
    });

    // Fetch resumes
    const resumes = await prisma.resume.findMany({
      where: { userId: auth.user.id },
      orderBy: { uploadedAt: "desc" },
    });

    // Fetch updated user fields
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { name: true, email: true, phone: true, avatarUrl: true },
    });

    const data = {
      ...profile,
      ...user,
      resumes,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("PUT /api/profile error:", error);
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}
