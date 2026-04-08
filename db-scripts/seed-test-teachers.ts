/**
 * Seed test teachers and applications for analytics testing
 * Run with: npx ts-node db-scripts/seed-test-teachers.ts
 */

import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

const TEST_PASSWORD = "TestPass123!";

const TEACHERS = [
  {
    name: "Rajesh Kumar",
    email: "rajesh.kumar@email.com",
    phone: "9876543210",
    qualification: "B.Sc Physics, M.Sc Physics",
    experience: "8-10 years",
    currentSchool: "St. Xavier's School",
    city: "Delhi",
    bio: "Experienced physics teacher with expertise in IB and CBSE curriculum",
    subjects: ["Physics", "Mathematics"],
    preferredBoards: ["CBSE", "IB"],
    preferredGrades: ["9-12"],
    expectedSalary: 50000,
  },
  {
    name: "Priya Sharma",
    email: "priya.sharma@email.com",
    phone: "9876543211",
    qualification: "B.Sc Chemistry, B.Ed",
    experience: "5-7 years",
    currentSchool: "DPS Mumbai",
    city: "Mumbai",
    bio: "Chemistry specialist with hands-on lab experience",
    subjects: ["Chemistry", "Science"],
    preferredBoards: ["CBSE", "ICSE"],
    preferredGrades: ["9-12"],
    expectedSalary: 48000,
  },
  {
    name: "Amit Patel",
    email: "amit.patel@email.com",
    phone: "9876543212",
    qualification: "B.Sc Mathematics, M.Ed",
    experience: "10-12 years",
    currentSchool: "Ryan International",
    city: "Bangalore",
    bio: "Mathematics teacher with proven track record in competitive exams",
    subjects: ["Mathematics", "Physics"],
    preferredBoards: ["CBSE", "IB", "CAMBRIDGE"],
    preferredGrades: ["9-12"],
    expectedSalary: 55000,
  },
  {
    name: "Sneha Desai",
    email: "sneha.desai@email.com",
    phone: "9876543213",
    qualification: "B.Sc Chemistry, M.Sc Chemistry",
    experience: "6-8 years",
    currentSchool: "Vidyapith School",
    city: "Pune",
    bio: "Research-focused chemistry educator",
    subjects: ["Chemistry", "Science", "Environmental Science"],
    preferredBoards: ["CBSE", "STATE_BOARD"],
    preferredGrades: ["9-12"],
    expectedSalary: 46000,
  },
  {
    name: "Vikram Singh",
    email: "vikram.singh@email.com",
    phone: "9876543214",
    qualification: "B.Sc Physics, M.Phil Physics",
    experience: "7-9 years",
    currentSchool: "The Heritage School",
    city: "Chennai",
    bio: "Physics educator with interest in modern pedagogy",
    subjects: ["Physics", "Mathematics"],
    preferredBoards: ["CBSE", "IB"],
    preferredGrades: ["10-12"],
    expectedSalary: 52000,
  },
  {
    name: "Anaya Gupta",
    email: "anaya.gupta@email.com",
    phone: "9876543215",
    qualification: "B.Sc Chemistry, M.Sc Chemistry, B.Ed",
    experience: "4-6 years",
    currentSchool: "Delhi Public School East",
    city: "Delhi",
    bio: "Enthusiastic chemistry teacher focused on student engagement",
    subjects: ["Chemistry", "Science"],
    preferredBoards: ["CBSE"],
    preferredGrades: ["8-12"],
    expectedSalary: 44000,
  },
];

async function main() {
  try {
    console.log("🌱 Starting test teacher seed...\n");

    // Find the two jobs
    const mathJob = await prisma.jobPosting.findFirst({
      where: {
        title: { contains: "PGT Mathematics" },
        school: {
          schoolName: "Delhi Public School",
          city: "Madurai",
        },
      },
    });

    const chemJob = await prisma.jobPosting.findFirst({
      where: {
        title: { contains: "PGT Chemistry" },
        school: {
          schoolName: "Delhi Public School",
          city: "Madurai",
        },
      },
    });

    if (!mathJob || !chemJob) {
      console.error("❌ Required jobs not found. Make sure they exist in the database.");
      console.log("Looking for:");
      console.log("- PGT Mathematics at Delhi Public School, Madurai");
      console.log("- PGT Chemistry at Delhi Public School, Madurai");
      process.exit(1);
    }

    console.log(`✅ Found jobs:`);
    console.log(`   - ${mathJob.title} (ID: ${mathJob.id})`);
    console.log(`   - ${chemJob.title} (ID: ${chemJob.id})\n`);

    // Create teachers
    for (const teacher of TEACHERS) {
      const hashedPassword = await bcryptjs.hash(TEST_PASSWORD, 10);

      const user = await prisma.user.create({
        data: {
          email: teacher.email,
          name: teacher.name,
          hashedPassword,
          phone: teacher.phone,
          emailVerified: true,
          role: "TEACHER",
        },
      });

      const profile = await prisma.teacherProfile.create({
        data: {
          userId: user.id,
          qualification: teacher.qualification,
          experience: teacher.experience,
          currentSchool: teacher.currentSchool,
          city: teacher.city,
          bio: teacher.bio,
          subjects: teacher.subjects,
          preferredBoards: teacher.preferredBoards,
          preferredGrades: teacher.preferredGrades,
          expectedSalary: teacher.expectedSalary,
          availabilityStatus: "ACTIVELY_LOOKING",
        },
      });

      console.log(`✅ Created teacher: ${teacher.name} (${teacher.email})`);

      // Randomly apply to one or both jobs
      const applyToMath = Math.random() > 0.3; // 70% apply to math
      const applyToChem = Math.random() > 0.4; // 60% apply to chem

      if (applyToMath) {
        await prisma.application.create({
          data: {
            jobId: mathJob.id,
            applicantId: user.id,
            coverLetter: `I am an experienced mathematics teacher with ${teacher.experience} of experience. I am very interested in this position at Delhi Public School, Madurai.`,
            status: "PENDING",
            appliedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
          },
        });
        console.log(`   └─ Applied to: PGT Mathematics`);
      }

      if (applyToChem) {
        await prisma.application.create({
          data: {
            jobId: chemJob.id,
            applicantId: user.id,
            coverLetter: `I am a dedicated chemistry educator with ${teacher.experience} of experience. I would be delighted to join your institution.`,
            status: "PENDING",
            appliedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
          },
        });
        console.log(`   └─ Applied to: PGT Chemistry`);
      }

      console.log();
    }

    // Get stats
    const totalApps = await prisma.application.count({
      where: {
        jobId: { in: [mathJob.id, chemJob.id] },
      },
    });

    const mathApps = await prisma.application.count({
      where: { jobId: mathJob.id },
    });

    const chemApps = await prisma.application.count({
      where: { jobId: chemJob.id },
    });

    console.log("📊 Summary:");
    console.log(`   Total Applications: ${totalApps}`);
    console.log(`   Math Job Applications: ${mathApps}`);
    console.log(`   Chemistry Job Applications: ${chemApps}`);
    console.log(
      `\n✨ Ready for analytics testing! Visit /dashboard/school to see the data.`
    );
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
