import { PrismaClient, Board, JobType, JobStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding job postings only...");

  await prisma.jobBenefit.deleteMany();
  await prisma.jobRequirement.deleteMany();
  await prisma.jobPosting.deleteMany();

  const schools = await prisma.schoolProfile.findMany({
    select: { id: true, userId: true, board: true, schoolName: true, city: true },
  });

  if (schools.length === 0) {
    console.warn("⚠️  No school profiles found. Create school users and profiles before seeding jobs.");
    return;
  }

  console.log(`  Found ${schools.length} school profiles. Seeding jobs for schools...`);

  const jobsData = [
    {
      schoolIdx: 0,
      title: "PGT Mathematics",
      subject: "Mathematics",
      gradeLevel: "9-12",
      jobType: JobType.FULL_TIME,
      experience: "3-5 years",
      salaryMin: 45000,
      salaryMax: 65000,
      description:
        "We are looking for a passionate PGT Mathematics teacher to join our vibrant team. The ideal candidate will have a strong command over the CBSE curriculum for classes 9-12, with the ability to make complex concepts accessible and engaging.",
      requirements: [
        "M.Sc Mathematics with B.Ed from a recognized university",
        "Minimum 3 years teaching experience in CBSE senior secondary",
        "Proficiency in smart classroom tools and digital teaching aids",
        "Experience with JEE/NEET coaching preferred",
        "Strong classroom management and mentoring skills",
      ],
      benefits: [
        "PF & ESI coverage",
        "Free lunch during school hours",
        "Professional development allowance",
        "Annual increment based on performance review",
        "Children's education fee waiver (50%)",
      ],
    },
    {
      schoolIdx: 0,
      title: "TGT Science",
      subject: "Science",
      gradeLevel: "6-8",
      jobType: JobType.FULL_TIME,
      experience: "2-4 years",
      salaryMin: 35000,
      salaryMax: 50000,
      description:
        "Seeking a capable TGT Science teacher for middle school. The teacher will deliver engaging lessons in Biology, Physics, and Chemistry, aligned with the CBSE curriculum, and support student curiosity through experiments.",
      requirements: [
        "B.Sc with B.Ed in Science",
        "2+ years teaching experience in CBSE middle school",
        "Strong command of lab safety and practical demonstrations",
        "Ability to use digital teaching aids",
      ],
      benefits: [
        "Health insurance",
        "Annual performance bonus",
        "Teacher training programs",
        "Supportive academic environment",
      ],
    },
    {
      schoolIdx: 1,
      title: "TGT English",
      subject: "English",
      gradeLevel: "6-8",
      jobType: JobType.FULL_TIME,
      experience: "2-4 years",
      salaryMin: 35000,
      salaryMax: 50000,
      description:
        "Ryan International School is hiring a creative TGT English teacher for middle school. We need someone who can inspire a love of literature and build strong communication skills.",
      requirements: [
        "MA English with B.Ed",
        "2+ years teaching experience in ICSE or CBSE middle school",
        "Strong classroom management skills",
        "Experience organizing literary activities",
      ],
      benefits: [
        "Health insurance for self and dependents",
        "Annual bonus",
        "Paid training programs",
      ],
    },
    {
      schoolIdx: 1,
      title: "Art & Craft Teacher",
      subject: "Art & Craft",
      gradeLevel: "1-5",
      jobType: JobType.PART_TIME,
      experience: "1-3 years",
      salaryMin: 18000,
      salaryMax: 25000,
      description:
        "We're looking for a creative Art & Craft teacher for primary grades. The role includes planning art projects, teaching craft techniques, and organizing student exhibitions.",
      requirements: [
        "Diploma or degree in Fine Arts",
        "1+ year experience teaching young children",
        "Creative teaching portfolio",
      ],
      benefits: [
        "Flexible hours",
        "Supplies provided",
        "Festival bonus",
      ],
    },
  ];

  for (const j of jobsData) {
    const school = schools[j.schoolIdx % schools.length];
    const job = await prisma.jobPosting.create({
      data: {
        schoolId: school.id,
        postedBy: school.userId,
        title: j.title,
        subject: j.subject,
        board: school.board,
        gradeLevel: j.gradeLevel,
        jobType: j.jobType,
        experience: j.experience,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        description: j.description,
        status: JobStatus.ACTIVE,
      },
    });

    for (let i = 0; i < j.requirements.length; i++) {
      await prisma.jobRequirement.create({ data: { jobId: job.id, text: j.requirements[i], sortOrder: i } });
    }
    for (let i = 0; i < j.benefits.length; i++) {
      await prisma.jobBenefit.create({ data: { jobId: job.id, text: j.benefits[i], sortOrder: i } });
    }

    console.log(`  ✓ Created job: ${j.title} for ${school.schoolName}`);
  }

  console.log("\n✅ Job seeding complete.");
}

main()
  .catch((error) => {
    console.error("❌ Job seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
