#!/usr/bin/env node

import {
  ApplicationStatus,
  AvailabilityStatus,
  Board,
  ExperienceLevel,
  JobStatus,
  JobType,
  PrismaClient,
  RejectionReason,
  SchoolVerificationStatus,
  TeacherVerificationStatus,
  UserRole,
} from "@prisma/client";
import { hash } from "bcryptjs";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { assertDestructiveDbScriptAllowed } from "../scripts/lib/script-safety";

const prisma = new PrismaClient();
const ROOT_ADMIN_PASSWORD = "Password@123";
const SHARED_STAKEHOLDER_PASSWORD = "Mind@123";
const RESUME_URL = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
const DAY_MS = 24 * 60 * 60 * 1000;

const REQUIREMENTS = [
  "Relevant degree with B.Ed or equivalent",
  "Strong classroom management and communication",
  "Comfort with digital teaching tools",
  "Ability to prepare lesson plans aligned with curriculum standards",
  "Experience with student assessment and feedback cycles",
];

const BENEFITS = [
  "Medical insurance for self and family",
  "Annual increment based on performance",
  "Professional development support and training budget",
  "EPF and gratuity as per norms",
  "Summer and winter vacation pay",
];

type SchoolSeed = {
  adminName: string;
  adminEmail: string;
  phone: string;
  schoolName: string;
  city: string;
  board: Board;
  address: string;
  website: string;
  about: string;
  subjectPlan: string[];
};

type JobBlueprint = {
  titleKind: "PGT" | "TGT" | "PRIMARY" | "SPECIALIST" | "COORDINATOR";
  gradeLevel: string;
  jobType: JobType;
  experience: string;
  experienceLevel: ExperienceLevel;
  salaryMin: number;
  salaryMax: number;
  isUrgent: boolean;
  requiredWithin48h: boolean;
  requiresTet: boolean;
  daysAgo: number;
};

type TeacherCategory = "HIGH" | "AVERAGE" | "MISMATCH";

type TeacherTemplate = {
  qualification: string;
  experience: string;
  currentSchoolPrefix: string;
  bio: string;
  subjects: string[];
  preferredBoards: Board[];
  preferredGrades: string[];
  expectedSalary: number;
  roleTitle: string;
  certName: string;
  availabilityStatus: AvailabilityStatus;
};

type TeacherSeed = TeacherTemplate & {
  name: string;
  email: string;
  phone: string;
  city: string;
  category: TeacherCategory;
  slot: number;
  familyIndex: number;
};

type SchoolRecord = {
  userId: string;
  schoolId: string;
  schoolName: string;
  board: Board;
  city: string;
};

type JobRecord = {
  id: string;
  schoolId: string;
  postedBy: string;
  schoolName: string;
  city: string;
  board: Board;
  subject: string;
  categoryIndex: number;
  slot: number;
  postedAt: Date;
};

type TeacherRecord = {
  userId: string;
  name: string;
  category: TeacherCategory;
  slot: number;
};

function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    if (process.env[key] !== undefined) continue;

    let value = trimmed.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function avatarUrl(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111827&color=fff`;
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * DAY_MS);
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function scoreFor(category: TeacherCategory, slot: number, cohort: number) {
  if (category === "HIGH") {
    return 0.86 + ((slot + cohort) % 5) * 0.018;
  }
  if (category === "AVERAGE") {
    return 0.58 + ((slot + cohort) % 4) * 0.025;
  }
  return 0.12 + ((slot + cohort) % 5) * 0.028;
}

function breakdownFor(category: TeacherCategory, slot: number, cohort: number) {
  const score = scoreFor(category, slot, cohort);
  const subject = Math.min(0.98, score + (category === "HIGH" ? 0.03 : category === "AVERAGE" ? 0.01 : -0.03));
  const board = Math.min(0.98, score + (category === "HIGH" ? 0.02 : category === "AVERAGE" ? 0.0 : -0.04));
  const city = Math.min(0.98, score + (category === "HIGH" ? 0.01 : category === "AVERAGE" ? 0.0 : -0.02));
  const salary = Math.min(0.98, score + (category === "HIGH" ? 0.02 : category === "AVERAGE" ? 0.01 : -0.01));
  const experience = Math.min(0.98, score + (category === "HIGH" ? 0.01 : category === "AVERAGE" ? 0.0 : -0.02));

  return { subject, board, city, salary, experience };
}

function statusForCategory(category: TeacherCategory) {
  if (category === "HIGH") {
    return {
      status: ApplicationStatus.SHORTLISTED,
      note: "Strong match and shortlisted for the next review round.",
      rejectionReason: null,
    };
  }

  if (category === "AVERAGE") {
    return {
      status: ApplicationStatus.REVIEWED,
      note: "Reviewed by the school team with some fit gaps noted.",
      rejectionReason: null,
    };
  }

  return {
    status: ApplicationStatus.REJECTED,
    note: "Rejected after screening due to a low match score.",
    rejectionReason: [
      RejectionReason.UNDERQUALIFIED,
      RejectionReason.EXPERIENCE_MISMATCH,
      RejectionReason.LOCATION_MISMATCH,
      RejectionReason.SALARY_MISMATCH,
      RejectionReason.OTHER,
    ],
  };
}

function applicantTag(category: TeacherCategory) {
  if (category === "HIGH") return "high-qualified";
  if (category === "AVERAGE") return "average-fit";
  return "not-matching";
}

const SCHOOL_SEEDS: SchoolSeed[] = [
  {
    adminName: "Rajalakshmi Venkataraman",
    adminEmail: "principal.brightstar@eduhire-demo.in",
    phone: "04440022110",
    schoolName: "Bright Star International School",
    city: "Chennai",
    board: Board.CBSE,
    address: "Besant Nagar, Chennai 600090",
    website: "https://brightstarchennai.edu.in",
    about: "A premier CBSE school known for strong board results, digital classrooms, and a vibrant activity programme.",
    subjectPlan: ["Mathematics", "English", "Computer Science", "Physics", "Physical Education"],
  },
  {
    adminName: "Srinivas Raghunathan",
    adminEmail: "hr.presidencyedge@eduhire-demo.in",
    phone: "08022001133",
    schoolName: "Presidency Edge School",
    city: "Bengaluru",
    board: Board.ICSE,
    address: "Jayanagar 4th Block, Bengaluru 560041",
    website: "https://presidencyedge.edu.in",
    about: "An ICSE school focused on inquiry-based learning, laboratory work, and debate-led classroom culture.",
    subjectPlan: ["Physics", "Chemistry", "Biology", "Mathematics", "English"],
  },
  {
    adminName: "Padma Krishnamurthy",
    adminEmail: "careers.navatara@eduhire-demo.in",
    phone: "04022003344",
    schoolName: "Navatara Global School",
    city: "Hyderabad",
    board: Board.CBSE,
    address: "Gachibowli, Hyderabad 500032",
    website: "https://navataraglobal.edu.in",
    about: "A tech-forward CBSE school with coding, AI awareness, and entrepreneurship embedded into the core programme.",
    subjectPlan: ["Computer Science", "Mathematics", "Social Science", "Hindi", "Robotics"],
  },
  {
    adminName: "Ananya Joshi",
    adminEmail: "recruitment.horizon@eduhire-demo.in",
    phone: "02022004455",
    schoolName: "Horizon Cambridge Academy",
    city: "Pune",
    board: Board.CAMBRIDGE,
    address: "Koregaon Park, Pune 411001",
    website: "https://horizoncambridge.edu.in",
    about: "A Cambridge-affiliated school offering globally aligned teaching, project work, and strong pastoral support.",
    subjectPlan: ["Mathematics", "Physics", "English Literature", "Biology", "Early Childhood"],
  },
  {
    adminName: "Geetha Annamalai",
    adminEmail: "admin.annai@eduhire-demo.in",
    phone: "04222005566",
    schoolName: "Annai Matriculation Higher Secondary School",
    city: "Coimbatore",
    board: Board.STATE_BOARD,
    address: "RS Puram, Coimbatore 641002",
    website: "https://annaimatriccoimbatore.edu.in",
    about: "A well-established state-board school with strong Tamil language outcomes and a disciplined academic culture.",
    subjectPlan: ["Tamil", "Mathematics", "Science", "Social Science", "Primary Studies"],
  },
  {
    adminName: "Vikram Bhatia",
    adminEmail: "jobs.pioneer@eduhire-demo.in",
    phone: "01122006677",
    schoolName: "Pioneer Public School",
    city: "Delhi",
    board: Board.CBSE,
    address: "Dwarka Sector 10, New Delhi 110075",
    website: "https://pioneerpublic.edu.in",
    about: "A flagship CBSE school with competitive-exam readiness, sports, and student leadership at the center of school life.",
    subjectPlan: ["Biology", "Chemistry", "Social Science", "Music", "Art & Craft"],
  },
  {
    adminName: "Meera Suresh",
    adminEmail: "admin.meridian@eduhire-demo.in",
    phone: "04842207788",
    schoolName: "Meridian International School",
    city: "Kochi",
    board: Board.IB,
    address: "Kakkanad, Kochi 682030",
    website: "https://meridianinternational.edu.in",
    about: "An IB school that values interdisciplinary inquiry, learner agency, and global-minded classroom design.",
    subjectPlan: ["PYP Homeroom", "MYP Science", "English Literature", "Mathematics", "Design & Technology"],
  },
  {
    adminName: "Kunal Mehta",
    adminEmail: "careers.pinkcity@eduhire-demo.in",
    phone: "01412208899",
    schoolName: "Pink City Scholars",
    city: "Jaipur",
    board: Board.CBSE,
    address: "C-Scheme, Jaipur 302001",
    website: "https://pinkcityscholars.edu.in",
    about: "A well-rounded CBSE campus with a strong emphasis on language, leadership, and academic confidence.",
    subjectPlan: ["English", "Mathematics", "Economics", "Hindi", "Counselling"],
  },
  {
    adminName: "Aisha Farooqui",
    adminEmail: "admin.sterling@eduhire-demo.in",
    phone: "07922009900",
    schoolName: "Sterling Academy",
    city: "Ahmedabad",
    board: Board.STATE_BOARD,
    address: "Satellite, Ahmedabad 380015",
    website: "https://sterlingacademy.edu.in",
    about: "A progressive school with strong science, commerce, and language tracks plus an active library culture.",
    subjectPlan: ["Science", "Commerce", "Mathematics", "Gujarati", "Library Science"],
  },
  {
    adminName: "Sanjay Basu",
    adminEmail: "principal.riverfront@eduhire-demo.in",
    phone: "03322001122",
    schoolName: "Riverfront School",
    city: "Kolkata",
    board: Board.ICSE,
    address: "Salt Lake, Kolkata 700091",
    website: "https://riverfrontschool.edu.in",
    about: "An ICSE school that blends strong academics with creative arts, laboratory learning, and project-based study.",
    subjectPlan: ["History", "Chemistry", "Physics", "Computer Applications", "Dance"],
  },
];

const JOB_BLUEPRINTS: JobBlueprint[] = [
  {
    titleKind: "PGT",
    gradeLevel: "11-12",
    jobType: JobType.FULL_TIME,
    experience: "4-6 years",
    experienceLevel: ExperienceLevel.FIVE_TO_TEN_YEARS,
    salaryMin: 52000,
    salaryMax: 72000,
    isUrgent: true,
    requiredWithin48h: false,
    requiresTet: true,
    daysAgo: 4,
  },
  {
    titleKind: "TGT",
    gradeLevel: "6-8",
    jobType: JobType.FULL_TIME,
    experience: "2-4 years",
    experienceLevel: ExperienceLevel.TWO_TO_FIVE_YEARS,
    salaryMin: 34000,
    salaryMax: 50000,
    isUrgent: false,
    requiredWithin48h: false,
    requiresTet: true,
    daysAgo: 6,
  },
  {
    titleKind: "PRIMARY",
    gradeLevel: "1-5",
    jobType: JobType.FULL_TIME,
    experience: "1-3 years",
    experienceLevel: ExperienceLevel.ONE_TO_TWO_YEARS,
    salaryMin: 24000,
    salaryMax: 36000,
    isUrgent: false,
    requiredWithin48h: false,
    requiresTet: false,
    daysAgo: 8,
  },
  {
    titleKind: "SPECIALIST",
    gradeLevel: "1-12",
    jobType: JobType.PART_TIME,
    experience: "2-5 years",
    experienceLevel: ExperienceLevel.TWO_TO_FIVE_YEARS,
    salaryMin: 30000,
    salaryMax: 48000,
    isUrgent: false,
    requiredWithin48h: true,
    requiresTet: false,
    daysAgo: 10,
  },
  {
    titleKind: "COORDINATOR",
    gradeLevel: "1-12",
    jobType: JobType.FULL_TIME,
    experience: "3-5 years",
    experienceLevel: ExperienceLevel.FIVE_TO_TEN_YEARS,
    salaryMin: 32000,
    salaryMax: 52000,
    isUrgent: true,
    requiredWithin48h: false,
    requiresTet: true,
    daysAgo: 12,
  },
];

const HIGH_TEACHER_TEMPLATES: TeacherTemplate[] = [
  {
    qualification: "M.Sc Mathematics, B.Ed",
    experience: "8 years",
    currentSchoolPrefix: "Academy",
    bio: "A strong senior-secondary mathematics teacher focused on board preparation, practice cycles, and problem-solving confidence.",
    subjects: ["Mathematics", "Statistics"],
    preferredBoards: [Board.CBSE, Board.ICSE],
    preferredGrades: ["9-12", "11-12"],
    expectedSalary: 68000,
    roleTitle: "PGT Mathematics",
    certName: "Advanced Mathematics Pedagogy Certificate",
    availabilityStatus: AvailabilityStatus.ACTIVELY_LOOKING,
  },
  {
    qualification: "M.Sc Physics, B.Ed",
    experience: "7 years",
    currentSchoolPrefix: "Institute",
    bio: "A lab-friendly physics teacher who pairs demonstrations with exam-oriented concept clarity.",
    subjects: ["Physics", "Science"],
    preferredBoards: [Board.CBSE, Board.ICSE, Board.CAMBRIDGE],
    preferredGrades: ["9-12", "11-12"],
    expectedSalary: 72000,
    roleTitle: "PGT Physics",
    certName: "Physics Lab Facilitation Certificate",
    availabilityStatus: AvailabilityStatus.ACTIVELY_LOOKING,
  },
  {
    qualification: "MA English Literature, B.Ed",
    experience: "6 years",
    currentSchoolPrefix: "School",
    bio: "A language specialist with a strong hold on literature, composition, and spoken fluency.",
    subjects: ["English", "English Literature"],
    preferredBoards: [Board.ICSE, Board.CBSE],
    preferredGrades: ["6-12", "9-12"],
    expectedSalary: 64000,
    roleTitle: "PGT English",
    certName: "Language and Literature Teaching Certificate",
    availabilityStatus: AvailabilityStatus.OPEN_TO_OFFERS,
  },
  {
    qualification: "MCA, B.Ed",
    experience: "7 years",
    currentSchoolPrefix: "Academy",
    bio: "A computer science educator who can bridge coding fundamentals with school-level software projects.",
    subjects: ["Computer Science", "Information Technology"],
    preferredBoards: [Board.CBSE, Board.IB],
    preferredGrades: ["9-12", "6-12"],
    expectedSalary: 70000,
    roleTitle: "PGT Computer Science",
    certName: "School Coding Lab Facilitator",
    availabilityStatus: AvailabilityStatus.ACTIVELY_LOOKING,
  },
  {
    qualification: "M.Sc Chemistry, B.Ed",
    experience: "8 years",
    currentSchoolPrefix: "College",
    bio: "A senior chemistry teacher with strong laboratory discipline and board-exam revision planning.",
    subjects: ["Chemistry", "Science"],
    preferredBoards: [Board.CBSE, Board.ICSE],
    preferredGrades: ["9-12", "11-12"],
    expectedSalary: 69000,
    roleTitle: "PGT Chemistry",
    certName: "Chemistry Lab Safety Certificate",
    availabilityStatus: AvailabilityStatus.ACTIVELY_LOOKING,
  },
];

const AVERAGE_TEACHER_TEMPLATES: TeacherTemplate[] = [
  {
    qualification: "B.Sc Science, B.Ed",
    experience: "4 years",
    currentSchoolPrefix: "Learning Centre",
    bio: "A reliable classroom teacher who uses structured lesson plans and consistent follow-up work.",
    subjects: ["Science", "Biology"],
    preferredBoards: [Board.CBSE, Board.STATE_BOARD],
    preferredGrades: ["6-10"],
    expectedSalary: 42000,
    roleTitle: "Middle School Science Teacher",
    certName: "Classroom Assessment Certificate",
    availabilityStatus: AvailabilityStatus.OPEN_TO_OFFERS,
  },
  {
    qualification: "MA Social Science, B.Ed",
    experience: "5 years",
    currentSchoolPrefix: "Academy",
    bio: "A steady social science teacher who is comfortable with maps, timelines, and project-based history work.",
    subjects: ["Social Science", "History"],
    preferredBoards: [Board.CBSE, Board.STATE_BOARD],
    preferredGrades: ["6-10"],
    expectedSalary: 44000,
    roleTitle: "TGT Social Science",
    certName: "Project-Based Learning Certificate",
    availabilityStatus: AvailabilityStatus.OPEN_TO_OFFERS,
  },
  {
    qualification: "MA Hindi, B.Ed",
    experience: "4 years",
    currentSchoolPrefix: "School",
    bio: "A language teacher with comfortable classroom control and good oral practice routines.",
    subjects: ["Hindi", "Language"],
    preferredBoards: [Board.CBSE, Board.STATE_BOARD],
    preferredGrades: ["6-10"],
    expectedSalary: 40000,
    roleTitle: "Hindi Teacher",
    certName: "Hindi Language Pedagogy Certificate",
    availabilityStatus: AvailabilityStatus.ACTIVELY_LOOKING,
  },
  {
    qualification: "M.Com, B.Ed",
    experience: "5 years",
    currentSchoolPrefix: "Institute",
    bio: "A commerce educator who can handle basic accounting, business studies, and classroom assessments.",
    subjects: ["Commerce", "Accountancy"],
    preferredBoards: [Board.CBSE, Board.ICSE],
    preferredGrades: ["9-12"],
    expectedSalary: 46000,
    roleTitle: "Commerce Teacher",
    certName: "Business Studies Teaching Certificate",
    availabilityStatus: AvailabilityStatus.OPEN_TO_OFFERS,
  },
  {
    qualification: "D.El.Ed",
    experience: "3 years",
    currentSchoolPrefix: "Primary School",
    bio: "A warm primary teacher who keeps routines simple, steady, and child-friendly.",
    subjects: ["Primary Studies", "EVS"],
    preferredBoards: [Board.CBSE, Board.STATE_BOARD],
    preferredGrades: ["1-5"],
    expectedSalary: 32000,
    roleTitle: "Primary Homeroom Teacher",
    certName: "Early Learner Classroom Certificate",
    availabilityStatus: AvailabilityStatus.ACTIVELY_LOOKING,
  },
];

const MISMATCH_TEACHER_TEMPLATES: TeacherTemplate[] = [
  {
    qualification: "Diploma in Music",
    experience: "3 years",
    currentSchoolPrefix: "Arts Studio",
    bio: "A creative music teacher who is best suited for extracurricular enrichment rather than academic subject delivery.",
    subjects: ["Music", "Choir"],
    preferredBoards: [Board.ICSE, Board.CBSE],
    preferredGrades: ["1-8"],
    expectedSalary: 28000,
    roleTitle: "Music Teacher",
    certName: "School Music Facilitation Certificate",
    availabilityStatus: AvailabilityStatus.OPEN_TO_OFFERS,
  },
  {
    qualification: "BFA, Diploma in Fine Arts",
    experience: "2 years",
    currentSchoolPrefix: "Creative Studio",
    bio: "A fine arts mentor who thrives in visual art sessions and project-based creative workshops.",
    subjects: ["Art", "Craft"],
    preferredBoards: [Board.CBSE, Board.ICSE],
    preferredGrades: ["1-8"],
    expectedSalary: 26000,
    roleTitle: "Art & Craft Teacher",
    certName: "Visual Arts Workshop Certificate",
    availabilityStatus: AvailabilityStatus.OPEN_TO_OFFERS,
  },
  {
    qualification: "Diploma in Dance",
    experience: "4 years",
    currentSchoolPrefix: "Creative Wing",
    bio: "A performing arts teacher who works best in festivals, performances, and physical-expression sessions.",
    subjects: ["Dance", "Performance Arts"],
    preferredBoards: [Board.ICSE, Board.IB],
    preferredGrades: ["1-8"],
    expectedSalary: 30000,
    roleTitle: "Dance Teacher",
    certName: "Performing Arts Certificate",
    availabilityStatus: AvailabilityStatus.ACTIVELY_LOOKING,
  },
  {
    qualification: "Bachelor of Library Science",
    experience: "3 years",
    currentSchoolPrefix: "Library",
    bio: "A library specialist focused on reading clubs, cataloging, and quiet study routines.",
    subjects: ["Library Science", "Reading"],
    preferredBoards: [Board.CBSE, Board.STATE_BOARD],
    preferredGrades: ["1-12"],
    expectedSalary: 24000,
    roleTitle: "Library Assistant",
    certName: "Library Management Certificate",
    availabilityStatus: AvailabilityStatus.OPEN_TO_OFFERS,
  },
  {
    qualification: "MA Counselling Psychology",
    experience: "5 years",
    currentSchoolPrefix: "Wellness Centre",
    bio: "A student wellbeing counsellor with a strong empathy toolkit and pastoral support background.",
    subjects: ["Counselling", "Wellbeing"],
    preferredBoards: [Board.CBSE, Board.CAMBRIDGE],
    preferredGrades: ["1-12"],
    expectedSalary: 36000,
    roleTitle: "Student Counsellor",
    certName: "School Counselling Certificate",
    availabilityStatus: AvailabilityStatus.ACTIVELY_LOOKING,
  },
];

const HIGH_FAMILY_NAMES = ["Iyer"];
const AVERAGE_FAMILY_NAMES = ["Sharma"];
const MISMATCH_FAMILY_NAMES = ["Nair", "Gupta"];
const FIRST_NAMES = [
  "Aarav",
  "Diya",
  "Ishaan",
  "Meera",
  "Rohan",
  "Anika",
  "Kabir",
  "Sana",
  "Arjun",
  "Nisha",
  "Vivek",
  "Kavya",
  "Siddharth",
  "Pooja",
  "Rahul",
  "Riya",
  "Amit",
  "Tanya",
  "Krish",
  "Neha",
];

function teacherName(index: number, category: TeacherCategory) {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const familyNames =
    category === "HIGH"
      ? HIGH_FAMILY_NAMES
      : category === "AVERAGE"
        ? AVERAGE_FAMILY_NAMES
        : MISMATCH_FAMILY_NAMES;
  const family = familyNames[Math.floor(index / FIRST_NAMES.length) % familyNames.length];
  return `${first} ${family}`;
}

function teacherEmail(category: TeacherCategory, index: number) {
  const prefix = category.toLowerCase();
  return `${prefix}.${String(index + 1).padStart(2, "0")}@eduhire-demo.in`;
}

function teacherPhone(category: TeacherCategory, index: number) {
  const categoryOffset = category === "HIGH" ? 1000 : category === "AVERAGE" ? 3000 : 5000;
  return String(9900000000 + categoryOffset + index);
}

function buildTeacherTemplate(category: TeacherCategory, index: number): TeacherTemplate {
  const templates =
    category === "HIGH"
      ? HIGH_TEACHER_TEMPLATES
      : category === "AVERAGE"
        ? AVERAGE_TEACHER_TEMPLATES
        : MISMATCH_TEACHER_TEMPLATES;
  return templates[index % templates.length];
}

function buildTeacherSeed(category: TeacherCategory, index: number): TeacherSeed {
  const template = buildTeacherTemplate(category, index);
  const cityPool =
    category === "HIGH"
      ? ["Chennai", "Bengaluru", "Hyderabad", "Pune"]
      : category === "AVERAGE"
        ? ["Coimbatore", "Delhi", "Kochi", "Jaipur"]
        : ["Ahmedabad", "Kolkata", "Surat", "Mysuru"];

  const city = cityPool[index % cityPool.length];

  return {
    ...template,
    name: teacherName(index, category),
    email: teacherEmail(category, index),
    phone: teacherPhone(category, index),
    city,
    category,
    slot: index % 10,
    familyIndex: Math.floor(index / 10),
  };
}

function buildSchoolLogo(name: string) {
  return avatarUrl(name);
}

async function resetDatabase() {
  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    select tablename as table_name
    from pg_tables
    where schemaname = 'public'
      and tablename <> '_prisma_migrations'
      and tableowner = current_user
    order by tablename
  `;

  if (tables.length === 0) {
    console.log("No public tables found to truncate.");
    return;
  }

  const tableList = tables.map((row) => `"${row.table_name.replace(/"/g, '""')}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);
}

async function seedSchoolsAndJobs(hashedSchoolPassword: string) {
  const schools: SchoolRecord[] = [];
  const jobs: JobRecord[] = [];

  for (let schoolIndex = 0; schoolIndex < SCHOOL_SEEDS.length; schoolIndex++) {
    const school = SCHOOL_SEEDS[schoolIndex];
    const user = await prisma.user.create({
      data: {
        email: school.adminEmail,
        name: school.adminName,
        phone: school.phone,
        avatarUrl: avatarUrl(school.adminName),
        role: UserRole.SCHOOL_ADMIN,
        emailVerified: true,
        hashedPassword: hashedSchoolPassword,
      },
    });

    const profile = await prisma.schoolProfile.create({
      data: {
        userId: user.id,
        schoolName: school.schoolName,
        city: school.city,
        board: school.board,
        address: school.address,
        website: school.website,
        about: school.about,
        logoUrl: buildSchoolLogo(school.schoolName),
        hasPfEsi: true,
        paymentTrackRecord: "Regular",
        workingHours: "8:00 AM - 3:30 PM",
        verified: true,
        verificationStatus: SchoolVerificationStatus.VERIFIED,
        verificationSubmittedAt: new Date(),
        verificationTimestamp: new Date(),
      },
    });

    schools.push({
      userId: user.id,
      schoolId: profile.id,
      schoolName: profile.schoolName,
      board: profile.board,
      city: profile.city,
    });
  }

  for (let blueprintIndex = 0; blueprintIndex < JOB_BLUEPRINTS.length; blueprintIndex++) {
    const blueprint = JOB_BLUEPRINTS[blueprintIndex];

    for (let schoolIndex = 0; schoolIndex < schools.length; schoolIndex++) {
      const school = schools[schoolIndex];
      const subject = SCHOOL_SEEDS[schoolIndex].subjectPlan[blueprintIndex];
      const postedAt = daysAgo(blueprint.daysAgo + schoolIndex);
      const expiresAt = addHours(postedAt, 30 * 24);

      const title =
        blueprint.titleKind === "PGT"
          ? `PGT ${subject}`
          : blueprint.titleKind === "TGT"
            ? `TGT ${subject}`
            : blueprint.titleKind === "PRIMARY"
              ? `${subject} Teacher`
              : blueprint.titleKind === "SPECIALIST"
                ? `${subject} Specialist`
                : `${subject} Coordinator`;

      const description = `We are looking for a ${title} at ${school.schoolName} in ${school.city}. The role focuses on curriculum delivery, student support, assessment discipline, and collaborative planning within a ${school.board} environment.`;

      const job = await prisma.jobPosting.create({
        data: {
          schoolId: school.schoolId,
          postedBy: school.userId,
          title,
          subject,
          board: school.board,
          gradeLevel: blueprint.gradeLevel,
          jobType: blueprint.jobType,
          experience: blueprint.experience,
          experienceLevel: blueprint.experienceLevel,
          salaryMin: blueprint.salaryMin,
          salaryMax: blueprint.salaryMax,
          isUrgent: blueprint.isUrgent,
          requiredWithin48h: blueprint.requiredWithin48h,
          requiresTet: blueprint.requiresTet,
          description,
          status: JobStatus.ACTIVE,
          postedAt,
          expiresAt,
        },
      });

      await prisma.jobRequirement.createMany({
        data: REQUIREMENTS.map((text, sortOrder) => ({ jobId: job.id, text, sortOrder })),
      });

      await prisma.jobBenefit.createMany({
        data: BENEFITS.map((text, sortOrder) => ({ jobId: job.id, text, sortOrder })),
      });

      jobs.push({
        id: job.id,
        schoolId: school.schoolId,
        postedBy: school.userId,
        schoolName: school.schoolName,
        city: school.city,
        board: school.board,
        subject,
        categoryIndex: blueprintIndex,
        slot: schoolIndex,
        postedAt,
      });
    }
  }

  return { schools, jobs };
}

async function seedTeachers(hashedTeacherPassword: string) {
  const teachers: TeacherRecord[] = [];
  const teacherSeeds: TeacherSeed[] = [
    ...Array.from({ length: 20 }, (_, index) => buildTeacherSeed("HIGH", index)),
    ...Array.from({ length: 20 }, (_, index) => buildTeacherSeed("AVERAGE", index)),
    ...Array.from({ length: 40 }, (_, index) => buildTeacherSeed("MISMATCH", index)),
  ];

  for (const teacherSeed of teacherSeeds) {
    const user = await prisma.user.create({
      data: {
        email: teacherSeed.email,
        name: teacherSeed.name,
        phone: teacherSeed.phone,
        avatarUrl: avatarUrl(teacherSeed.name),
        role: UserRole.TEACHER,
        emailVerified: true,
        hashedPassword: hashedTeacherPassword,
      },
    });

    const profile = await prisma.teacherProfile.create({
      data: {
        userId: user.id,
        qualification: teacherSeed.qualification,
        experience: teacherSeed.experience,
        currentSchool: `${teacherSeed.city} ${teacherSeed.currentSchoolPrefix}`,
        city: teacherSeed.city,
        bio: teacherSeed.bio,
        subjects: teacherSeed.subjects,
        preferredBoards: teacherSeed.preferredBoards,
        preferredGrades: teacherSeed.preferredGrades,
        expectedSalary: teacherSeed.expectedSalary,
        availabilityStatus: teacherSeed.availabilityStatus,
        tetStatus: "Cleared",
        verificationStatus: TeacherVerificationStatus.VERIFIED,
        verificationSubmittedAt: new Date(),
        verificationTimestamp: new Date(),
        verificationNotes: "Seeded as a verified demo profile.",
        codeOfConductSigned: true,
        referenceCheckDone: true,
        pocsoAcknowledged: true,
        safetyBadgeGranted: true,
      },
    });

    await prisma.experience.create({
      data: {
        teacherProfileId: profile.id,
        schoolName: teacherSeed.currentSchoolPrefix,
        role: teacherSeed.roleTitle,
        startDate: new Date("2021-06-01T00:00:00.000Z"),
        endDate: null,
        isCurrent: true,
        description: `Handled ${teacherSeed.preferredGrades.join(", ")} classes with consistent lesson planning and assessment discipline.`,
      },
    });

    await prisma.certification.create({
      data: {
        teacherProfileId: profile.id,
        name: teacherSeed.certName,
        issuedBy: "EduHire Accreditation Board",
        issuedAt: new Date("2023-08-01T00:00:00.000Z"),
        credentialId: `CERT-${teacherSeed.category}-${String(teacherSeeds.length + teachers.length + 1).padStart(4, "0")}`,
      },
    });

    await prisma.resume.create({
      data: {
        userId: user.id,
        fileUrl: `${RESUME_URL}?teacher=${encodeURIComponent(teacherSeed.email)}`,
        fileName: `${teacherSeed.name.replace(/\s+/g, "_")}_Resume.pdf`,
        fileSize: 150000,
        isGenerated: false,
      },
    });

    teachers.push({
      userId: user.id,
      name: teacherSeed.name,
      category: teacherSeed.category,
      slot: teacherSeed.slot,
    });
  }

  return teachers;
}

async function createRootAdmin(hashedPassword: string) {
  await prisma.user.create({
    data: {
      email: "admin@theeduhire.in",
      name: "EduHire Root Admin",
      role: UserRole.ADMIN,
      emailVerified: true,
      avatarUrl: avatarUrl("EduHire Root Admin"),
      hashedPassword,
    },
  });
}

async function seedApplications(teachers: TeacherRecord[], jobs: JobRecord[]) {
  const jobsByCohort = new Map<number, JobRecord[]>();
  for (const job of jobs) {
    if (!jobsByCohort.has(job.categoryIndex)) {
      jobsByCohort.set(job.categoryIndex, []);
    }
    jobsByCohort.get(job.categoryIndex)!.push(job);
  }

  for (const cohortJobs of jobsByCohort.values()) {
    cohortJobs.sort((a, b) => a.slot - b.slot);
  }

  let created = 0;

  for (const teacher of teachers) {
    for (let cohort = 0; cohort < 5; cohort++) {
      const job = jobsByCohort.get(cohort)?.[teacher.slot];
      if (!job) {
        throw new Error(`Missing job for cohort ${cohort} and slot ${teacher.slot}`);
      }

      const category = teacher.category;
      const score = scoreFor(category, teacher.slot, cohort);
      const breakdown = breakdownFor(category, teacher.slot, cohort);
      const statusInfo = statusForCategory(category);
      const appliedAt = addHours(job.postedAt, 12 + cohort * 3 + teacher.slot);
      const rejectionReasons =
        category === "MISMATCH"
          ? (statusInfo.rejectionReason as RejectionReason[])
          : null;
      const rejectionReason =
        rejectionReasons === null
          ? null
          : rejectionReasons[(teacher.slot + cohort) % rejectionReasons.length];

      const application = await prisma.application.create({
        data: {
          jobId: job.id,
          applicantId: teacher.userId,
          coverLetter: `I am applying for the ${job.subject} role at ${job.schoolName}. My background aligns with the requirements and I would welcome the opportunity to contribute to the school community.`,
          status: statusInfo.status,
          appliedAt,
          reviewedAt: addHours(appliedAt, 20),
          schoolNotes:
            category === "HIGH"
              ? "Shortlisted after strong initial screening."
              : category === "AVERAGE"
                ? "Reviewed and kept in the active stack."
                : "Rejected during the first screening pass.",
          rejectionReason,
        },
      });

      await prisma.aIMatchScore.create({
        data: {
          jobId: job.id,
          applicantId: teacher.userId,
          score,
          breakdown,
          explanation:
            category === "HIGH"
              ? `Strong fit for ${job.subject} at ${job.schoolName}.`
              : category === "AVERAGE"
                ? `Moderate fit for ${job.subject} with some gaps in the application.`
                : `Low fit for ${job.subject}; profile is not closely aligned.`,
          computedAt: appliedAt,
        },
      });

      if (!application.id) {
        throw new Error("Application creation failed");
      }

      created++;
    }
  }

  return created;
}

async function validateDataset() {
  const counts = {
    schools: await prisma.schoolProfile.count(),
    jobs: await prisma.jobPosting.count(),
    teachers: await prisma.user.count({ where: { role: UserRole.TEACHER } }),
    admins: await prisma.user.count({ where: { role: UserRole.ADMIN } }),
    applications: await prisma.application.count(),
  };

  if (counts.schools < 10) throw new Error(`Expected at least 10 schools, found ${counts.schools}`);
  if (counts.jobs < 50) throw new Error(`Expected at least 50 jobs, found ${counts.jobs}`);
  if (counts.teachers < 20) throw new Error(`Expected at least 20 teachers, found ${counts.teachers}`);
  if (counts.admins < 1) throw new Error(`Expected at least 1 admin, found ${counts.admins}`);

  const jobsPerSchool = await prisma.schoolProfile.findMany({
    select: { schoolName: true, _count: { select: { jobPostings: true } } },
  });

  for (const school of jobsPerSchool) {
    if (school._count.jobPostings < 3 || school._count.jobPostings > 5) {
      throw new Error(`${school.schoolName} has ${school._count.jobPostings} jobs; expected 3-5`);
    }
  }

  const appsPerTeacher = await prisma.user.findMany({
    where: { role: UserRole.TEACHER },
    select: { name: true, _count: { select: { applications: true } } },
  });

  for (const teacher of appsPerTeacher) {
    if (teacher._count.applications < 3 || teacher._count.applications > 6) {
      throw new Error(`${teacher.name} has ${teacher._count.applications} applications; expected 3-6`);
    }
  }

  const appsPerJob = await prisma.jobPosting.findMany({
    select: { id: true, title: true, school: { select: { schoolName: true } }, _count: { select: { applications: true } } },
  });

  for (const job of appsPerJob) {
    if (job._count.applications < 8 || job._count.applications > 10) {
      throw new Error(`${job.title} at ${job.school.schoolName} has ${job._count.applications} applications; expected 8-10`);
    }
  }

  const apps = await prisma.application.findMany({
    select: {
      jobId: true,
      applicantId: true,
      status: true,
      applicant: { select: { name: true } },
      job: { select: { title: true, school: { select: { schoolName: true } } } },
    },
  });

  const scoreRows = await prisma.aIMatchScore.findMany({
    select: { jobId: true, applicantId: true, score: true },
  });

  const scoreMap = new Map<string, number>();
  for (const row of scoreRows) {
    scoreMap.set(`${row.jobId}:${row.applicantId}`, row.score);
  }

  const perJob = new Map<string, { high: number; average: number; mismatch: number }>();
  for (const application of apps) {
    const score = scoreMap.get(`${application.jobId}:${application.applicantId}`);
    if (score === undefined) {
      throw new Error(`Missing match score for ${application.applicant.name} -> ${application.job.title}`);
    }

    const bucket = perJob.get(application.jobId) ?? { high: 0, average: 0, mismatch: 0 };
    if (score >= 0.8) bucket.high += 1;
    else if (score >= 0.45) bucket.average += 1;
    else bucket.mismatch += 1;
    perJob.set(application.jobId, bucket);
  }

  for (const [jobId, bucket] of perJob.entries()) {
    if (bucket.high < 2 || bucket.average < 2 || bucket.mismatch < 3) {
      const job = await prisma.jobPosting.findUnique({
        where: { id: jobId },
        select: { title: true, school: { select: { schoolName: true } } },
      });
      throw new Error(
        `${job?.title} at ${job?.school.schoolName} does not meet the applicant quality mix: ${JSON.stringify(bucket)}`
      );
    }
  }

  return counts;
}

async function main() {
  loadEnvFile();
  assertDestructiveDbScriptAllowed("db-scripts/reseed-entire-db.ts");

  console.log("EduHire - full database reseed\n");

  const sharedPasswordHash = await hash(SHARED_STAKEHOLDER_PASSWORD, 10);
  const rootPasswordHash = await hash(ROOT_ADMIN_PASSWORD, 10);

  console.log("Resetting database...");
  await resetDatabase();

  console.log("Seeding schools and jobs...");
  const { jobs } = await seedSchoolsAndJobs(sharedPasswordHash);
  console.log(`  Created ${SCHOOL_SEEDS.length} schools and ${jobs.length} jobs.`);

  console.log("Seeding teachers...");
  const teachers = await seedTeachers(sharedPasswordHash);
  console.log(`  Created ${teachers.length} teachers.`);

  console.log("Creating root admin...");
  await createRootAdmin(rootPasswordHash);

  console.log("Seeding applications and match scores...");
  const applicationCount = await seedApplications(teachers, jobs);
  console.log(`  Created ${applicationCount} applications and match scores.`);

  console.log("Validating dataset...\n");
  const counts = await validateDataset();

  const rootAdmin = await prisma.user.findUnique({
    where: { email: "admin@theeduhire.in" },
    select: { id: true },
  });

  console.log("Seed summary");
  console.log(`  Schools      : ${counts.schools}`);
  console.log(`  Jobs         : ${counts.jobs}`);
  console.log(`  Teachers     : ${counts.teachers}`);
  console.log(`  Admins       : ${counts.admins}`);
  console.log(`  Applications : ${counts.applications}`);
  console.log(`  Root admin   : admin@theeduhire.in / ${ROOT_ADMIN_PASSWORD}`);
  console.log(`  School login : shared password ${SHARED_STAKEHOLDER_PASSWORD}`);
  console.log(`  Teacher login: shared password ${SHARED_STAKEHOLDER_PASSWORD}`);
  console.log(`  Root admin id: ${rootAdmin?.id ?? "unknown"}`);
}

main()
  .catch((error) => {
    console.error("Reseed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
