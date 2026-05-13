import {
  ApplicationStatus,
  AvailabilityStatus,
  Board,
  JobStatus,
  JobType,
  PrismaClient,
} from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

export const SMOKE_PASSWORD = "SmokeTest123!";
export const SMOKE_RESUME_ID = "11111111-1111-1111-1111-111111111111";
const RESUME_URL =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

export const SMOKE_ACCOUNTS = {
  teacher: {
    email: "smoke.teacher@eduhire-demo.in",
    name: "Smoke Test Teacher",
    phone: "9000000002",
  },
  school: {
    email: "smoke.school@eduhire-demo.in",
    name: "Smoke Test School Admin",
    phone: "9000000001",
  },
  outsiderSchool: {
    email: "smoke.outsider-school@eduhire-demo.in",
    name: "Outsider School Admin",
    phone: "9000000003",
  },
  pendingSchool: {
    email: "smoke.pending-school@eduhire-demo.in",
    name: "Pending School Admin",
    phone: "9000000004",
  },
  admin: {
    email: "smoke.admin@eduhire-demo.in",
    name: "Smoke Test Admin",
    phone: "9000000005",
  },
} as const;

export type SmokeData = {
  teacher: {
    email: string;
    password: string;
    userId: string;
    resumeId: string;
    profileId: string;
  };
  school: {
    email: string;
    password: string;
    userId: string;
    schoolId: string;
    jobId: string;
    applicationId: string;
  };
  outsiderSchool: {
    email: string;
    password: string;
    userId: string;
    schoolId: string;
  };
  pendingSchool: {
    email: string;
    password: string;
    userId: string;
    schoolId: string;
  };
  admin: {
    email: string;
    password: string;
    userId: string;
  };
};

let cachedSmokeData: SmokeData | null = null;

export async function ensureSmokeData(): Promise<SmokeData> {
  if (cachedSmokeData) {
    return cachedSmokeData;
  }

  const hashedPassword = await hash(SMOKE_PASSWORD, 10);

  const schoolUser = await prisma.user.upsert({
    where: { email: SMOKE_ACCOUNTS.school.email },
    update: {
      name: SMOKE_ACCOUNTS.school.name,
      role: "SCHOOL_ADMIN",
      hashedPassword,
      emailVerified: true,
      phone: SMOKE_ACCOUNTS.school.phone,
    },
    create: {
      email: SMOKE_ACCOUNTS.school.email,
      name: SMOKE_ACCOUNTS.school.name,
      role: "SCHOOL_ADMIN",
      hashedPassword,
      emailVerified: true,
      phone: SMOKE_ACCOUNTS.school.phone,
    },
  });

  const outsiderSchoolUser = await prisma.user.upsert({
    where: { email: SMOKE_ACCOUNTS.outsiderSchool.email },
    update: {
      name: SMOKE_ACCOUNTS.outsiderSchool.name,
      role: "SCHOOL_ADMIN",
      hashedPassword,
      emailVerified: true,
      phone: SMOKE_ACCOUNTS.outsiderSchool.phone,
    },
    create: {
      email: SMOKE_ACCOUNTS.outsiderSchool.email,
      name: SMOKE_ACCOUNTS.outsiderSchool.name,
      role: "SCHOOL_ADMIN",
      hashedPassword,
      emailVerified: true,
      phone: SMOKE_ACCOUNTS.outsiderSchool.phone,
    },
  });

  const pendingSchoolUser = await prisma.user.upsert({
    where: { email: SMOKE_ACCOUNTS.pendingSchool.email },
    update: {
      name: SMOKE_ACCOUNTS.pendingSchool.name,
      role: "SCHOOL_ADMIN",
      hashedPassword,
      emailVerified: true,
      phone: SMOKE_ACCOUNTS.pendingSchool.phone,
    },
    create: {
      email: SMOKE_ACCOUNTS.pendingSchool.email,
      name: SMOKE_ACCOUNTS.pendingSchool.name,
      role: "SCHOOL_ADMIN",
      hashedPassword,
      emailVerified: true,
      phone: SMOKE_ACCOUNTS.pendingSchool.phone,
    },
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: SMOKE_ACCOUNTS.teacher.email },
    update: {
      name: SMOKE_ACCOUNTS.teacher.name,
      role: "TEACHER",
      hashedPassword,
      emailVerified: true,
      phone: SMOKE_ACCOUNTS.teacher.phone,
      avatarUrl: "https://i.pravatar.cc/300?img=12",
    },
    create: {
      email: SMOKE_ACCOUNTS.teacher.email,
      name: SMOKE_ACCOUNTS.teacher.name,
      role: "TEACHER",
      hashedPassword,
      emailVerified: true,
      phone: SMOKE_ACCOUNTS.teacher.phone,
      avatarUrl: "https://i.pravatar.cc/300?img=12",
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: SMOKE_ACCOUNTS.admin.email },
    update: {
      name: SMOKE_ACCOUNTS.admin.name,
      role: "ADMIN",
      hashedPassword,
      emailVerified: true,
      phone: SMOKE_ACCOUNTS.admin.phone,
    },
    create: {
      email: SMOKE_ACCOUNTS.admin.email,
      name: SMOKE_ACCOUNTS.admin.name,
      role: "ADMIN",
      hashedPassword,
      emailVerified: true,
      phone: SMOKE_ACCOUNTS.admin.phone,
    },
  });

  const schoolProfile = await prisma.schoolProfile.upsert({
    where: { userId: schoolUser.id },
    update: {
      schoolName: "Smoke Test Matric School",
      city: "Chennai",
      board: Board.CBSE,
      address: "T Nagar, Chennai",
      website: "https://smoke-school.example.com",
      about: "Verified smoke-test school profile for runtime validation.",
      verified: true,
      verificationStatus: "VERIFIED",
      hasPfEsi: true,
      paymentTrackRecord: "ON_TIME",
      workingHours: "8am-4pm, Mon-Fri",
      udiseCode: "SMOKE123456",
    },
    create: {
      userId: schoolUser.id,
      schoolName: "Smoke Test Matric School",
      city: "Chennai",
      board: Board.CBSE,
      address: "T Nagar, Chennai",
      website: "https://smoke-school.example.com",
      about: "Verified smoke-test school profile for runtime validation.",
      verified: true,
      verificationStatus: "VERIFIED",
      hasPfEsi: true,
      paymentTrackRecord: "ON_TIME",
      workingHours: "8am-4pm, Mon-Fri",
      udiseCode: "SMOKE123456",
    },
  });

  const outsiderSchoolProfile = await prisma.schoolProfile.upsert({
    where: { userId: outsiderSchoolUser.id },
    update: {
      schoolName: "Smoke Outsider School",
      city: "Coimbatore",
      board: Board.ICSE,
      address: "Race Course, Coimbatore",
      website: "https://outsider-school.example.com",
      about: "Secondary smoke school for authorization checks.",
      verified: true,
      verificationStatus: "VERIFIED",
      hasPfEsi: true,
      paymentTrackRecord: "ON_TIME",
      workingHours: "8am-4pm, Mon-Fri",
      udiseCode: "SMOKE654321",
    },
    create: {
      userId: outsiderSchoolUser.id,
      schoolName: "Smoke Outsider School",
      city: "Coimbatore",
      board: Board.ICSE,
      address: "Race Course, Coimbatore",
      website: "https://outsider-school.example.com",
      about: "Secondary smoke school for authorization checks.",
      verified: true,
      verificationStatus: "VERIFIED",
      hasPfEsi: true,
      paymentTrackRecord: "ON_TIME",
      workingHours: "8am-4pm, Mon-Fri",
      udiseCode: "SMOKE654321",
    },
  });

  const pendingSchoolProfile = await prisma.schoolProfile.upsert({
    where: { userId: pendingSchoolUser.id },
    update: {
      schoolName: "Smoke Pending School",
      city: "Madurai",
      board: Board.STATE_BOARD,
      address: "KK Nagar, Madurai",
      website: "https://pending-school.example.com",
      about: "Pending verification school for admin workflow checks.",
      logoUrl: "https://placehold.co/256x256/png",
      verified: false,
      verificationStatus: "PENDING",
      hasPfEsi: false,
      paymentTrackRecord: "MIXED",
      workingHours: "9am-4pm, Mon-Fri",
      udiseCode: "SMOKEPENDING1",
    },
    create: {
      userId: pendingSchoolUser.id,
      schoolName: "Smoke Pending School",
      city: "Madurai",
      board: Board.STATE_BOARD,
      address: "KK Nagar, Madurai",
      website: "https://pending-school.example.com",
      about: "Pending verification school for admin workflow checks.",
      logoUrl: "https://placehold.co/256x256/png",
      verified: false,
      verificationStatus: "PENDING",
      hasPfEsi: false,
      paymentTrackRecord: "MIXED",
      workingHours: "9am-4pm, Mon-Fri",
      udiseCode: "SMOKEPENDING1",
    },
  });

  const teacherProfile = await prisma.teacherProfile.upsert({
    where: { userId: teacherUser.id },
    update: {
      qualification: "M.Sc Mathematics, B.Ed",
      experience: "3-5 years",
      currentSchool: "Current Demo School",
      city: "Chennai",
      bio: "Smoke-test teacher profile with passport, safety, and fit data.",
      subjects: ["Mathematics"],
      preferredBoards: ["CBSE"],
      preferredGrades: ["9-12"],
      expectedSalary: 45000,
      availabilityStatus: AvailabilityStatus.IMMEDIATE_JOINER,
      preferredJobTypes: ["Full-time", "Online"],
      noticePeriodDays: 0,
      tetStatus: "BOTH",
      teachingMediums: ["Tamil", "English"],
      demoVideoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      lessonPlanUrl: RESUME_URL,
      pocsoAcknowledged: true,
      referenceCheckDone: true,
      codeOfConductSigned: true,
      safetyBadgeGranted: true,
    },
    create: {
      userId: teacherUser.id,
      qualification: "M.Sc Mathematics, B.Ed",
      experience: "3-5 years",
      currentSchool: "Current Demo School",
      city: "Chennai",
      bio: "Smoke-test teacher profile with passport, safety, and fit data.",
      subjects: ["Mathematics"],
      preferredBoards: ["CBSE"],
      preferredGrades: ["9-12"],
      expectedSalary: 45000,
      availabilityStatus: AvailabilityStatus.IMMEDIATE_JOINER,
      preferredJobTypes: ["Full-time", "Online"],
      noticePeriodDays: 0,
      tetStatus: "BOTH",
      teachingMediums: ["Tamil", "English"],
      demoVideoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      lessonPlanUrl: RESUME_URL,
      pocsoAcknowledged: true,
      referenceCheckDone: true,
      codeOfConductSigned: true,
      safetyBadgeGranted: true,
    },
  });

  await prisma.experience.deleteMany({
    where: { teacherProfileId: teacherProfile.id },
  });
  await prisma.certification.deleteMany({
    where: { teacherProfileId: teacherProfile.id },
  });

  await prisma.experience.create({
    data: {
      teacherProfileId: teacherProfile.id,
      schoolName: "Current Demo School",
      role: "PGT Mathematics",
      startDate: new Date("2022-06-01T00:00:00.000Z"),
      isCurrent: true,
      description: "Handles senior secondary mathematics and board exam preparation.",
    },
  });

  await prisma.certification.create({
    data: {
      teacherProfileId: teacherProfile.id,
      name: "CTET Paper II",
      issuedBy: "CBSE",
      issuedAt: new Date("2021-11-01T00:00:00.000Z"),
      credentialId: "SMOKE-CTET-001",
    },
  });

  const resume = await prisma.resume.upsert({
    where: { id: SMOKE_RESUME_ID },
    update: {
      userId: teacherUser.id,
      fileUrl: RESUME_URL,
      fileName: "Smoke_Test_Teacher_Resume.pdf",
      fileSize: 123456,
    },
    create: {
      id: SMOKE_RESUME_ID,
      userId: teacherUser.id,
      fileUrl: RESUME_URL,
      fileName: "Smoke_Test_Teacher_Resume.pdf",
      fileSize: 123456,
    },
  });

  const existingJob = await prisma.jobPosting.findFirst({
    where: {
      postedBy: schoolUser.id,
      title: "Smoke Test PGT Mathematics",
    },
    select: { id: true },
  });

  const jobId = existingJob?.id;
  if (jobId) {
    await prisma.screeningAnswer.deleteMany({
      where: { application: { jobId } },
    });
    await prisma.applicationStatusHistory.deleteMany({
      where: { application: { jobId } },
    });
    await prisma.application.deleteMany({
      where: { jobId },
    });
    await prisma.screeningQuestion.deleteMany({ where: { jobId } });
    await prisma.jobRequirement.deleteMany({ where: { jobId } });
    await prisma.jobBenefit.deleteMany({ where: { jobId } });
  }

  const job = jobId
    ? await prisma.jobPosting.update({
        where: { id: jobId },
        data: {
          schoolId: schoolProfile.id,
          postedBy: schoolUser.id,
          title: "Smoke Test PGT Mathematics",
          subject: "Mathematics",
          board: Board.CBSE,
          gradeLevel: "9-12",
          jobType: JobType.FULL_TIME,
          experience: "3-5 years",
          experienceLevel: "TWO_TO_FIVE_YEARS",
          salaryMin: 40000,
          salaryMax: 50000,
          isUrgent: true,
          requiredWithin48h: true,
          requiresTet: true,
          applicationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          description:
            "Smoke-test role for validating verified school posting, urgent jobs, and teacher matching.",
          status: JobStatus.ACTIVE,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })
    : await prisma.jobPosting.create({
        data: {
          schoolId: schoolProfile.id,
          postedBy: schoolUser.id,
          title: "Smoke Test PGT Mathematics",
          subject: "Mathematics",
          board: Board.CBSE,
          gradeLevel: "9-12",
          jobType: JobType.FULL_TIME,
          experience: "3-5 years",
          experienceLevel: "TWO_TO_FIVE_YEARS",
          salaryMin: 40000,
          salaryMax: 50000,
          isUrgent: true,
          requiredWithin48h: true,
          requiresTet: true,
          applicationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          description:
            "Smoke-test role for validating verified school posting, urgent jobs, and teacher matching.",
          status: JobStatus.ACTIVE,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

  const createdQuestion = await prisma.screeningQuestion.create({
    data: {
      jobId: job.id,
      question: "Do you have TET or CTET certification?",
      required: true,
      sortOrder: 0,
    },
  });

  await prisma.jobRequirement.createMany({
    data: [
      {
        jobId: job.id,
        text: "B.Ed with Mathematics specialization",
        sortOrder: 0,
      },
      {
        jobId: job.id,
        text: "Confident with board exam preparation",
        sortOrder: 1,
      },
    ],
  });

  await prisma.jobBenefit.createMany({
    data: [
      { jobId: job.id, text: "PF / ESI", sortOrder: 0 },
      {
        jobId: job.id,
        text: "Professional development support",
        sortOrder: 1,
      },
    ],
  });

  const application = await prisma.application.create({
    data: {
      jobId: job.id,
      applicantId: teacherUser.id,
      status: ApplicationStatus.PENDING,
      resumeId: resume.id,
      coverLetter: "Smoke-test application for workflow validation.",
    },
  });

  await prisma.applicationStatusHistory.create({
    data: {
      applicationId: application.id,
      fromStatus: ApplicationStatus.PENDING,
      toStatus: ApplicationStatus.PENDING,
      changedBy: teacherUser.id,
      note: "Seeded smoke-test application.",
    },
  });

  await prisma.screeningAnswer.create({
    data: {
      applicationId: application.id,
      questionId: createdQuestion.id,
      questionSnapshot: createdQuestion.question,
      answer: "Yes, I hold valid TET and CTET credentials.",
    },
  });

  await prisma.aIMatchScore.upsert({
    where: { jobId_applicantId: { jobId: job.id, applicantId: teacherUser.id } },
    update: {
      score: 0.92,
      breakdown: {
        subject: 1,
        location: 1,
        board: 1,
        salary: 0.8,
        experience: 0.9,
        tet: 1,
      },
      explanation:
        "Matches your Mathematics teaching profile, Chennai location, board preference, and TET credentials.",
    },
    create: {
      jobId: job.id,
      applicantId: teacherUser.id,
      score: 0.92,
      breakdown: {
        subject: 1,
        location: 1,
        board: 1,
        salary: 0.8,
        experience: 0.9,
        tet: 1,
      },
      explanation:
        "Matches your Mathematics teaching profile, Chennai location, board preference, and TET credentials.",
    },
  });

  cachedSmokeData = {
    teacher: {
      email: SMOKE_ACCOUNTS.teacher.email,
      password: SMOKE_PASSWORD,
      userId: teacherUser.id,
      resumeId: resume.id,
      profileId: teacherProfile.id,
    },
    school: {
      email: SMOKE_ACCOUNTS.school.email,
      password: SMOKE_PASSWORD,
      userId: schoolUser.id,
      schoolId: schoolProfile.id,
      jobId: job.id,
      applicationId: application.id,
    },
    outsiderSchool: {
      email: SMOKE_ACCOUNTS.outsiderSchool.email,
      password: SMOKE_PASSWORD,
      userId: outsiderSchoolUser.id,
      schoolId: outsiderSchoolProfile.id,
    },
    pendingSchool: {
      email: SMOKE_ACCOUNTS.pendingSchool.email,
      password: SMOKE_PASSWORD,
      userId: pendingSchoolUser.id,
      schoolId: pendingSchoolProfile.id,
    },
    admin: {
      email: SMOKE_ACCOUNTS.admin.email,
      password: SMOKE_PASSWORD,
      userId: adminUser.id,
    },
  };

  return cachedSmokeData;
}

export async function disconnectSmokePrisma() {
  await prisma.$disconnect();
}
