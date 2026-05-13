import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const db = prisma as any;

export async function POST() {
  try {
    const auth = await requireAuth(["TEACHER", "SCHOOL_ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    if (auth.user.role === "SCHOOL_ADMIN") {
      const school = await prisma.schoolProfile.findUnique({
        where: { userId: auth.user.id },
        select: {
          id: true,
          schoolName: true,
          city: true,
          board: true,
          about: true,
          logoUrl: true,
          udiseCode: true,
          verificationStatus: true,
        },
      });
      if (!school) {
        return NextResponse.json({ success: false, error: "School profile not found" }, { status: 404 });
      }

      if (school.verificationStatus === "VERIFIED") {
        return NextResponse.json({ success: false, error: "School is already verified" }, { status: 400 });
      }
      if (school.verificationStatus === "PENDING") {
        return NextResponse.json({ success: false, error: "Verification is already under review" }, { status: 400 });
      }

      const missingFields: string[] = [];
      if (!school.schoolName?.trim()) missingFields.push("school name");
      if (!school.city?.trim()) missingFields.push("city");
      if (!school.board) missingFields.push("board");
      if (!school.about?.trim()) missingFields.push("about section");
      if (!school.logoUrl?.trim()) missingFields.push("school logo");
      if (!school.udiseCode?.trim()) missingFields.push("UDISE code");

      if (missingFields.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Complete profile before verification: ${missingFields.join(", ")}`,
          },
          { status: 400 }
        );
      }

      const updated = await db.schoolProfile.update({
        where: { id: school.id },
        data: {
          verificationStatus: "PENDING",
          verified: false,
          verificationSubmittedAt: new Date(),
          verificationNotes: null,
          verificationTimestamp: null,
          verifiedByAdminId: null,
          verificationRejectionReason: null,
        },
        select: { verificationStatus: true, verified: true, verificationSubmittedAt: true },
      });

      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: "SYSTEM",
            title: "School verification request",
            body: `A school requested verification review.`,
            payload: {
              schoolId: school.id,
              requestedBy: auth.user.id,
            },
          })),
        });
      }

      return NextResponse.json({ success: true, data: updated });
    }

    const teacher = await db.teacherProfile.findUnique({
      where: { userId: auth.user.id },
      select: {
        id: true,
        qualification: true,
        experience: true,
        city: true,
        bio: true,
        subjects: true,
        demoVideoUrl: true,
        lessonPlanUrl: true,
        pocsoAcknowledged: true,
        codeOfConductSigned: true,
        verificationStatus: true,
      },
    });

    if (!teacher) {
      return NextResponse.json({ success: false, error: "Teacher profile not found" }, { status: 404 });
    }

    if (teacher.verificationStatus === "VERIFIED") {
      return NextResponse.json({ success: false, error: "Teacher is already verified" }, { status: 400 });
    }
    if (teacher.verificationStatus === "PENDING") {
      return NextResponse.json({ success: false, error: "Verification is already under review" }, { status: 400 });
    }

    const missingFields: string[] = [];
    if (!teacher.qualification?.trim()) missingFields.push("qualification");
    if (!teacher.experience?.trim()) missingFields.push("experience level");
    if (!teacher.city?.trim()) missingFields.push("city");
    if (!teacher.bio?.trim()) missingFields.push("bio");
    if (!teacher.subjects?.length) missingFields.push("subjects");
    if (!teacher.demoVideoUrl?.trim()) missingFields.push("demo video");
    if (!teacher.lessonPlanUrl?.trim()) missingFields.push("lesson plan");
    if (!teacher.pocsoAcknowledged) missingFields.push("POCSO acknowledgement");
    if (!teacher.codeOfConductSigned) missingFields.push("code of conduct acknowledgement");

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Complete profile before verification: ${missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const updated = await db.teacherProfile.update({
      where: { id: teacher.id },
      data: {
        verificationStatus: "PENDING",
        verificationSubmittedAt: new Date(),
        verificationNotes: null,
        verificationTimestamp: null,
        verifiedByAdminId: null,
        verificationRejectionReason: null,
        safetyBadgeGranted: false,
      },
      select: {
        verificationStatus: true,
        verificationSubmittedAt: true,
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: "SYSTEM",
          title: "Teacher verification request",
          body: `A teacher requested verification review.`,
          payload: {
            teacherUserId: auth.user.id,
            teacherProfileId: teacher.id,
          },
        })),
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("POST /api/profile/verify error:", error);
    return NextResponse.json({ success: false, error: "Failed to submit verification request" }, { status: 500 });
  }
}
