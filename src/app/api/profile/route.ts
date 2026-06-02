import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { Board } from "@prisma/client";
import { teacherProfileSchema, schoolProfileSchema } from "@/lib/validators/profile";
import { publishDomainEvent } from "@/lib/domain-events";
import { sanitizeOptionalPlainText, sanitizePlainText } from "@/lib/sanitize";
import { getResumeAccessPath, getTeacherDocumentAccessPath } from "@/lib/storage";

export async function GET() {
  try {
    const auth = await requireAuth();
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    if (auth.user.role === "SCHOOL_ADMIN") {
      const user = await prisma.user.findUnique({
        where: { id: auth.user.id },
        select: { name: true, email: true, phone: true, avatarUrl: true, whatsappNumber: true, whatsappOptin: true },
      });
      const profile = await prisma.schoolProfile.findUnique({
        where: { userId: auth.user.id },
      });
      return NextResponse.json({ success: true, data: { ...profile, ...user } });
    }

    // Teacher profile with relations
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { name: true, email: true, phone: true, avatarUrl: true, whatsappNumber: true, whatsappOptin: true },
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
      demoVideoUrl: profile?.demoVideoUrl ? getTeacherDocumentAccessPath("demo-video", auth.user.id) : null,
      lessonPlanUrl: profile?.lessonPlanUrl ? getTeacherDocumentAccessPath("lesson-plan", auth.user.id) : null,
      resumes: resumes.map((resume) => ({
        ...resume,
        fileUrl: getResumeAccessPath(resume.id),
      })),
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
      const parsed = schoolProfileSchema.partial().safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const { schoolName, city, board, address, website, about, hasPfEsi, paymentTrackRecord, workingHours, udiseCode } = parsed.data;
      const sanitizedSchoolName = schoolName !== undefined ? sanitizePlainText(schoolName) : schoolName;
      const sanitizedCity = city !== undefined ? sanitizePlainText(city) : city;
      const sanitizedAddress = sanitizeOptionalPlainText(address);
      const sanitizedWebsite = sanitizeOptionalPlainText(website);
      const sanitizedAbout = sanitizeOptionalPlainText(about);
      const sanitizedWorkingHours = sanitizeOptionalPlainText(workingHours);
      const sanitizedUdiseCode = sanitizeOptionalPlainText(udiseCode);

      if (!body.schoolName && !body.city && !body.board) {
        const existingProfile = await prisma.schoolProfile.findUnique({
          where: { userId: auth.user.id },
          select: { schoolName: true, city: true, board: true },
        });

        if (!existingProfile?.schoolName || !existingProfile?.city || !existingProfile?.board) {
          return NextResponse.json(
            { success: false, error: { schoolName: ["School name, city, and board are required during initial setup"] } },
            { status: 400 }
          );
        }
      }

      const userPatch: { phone?: string | null; name?: string; whatsappNumber?: string | null; whatsappOptin?: boolean } = {};
      if (body.phone !== undefined) {
        userPatch.phone = body.phone || null;
      }
      if (body.whatsappNumber !== undefined) {
        userPatch.whatsappNumber = body.whatsappNumber || null;
      }
      if (typeof body.whatsappOptin === "boolean") {
        userPatch.whatsappOptin = body.whatsappOptin;
      }
      if (typeof body.name === "string" && body.name.trim()) {
        userPatch.name = sanitizePlainText(body.name.trim());
      }

      if (Object.keys(userPatch).length > 0) {
        await prisma.user.update({
          where: { id: auth.user.id },
          data: userPatch,
        });
      }

      const data = {
        ...(sanitizedSchoolName !== undefined && { schoolName: sanitizedSchoolName }),
        ...(sanitizedCity !== undefined && { city: sanitizedCity }),
        ...(board !== undefined && { board }),
        ...(sanitizedAddress !== undefined && { address: sanitizedAddress }),
        ...(sanitizedWebsite !== undefined && { website: sanitizedWebsite }),
        ...(sanitizedAbout !== undefined && { about: sanitizedAbout }),
        ...(hasPfEsi !== undefined && { hasPfEsi }),
        ...(paymentTrackRecord !== undefined && { paymentTrackRecord }),
        ...(sanitizedWorkingHours !== undefined && { workingHours: sanitizedWorkingHours }),
        ...(sanitizedUdiseCode !== undefined && { udiseCode: sanitizedUdiseCode }),
      };
      const profile = await prisma.$transaction(async (tx: any) => {
        const nextProfile = await tx.schoolProfile.upsert({
          where: { userId: auth.user.id },
          update: data,
          create: {
            userId: auth.user.id,
            schoolName: sanitizedSchoolName || "",
            city: sanitizedCity || "",
            board: (board as Board) || Board.CBSE,
            address: sanitizedAddress || null,
            website: sanitizedWebsite || null,
            about: sanitizedAbout || null,
            hasPfEsi: hasPfEsi || false,
            paymentTrackRecord: paymentTrackRecord || null,
            workingHours: sanitizedWorkingHours || null,
            udiseCode: sanitizedUdiseCode || null,
          },
        });

        await publishDomainEvent(tx, {
          eventType: "school_profile_updated",
          aggregateType: "school_profile",
          aggregateId: nextProfile.id,
          actorId: auth.user.id,
          payload: {
            userId: auth.user.id,
            schoolProfileId: nextProfile.id,
          },
          metadata: {
            source: "api.profile.put",
          },
        });

        return nextProfile;
      });

      const user = await prisma.user.findUnique({
        where: { id: auth.user.id },
        select: { name: true, email: true, phone: true, avatarUrl: true, whatsappNumber: true, whatsappOptin: true },
      });

      return NextResponse.json({ success: true, data: { ...profile, ...user } });
    }

    // Teacher profile — partial patch: only validate/apply fields present in request body
    const parsed = teacherProfileSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      name,
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
      preferredJobTypes,
      noticePeriodDays,
      tetStatus,
      teachingMediums,
      pocsoAcknowledged,
      referenceCheckDone,
      codeOfConductSigned,
    } = parsed.data;
    const sanitizedQualification = sanitizeOptionalPlainText(qualification);
    const sanitizedExperience = sanitizeOptionalPlainText(experience);
    const sanitizedCurrentSchool = sanitizeOptionalPlainText(currentSchool);
    const sanitizedCity = sanitizeOptionalPlainText(city);
    const sanitizedBio = sanitizeOptionalPlainText(bio);
    const sanitizedSubjects = subjects?.map((item) => sanitizePlainText(item));
    const sanitizedPreferredBoards = preferredBoards?.map((item) => sanitizePlainText(item));
    const sanitizedPreferredGrades = preferredGrades?.map((item) => sanitizePlainText(item));
    const sanitizedPreferredJobTypes = preferredJobTypes?.map((item) => sanitizePlainText(item));
    const sanitizedTeachingMediums = teachingMediums?.map((item) => sanitizePlainText(item));
    const sanitizedName = sanitizeOptionalPlainText(name);
    const userPatch: { phone?: string | null; name?: string; whatsappNumber?: string | null; whatsappOptin?: boolean } = {};
    if (phone !== undefined) {
      userPatch.phone = phone || null;
    }
    if (body.whatsappNumber !== undefined) {
      userPatch.whatsappNumber = body.whatsappNumber || null;
    }
    if (typeof body.whatsappOptin === "boolean") {
      userPatch.whatsappOptin = body.whatsappOptin;
    }
    if (sanitizedName !== undefined && sanitizedName !== null && sanitizedName.trim()) {
      userPatch.name = sanitizedName;
    }
    if (Object.keys(userPatch).length > 0) {
      await prisma.user.update({
        where: { id: auth.user.id },
        data: userPatch,
      });
    }

    // Update TeacherProfile
    const profileData = {
      ...(sanitizedQualification !== undefined && { qualification: sanitizedQualification }),
      ...(sanitizedExperience !== undefined && { experience: sanitizedExperience }),
      ...(sanitizedCurrentSchool !== undefined && { currentSchool: sanitizedCurrentSchool }),
      ...(sanitizedCity !== undefined && { city: sanitizedCity }),
      ...(sanitizedBio !== undefined && { bio: sanitizedBio }),
      ...(sanitizedSubjects !== undefined && { subjects: sanitizedSubjects }),
      ...(sanitizedPreferredBoards !== undefined && { preferredBoards: sanitizedPreferredBoards }),
      ...(sanitizedPreferredGrades !== undefined && { preferredGrades: sanitizedPreferredGrades }),
      ...(expectedSalary !== undefined && { expectedSalary }),
      ...(availabilityStatus !== undefined && { availabilityStatus }),
      ...(sanitizedPreferredJobTypes !== undefined && { preferredJobTypes: sanitizedPreferredJobTypes }),
      ...(noticePeriodDays !== undefined && { noticePeriodDays }),
      ...(tetStatus !== undefined && { tetStatus }),
      ...(sanitizedTeachingMediums !== undefined && { teachingMediums: sanitizedTeachingMediums }),
      ...(pocsoAcknowledged !== undefined && { pocsoAcknowledged }),
      ...(referenceCheckDone !== undefined && { referenceCheckDone }),
      ...(codeOfConductSigned !== undefined && { codeOfConductSigned }),
    };

    const profile = await prisma.$transaction(async (tx: any) => {
      let nextProfile = await tx.teacherProfile.upsert({
        where: { userId: auth.user.id },
        update: profileData,
        create: {
          userId: auth.user.id,
          qualification: sanitizedQualification || null,
          experience: sanitizedExperience || null,
          currentSchool: sanitizedCurrentSchool || null,
          city: sanitizedCity || null,
          bio: sanitizedBio || null,
          subjects: sanitizedSubjects || [],
          preferredBoards: sanitizedPreferredBoards || [],
          preferredGrades: sanitizedPreferredGrades || [],
          expectedSalary: expectedSalary || null,
          availabilityStatus: availabilityStatus || "NOT_LOOKING",
          preferredJobTypes: sanitizedPreferredJobTypes || [],
          noticePeriodDays: noticePeriodDays || null,
          tetStatus: tetStatus || null,
          teachingMediums: sanitizedTeachingMediums || [],
          pocsoAcknowledged: pocsoAcknowledged || false,
          referenceCheckDone: referenceCheckDone || false,
          codeOfConductSigned: codeOfConductSigned || false,
        },
        include: {
          experiences: { orderBy: { startDate: "desc" } },
          certifications: { orderBy: { issuedAt: "desc" } },
        },
      });

      await publishDomainEvent(tx, {
        eventType: "teacher_profile_updated",
        aggregateType: "teacher_profile",
        aggregateId: nextProfile.id,
        actorId: auth.user.id,
        payload: {
          userId: auth.user.id,
          teacherProfileId: nextProfile.id,
        },
        metadata: {
          source: "api.profile.put",
        },
      });

      return nextProfile;
    });

    // Fetch resumes
    const resumes = await prisma.resume.findMany({
      where: { userId: auth.user.id },
      orderBy: { uploadedAt: "desc" },
    });

    // Fetch updated user fields
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { name: true, email: true, phone: true, avatarUrl: true, whatsappNumber: true, whatsappOptin: true },
    });

    const data = {
      ...profile,
      ...user,
      demoVideoUrl: profile?.demoVideoUrl ? getTeacherDocumentAccessPath("demo-video", auth.user.id) : null,
      lessonPlanUrl: profile?.lessonPlanUrl ? getTeacherDocumentAccessPath("lesson-plan", auth.user.id) : null,
      resumes: resumes.map((resume) => ({
        ...resume,
        fileUrl: getResumeAccessPath(resume.id),
      })),
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("PUT /api/profile error:", error);
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}
