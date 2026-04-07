import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { Board } from "@prisma/client";

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

    const profile = await prisma.teacherProfile.findUnique({
      where: { userId: auth.user.id },
    });
    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
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
      const { schoolName, city, board, address, website, about } = body;
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

    const { qualification, experience, currentSchool, city, bio, subjects, preferredBoards, preferredGrades, expectedSalary } = body;
    const data = {
      ...(qualification !== undefined && { qualification }),
      ...(experience !== undefined && { experience }),
      ...(currentSchool !== undefined && { currentSchool }),
      ...(city !== undefined && { city }),
      ...(bio !== undefined && { bio }),
      ...(subjects !== undefined && { subjects }),
      ...(preferredBoards !== undefined && { preferredBoards }),
      ...(preferredGrades !== undefined && { preferredGrades }),
      ...(expectedSalary !== undefined && { expectedSalary: parseInt(expectedSalary) || null }),
    };
    const profile = await prisma.teacherProfile.upsert({
      where: { userId: auth.user.id },
      update: data,
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
        expectedSalary: expectedSalary ? parseInt(expectedSalary) : null 
      },
    });
    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error("PUT /api/profile error:", error);
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}
