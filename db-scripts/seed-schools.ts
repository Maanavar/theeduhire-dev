import { PrismaClient, Board, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

function getSeedPassword() {
  const password = process.env.SEED_DEFAULT_PASSWORD?.trim();
  if (!password || password.length < 8) {
    throw new Error("SEED_DEFAULT_PASSWORD must be set and at least 8 characters long.");
  }
  return password;
}

async function main() {
  console.log("Seeding school admin accounts...");

  const password = await hash(getSeedPassword(), 12);

  const schools = [
    {
      user: { email: "admin@dpsmadurai.edu.in", name: "Rajesh Kumar", phone: "0452-2345678" },
      profile: {
        schoolName: "Delhi Public School",
        city: "Madurai",
        board: Board.CBSE,
        address: "NH-45B, Palanganatham, Madurai 625003",
        website: "https://dpsmadurai.edu.in",
        about: "Delhi Public School Madurai is a premier CBSE institution offering world-class education with state-of-the-art infrastructure, smart classrooms, and a focus on holistic development.",
        verified: true,
      },
    },
    {
      user: { email: "hr@ryaninternational.in", name: "Priya Sharma", phone: "044-9876543" },
      profile: {
        schoolName: "Ryan International School",
        city: "Chennai",
        board: Board.ICSE,
        address: "OMR Road, Thoraipakkam, Chennai 600097",
        website: "https://ryaninternational.in",
        about: "Ryan International School Chennai follows the ICSE curriculum with emphasis on innovation, leadership, and value-based education.",
        verified: true,
      },
    },
    {
      user: { email: "recruit@velammal.edu.in", name: "Lakshmi Narayanan", phone: "0422-1234567" },
      profile: {
        schoolName: "Velammal Vidyalaya",
        city: "Coimbatore",
        board: Board.CBSE,
        address: "Vilankurichi Road, Coimbatore 641035",
        website: "https://velammal.edu.in",
        about: "Velammal Vidyalaya Coimbatore is known for activity-based learning and excellent board results.",
        verified: true,
      },
    },
  ];

  for (const school of schools) {
    const existingUser = await prisma.user.findUnique({
      where: { email: school.user.email },
    });

    if (existingUser) {
      console.log(`  School admin ${school.user.email} already exists, skipping...`);
      continue;
    }

    const user = await prisma.user.create({
      data: {
        email: school.user.email,
        name: school.user.name,
        phone: school.user.phone,
        role: UserRole.SCHOOL_ADMIN,
        emailVerified: true,
        hashedPassword: password,
      },
    });

    await prisma.schoolProfile.create({
      data: { userId: user.id, ...school.profile },
    });

    console.log(`  Created school admin: ${school.user.name} (${school.profile.schoolName})`);
  }

  console.log("\nSchool admin seeding complete.");
}

main()
  .catch((error) => {
    console.error("School seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
