// prisma/seed.ts
// Run: npx tsx prisma/seed.ts
// Seeds: 6 school users + profiles, 12 job postings with requirements & benefits

import { PrismaClient, Board, JobType, JobStatus, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding EduHire database...\n");

  await prisma.savedJob.deleteMany();
  await prisma.application.deleteMany();
  await prisma.resume.deleteMany();
  await prisma.jobBenefit.deleteMany();
  await prisma.jobRequirement.deleteMany();
  await prisma.jobPosting.deleteMany();
  await prisma.schoolProfile.deleteMany();
  await prisma.teacherProfile.deleteMany();
  await prisma.user.deleteMany();
  console.log("  Cleaned existing data");

  const password = await hash("eduhire2026", 12);

  const schools = [
    {
      user: { email: "admin@dpsmadurai.edu.in", name: "Rajesh Kumar", phone: "0452-2345678" },
      profile: { schoolName: "Delhi Public School", city: "Madurai", board: Board.CBSE, address: "NH-45B, Palanganatham, Madurai 625003", website: "https://dpsmadurai.edu.in", about: "Delhi Public School Madurai is a premier CBSE institution offering world-class education with state-of-the-art infrastructure, smart classrooms, and a focus on holistic development.", verified: true },
    },
    {
      user: { email: "hr@ryaninternational.in", name: "Priya Sharma", phone: "044-9876543" },
      profile: { schoolName: "Ryan International School", city: "Chennai", board: Board.ICSE, address: "OMR Road, Thoraipakkam, Chennai 600097", website: "https://ryaninternational.in", about: "Ryan International School Chennai follows the ICSE curriculum with emphasis on innovation, leadership, and value-based education.", verified: true },
    },
    {
      user: { email: "recruit@velammal.edu.in", name: "Lakshmi Narayanan", phone: "0422-1234567" },
      profile: { schoolName: "Velammal Vidyalaya", city: "Coimbatore", board: Board.CBSE, address: "Vilankurichi Road, Coimbatore 641035", website: "https://velammal.edu.in", about: "Velammal Vidyalaya Coimbatore is known for activity-based learning and excellent board results.", verified: true },
    },
    {
      user: { email: "hr@amitytrichy.edu.in", name: "Suresh Babu", phone: "0431-5678901" },
      profile: { schoolName: "Amity International School", city: "Trichy", board: Board.CBSE, address: "Thillai Nagar, Tiruchirappalli 620018", website: "https://amitytrichy.edu.in", about: "Amity International School Trichy offers rigorous academics with extensive co-curricular activities and continuous professional development.", verified: true },
    },
    {
      user: { email: "principal@sethupathi.tn.edu.in", name: "Muthu Selvam", phone: "0452-8901234" },
      profile: { schoolName: "Sethupathi Higher Secondary School", city: "Madurai", board: Board.STATE_BOARD, address: "Simmakkal, Madurai 625001", website: "https://sethupathi.tn.edu.in", about: "One of Madurai's oldest and most respected State Board institutions with strong Tamil literary traditions and academic excellence.", verified: true },
    },
    {
      user: { email: "careers@davmadurai.edu.in", name: "Anand Krishnan", phone: "0452-6789012" },
      profile: { schoolName: "DAV Public School", city: "Madurai", board: Board.CBSE, address: "KK Nagar, Madurai 625020", website: "https://davmadurai.edu.in", about: "DAV Public School Madurai combines traditional values with modern education, strong STEM focus with coding labs and robotics clubs.", verified: false },
    },
  ];

  const schoolRecords: { userId: string; schoolId: string; board: Board }[] = [];

  for (const s of schools) {
    const user = await prisma.user.create({
      data: { email: s.user.email, name: s.user.name, phone: s.user.phone, role: UserRole.SCHOOL_ADMIN, emailVerified: true, hashedPassword: password },
    });
    const school = await prisma.schoolProfile.create({
      data: { userId: user.id, ...s.profile },
    });
    schoolRecords.push({ userId: user.id, schoolId: school.id, board: s.profile.board });
    console.log(`  ✓ School: ${s.profile.schoolName} (${s.profile.city})`);
  }

  const jobsData = [
    { schoolIdx: 0, title: "PGT Mathematics", subject: "Mathematics", gradeLevel: "9-12", jobType: JobType.FULL_TIME, experience: "3-5 years", salaryMin: 45000, salaryMax: 65000, description: "We are looking for a passionate PGT Mathematics teacher to join our vibrant team at DPS Madurai. The ideal candidate will have a strong command over the CBSE curriculum for classes 9-12, with the ability to make complex concepts like calculus, coordinate geometry, and probability accessible and engaging.\n\nYou will be responsible for lesson planning aligned with NCERT guidelines, conducting periodic assessments, preparing students for board exams and competitive tests (JEE, NEET), and contributing to the school's consistently strong mathematics results.", requirements: ["M.Sc Mathematics with B.Ed from a recognized university", "Minimum 3 years teaching experience in CBSE senior secondary", "Proficiency in smart classroom tools and digital teaching aids", "Experience with JEE/NEET competitive exam coaching preferred", "Strong command over English for medium of instruction"], benefits: ["PF & ESI coverage", "Free lunch during school hours", "Professional development allowance ₹15,000/year", "Annual increment based on performance review", "Children's education fee waiver (50%)", "Air-conditioned staffroom"], daysAgo: 2 },
    { schoolIdx: 0, title: "PGT Chemistry", subject: "Chemistry", gradeLevel: "11-12", jobType: JobType.FULL_TIME, experience: "5+ years", salaryMin: 50000, salaryMax: 70000, description: "DPS Madurai seeks an experienced PGT Chemistry teacher for our senior secondary science stream. The role involves teaching Organic, Inorganic, and Physical Chemistry to classes 11-12, managing the chemistry laboratory, and preparing students for CBSE boards and NEET.\n\nWe are looking for someone who can mentor students in science olympiads and contribute to our strong track record of 95%+ results in chemistry.", requirements: ["M.Sc Chemistry with B.Ed", "5+ years experience teaching CBSE Chemistry at +2 level", "Expertise in laboratory safety and practical examination preparation", "Track record of strong student board exam performance", "NEET coaching experience strongly preferred"], benefits: ["Competitive salary with annual increments", "Medical insurance for self and family", "Dedicated chemistry lab assistant support", "Conference attendance allowance", "On-campus housing available"], daysAgo: 5 },
    { schoolIdx: 1, title: "TGT English", subject: "English", gradeLevel: "6-8", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 35000, salaryMax: 50000, description: "Ryan International School Chennai is hiring a creative TGT English teacher for our middle school. We seek someone who can inspire a love of literature and strong communication skills in students aged 11-14.\n\nThe role involves designing engaging lesson plans that integrate classic and contemporary literature, teaching grammar through contextual methods, and facilitating creative writing workshops.", requirements: ["MA English / English Literature with B.Ed", "2+ years teaching experience in ICSE or CBSE middle school", "Strong communication, presentation, and classroom management skills", "Familiarity with NEP 2020 guidelines", "Experience conducting literary events or debates preferred"], benefits: ["Health insurance for self and dependents", "School transport facility", "Annual performance bonus", "Paid summer training programs", "Access to Ryan Group's teacher exchange program"], daysAgo: 1 },
    { schoolIdx: 1, title: "Art & Craft Teacher", subject: "Art & Craft", gradeLevel: "1-5", jobType: JobType.PART_TIME, experience: "1-3 years", salaryMin: 18000, salaryMax: 25000, description: "We're looking for a creative Art & Craft teacher for our primary section. The ideal candidate can teach drawing, painting, clay modeling, origami, and mixed-media art to children aged 6-10.\n\nYou'll plan age-appropriate art activities, organize exhibitions, and integrate art with other subjects through project-based learning.", requirements: ["BFA or Diploma in Fine Arts / Applied Arts", "1+ year experience teaching art to young children", "Portfolio of student work or personal artwork", "Patience, creativity, and ability to manage young learners"], benefits: ["Flexible 4-hour schedule (8:30 AM - 12:30 PM)", "Art supplies and materials provided", "Festival bonus", "Opportunity to transition to full-time"], daysAgo: 3 },
    { schoolIdx: 2, title: "Primary Teacher (All Subjects)", subject: "All Subjects", gradeLevel: "1-5", jobType: JobType.FULL_TIME, experience: "1-3 years", salaryMin: 25000, salaryMax: 38000, description: "Join Velammal Vidyalaya Coimbatore as a Primary Teacher handling all subjects for grades 1-5. We're looking for a nurturing educator who creates a joyful learning environment using activity-based and experiential methods.\n\nOur primary section emphasizes learning through play, projects, and exploration, aligned with NEP 2020's foundational stage guidelines.", requirements: ["B.Ed or D.El.Ed from a recognized institution", "Minimum 1 year teaching experience in primary classes", "Knowledge of activity-based and play-based learning methods", "Fluency in both English and Tamil (mandatory)", "Basic computer literacy for smart classroom usage"], benefits: ["Provident Fund", "Complimentary meals during school hours", "Festival bonus and annual increment", "Creche facility for staff with young children", "Regular in-house training workshops"], daysAgo: 4 },
    { schoolIdx: 3, title: "PGT Physics", subject: "Physics", gradeLevel: "11-12", jobType: JobType.FULL_TIME, experience: "5+ years", salaryMin: 50000, salaryMax: 75000, description: "Amity International School Trichy is seeking an experienced PGT Physics teacher for senior secondary classes. The candidate should excel at making Physics intuitive through demonstrations, experiments, and real-world applications.\n\nResponsibilities include preparing students for CBSE board exams and competitive entrance tests (JEE Main & Advanced, NEET).", requirements: ["M.Sc Physics with B.Ed from a reputed university", "5+ years of teaching experience at CBSE +2 level", "Proven track record of strong board exam results", "JEE/NEET coaching experience strongly preferred", "Ability to design and conduct practical experiments"], benefits: ["Highly competitive salary package", "Housing allowance ₹8,000/month", "Children's education fee waiver (100%)", "Paid research sabbatical every 3 years", "Medical insurance and annual health checkup", "Teacher of the Year award program"], daysAgo: 6 },
    { schoolIdx: 3, title: "Physical Education Teacher", subject: "Physical Education", gradeLevel: "6-8", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 30000, salaryMax: 42000, description: "We need a dynamic Physical Education teacher for our middle school. The role involves conducting daily PE classes, coaching school sports teams, and organizing inter-school sports events.\n\nThe ideal candidate has experience in multiple sports and can develop age-appropriate fitness programs.", requirements: ["B.P.Ed or M.P.Ed from a recognized university", "2+ years experience as a PE teacher in a school setting", "Coaching certification in at least 2 sports", "First aid and CPR certification preferred", "Strong organizational skills for event management"], benefits: ["Sports equipment and uniform provided", "Coaching bonus for inter-school tournament wins", "Summer sports camp income opportunity", "Medical insurance", "Annual sports conference attendance"], daysAgo: 8 },
    { schoolIdx: 4, title: "Tamil Language Teacher", subject: "Tamil", gradeLevel: "9-12", jobType: JobType.FULL_TIME, experience: "3-5 years", salaryMin: 30000, salaryMax: 45000, description: "Sethupathi Higher Secondary School needs a passionate Tamil teacher who can bring our rich literary heritage alive in the classroom.\n\nThe role involves teaching Tamil literature, grammar, and composition for classes 9-12 under the Tamil Nadu State Board curriculum, covering Sangam literature, modern Tamil prose and poetry.", requirements: ["MA Tamil with B.Ed from a recognized university", "Strong knowledge of Sangam literature, Thirukkural, and modern Tamil works", "3+ years teaching experience in State Board curriculum", "Excellent spoken and written Tamil", "Ability to conduct literary events and Tamil cultural programs"], benefits: ["PF & ESI coverage", "Annual increment as per pay revision", "Festival advance (Pongal and Deepavali)", "Staff quarters available on campus", "Leave encashment facility"], daysAgo: 3 },
    { schoolIdx: 4, title: "TGT Social Science", subject: "Social Science", gradeLevel: "6-8", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 28000, salaryMax: 40000, description: "We're hiring a Social Science teacher for our middle school section covering History, Geography, Civics, and Economics under the Tamil Nadu State Board syllabus.\n\nWe're looking for a teacher who can make social studies engaging through map-based learning, historical timelines, local field trips, and project work.", requirements: ["MA in History, Geography, or Political Science with B.Ed", "2+ years teaching experience in State Board middle school", "Ability to organize educational field trips and projects", "Competency in using maps, charts, and digital teaching aids", "Knowledge of local history and culture preferred"], benefits: ["PF & ESI", "Free meals during school hours", "Annual increment", "Field trip allowance for educational visits", "Library access with 20,000+ books"], daysAgo: 7 },
    { schoolIdx: 5, title: "Computer Science Teacher", subject: "Computer Science", gradeLevel: "9-12", jobType: JobType.FULL_TIME, experience: "2-5 years", salaryMin: 40000, salaryMax: 60000, description: "DAV Public School Madurai needs a Computer Science teacher proficient in Python, Java, and modern web technologies. You'll teach classes 9-12, manage the computer lab, and lead the school's coding club.\n\nWe want someone who can make programming exciting and practical, connecting classroom concepts to real-world applications.", requirements: ["B.Tech / MCA / M.Sc CS with B.Ed", "Proficiency in Python, Java, SQL, and web technologies", "2+ years experience with CBSE CS / IP curriculum", "Ability to conduct coding workshops and manage a computer lab", "Knowledge of AI/ML basics is a plus"], benefits: ["AC computer lab and staffroom", "Laptop provided for personal use", "Tech conference allowance ₹20,000/year", "Flexible afternoon schedule for coding club", "Access to online learning platforms", "Annual increment and performance bonus"], daysAgo: 1 },
    { schoolIdx: 5, title: "Music Teacher (Carnatic)", subject: "Music", gradeLevel: "1-5", jobType: JobType.PART_TIME, experience: "Fresher", salaryMin: 15000, salaryMax: 22000, description: "DAV Public School Madurai is looking for a Carnatic music teacher for our primary section. You'll introduce young children to the basics of Carnatic music including swaras, simple keerthanas, bhajans, and rhythmic patterns.\n\nThis is a part-time role (morning session). We welcome fresh graduates passionate about sharing Tamil Nadu's rich musical heritage.", requirements: ["Diploma or degree in Carnatic Music", "Ability to teach vocals and basic instruments", "Patience and ability to engage children aged 5-10", "Willingness to participate in school cultural events"], benefits: ["Flexible 4-hour morning schedule", "Music room with instruments provided", "Festival bonus", "Free lunch on working days", "Opportunity to conduct paid evening classes on campus"], daysAgo: 10 },
    { schoolIdx: 2, title: "Montessori Directress", subject: "Early Childhood", gradeLevel: "Pre-K", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 22000, salaryMax: 32000, description: "Velammal Vidyalaya Coimbatore is looking for a certified Montessori Directress to lead our pre-primary program for children aged 2.5 to 6 years.\n\nYou'll create a prepared Montessori environment across the five Montessori areas and maintain detailed developmental progress records for each child.", requirements: ["Montessori certification from AMI, AMS, or Indian Montessori Centre", "2+ years experience running a Montessori classroom", "Deep understanding of child development milestones (ages 2-6)", "Patience, empathy, and genuine passion for early childhood education", "Fluency in English and Tamil"], benefits: ["Small class size (max 20 children with assistant)", "Creative freedom in classroom design", "Professional development workshops", "Friendly and supportive work culture", "Provident Fund and medical leave", "School transport facility"], daysAgo: 5 },
  ];

  for (const j of jobsData) {
    const school = schoolRecords[j.schoolIdx];
    const postedAt = new Date(Date.now() - j.daysAgo * 86400000);

    const job = await prisma.jobPosting.create({
      data: {
        schoolId: school.schoolId, postedBy: school.userId,
        title: j.title, subject: j.subject, board: school.board, gradeLevel: j.gradeLevel,
        jobType: j.jobType, experience: j.experience, salaryMin: j.salaryMin, salaryMax: j.salaryMax,
        description: j.description, status: JobStatus.ACTIVE, postedAt,
      },
    });

    for (let i = 0; i < j.requirements.length; i++) {
      await prisma.jobRequirement.create({ data: { jobId: job.id, text: j.requirements[i], sortOrder: i } });
    }
    for (let i = 0; i < j.benefits.length; i++) {
      await prisma.jobBenefit.create({ data: { jobId: job.id, text: j.benefits[i], sortOrder: i } });
    }
    console.log(`  ✓ Job: ${j.title} @ ${schools[j.schoolIdx].profile.schoolName}`);
  }

  const teacherData = [
    { email: "teacher1@example.com", name: "Kavitha Rajan", phone: "+91 98765 43210" },
    { email: "teacher2@example.com", name: "Arjun Venkatesh", phone: "+91 87654 32109" },
  ];

  for (const t of teacherData) {
    const user = await prisma.user.create({
      data: { email: t.email, name: t.name, phone: t.phone, role: UserRole.TEACHER, emailVerified: true, hashedPassword: password },
    });
    await prisma.teacherProfile.create({
      data: { userId: user.id, city: "Madurai", subjects: ["Mathematics", "Physics"], preferredBoards: ["CBSE"], preferredGrades: ["9-12", "11-12"] },
    });
    console.log(`  ✓ Teacher: ${t.name}`);
  }

  await prisma.user.create({
    data: { email: "admin@theeduhire.in", name: "EduHire Admin", role: UserRole.ADMIN, emailVerified: true, hashedPassword: password },
  });
  console.log("  ✓ Admin: admin@theeduhire.in");
  console.log("\n✅ Seed complete! (6 schools, 12 jobs, 2 teachers, 1 admin)");
  console.log("   Password for all accounts: eduhire2026");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
