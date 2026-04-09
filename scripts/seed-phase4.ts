#!/usr/bin/env node
// scripts/seed-phase4.ts
// Comprehensive database seed for Phase 4 testing
// Run: npx tsx scripts/seed-phase4.ts

import { PrismaClient, Board, JobType, AvailabilityStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// Test data
const SCHOOLS = [
  {
    name: "Sri Venkateswara Vidyalayam",
    city: "Chennai",
    board: "CBSE" as Board,
    address: "Velachery, Chennai 600042",
    website: "https://svvidyalayam.edu.in",
    about: "Premier CBSE school with 25 years of excellence",
  },
  {
    name: "DPS Chennai East",
    city: "Chennai",
    board: "CBSE" as Board,
    address: "Besant Nagar, Chennai 600090",
    website: "https://dpseast.edu.in",
    about: "Delhi Public School - Chennai branch",
  },
  {
    name: "Chettinad Vidyashram",
    city: "Chennai",
    board: "ICSE" as Board,
    address: "Chetpet, Chennai 600031",
    website: "https://chettinadvidyashram.edu.in",
    about: "ICSE board school with focus on holistic development",
  },
  {
    name: "Sri Aurobindo Pathamandir",
    city: "Bangalore",
    board: "CBSE" as Board,
    address: "Whitefield, Bangalore 560066",
    website: "https://saurobindo.edu.in",
    about: "Montessori and CBSE integrated curriculum",
  },
  {
    name: "Cathedral High School",
    city: "Bangalore",
    board: "ICSE" as Board,
    address: "Indiranagar, Bangalore 560038",
    website: "https://cathedral.edu.in",
    about: "Heritage ICSE school since 1888",
  },
  {
    name: "Nalanda Academy",
    city: "Hyderabad",
    board: "CBSE" as Board,
    address: "Gachibowli, Hyderabad 500032",
    website: "https://nalanda.edu.in",
    about: "Science and math focused CBSE school",
  },
];

const TEACHERS = [
  {
    name: "Rajesh Kumar",
    city: "Chennai",
    qualification: "B.Sc (Maths), M.Ed",
    experience: "5-7 years",
    subjects: ["Mathematics", "Physics"],
    preferredBoards: ["CBSE", "ICSE"],
    expectedSalary: 45000,
  },
  {
    name: "Priya Sharma",
    city: "Chennai",
    qualification: "B.A (English), M.A (Literature)",
    experience: "3-5 years",
    subjects: ["English", "Literature"],
    preferredBoards: ["CBSE"],
    expectedSalary: 40000,
  },
  {
    name: "Amit Patel",
    city: "Bangalore",
    qualification: "B.Tech (CSE), B.Ed",
    experience: "2-3 years",
    subjects: ["Computer Science", "Mathematics"],
    preferredBoards: ["CBSE"],
    expectedSalary: 50000,
  },
  {
    name: "Sneha Gupta",
    city: "Bangalore",
    qualification: "B.Sc (Chemistry), M.Sc (Chemistry)",
    experience: "4-6 years",
    subjects: ["Chemistry", "Science"],
    preferredBoards: ["ICSE", "CBSE"],
    expectedSalary: 48000,
  },
  {
    name: "Vikram Singh",
    city: "Chennai",
    qualification: "B.A (History), M.A (History)",
    experience: "6-8 years",
    subjects: ["History", "Social Studies"],
    preferredBoards: ["CBSE"],
    expectedSalary: 42000,
  },
  {
    name: "Deepa Menon",
    city: "Hyderabad",
    qualification: "B.Sc (Biology), M.Ed",
    experience: "3-5 years",
    subjects: ["Biology", "Science"],
    preferredBoards: ["CBSE", "STATE_BOARD"],
    expectedSalary: 38000,
  },
  {
    name: "Arun Kumar",
    city: "Bangalore",
    qualification: "B.A (Economics), M.A (Economics)",
    experience: "5-7 years",
    subjects: ["Economics", "Social Studies"],
    preferredBoards: ["ICSE"],
    expectedSalary: 45000,
  },
  {
    name: "Anjali Desai",
    city: "Chennai",
    qualification: "B.A (Sanskrit), M.Ed",
    experience: "2-4 years",
    subjects: ["Sanskrit", "Languages"],
    preferredBoards: ["CBSE"],
    expectedSalary: 35000,
  },
  {
    name: "Karthik Iyer",
    city: "Hyderabad",
    qualification: "B.Tech (Mechanical), B.Ed",
    experience: "4-6 years",
    subjects: ["Physics", "Mathematics"],
    preferredBoards: ["CBSE"],
    expectedSalary: 52000,
  },
  {
    name: "Meera Nair",
    city: "Bangalore",
    qualification: "BFA (Fine Arts), M.Ed",
    experience: "3-5 years",
    subjects: ["Art", "Drawing"],
    preferredBoars: ["CBSE", "ICSE"],
    expectedSalary: 32000,
  },
  {
    name: "Suresh Kumar",
    city: "Chennai",
    qualification: "B.Sc (Maths), M.Phil",
    experience: "7-9 years",
    subjects: ["Mathematics", "Statistics"],
    preferredBoards: ["CBSE"],
    expectedSalary: 55000,
  },
  {
    name: "Lakshmi Iyer",
    city: "Bangalore",
    qualification: "B.A (English), DELTA",
    experience: "4-6 years",
    subjects: ["English", "Communication"],
    preferredBoards: ["ICSE"],
    expectedSalary: 43000,
  },
];

const JOBS_BY_SCHOOL = {
  0: [ // Sri Venkateswara
    {
      title: "Mathematics Teacher",
      subject: "Mathematics",
      gradeLevel: "9-10",
      experience: "3-5 years",
      salaryMin: 40000,
      salaryMax: 50000,
      description: "Experienced math teacher for high school. Should have expertise in algebra and geometry.",
    },
    {
      title: "English Teacher",
      subject: "English",
      gradeLevel: "6-8",
      experience: "2-4 years",
      salaryMin: 35000,
      salaryMax: 45000,
      description: "Dynamic English teacher to inspire young learners with communication and literature skills.",
    },
  ],
  1: [ // DPS Chennai
    {
      title: "Physics Teacher",
      subject: "Physics",
      gradeLevel: "11-12",
      experience: "5-7 years",
      salaryMin: 50000,
      salaryMax: 60000,
      description: "Senior physics teacher for senior secondary. Lab experience preferred.",
    },
    {
      title: "Computer Science Teacher",
      subject: "Computer Science",
      gradeLevel: "10-12",
      experience: "3-5 years",
      salaryMin: 45000,
      salaryMax: 55000,
      description: "Programming and coding expert to guide future tech leaders.",
    },
  ],
  2: [ // Chettinad
    {
      title: "Chemistry Teacher",
      subject: "Chemistry",
      gradeLevel: "9-12",
      experience: "4-6 years",
      salaryMin: 45000,
      salaryMax: 55000,
      description: "Chemistry specialist with practical lab experience. ICSE curriculum expertise.",
    },
    {
      title: "History Teacher",
      subject: "History",
      gradeLevel: "8-10",
      experience: "5-7 years",
      salaryMin: 40000,
      salaryMax: 50000,
      description: "Passionate history educator to make the past come alive for students.",
    },
  ],
  3: [ // Sri Aurobindo Bangalore
    {
      title: "Mathematics Teacher",
      subject: "Mathematics",
      gradeLevel: "5-7",
      experience: "2-4 years",
      salaryMin: 35000,
      salaryMax: 45000,
      description: "Primary teacher with Montessori background. Problem-solving approach required.",
    },
    {
      title: "Science Teacher",
      subject: "Science",
      gradeLevel: "6-8",
      experience: "3-5 years",
      salaryMin: 38000,
      salaryMax: 48000,
      description: "Science educator with hands-on experiment design skills.",
    },
  ],
  4: [ // Cathedral Bangalore
    {
      title: "Economics Teacher",
      subject: "Economics",
      gradeLevel: "11-12",
      experience: "5-7 years",
      salaryMin: 48000,
      salaryMax: 58000,
      description: "Economics expert for senior classes. Real-world application focus.",
    },
    {
      title: "Languages Teacher",
      subject: "Languages",
      gradeLevel: "7-10",
      experience: "3-5 years",
      salaryMin: 35000,
      salaryMax: 45000,
      description: "Multi-lingual teacher. French or German preferred.",
    },
  ],
  5: [ // Nalanda Hyderabad
    {
      title: "Physics Teacher",
      subject: "Physics",
      gradeLevel: "9-10",
      experience: "4-6 years",
      salaryMin: 42000,
      salaryMax: 52000,
      description: "Physics teacher with strong fundamentals and problem-solving approach.",
    },
    {
      title: "Biology Teacher",
      subject: "Biology",
      gradeLevel: "9-12",
      experience: "3-5 years",
      salaryMin: 40000,
      salaryMax: 50000,
      description: "Biology educator with lab management and research guidance.",
    },
  ],
};

async function clearAllData() {
  console.log("🗑️  Clearing existing data...");
  // Order matters due to foreign key constraints
  await prisma.alertHistory.deleteMany();
  await prisma.jobAlert.deleteMany();
  await prisma.applicationStatusHistory.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.application.deleteMany();
  await prisma.resume.deleteMany();
  await prisma.savedJob.deleteMany();
  await prisma.aIMatchScore.deleteMany();
  await prisma.jobBenefit.deleteMany();
  await prisma.jobRequirement.deleteMany();
  await prisma.jobPosting.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.teacherProfile.deleteMany();
  await prisma.schoolProfile.deleteMany();
  await prisma.user.deleteMany();
  console.log("✓ All data cleared\n");
}

async function seedSchools() {
  console.log("🏫 Creating schools...");
  const createdSchools = [];

  for (let i = 0; i < SCHOOLS.length; i++) {
    const schoolData = SCHOOLS[i];
    const user = await prisma.user.create({
      data: {
        email: `admin${i + 1}@${schoolData.name.replace(/\s+/g, "").toLowerCase()}.edu`,
        name: `${schoolData.name} Admin`,
        role: "SCHOOL_ADMIN",
        phone: `+91 ${9000000000 + i}`,
        emailVerified: true,
        hashedPassword: await hash("password123", 10),
      },
    });

    const school = await prisma.schoolProfile.create({
      data: {
        userId: user.id,
        schoolName: schoolData.name,
        city: schoolData.city,
        board: schoolData.board,
        address: schoolData.address,
        website: schoolData.website,
        about: schoolData.about,
        verified: true,
      },
    });

    createdSchools.push({ user, school });
    console.log(`  ✓ ${schoolData.name}`);
  }

  return createdSchools;
}

async function seedTeachers() {
  console.log("\n👨‍🏫 Creating teachers...");
  const createdTeachers = [];

  for (let i = 0; i < TEACHERS.length; i++) {
    const teacherData = TEACHERS[i];
    const user = await prisma.user.create({
      data: {
        email: `teacher${i + 1}@eduhire.in`,
        name: teacherData.name,
        role: "TEACHER",
        phone: `+91 ${8000000000 + i}`,
        emailVerified: true,
        hashedPassword: await hash("password123", 10),
      },
    });

    const profile = await prisma.teacherProfile.create({
      data: {
        userId: user.id,
        qualification: teacherData.qualification,
        city: teacherData.city,
        subjects: teacherData.subjects,
        preferredBoards: teacherData.preferredBoards,
        experience: teacherData.experience,
        expectedSalary: teacherData.expectedSalary,
        availabilityStatus: "ACTIVELY_LOOKING",
      },
    });

    createdTeachers.push({ user, profile });
    console.log(`  ✓ ${teacherData.name} (${teacherData.city})`);
  }

  return createdTeachers;
}

async function seedJobs(schools: any[]) {
  console.log("\n📋 Creating jobs...");
  const createdJobs = [];

  for (let i = 0; i < schools.length; i++) {
    const school = schools[i];
    const jobs = (JOBS_BY_SCHOOL as any)[i];

    for (const jobData of jobs) {
      const job = await prisma.jobPosting.create({
        data: {
          schoolId: school.school.id,
          postedBy: school.user.id,
          title: jobData.title,
          subject: jobData.subject,
          board: school.school.board,
          gradeLevel: jobData.gradeLevel,
          jobType: "FULL_TIME" as JobType,
          experience: jobData.experience,
          salaryMin: jobData.salaryMin,
          salaryMax: jobData.salaryMax,
          description: jobData.description,
          status: "ACTIVE",
          postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Add requirements
      await prisma.jobRequirement.createMany({
        data: [
          { jobId: job.id, text: "Bachelor's degree in relevant field", sortOrder: 0 },
          { jobId: job.id, text: "Teaching certification", sortOrder: 1 },
          { jobId: job.id, text: "Strong communication skills", sortOrder: 2 },
        ],
      });

      // Add benefits
      await prisma.jobBenefit.createMany({
        data: [
          { jobId: job.id, text: "Competitive salary", sortOrder: 0 },
          { jobId: job.id, text: "Health insurance", sortOrder: 1 },
          { jobId: job.id, text: "Professional development", sortOrder: 2 },
          { jobId: job.id, text: "Flexible working hours", sortOrder: 3 },
        ],
      });

      createdJobs.push(job);
      console.log(`  ✓ ${jobData.title} at ${school.school.schoolName}`);
    }
  }

  return createdJobs;
}

async function seedApplications(teachers: any[], jobs: any[]) {
  console.log("\n📝 Creating applications...");
  let appCount = 0;

  // Each teacher applies for 2-3 relevant jobs
  for (const teacher of teachers) {
    // Find matching jobs based on subject
    const matchingJobs = jobs.filter((job: any) =>
      teacher.profile.subjects.some((s: string) =>
        job.subject.toLowerCase().includes(s.toLowerCase()) ||
        job.description.toLowerCase().includes(s.toLowerCase())
      )
    );

    // If no exact match, get any 2-3 jobs from their city or nearby
    let jobsToApply: any[] = [];
    if (matchingJobs.length >= 2) {
      jobsToApply = matchingJobs.slice(0, 3);
    } else {
      // Sample 2-3 random jobs
      const randJobs = jobs.sort(() => Math.random() - 0.5).slice(0, 3);
      jobsToApply = [...matchingJobs, ...randJobs].slice(0, 3);
    }

    for (const job of jobsToApply) {
      const application = await prisma.application.create({
        data: {
          jobId: job.id,
          applicantId: teacher.user.id,
          coverLetter: `I am interested in the ${job.title} position at ${job.school?.schoolName || "your school"}. With my ${teacher.profile.experience} of experience in ${teacher.profile.subjects[0]}, I am confident I can contribute significantly to your institution.`,
          status: Math.random() > 0.5 ? "PENDING" : "REVIEWED",
          appliedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      });

      appCount++;

      // Create application status history entry
      await prisma.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          fromStatus: "PENDING",
          toStatus: application.status,
          changedBy: job.postedBy,
          changedAt: application.appliedAt,
        },
      });
    }

    console.log(`  ✓ ${teacher.profile.city} - ${teacher.user.name} applied for ${jobsToApply.length} jobs`);
  }

  console.log(`\n  Total applications created: ${appCount}`);
  return appCount;
}

async function main() {
  try {
    console.log("═══════════════════════════════════════════════");
    console.log("    🌱 Phase 4 Database Seed Script 🌱");
    console.log("═══════════════════════════════════════════════\n");

    await clearAllData();

    const schools = await seedSchools();
    const teachers = await seedTeachers();

    // Fetch all jobs with school info
    const allJobs = await prisma.jobPosting.findMany({
      include: { school: true },
    });

    await seedJobs(schools);
    const jobsWithSchool = await prisma.jobPosting.findMany({
      include: { school: true },
    });

    await seedApplications(teachers, jobsWithSchool);

    console.log("\n═══════════════════════════════════════════════");
    console.log("✅ Seed complete! Summary:");
    console.log(`   • Schools: ${SCHOOLS.length}`);
    console.log(`   • Teachers: ${TEACHERS.length}`);
    console.log(`   • Jobs: ${allJobs.length + jobsWithSchool.length}`);
    console.log("═══════════════════════════════════════════════\n");

    console.log("📧 Test Credentials:");
    console.log("   Teachers: teacher1@eduhire.in - teacher12@eduhire.in (password: password123)");
    console.log("   Schools: admin1-6@school.edu (password: password123)\n");

    console.log("🚀 You can now test:");
    console.log("   • /dashboard/recommendations (AI matching)");
    console.log("   • /dashboard/interviews (view interviews)");
    console.log("   • Schedule interviews from school admin\n");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
