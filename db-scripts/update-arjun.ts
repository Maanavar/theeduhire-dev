import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateArjunProfile() {
  try {
    // Find Arjun's user account
    const user = await prisma.user.findUnique({
      where: { email: "teacher2@example.com" },
      include: { teacherProfile: true },
    });

    if (!user) {
      console.error("Arjun not found");
      return;
    }

    console.log("Found Arjun:", user.name);

    // Update user with avatar and phone
    await prisma.user.update({
      where: { id: user.id },
      data: {
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun",
        phone: "+91 98765 43210",
      },
    });
    console.log("✓ User profile updated (avatar & phone)");

    // Update teacher profile
    const teacherProfile = user.teacherProfile;

    await prisma.teacherProfile.update({
      where: { userId: user.id },
      data: {
        city: "Coimbatore",
        subjects: ["Physics", "Chemistry"],
        preferredBoards: ["CBSE", "ICSE"],
        preferredGrades: ["9-12", "11-12"],
        qualification: "M.Sc Physics with B.Ed",
        experience: "12+ years",
        currentSchool: "Velammal Vidyalaya, Coimbatore",
        expectedSalary: 65000,
        availabilityStatus: "ACTIVELY_LOOKING",
        bio: "Dedicated Physics & Chemistry educator with 12+ years of experience in CBSE and ICSE curriculum. Specialized in making complex concepts engaging through practical demonstrations and digital teaching aids. Strong track record of improving student performance in competitive exams (JEE, NEET). Passionate about mentoring and creating a collaborative learning environment.",
      },
    });
    console.log("✓ Teacher profile updated");

    // Add work experiences
    if (teacherProfile) {
      const exp1 = await prisma.experience.create({
        data: {
          teacherProfileId: teacherProfile.id,
          schoolName: "Velammal Vidyalaya",
          role: "PGT Physics (Senior Teacher)",
          startDate: new Date("2020-01-15"),
          endDate: null,
          isCurrent: true,
          description: "Lead Physics educator for classes 11-12. Designed and implemented STEM curriculum, mentored JEE aspirants, achieved 95%+ pass rate in board exams.",
        },
      });
      console.log("✓ Experience 1 added (current)");

      const exp2 = await prisma.experience.create({
        data: {
          teacherProfileId: teacherProfile.id,
          schoolName: "Sri Aurobindo Pathanam",
          role: "TGT Physics & Chemistry",
          startDate: new Date("2015-06-01"),
          endDate: new Date("2019-12-31"),
          isCurrent: false,
          description: "Taught Physics and Chemistry to classes 9-12. Organized science exhibitions and laboratory practical sessions. Mentored 200+ students over 4.5 years.",
        },
      });
      console.log("✓ Experience 2 added");

      const exp3 = await prisma.experience.create({
        data: {
          teacherProfileId: teacherProfile.id,
          schoolName: "Delhi Public School",
          role: "TGT Physics",
          startDate: new Date("2012-04-01"),
          endDate: new Date("2015-05-31"),
          isCurrent: false,
          description: "Physics educator for middle and senior secondary. Implemented activity-based learning approach, conducted laboratory demonstrations.",
        },
      });
      console.log("✓ Experience 3 added");

      // Add certifications
      const cert1 = await prisma.certification.create({
        data: {
          teacherProfileId: teacherProfile.id,
          name: "JEE Main & Advanced Coaching Certification",
          issuedBy: "Vedic Maths Academy",
          issuedAt: new Date("2018-06-15"),
          expiresAt: null,
          credentialId: "JEEC-2018-001",
        },
      });
      console.log("✓ Certification 1 added");

      const cert2 = await prisma.certification.create({
        data: {
          teacherProfileId: teacherProfile.id,
          name: "Smart Classroom Technologies",
          issuedBy: "Microsoft Educator Academy",
          issuedAt: new Date("2021-03-10"),
          expiresAt: new Date("2026-03-10"),
          credentialId: "MSE-2021-456",
        },
      });
      console.log("✓ Certification 2 added");

      const cert3 = await prisma.certification.create({
        data: {
          teacherProfileId: teacherProfile.id,
          name: "Online Teaching & Digital Pedagogy",
          issuedBy: "British Council",
          issuedAt: new Date("2020-11-20"),
          expiresAt: null,
          credentialId: "BC-2020-789",
        },
      });
      console.log("✓ Certification 3 added");
    }

    // Add resume
    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        fileName: "Arjun_Venkatesh_Resume.pdf",
        fileUrl: "https://example.com/resumes/arjun_venkatesh.pdf",
        fileSize: 245000,
      },
    });
    console.log("✓ Resume added");

    console.log("\n✅ Arjun Venkatesh profile now 100% complete!");
    console.log("\nProfile Summary:");
    console.log("  📍 City: Coimbatore");
    console.log("  📅 Experience: 12+ years");
    console.log("  🔔 Status: ACTIVELY_LOOKING");
    console.log("  📚 Subjects: Physics, Chemistry");
    console.log("  🏫 Preferred Boards: CBSE, ICSE");
    console.log("  🎓 Qualification: M.Sc Physics with B.Ed");
    console.log("  💼 Work Experiences: 3 entries");
    console.log("  🏅 Certifications: 3 entries");
    console.log("  📄 Resume: Uploaded");
    console.log("  💰 Expected Salary: ₹65,000/month");
    console.log("  🖼️  Avatar: Set");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateArjunProfile();
