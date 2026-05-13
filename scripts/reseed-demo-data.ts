#!/usr/bin/env node

import {
  ApplicationStatus,
  AvailabilityStatus,
  Board,
  JobStatus,
  JobType,
  PrismaClient,
  RejectionReason,
  UserRole,
} from "@prisma/client";
import { hash } from "bcryptjs";
import { calculateProfileCompletion } from "../src/lib/profileCompletion";

const prisma = new PrismaClient();
const PASSWORD = process.env.SEED_DEFAULT_PASSWORD?.trim() || "";
if (!PASSWORD || PASSWORD.length < 8) {
  throw new Error("SEED_DEFAULT_PASSWORD must be set and at least 8 characters long.");
}
const NOW = new Date();
const DAY_MS = 24 * 60 * 60 * 1000;
const RESUME_URL = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

const AVATAR_COLORS = [
  "0D8ABC", "1F9B63", "E76F51", "264653", "6A4C93",
  "F4A261", "457B9D", "2A9D8F", "8D99AE", "C1121F",
  "588157", "3A86FF", "9F1239", "166534", "15803D",
  "A16207", "854D0E", "334155", "0F172A", "BE185D",
];

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
  jobs: Array<{
    title: string;
    subject: string;
    gradeLevel: string;
    jobType: JobType;
    experience: string;
    salaryMin: number;
    salaryMax: number;
    description: string;
    daysAgo: number;
  }>;
};

type TeacherSeed = {
  name: string;
  email: string;
  phone: string;
  qualification: string;
  experience: string;
  currentSchool: string;
  city: string;
  bio: string;
  subjects: string[];
  preferredBoards: Board[];
  preferredGrades: string[];
  expectedSalary: number;
  roleTitle: string;
  certName: string;
  availabilityStatus: AvailabilityStatus;
};

function avatarFor(name: string, index: number) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff`;
}

function daysAgo(days: number) {
  return new Date(NOW.getTime() - days * DAY_MS);
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

// ─────────────────────────────────────────────
// SCHOOLS  (6 schools × 5 jobs each = 30 jobs)
// ─────────────────────────────────────────────

const SCHOOLS: SchoolSeed[] = [
  // 1 ─ Chennai – CBSE
  {
    adminName: "Rajalakshmi Venkataraman",
    adminEmail: "principal@brightstarchennai.eduhire-demo.in",
    phone: "04440022110",
    schoolName: "Bright Star International School",
    city: "Chennai",
    board: Board.CBSE,
    address: "Besant Nagar, Chennai 600090",
    website: "https://brightstarchennai.edu.in",
    about: "A premier CBSE school in Chennai known for holistic development, strong board results, and an active robotics and coding club.",
    jobs: [
      { title: "PGT Mathematics", subject: "Mathematics", gradeLevel: "11-12", jobType: JobType.FULL_TIME, experience: "5+ years", salaryMin: 52000, salaryMax: 72000, description: "Lead senior secondary mathematics covering calculus, algebra, and statistics with focused board-exam coaching.", daysAgo: 3 },
      { title: "TGT English", subject: "English", gradeLevel: "6-8", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 34000, salaryMax: 48000, description: "Middle school English: reading circles, grammar, creative writing workshops and oral communication activities.", daysAgo: 6 },
      { title: "Computer Science Teacher", subject: "Computer Science", gradeLevel: "9-12", jobType: JobType.FULL_TIME, experience: "3-5 years", salaryMin: 44000, salaryMax: 60000, description: "Python, data structures, SQL, and school coding-club mentorship across grades 9–12.", daysAgo: 10 },
      { title: "Robotics Instructor", subject: "Robotics", gradeLevel: "6-8", jobType: JobType.CONTRACT, experience: "2-4 years", salaryMin: 40000, salaryMax: 54000, description: "Design and run robotics lab sessions, inter-school competitions, and project showcases.", daysAgo: 14 },
      { title: "Physical Education Teacher", subject: "Physical Education", gradeLevel: "1-12", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 30000, salaryMax: 42000, description: "Full-school PE programme covering fitness, team sports, yoga, and annual sports day coordination.", daysAgo: 18 },
    ],
  },

  // 2 ─ Bengaluru – ICSE
  {
    adminName: "Srinivas Raghunathan",
    adminEmail: "hr@presidencybengaluru.eduhire-demo.in",
    phone: "08022001133",
    schoolName: "Presidency ICSE School Bengaluru",
    city: "Bengaluru",
    board: Board.ICSE,
    address: "Jayanagar 4th Block, Bengaluru 560041",
    website: "https://presidencybengaluru.edu.in",
    about: "An ICSE school in Bengaluru with a culture of inquiry-based learning, debate, and strong science lab infrastructure.",
    jobs: [
      { title: "PGT Physics", subject: "Physics", gradeLevel: "11-12", jobType: JobType.FULL_TIME, experience: "5+ years", salaryMin: 58000, salaryMax: 80000, description: "Senior physics including mechanics, optics, and modern physics with comprehensive lab work.", daysAgo: 2 },
      { title: "PGT Chemistry", subject: "Chemistry", gradeLevel: "11-12", jobType: JobType.FULL_TIME, experience: "4-6 years", salaryMin: 54000, salaryMax: 74000, description: "Organic, inorganic, and physical chemistry with safety-first lab sessions and board-exam revision.", daysAgo: 5 },
      { title: "Biology Teacher", subject: "Biology", gradeLevel: "9-12", jobType: JobType.FULL_TIME, experience: "3-5 years", salaryMin: 46000, salaryMax: 62000, description: "Teach ICSE biology with dissection practicals, revision schedules, and specimen work.", daysAgo: 9 },
      { title: "TGT Mathematics", subject: "Mathematics", gradeLevel: "6-10", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 38000, salaryMax: 52000, description: "Structured middle-to-secondary mathematics: geometry, algebra, and applied problem solving.", daysAgo: 13 },
      { title: "English Language & Literature Teacher", subject: "English", gradeLevel: "9-10", jobType: JobType.FULL_TIME, experience: "3-5 years", salaryMin: 40000, salaryMax: 56000, description: "ICSE English: prose, poetry, grammar, and composition with competitive debate and essay coaching.", daysAgo: 17 },
    ],
  },

  // 3 ─ Hyderabad – CBSE
  {
    adminName: "Padma Krishnamurthy",
    adminEmail: "careers@navatarahyderabad.eduhire-demo.in",
    phone: "04022003344",
    schoolName: "Navatara Global School Hyderabad",
    city: "Hyderabad",
    board: Board.CBSE,
    address: "Gachibowli, Hyderabad 500032",
    website: "https://navatarahyderabad.edu.in",
    about: "A tech-forward CBSE school near the IT corridor, known for integrating coding, AI awareness, and entrepreneurship into core curriculum.",
    jobs: [
      { title: "PGT Computer Science", subject: "Computer Science", gradeLevel: "11-12", jobType: JobType.FULL_TIME, experience: "4-6 years", salaryMin: 56000, salaryMax: 76000, description: "Python-heavy CBSE CS curriculum including data structures, web basics, and project portfolio development.", daysAgo: 1 },
      { title: "PGT Mathematics", subject: "Mathematics", gradeLevel: "11-12", jobType: JobType.FULL_TIME, experience: "4-6 years", salaryMin: 54000, salaryMax: 74000, description: "Calculus, vectors, probability, and linear programming with JEE-oriented enrichment for interested students.", daysAgo: 4 },
      { title: "Middle School Science Teacher", subject: "Science", gradeLevel: "6-8", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 34000, salaryMax: 46000, description: "Integrated science with physics, chemistry, and biology strands; experiment notebooks and demo sessions.", daysAgo: 8 },
      { title: "Social Science Teacher", subject: "Social Science", gradeLevel: "6-10", jobType: JobType.FULL_TIME, experience: "2-5 years", salaryMin: 32000, salaryMax: 45000, description: "Geography, history, civics, and economics with map work, timelines, and current-affairs integration.", daysAgo: 12 },
      { title: "Hindi Teacher", subject: "Hindi", gradeLevel: "6-10", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 30000, salaryMax: 42000, description: "Hindi grammar, reading, composition, and spoken fluency for CBSE students from diverse linguistic backgrounds.", daysAgo: 20 },
    ],
  },

  // 4 ─ Pune – Cambridge (IB)
  {
    adminName: "Ananya Joshi",
    adminEmail: "recruitment@horizonpune.eduhire-demo.in",
    phone: "02022004455",
    schoolName: "Horizon Cambridge Academy Pune",
    city: "Pune",
    board: Board.CAMBRIDGE,
    address: "Koregaon Park, Pune 411001",
    website: "https://horizonpune.edu.in",
    about: "A Cambridge-affiliated school in Pune offering IGCSE and A-Level programmes, attracting internationally mobile families and globally-minded educators.",
    jobs: [
      { title: "IGCSE Mathematics Teacher", subject: "Mathematics", gradeLevel: "9-10", jobType: JobType.FULL_TIME, experience: "3-5 years", salaryMin: 60000, salaryMax: 84000, description: "Cambridge IGCSE Extended Mathematics: algebra, trigonometry, statistics, and past-paper drilling.", daysAgo: 2 },
      { title: "A-Level Physics Teacher", subject: "Physics", gradeLevel: "11-12", jobType: JobType.FULL_TIME, experience: "5+ years", salaryMin: 70000, salaryMax: 96000, description: "A-Level Physics including AS and A2 components; strong lab and mock-paper culture expected.", daysAgo: 5 },
      { title: "IGCSE English First Language Teacher", subject: "English", gradeLevel: "9-10", jobType: JobType.FULL_TIME, experience: "3-5 years", salaryMin: 56000, salaryMax: 76000, description: "Reading, writing, and directed writing for Cambridge IGCSE English First Language.", daysAgo: 9 },
      { title: "IGCSE Biology Teacher", subject: "Biology", gradeLevel: "9-10", jobType: JobType.FULL_TIME, experience: "3-5 years", salaryMin: 54000, salaryMax: 72000, description: "Cambridge IGCSE Biology with practical investigations and concept-based revision.", daysAgo: 15 },
      { title: "Early Years Foundation Teacher", subject: "Early Childhood", gradeLevel: "Pre-K", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 38000, salaryMax: 52000, description: "EYFS-aligned pre-primary classroom with play-based and inquiry-led routines.", daysAgo: 21 },
    ],
  },

  // 5 ─ Coimbatore – State Board
  {
    adminName: "Geetha Annamalai",
    adminEmail: "admin@annaimatriccoimbatore.eduhire-demo.in",
    phone: "04222005566",
    schoolName: "Annai Matriculation Higher Secondary School",
    city: "Coimbatore",
    board: Board.STATE_BOARD,
    address: "RS Puram, Coimbatore 641002",
    website: "https://annaimatriccoimbatore.edu.in",
    about: "A well-established state-board school in Coimbatore with strong Tamil language outcomes, disciplined academics, and a tradition of public exam success.",
    jobs: [
      { title: "Tamil Teacher", subject: "Tamil", gradeLevel: "9-12", jobType: JobType.FULL_TIME, experience: "3-5 years", salaryMin: 30000, salaryMax: 44000, description: "Senior Tamil: prose, poetry, grammar, and board-exam revision for classes 9–12.", daysAgo: 2 },
      { title: "Mathematics Teacher", subject: "Mathematics", gradeLevel: "6-8", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 28000, salaryMax: 40000, description: "Middle school numeracy, algebra, and geometry with structured worksheet-based practice.", daysAgo: 6 },
      { title: "Science Teacher", subject: "Science", gradeLevel: "6-8", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 28000, salaryMax: 38000, description: "Integrated science with demonstrations, notebook work, and practical exam preparation.", daysAgo: 11 },
      { title: "Social Science Teacher", subject: "Social Science", gradeLevel: "9-12", jobType: JobType.FULL_TIME, experience: "3-5 years", salaryMin: 30000, salaryMax: 42000, description: "History, geography, civics, and economics for state-board senior classes.", daysAgo: 16 },
      { title: "Primary Homeroom Teacher", subject: "All Subjects", gradeLevel: "1-5", jobType: JobType.FULL_TIME, experience: "1-3 years", salaryMin: 22000, salaryMax: 32000, description: "Primary classroom role covering all subjects with a focus on literacy, numeracy, and EVS.", daysAgo: 22 },
    ],
  },

  // 6 ─ Delhi – CBSE
  {
    adminName: "Vikram Bhatia",
    adminEmail: "jobs@delhipioneer.eduhire-demo.in",
    phone: "01122006677",
    schoolName: "Pioneer Public School Delhi",
    city: "Delhi",
    board: Board.CBSE,
    address: "Dwarka Sector 10, New Delhi 110075",
    website: "https://delhipioneer.edu.in",
    about: "A flagship CBSE school in Delhi's Dwarka suburb with a strong focus on competitive-exam readiness, sports, and student leadership.",
    jobs: [
      { title: "PGT Biology", subject: "Biology", gradeLevel: "11-12", jobType: JobType.FULL_TIME, experience: "4-6 years", salaryMin: 52000, salaryMax: 70000, description: "Senior biology covering zoology, botany, genetics, and ecology with NEET-orientation support.", daysAgo: 1 },
      { title: "PGT Chemistry", subject: "Chemistry", gradeLevel: "11-12", jobType: JobType.FULL_TIME, experience: "4-6 years", salaryMin: 50000, salaryMax: 68000, description: "Senior chemistry with strong lab culture, electrochemistry, organic reactions, and board prep.", daysAgo: 4 },
      { title: "TGT Social Science", subject: "Social Science", gradeLevel: "6-8", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 34000, salaryMax: 46000, description: "Middle school history, geography, civics with project-based activities and map skills.", daysAgo: 8 },
      { title: "Music Teacher", subject: "Music", gradeLevel: "1-8", jobType: JobType.PART_TIME, experience: "Fresher", salaryMin: 20000, salaryMax: 30000, description: "Primary and middle school music: rhythm, notation, vocal practice, and annual cultural fest.", daysAgo: 13 },
      { title: "Art & Craft Teacher", subject: "Art & Craft", gradeLevel: "1-8", jobType: JobType.PART_TIME, experience: "1-3 years", salaryMin: 22000, salaryMax: 32000, description: "Craft, drawing, and design for primary and middle school with exhibition coordination.", daysAgo: 19 },
    ],
  },
];

// ─────────────────────────────────────────────
// TEACHERS  (20 varied profiles)
// ─────────────────────────────────────────────

const TEACHERS: TeacherSeed[] = [
  // 1 – Senior Maths, Chennai, CBSE
  {
    name: "Kavitha Sundaram",
    email: "kavitha.sundaram@eduhire-demo.in",
    phone: "9500100001",
    qualification: "M.Sc Mathematics, B.Ed (IGNOU)",
    experience: "7 years",
    currentSchool: "St. Raphael's Higher Secondary School",
    city: "Chennai",
    bio: "Results-driven mathematics educator with seven years of senior-secondary teaching; specialises in board-exam coaching and JEE Foundation bridging.",
    subjects: ["Mathematics"],
    preferredBoards: [Board.CBSE, Board.ICSE],
    preferredGrades: ["11-12", "9-10"],
    expectedSalary: 62000,
    roleTitle: "PGT Mathematics",
    certName: "CBSE Mathematics Capacity Building Programme",
    availabilityStatus: AvailabilityStatus.ACTIVELY_LOOKING,
  },
  // 2 – Physics, Bengaluru, ICSE/CBSE
  {
    name: "Arjun Nair",
    email: "arjun.nair@eduhire-demo.in",
    phone: "9500100002",
    qualification: "M.Sc Physics, B.Ed",
    experience: "6 years",
    currentSchool: "Jyothi Kendriya Vidyalaya",
    city: "Bengaluru",
    bio: "Physics teacher with deep lab expertise and a knack for making abstract concepts tangible through demonstrations and peer experiments.",
    subjects: ["Physics", "Mathematics"],
    preferredBoards: [Board.ICSE, Board.CBSE],
    preferredGrades: ["11-12", "9-10"],
    expectedSalary: 70000,
    roleTitle: "PGT Physics",
    certName: "Advanced Physics Lab Facilitation Certificate",
    availabilityStatus: AvailabilityStatus.ACTIVELY_LOOKING,
  },
  // 3 – Chemistry, Hyderabad
  {
    name: "Sneha Reddy",
    email: "sneha.reddy@eduhire-demo.in",
    phone: "9500100003",
    qualification: "M.Sc Chemistry, B.Ed",
    experience: "5 years",
    currentSchool: "Narayana E-Techno School",
    city: "Hyderabad",
    bio: "Chemistry teacher skilled at lab safety, organic synthesis demonstrations, and systematic board-paper revision cycles.",
    subjects: ["Chemistry", "Biology"],
    preferredBoards: [Board.CBSE, Board.ICSE],
    preferredGrades: ["11-12", "9-10", "9-12"],
    expectedSalary: 66000,
    roleTitle: "PGT Chemistry",
    certName: "Advanced Chemistry Lab Safety Certification",
    availabilityStatus: AvailabilityStatus.OPEN_TO_OFFERS,
  },
  // 4 – English, Pune, Cambridge
  {
    name: "Priya Fernandes",
    email: "priya.fernandes@eduhire-demo.in",
    phone: "9500100004",
    qualification: "MA English Literature, PGCE (Cambridge)",
    experience: "5 years",
    currentSchool: "Symbiosis International School",
    city: "Pune",
    bio: "Cambridge-trained English educator with IGCSE and A-Level experience; excels at argument writing, close reading, and debate coaching.",
    subjects: ["English"],
    preferredBoards: [Board.CAMBRIDGE, Board.ICSE],
    preferredGrades: ["9-10", "11-12"],
    expectedSalary: 72000,
    roleTitle: "IGCSE English Teacher",
    certName: "Cambridge English Teaching Qualification (CELT-S)",
    availabilityStatus: AvailabilityStatus.ACTIVELY_LOOKING,
  },
  // 5 – Biology, Delhi, CBSE
  {
    name: "Rahul Gupta",
    email: "rahul.gupta@eduhire-demo.in",
    phone: "9500100005",
    qualification: "M.Sc Biotechnology, B.Ed",
    experience: "6 years",
    currentSchool: "DPS Vasant Kunj",
    city: "Delhi",
    bio: "Biology teacher with strong NEET-preparation track record, detailed practical notebooks, and structured chapter-revision programmes.",
    subjects: ["Biology", "Chemistry"],
    preferredBoards: [Board.CBSE],
    preferredGrades: ["11-12", "9-12"],
    expectedSalary: 60000,
    roleTitle: "PGT Biology",
    certName: "Life Sciences for Senior School Teachers",
    availabilityStatus: AvailabilityStatus.IMMEDIATE_JOINER,
  },
  // 6 – Computer Science, Hyderabad, CBSE
  {
    name: "Kiran Murthy",
    email: "kiran.murthy@eduhire-demo.in",
    phone: "9500100006",
    qualification: "MCA, B.Ed",
    experience: "4 years",
    currentSchool: "Future Kids School Hyderabad",
    city: "Hyderabad",
    bio: "CS teacher blending Python, SQL, and web fundamentals with project-based learning; runs school coding club and hackathons.",
    subjects: ["Computer Science", "Robotics"],
    preferredBoards: [Board.CBSE, Board.CAMBRIDGE],
    preferredGrades: ["9-12", "11-12", "6-8"],
    expectedSalary: 64000,
    roleTitle: "PGT Computer Science",
    certName: "Python for Educators — NASSCOM Certification",
    availabilityStatus: AvailabilityStatus.ACTIVELY_LOOKING,
  },
  // 7 – Tamil, Coimbatore, State Board
  {
    name: "Nithya Kannan",
    email: "nithya.kannan@eduhire-demo.in",
    phone: "9500100007",
    qualification: "MA Tamil, B.Ed",
    experience: "5 years",
    currentSchool: "PSG Matric Higher Secondary School",
    city: "Coimbatore",
    bio: "Passionate Tamil educator with expertise in classical literature, grammar pedagogy, and public-exam score improvement.",
    subjects: ["Tamil"],
    preferredBoards: [Board.STATE_BOARD],
    preferredGrades: ["9-12", "6-8"],
    expectedSalary: 38000,
    roleTitle: "Tamil Teacher",
    certName: "Tamil Pedagogy Enrichment Certificate",
    availabilityStatus: AvailabilityStatus.ACTIVELY_LOOKING,
  },
  // 8 – Social Science, Delhi/Hyderabad, CBSE
  {
    name: "Aditya Sharma",
    email: "aditya.sharma@eduhire-demo.in",
    phone: "9500100008",
    qualification: "MA History, B.Ed",
    experience: "4 years",
    currentSchool: "Kendriya Vidyalaya Dwarka",
    city: "Delhi",
    bio: "Social Science teacher who brings history alive through timelines, map work, and current-affairs discussions; strong civic education advocate.",
    subjects: ["Social Science"],
    preferredBoards: [Board.CBSE],
    preferredGrades: ["6-8", "9-10", "6-10"],
    expectedSalary: 42000,
    roleTitle: "TGT Social Science",
    certName: "Social Science Classroom Strategies Workshop",
    availabilityStatus: AvailabilityStatus.OPEN_TO_OFFERS,
  },
  // 9 – Primary / All Subjects, Coimbatore, State Board
  {
    name: "Selvi Murugesan",
    email: "selvi.murugesan@eduhire-demo.in",
    phone: "9500100009",
    qualification: "BA Education, D.El.Ed",
    experience: "3 years",
    currentSchool: "Rainbow Primary School Coimbatore",
    city: "Coimbatore",
    bio: "Dedicated primary teacher managing all core subjects with activity-based routines, story-telling, and strong parent communication.",
    subjects: ["All Subjects", "Tamil"],
    preferredBoards: [Board.STATE_BOARD, Board.CBSE],
    preferredGrades: ["1-5", "Pre-K"],
    expectedSalary: 28000,
    roleTitle: "Primary Homeroom Teacher",
    certName: "Foundational Literacy and Numeracy Training (FLN)",
    availabilityStatus: AvailabilityStatus.ACTIVELY_LOOKING,
  },
  // 10 – Art & Craft, Delhi
  {
    name: "Meena Kapoor",
    email: "meena.kapoor@eduhire-demo.in",
    phone: "9500100010",
    qualification: "BFA Fine Arts, Diploma in Art Education",
    experience: "3 years",
    currentSchool: "Amity International School",
    city: "Delhi",
    bio: "Creative arts educator who nurtures imagination through craft projects, exhibitions, and design-thinking activities.",
    subjects: ["Art & Craft", "Music"],
    preferredBoards: [Board.CBSE, Board.STATE_BOARD],
    preferredGrades: ["1-8", "1-5"],
    expectedSalary: 28000,
    roleTitle: "Art & Craft Teacher",
    certName: "Creative Arts in Primary and Middle School Education",
    availabilityStatus: AvailabilityStatus.ACTIVELY_LOOKING,
  },
  // 11 – Music, Delhi
  {
    name: "Rohan Verma",
    email: "rohan.verma@eduhire-demo.in",
    phone: "9500100011",
    qualification: "MA Music (Hindustani Classical), Diploma in Music Education",
    experience: "Fresher",
    currentSchool: "Tagore Academy of Arts",
    city: "Delhi",
    bio: "Fresh music educator with strong Hindustani classical training; eager to bring rhythm, notation, and vocal practice to primary and middle school.",
    subjects: ["Music", "Art & Craft"],
    preferredBoards: [Board.CBSE, Board.STATE_BOARD],
    preferredGrades: ["1-8"],
    expectedSalary: 25000,
    roleTitle: "Music Teacher",
    certName: "Sangeet Prabhakar Examination",
    availabilityStatus: AvailabilityStatus.IMMEDIATE_JOINER,
  },
  // 12 – IGCSE Biology, Pune
  {
    name: "Anjali Mehta",
    email: "anjali.mehta@eduhire-demo.in",
    phone: "9500100012",
    qualification: "M.Sc Zoology, CELTA",
    experience: "4 years",
    currentSchool: "Indus International School Pune",
    city: "Pune",
    bio: "Biology teacher trained in Cambridge pedagogy; strong practical investigation skills and effective IGCSE revision frameworks.",
    subjects: ["Biology", "Science"],
    preferredBoards: [Board.CAMBRIDGE, Board.ICSE],
    preferredGrades: ["9-10", "11-12"],
    expectedSalary: 62000,
    roleTitle: "IGCSE Biology Teacher",
    certName: "Cambridge Biology Subject Knowledge Enhancement",
    availabilityStatus: AvailabilityStatus.OPEN_TO_OFFERS,
  },
  // 13 – Robotics/STEM, Chennai
  {
    name: "Deepak Rajendran",
    email: "deepak.rajendran@eduhire-demo.in",
    phone: "9500100013",
    qualification: "B.Tech Electronics and Communication, B.Ed",
    experience: "3 years",
    currentSchool: "STEM Valley School Chennai",
    city: "Chennai",
    bio: "STEM educator with hands-on robotics-lab experience, Arduino/Raspberry Pi kits, and a strong record of guiding students through inter-school robotics competitions.",
    subjects: ["Robotics", "Computer Science"],
    preferredBoards: [Board.CBSE],
    preferredGrades: ["6-8", "9-10"],
    expectedSalary: 48000,
    roleTitle: "Robotics Instructor",
    certName: "Robotics and AI for Educators — Texas Instruments",
    availabilityStatus: AvailabilityStatus.ACTIVELY_LOOKING,
  },
  // 14 – Physics, Pune (Cambridge)
  {
    name: "Suresh Iyer",
    email: "suresh.iyer@eduhire-demo.in",
    phone: "9500100014",
    qualification: "M.Sc Physics, PGCE",
    experience: "8 years",
    currentSchool: "Bishops Co-ed School Pune",
    city: "Pune",
    bio: "Veteran A-Level and IGCSE Physics teacher with eight years of Cambridge exam board experience; expert at practical investigation design and grade-boosting interventions.",
    subjects: ["Physics", "Mathematics"],
    preferredBoards: [Board.CAMBRIDGE, Board.ICSE],
    preferredGrades: ["11-12", "9-10"],
    expectedSalary: 88000,
    roleTitle: "A-Level Physics Teacher",
    certName: "Cambridge A-Level Physics Examiner Training",
    availabilityStatus: AvailabilityStatus.OPEN_TO_OFFERS,
  },
  // 15 – Middle School Maths, Coimbatore, State Board
  {
    name: "Poornima Krishnan",
    email: "poornima.krishnan@eduhire-demo.in",
    phone: "9500100015",
    qualification: "M.Sc Mathematics, B.Ed",
    experience: "4 years",
    currentSchool: "Sri Ramakrishna Matriculation School",
    city: "Coimbatore",
    bio: "Patient and methodical mathematics teacher who uses structured worksheets, peer teaching, and visual aids to build numeracy in middle school.",
    subjects: ["Mathematics", "Science"],
    preferredBoards: [Board.STATE_BOARD, Board.CBSE],
    preferredGrades: ["6-8", "1-5"],
    expectedSalary: 35000,
    roleTitle: "Middle School Mathematics Teacher",
    certName: "Problem Solving in School Mathematics — CBSE",
    availabilityStatus: AvailabilityStatus.ACTIVELY_LOOKING,
  },
  // 16 – Hindi, Hyderabad
  {
    name: "Sunita Tiwari",
    email: "sunita.tiwari@eduhire-demo.in",
    phone: "9500100016",
    qualification: "MA Hindi, B.Ed",
    experience: "5 years",
    currentSchool: "Little Flower High School Hyderabad",
    city: "Hyderabad",
    bio: "Hindi teacher who focuses on reading fluency, grammar, essay writing, and spoken Hindi confidence for linguistically diverse classrooms.",
    subjects: ["Hindi", "Social Science"],
    preferredBoards: [Board.CBSE, Board.STATE_BOARD],
    preferredGrades: ["6-10", "6-8", "9-10"],
    expectedSalary: 40000,
    roleTitle: "Hindi Teacher",
    certName: "Hindi Language Teaching Certification — Kendriya Hindi Sansthan",
    availabilityStatus: AvailabilityStatus.ACTIVELY_LOOKING,
  },
  // 17 – PE, Chennai
  {
    name: "Vijay Balaji",
    email: "vijay.balaji@eduhire-demo.in",
    phone: "9500100017",
    qualification: "M.P.Ed",
    experience: "4 years",
    currentSchool: "SBOA School and Junior College Chennai",
    city: "Chennai",
    bio: "Sports-oriented PE teacher with expertise in track-and-field coaching, yoga integration, and annual sports-day planning for large schools.",
    subjects: ["Physical Education"],
    preferredBoards: [Board.CBSE, Board.STATE_BOARD],
    preferredGrades: ["1-12", "6-8", "9-10"],
    expectedSalary: 38000,
    roleTitle: "Physical Education Teacher",
    certName: "School Sports Coaching Certificate — SAI",
    availabilityStatus: AvailabilityStatus.ACTIVELY_LOOKING,
  },
  // 18 – Early Childhood, Pune
  {
    name: "Nalini D'Souza",
    email: "nalini.dsouza@eduhire-demo.in",
    phone: "9500100018",
    qualification: "MA Child Psychology, Montessori Level 3",
    experience: "4 years",
    currentSchool: "Podar Jumbo Kids Pune",
    city: "Pune",
    bio: "Early childhood specialist with Montessori and EYFS training; skilled at setting up purposeful play environments and smooth parent transitions.",
    subjects: ["Early Childhood", "All Subjects"],
    preferredBoards: [Board.CAMBRIDGE, Board.CBSE, Board.ICSE],
    preferredGrades: ["Pre-K", "1-5"],
    expectedSalary: 46000,
    roleTitle: "Early Years Foundation Teacher",
    certName: "Montessori International Diploma — AMI",
    availabilityStatus: AvailabilityStatus.OPEN_TO_OFFERS,
  },
  // 19 – Science, Coimbatore/Bengaluru, State Board/CBSE
  {
    name: "Karthikeyan Balakrishnan",
    email: "karthikeyan.b@eduhire-demo.in",
    phone: "9500100019",
    qualification: "M.Sc General Science, B.Ed",
    experience: "4 years",
    currentSchool: "Kongu Matric Higher Secondary School",
    city: "Coimbatore",
    bio: "Integrated science teacher who builds conceptual clarity through experiments, model-making, and meticulous notebook design.",
    subjects: ["Science", "Mathematics"],
    preferredBoards: [Board.STATE_BOARD, Board.CBSE],
    preferredGrades: ["6-8", "9-10"],
    expectedSalary: 36000,
    roleTitle: "Middle School Science Teacher",
    certName: "Middle School Science Teaching Strategies — SCERT",
    availabilityStatus: AvailabilityStatus.ACTIVELY_LOOKING,
  },
  // 20 – IGCSE Maths / TGT Maths, Bengaluru
  {
    name: "Rashida Khan",
    email: "rashida.khan@eduhire-demo.in",
    phone: "9500100020",
    qualification: "M.Sc Mathematics, B.Ed, CELTA",
    experience: "5 years",
    currentSchool: "Gear Innovative International School Bengaluru",
    city: "Bengaluru",
    bio: "Mathematics teacher fluent in both Cambridge IGCSE and ICSE frameworks; uses visual problem-solving approaches and Socratic questioning.",
    subjects: ["Mathematics"],
    preferredBoards: [Board.CAMBRIDGE, Board.ICSE, Board.CBSE],
    preferredGrades: ["6-10", "9-10", "11-12"],
    expectedSalary: 64000,
    roleTitle: "TGT / IGCSE Mathematics Teacher",
    certName: "Cambridge Mathematics Subject Knowledge Enhancement",
    availabilityStatus: AvailabilityStatus.ACTIVELY_LOOKING,
  },
];

// ─────────────────────────────────────────────
// Scoring
// ─────────────────────────────────────────────

function scoreJob(
  teacher: {
    subjects: string[];
    preferredBoards: Board[];
    preferredGrades: string[];
    city: string;
    expectedSalary: number;
  },
  job: {
    subject: string;
    board: Board;
    gradeLevel: string;
    city: string;
    salaryMin: number;
    salaryMax: number;
  }
): number {
  const jobSubject = job.subject.toLowerCase();
  const subjectMatch = teacher.subjects.some((s) => {
    const n = s.toLowerCase();
    return n === jobSubject || jobSubject.includes(n) || n.includes(jobSubject);
  });
  const boardMatch = teacher.preferredBoards.includes(job.board);
  const gradeMatch = teacher.preferredGrades.includes(job.gradeLevel);
  const cityMatch = teacher.city === job.city;
  const salaryMatch =
    job.salaryMin <= teacher.expectedSalary + 10000 &&
    job.salaryMax >= teacher.expectedSalary - 8000;

  let score = 0;
  if (subjectMatch) score += 50;
  if (boardMatch) score += 20;
  if (cityMatch) score += 15;
  if (gradeMatch) score += 10;
  if (salaryMatch) score += 5;
  return score;
}

// ─────────────────────────────────────────────
// Application timeline patterns
// ─────────────────────────────────────────────

function buildTimeline(
  index: number
): Array<{ toStatus: ApplicationStatus; note: string; rejectionReason?: RejectionReason }> {
  const pattern = index % 7;
  if (pattern === 0)
    return [
      { toStatus: ApplicationStatus.REVIEWED, note: "Profile aligned well with the role requirements." },
      { toStatus: ApplicationStatus.SHORTLISTED, note: "Shortlisted for demo-class review." },
    ];
  if (pattern === 1)
    return [{ toStatus: ApplicationStatus.REVIEWED, note: "Application reviewed by the academic coordinator." }];
  if (pattern === 2)
    return [
      { toStatus: ApplicationStatus.REVIEWED, note: "Initial screening completed." },
      { toStatus: ApplicationStatus.REJECTED, note: "A stronger fit was found for this grade band.", rejectionReason: RejectionReason.EXPERIENCE_MISMATCH },
    ];
  if (pattern === 3)
    return [
      { toStatus: ApplicationStatus.REVIEWED, note: "Subject expertise looks promising." },
      { toStatus: ApplicationStatus.SHORTLISTED, note: "Moved to shortlist for final panel." },
      { toStatus: ApplicationStatus.HIRED, note: "Selected after demo class and panel interaction." },
    ];
  if (pattern === 4)
    return [{ toStatus: ApplicationStatus.REJECTED, note: "Current vacancy was filled internally.", rejectionReason: RejectionReason.POSITION_FILLED }];
  if (pattern === 5)
    return [
      { toStatus: ApplicationStatus.REVIEWED, note: "Reviewed; salary expectations slightly above band." },
      { toStatus: ApplicationStatus.REJECTED, note: "Salary expectation exceeds current budget.", rejectionReason: RejectionReason.SALARY_MISMATCH },
    ];
  return [
    { toStatus: ApplicationStatus.REVIEWED, note: "Strong profile reviewed by the recruitment team." },
    { toStatus: ApplicationStatus.SHORTLISTED, note: "Shortlisted; interview to be scheduled shortly." },
    { toStatus: ApplicationStatus.INTERVIEW_SCHEDULED, note: "Video interview scheduled for next week." },
  ];
}

// ─────────────────────────────────────────────
// DB operations
// ─────────────────────────────────────────────

async function clearExistingData() {
  console.log("Clearing existing data...");
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
  console.log("All rows cleared.\n");
}

type JobRow = {
  id: string;
  postedBy: string;
  city: string;
  schoolName: string;
  board: Board;
  subject: string;
  title: string;
  gradeLevel: string;
  salaryMin: number;
  salaryMax: number;
  experience: string;
  postedAt: Date;
};

async function createSchoolsAndJobs(hashedPassword: string): Promise<JobRow[]> {
  const jobs: JobRow[] = [];

  for (let i = 0; i < SCHOOLS.length; i++) {
    const school = SCHOOLS[i];
    const user = await prisma.user.create({
      data: {
        email: school.adminEmail,
        name: school.adminName,
        phone: school.phone,
        avatarUrl: avatarFor(school.adminName, i),
        role: UserRole.SCHOOL_ADMIN,
        emailVerified: true,
        hashedPassword,
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
        logoUrl: avatarFor(school.schoolName, i),
        verified: true,
      },
    });

    for (const job of school.jobs) {
      const postedAt = daysAgo(job.daysAgo);
      const created = await prisma.jobPosting.create({
        data: {
          schoolId: profile.id,
          postedBy: user.id,
          title: job.title,
          subject: job.subject,
          board: school.board,
          gradeLevel: job.gradeLevel,
          jobType: job.jobType,
          experience: job.experience,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          description: job.description,
          status: JobStatus.ACTIVE,
          postedAt,
          expiresAt: new Date(postedAt.getTime() + 30 * DAY_MS),
        },
      });

      await prisma.jobRequirement.createMany({
        data: REQUIREMENTS.map((text, idx) => ({ jobId: created.id, text, sortOrder: idx })),
      });
      await prisma.jobBenefit.createMany({
        data: BENEFITS.map((text, idx) => ({ jobId: created.id, text, sortOrder: idx })),
      });

      jobs.push({
        id: created.id,
        postedBy: user.id,
        city: school.city,
        schoolName: school.schoolName,
        board: school.board,
        subject: job.subject,
        title: job.title,
        gradeLevel: job.gradeLevel,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        experience: job.experience,
        postedAt,
      });
    }
  }

  return jobs;
}

type TeacherRow = {
  userId: string;
  name: string;
  subjects: string[];
  preferredBoards: Board[];
  preferredGrades: string[];
  city: string;
  expectedSalary: number;
};

async function createTeachers(hashedPassword: string): Promise<TeacherRow[]> {
  const result: TeacherRow[] = [];

  for (let i = 0; i < TEACHERS.length; i++) {
    const t = TEACHERS[i];
    const user = await prisma.user.create({
      data: {
        email: t.email,
        name: t.name,
        phone: t.phone,
        avatarUrl: avatarFor(t.name, i + 10),
        role: UserRole.TEACHER,
        emailVerified: true,
        hashedPassword,
      },
    });

    const profile = await prisma.teacherProfile.create({
      data: {
        userId: user.id,
        qualification: t.qualification,
        experience: t.experience,
        currentSchool: t.currentSchool,
        city: t.city,
        bio: t.bio,
        subjects: t.subjects,
        preferredBoards: t.preferredBoards,
        preferredGrades: t.preferredGrades,
        expectedSalary: t.expectedSalary,
        availabilityStatus: t.availabilityStatus,
      },
    });

    await prisma.experience.create({
      data: {
        teacherProfileId: profile.id,
        schoolName: t.currentSchool,
        role: t.roleTitle,
        startDate: new Date("2021-06-01T00:00:00.000Z"),
        endDate: null,
        isCurrent: true,
        description: `Handled ${t.preferredGrades.join(", ")} classes with consistent lesson planning and assessment.`,
      },
    });

    await prisma.certification.create({
      data: {
        teacherProfileId: profile.id,
        name: t.certName,
        issuedBy: "EduHire Accreditation Board",
        issuedAt: new Date("2023-08-01T00:00:00.000Z"),
        credentialId: `CERT-${t.name.replace(/\s+/g, "-").toUpperCase()}`,
      },
    });

    await prisma.resume.create({
      data: {
        userId: user.id,
        fileUrl: `${RESUME_URL}?teacher=${encodeURIComponent(t.email)}`,
        fileName: `${t.name.replace(/\s+/g, "_")}_Resume.pdf`,
        fileSize: 150000,
        isGenerated: false,
      },
    });

    result.push({
      userId: user.id,
      name: t.name,
      subjects: t.subjects,
      preferredBoards: t.preferredBoards,
      preferredGrades: t.preferredGrades,
      city: t.city,
      expectedSalary: t.expectedSalary,
    });
  }

  return result;
}

async function createApplications(teachers: TeacherRow[], jobs: JobRow[]) {
  let total = 0;

  for (let ti = 0; ti < teachers.length; ti++) {
    const teacher = teachers[ti];

    // Score all jobs for this teacher
    const ranked = jobs
      .map((job) => ({ job, score: scoreJob(teacher, job) }))
      .sort((a, b) => b.score - a.score);

    // We need:
    //   - at least one job with score >= 80   (high match)
    //   - at least one job with score < 30    (low match)
    //   - at least 3 total applications

    const highMatch = ranked.find((e) => e.score >= 80);   // raw score (0–100)
    const lowMatch = [...ranked].reverse().find((e) => e.score < 30); // raw score

    if (!highMatch) throw new Error(`No high-match (>=80) job found for ${teacher.name}`);
    if (!lowMatch) throw new Error(`No low-match (<30) job found for ${teacher.name}`);

    const chosen: typeof ranked = [];
    const used = new Set<string>();

    // 1. Best matching job (score >=80)
    chosen.push(highMatch);
    used.add(highMatch.job.id);

    // 2. Low-score job (score <30)
    if (!used.has(lowMatch.job.id)) {
      chosen.push(lowMatch);
      used.add(lowMatch.job.id);
    }

    // 3. Fill up to at least 3 more mid-range jobs
    for (const entry of ranked) {
      if (chosen.length >= 5) break;
      if (used.has(entry.job.id)) continue;
      chosen.push(entry);
      used.add(entry.job.id);
    }

    for (let ai = 0; ai < chosen.length; ai++) {
      const { job, score } = chosen[ai];
      const appliedAt = new Date(job.postedAt.getTime() + (1 + (ti % 3)) * DAY_MS + (ai * 6 + 8) * 3600000);
      const timeline = buildTimeline(ti + ai);
      const finalStatus = timeline.length ? timeline[timeline.length - 1].toStatus : ApplicationStatus.PENDING;

      const app = await prisma.application.create({
        data: {
          jobId: job.id,
          applicantId: teacher.userId,
          coverLetter: `I am eager to apply for the ${job.title} role at ${job.schoolName}. My background in ${teacher.subjects.join(" and ")} aligns well with this opportunity.`,
          status: finalStatus,
          appliedAt,
          reviewedAt: timeline.length ? addHours(appliedAt, 20) : null,
          schoolNotes: finalStatus === ApplicationStatus.HIRED ? "Candidate accepted; onboarding initiated." : null,
          rejectionReason: timeline[timeline.length - 1]?.rejectionReason,
        },
      });

      // Store AI match score (score field is 0.0–1.0 float)
      const scoreFloat = score / 100;
      const subjectMatch = teacher.subjects.some((s) => job.subject.toLowerCase().includes(s.toLowerCase()));
      const boardMatch = teacher.preferredBoards.includes(job.board);
      const cityMatch = teacher.city === job.city;
      const gradeMatch = teacher.preferredGrades.includes(job.gradeLevel);
      const salaryMatch = job.salaryMin <= teacher.expectedSalary + 10000 && job.salaryMax >= teacher.expectedSalary - 8000;
      const matchParts: string[] = [];
      if (subjectMatch) matchParts.push(`${teacher.subjects[0]} subject`);
      if (cityMatch) matchParts.push(`location in ${job.city}`);
      if (boardMatch) matchParts.push(`${job.board} board`);
      const explanation = matchParts.length
        ? `Matches your ${matchParts.join(", ")}`
        : "Limited match — different subject, board, or location";

      await prisma.aIMatchScore.create({
        data: {
          jobId: job.id,
          applicantId: teacher.userId,
          score: scoreFloat,
          breakdown: { subjectMatch, boardMatch, cityMatch, gradeMatch, salaryMatch },
          explanation,
          computedAt: appliedAt,
        },
      });

      let prev: ApplicationStatus = ApplicationStatus.PENDING;
      for (let si = 0; si < timeline.length; si++) {
        const step = timeline[si];
        await prisma.applicationStatusHistory.create({
          data: {
            applicationId: app.id,
            fromStatus: prev,
            toStatus: step.toStatus,
            changedBy: job.postedBy,
            changedAt: addHours(appliedAt, 20 + si * 24),
            note: step.note,
            rejectionReason: step.rejectionReason,
          },
        });
        prev = step.toStatus;
      }

      total++;
    }
  }

  return total;
}

async function createAdmins(hashedPassword: string) {
  await prisma.user.create({
    data: {
      email: "admin@theeduhire.in",
      name: "EduHire Admin",
      role: UserRole.ADMIN,
      emailVerified: true,
      hashedPassword,
      avatarUrl: "https://ui-avatars.com/api/?name=EduHire+Admin&background=111827&color=fff",
    },
  });
  await prisma.user.create({
    data: {
      email: "operations@theeduhire.in",
      name: "EduHire Operations",
      role: UserRole.ADMIN,
      emailVerified: true,
      hashedPassword,
      avatarUrl: "https://ui-avatars.com/api/?name=EduHire+Ops&background=374151&color=fff",
    },
  });
}

async function verifyProfiles() {
  const teachers = await prisma.user.findMany({
    where: { role: UserRole.TEACHER },
    select: {
      name: true,
      phone: true,
      avatarUrl: true,
      teacherProfile: {
        include: {
          experiences: { select: { id: true } },
          certifications: { select: { id: true } },
        },
      },
      resumes: { select: { id: true } },
    },
  });

  return teachers.map((teacher) => {
    const profile = teacher.teacherProfile;
    const result = calculateProfileCompletion({
      avatarUrl: teacher.avatarUrl,
      bio: profile?.bio,
      qualification: profile?.qualification,
      city: profile?.city,
      subjects: profile?.subjects,
      preferredBoards: profile?.preferredBoards,
      preferredGrades: profile?.preferredGrades,
      experiences: profile?.experiences,
      certifications: profile?.certifications,
      resumes: teacher.resumes,
    });
    return {
      name: teacher.name,
      percentage: result.percentage,
      incomplete: [
        ...result.incomplete,
        ...(teacher.phone ? [] : ["Phone"]),
        ...(profile?.currentSchool ? [] : ["Current school"]),
        ...(profile?.experience ? [] : ["Experience summary"]),
        ...(profile?.expectedSalary != null ? [] : ["Expected salary"]),
      ],
    };
  });
}

async function verifySchoolProfiles() {
  const schools = await prisma.user.findMany({
    where: { role: UserRole.SCHOOL_ADMIN },
    select: {
      name: true,
      phone: true,
      avatarUrl: true,
      schoolProfile: {
        select: {
          schoolName: true,
          address: true,
          website: true,
          about: true,
          logoUrl: true,
          verified: true,
        },
      },
    },
  });

  return schools.map((s) => ({
    name: s.schoolProfile?.schoolName || s.name,
    incomplete: [
      ...(s.phone ? [] : ["Phone"]),
      ...(s.avatarUrl ? [] : ["Admin avatar"]),
      ...(s.schoolProfile?.address ? [] : ["Address"]),
      ...(s.schoolProfile?.website ? [] : ["Website"]),
      ...(s.schoolProfile?.about ? [] : ["About"]),
      ...(s.schoolProfile?.logoUrl ? [] : ["Logo"]),
      ...(s.schoolProfile?.verified ? [] : ["Verified"]),
    ],
  }));
}

async function validateDataset() {
  const counts = {
    schools: await prisma.schoolProfile.count(),
    jobs: await prisma.jobPosting.count(),
    teachers: await prisma.user.count({ where: { role: UserRole.TEACHER } }),
    admins: await prisma.user.count({ where: { role: UserRole.ADMIN } }),
    applications: await prisma.application.count(),
  };

  if (counts.schools < 6) throw new Error(`Expected ≥6 schools, found ${counts.schools}`);
  if (counts.jobs < 30) throw new Error(`Expected ≥30 jobs, found ${counts.jobs}`);
  if (counts.teachers < 20) throw new Error(`Expected ≥20 teachers, found ${counts.teachers}`);
  if (counts.admins < 2) throw new Error(`Expected ≥2 admins, found ${counts.admins}`);
  if (counts.applications < 60) throw new Error(`Expected ≥60 applications, found ${counts.applications}`);

  const jobsPerSchool = await prisma.schoolProfile.findMany({
    select: { schoolName: true, _count: { select: { jobPostings: true } } },
  });
  for (const s of jobsPerSchool) {
    if (s._count.jobPostings < 5) throw new Error(`${s.schoolName} has fewer than 5 jobs`);
  }

  const appsPerTeacher = await prisma.user.findMany({
    where: { role: UserRole.TEACHER },
    select: { name: true, _count: { select: { applications: true } } },
  });
  for (const t of appsPerTeacher) {
    if (t._count.applications < 3) throw new Error(`${t.name} has fewer than 3 applications`);
  }

  // Verify each teacher has one high (>=80) and one low (<30) score application
  const scores = await prisma.aIMatchScore.findMany({
    select: { applicantId: true, score: true },
  });
  const byTeacher = new Map<string, number[]>();
  for (const s of scores) {
    if (!byTeacher.has(s.applicantId)) byTeacher.set(s.applicantId, []);
    byTeacher.get(s.applicantId)!.push(s.score);
  }
  for (const [teacherId, teacherScores] of byTeacher) {
    const hasHigh = teacherScores.some((s) => s >= 0.8);
    const hasLow = teacherScores.some((s) => s < 0.3);
    if (!hasHigh || !hasLow) {
      const name = (await prisma.user.findUnique({ where: { id: teacherId }, select: { name: true } }))?.name;
      if (!hasHigh) throw new Error(`${name} has no high-score (≥80%) application`);
      if (!hasLow) throw new Error(`${name} has no low-score (<30%) application`);
    }
  }

  return counts;
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

async function main() {
  console.log("EduHire — Full Reseed\n");
  const hashedPassword = await hash(PASSWORD, 10);

  await clearExistingData();

  console.log("Creating schools and jobs...");
  const jobs = await createSchoolsAndJobs(hashedPassword);
  console.log(`  ${jobs.length} jobs created across ${SCHOOLS.length} schools.`);

  console.log("Creating teachers...");
  const teachers = await createTeachers(hashedPassword);
  console.log(`  ${teachers.length} teachers created.`);

  console.log("Creating admin accounts...");
  await createAdmins(hashedPassword);

  console.log("Creating applications and AI match scores...");
  const appCount = await createApplications(teachers, jobs);
  console.log(`  ${appCount} applications created.`);

  console.log("Validating dataset...\n");
  const counts = await validateDataset();

  const profileChecks = await verifyProfiles();
  const schoolChecks = await verifySchoolProfiles();
  const incomplete = profileChecks.filter((t) => t.percentage < 100 || t.incomplete.length > 0);
  const incompleteSchools = schoolChecks.filter((s) => s.incomplete.length > 0);

  console.log("Seed summary");
  console.log(`  Schools      : ${counts.schools}`);
  console.log(`  Jobs         : ${counts.jobs}`);
  console.log(`  Teachers     : ${counts.teachers}`);
  console.log(`  Admins       : ${counts.admins}`);
  console.log(`  Applications : ${counts.applications}`);
  console.log(`  Shortlisted  : ${await prisma.application.count({ where: { status: ApplicationStatus.SHORTLISTED } })}`);
  console.log(`  Hired        : ${await prisma.application.count({ where: { status: ApplicationStatus.HIRED } })}`);
  console.log(`  Teacher profiles at 100%  : ${profileChecks.length - incomplete.length}/${profileChecks.length}`);
  console.log(`  School profiles complete  : ${schoolChecks.length - incompleteSchools.length}/${schoolChecks.length}`);

  if (incomplete.length) {
    console.log("\nTeacher profiles with gaps:");
    for (const t of incomplete) console.log(`  - ${t.name}: ${t.percentage}% (${t.incomplete.join(", ")})`);
  }

  console.log("\nLogin credentials (shared password: SEED_DEFAULT_PASSWORD)");
  console.log("  Admins   : admin@theeduhire.in | operations@theeduhire.in");
  console.log("  Schools  : *@eduhire-demo.in (6 accounts)");
  console.log("  Teachers : *@eduhire-demo.in (20 accounts)");
}

main()
  .catch((err) => {
    console.error("Reseed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
