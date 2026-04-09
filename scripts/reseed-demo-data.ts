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
const PASSWORD = "eduhire2026";
const NOW = new Date();
const RESUME_URL = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
const REQUIREMENTS = [
  "Relevant degree with B.Ed or equivalent",
  "Strong classroom management and communication",
  "Comfort with digital teaching tools",
];
const BENEFITS = [
  "Medical insurance",
  "Annual increment",
  "Professional development support",
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
  avatarUrl: string;
  qualification: string;
  experience: string;
  currentSchool: string;
  city: string;
  bio: string;
  subjects: string[];
  preferredBoards: string[];
  preferredGrades: string[];
  expectedSalary: number;
  applicationCount: number;
  roleTitle: string;
  certName: string;
};

const SCHOOLS: SchoolSeed[] = [
  {
    adminName: "Meenakshi Raghavan",
    adminEmail: "hr.chennai@eduhire-demo.in",
    phone: "04440011221",
    schoolName: "EduSpring International School",
    city: "Chennai",
    board: Board.CBSE,
    address: "OMR, Perungudi, Chennai 600096",
    website: "https://eduspringchennai.edu.in",
    about: "A Chennai CBSE campus known for strong academics and teacher mentoring.",
    jobs: [
      { title: "PGT Mathematics", subject: "Mathematics", gradeLevel: "9-12", jobType: JobType.FULL_TIME, experience: "3-5 years", salaryMin: 42000, salaryMax: 62000, description: "Senior secondary mathematics role with board exam focus.", daysAgo: 2 },
      { title: "TGT English", subject: "English", gradeLevel: "6-8", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 34000, salaryMax: 48000, description: "Middle school English with reading and writing workshops.", daysAgo: 4 },
    ],
  },
  {
    adminName: "Aravind Narayanan",
    adminEmail: "careers.coimbatore@eduhire-demo.in",
    phone: "04224001122",
    schoolName: "Greenfield Academy",
    city: "Coimbatore",
    board: Board.CBSE,
    address: "Avinashi Road, Coimbatore 641014",
    website: "https://greenfieldacademy.edu.in",
    about: "A Coimbatore school with strong primary pedagogy and coding clubs.",
    jobs: [
      { title: "Computer Science Teacher", subject: "Computer Science", gradeLevel: "9-12", jobType: JobType.FULL_TIME, experience: "2-5 years", salaryMin: 40000, salaryMax: 58000, description: "Teach Python, SQL, and coding projects.", daysAgo: 3 },
      { title: "Primary Teacher (All Subjects)", subject: "All Subjects", gradeLevel: "1-5", jobType: JobType.FULL_TIME, experience: "1-3 years", salaryMin: 26000, salaryMax: 38000, description: "Foundational classroom role for primary students.", daysAgo: 6 },
    ],
  },
  {
    adminName: "Sathya Priyan",
    adminEmail: "recruitment.madurai@eduhire-demo.in",
    phone: "04524001123",
    schoolName: "Heritage Public School",
    city: "Madurai",
    board: Board.STATE_BOARD,
    address: "KK Nagar, Madurai 625020",
    website: "https://heritagepublicmadurai.edu.in",
    about: "A respected Madurai campus with strong language and social science outcomes.",
    jobs: [
      { title: "Tamil Teacher", subject: "Tamil", gradeLevel: "9-12", jobType: JobType.FULL_TIME, experience: "3-5 years", salaryMin: 30000, salaryMax: 44000, description: "Senior Tamil and board exam preparation role.", daysAgo: 1 },
      { title: "Social Science Teacher", subject: "Social Science", gradeLevel: "6-8", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 28000, salaryMax: 39000, description: "Middle school history, civics, and geography.", daysAgo: 5 },
    ],
  },
  {
    adminName: "Divya Raman",
    adminEmail: "talent.trichy@eduhire-demo.in",
    phone: "04314001124",
    schoolName: "Scholars Global School",
    city: "Trichy",
    board: Board.CBSE,
    address: "Thillai Nagar, Trichy 620018",
    website: "https://scholarsglobaltrichy.edu.in",
    about: "A Trichy CBSE school with strong science and athletics programs.",
    jobs: [
      { title: "PGT Physics", subject: "Physics", gradeLevel: "11-12", jobType: JobType.FULL_TIME, experience: "5+ years", salaryMin: 48000, salaryMax: 72000, description: "Senior secondary physics with lab and board focus.", daysAgo: 2 },
      { title: "Physical Education Teacher", subject: "Physical Education", gradeLevel: "6-8", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 30000, salaryMax: 42000, description: "Coach school teams and conduct PE periods.", daysAgo: 7 },
    ],
  },
  {
    adminName: "Karthika Selvam",
    adminEmail: "jobs.salem@eduhire-demo.in",
    phone: "04274001125",
    schoolName: "Oakridge Senior Secondary School",
    city: "Salem",
    board: Board.CBSE,
    address: "Fairlands, Salem 636016",
    website: "https://oakridgesalem.edu.in",
    about: "A Salem senior-secondary campus with strong board exam performance.",
    jobs: [
      { title: "PGT Chemistry", subject: "Chemistry", gradeLevel: "11-12", jobType: JobType.FULL_TIME, experience: "3-5 years", salaryMin: 43000, salaryMax: 61000, description: "Senior chemistry with lab and board exam focus.", daysAgo: 3 },
      { title: "Biology Teacher", subject: "Biology", gradeLevel: "9-12", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 36000, salaryMax: 50000, description: "Biology teaching with practical support and revision planning.", daysAgo: 8 },
    ],
  },
  {
    adminName: "Janani Muthu",
    adminEmail: "hr.tirunelveli@eduhire-demo.in",
    phone: "04624001126",
    schoolName: "Riverside Matriculation School",
    city: "Tirunelveli",
    board: Board.STATE_BOARD,
    address: "Palayamkottai, Tirunelveli 627002",
    website: "https://riversidetnvl.edu.in",
    about: "A Tirunelveli school with strong arts and language programs.",
    jobs: [
      { title: "Art & Craft Teacher", subject: "Art & Craft", gradeLevel: "1-5", jobType: JobType.PART_TIME, experience: "1-3 years", salaryMin: 18000, salaryMax: 26000, description: "Primary art and craft teaching role.", daysAgo: 4 },
      { title: "Music Teacher", subject: "Music", gradeLevel: "1-5", jobType: JobType.PART_TIME, experience: "Fresher", salaryMin: 16000, salaryMax: 24000, description: "Primary music and performance guidance role.", daysAgo: 9 },
    ],
  },
  {
    adminName: "Rohini Venkat",
    adminEmail: "careers.vellore@eduhire-demo.in",
    phone: "04164001127",
    schoolName: "Lotus Residential Academy",
    city: "Vellore",
    board: Board.ICSE,
    address: "Katpadi, Vellore 632014",
    website: "https://lotusvellore.edu.in",
    about: "An ICSE residential campus known for language-rich classrooms and learner support.",
    jobs: [
      { title: "English Teacher", subject: "English", gradeLevel: "9-10", jobType: JobType.FULL_TIME, experience: "3-5 years", salaryMin: 36000, salaryMax: 52000, description: "ICSE English with debate and writing club support.", daysAgo: 2 },
      { title: "Early Childhood Educator", subject: "Early Childhood", gradeLevel: "Pre-K", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 24000, salaryMax: 34000, description: "Pre-primary classroom role with play-based routines.", daysAgo: 5 },
    ],
  },
];

const TEACHERS: TeacherSeed[] = [
  { name: "Kavitha Rajan", email: "kavitha.rajan@eduhire-demo.in", phone: "9001000001", avatarUrl: "https://ui-avatars.com/api/?name=Kavitha+Rajan&background=0D8ABC&color=fff", qualification: "M.Sc Mathematics, B.Ed", experience: "5+ years", currentSchool: "St. Anne's Matriculation School", city: "Chennai", bio: "Mathematics educator focused on board readiness and concept clarity.", subjects: ["Mathematics"], preferredBoards: ["CBSE", "ICSE"], preferredGrades: ["9-12", "11-12"], expectedSalary: 52000, applicationCount: 4, roleTitle: "PGT Mathematics", certName: "CBSE Mathematics Capacity Building" },
  { name: "Arun Prakash", email: "arun.prakash@eduhire-demo.in", phone: "9001000002", avatarUrl: "https://ui-avatars.com/api/?name=Arun+Prakash&background=1F9B63&color=fff", qualification: "M.Sc Physics, B.Ed", experience: "5+ years", currentSchool: "Noble Higher Secondary School", city: "Trichy", bio: "Physics teacher with strong practical-lab and senior-secondary experience.", subjects: ["Physics", "Mathematics"], preferredBoards: ["CBSE"], preferredGrades: ["9-12", "11-12"], expectedSalary: 56000, applicationCount: 3, roleTitle: "PGT Physics", certName: "Senior Secondary Physics Workshop" },
  { name: "Divya Shankar", email: "divya.shankar@eduhire-demo.in", phone: "9001000003", avatarUrl: "https://ui-avatars.com/api/?name=Divya+Shankar&background=E76F51&color=fff", qualification: "MA English, B.Ed", experience: "3-5 years", currentSchool: "St. Mary's Girls School", city: "Vellore", bio: "English teacher who enjoys reading circles, writing workshops, and spoken English practice.", subjects: ["English"], preferredBoards: ["CBSE", "ICSE"], preferredGrades: ["6-8", "9-10"], expectedSalary: 43000, applicationCount: 4, roleTitle: "TGT English", certName: "Cambridge English Teaching Qualification" },
  { name: "Harish Kumar", email: "harish.kumar@eduhire-demo.in", phone: "9001000004", avatarUrl: "https://ui-avatars.com/api/?name=Harish+Kumar&background=264653&color=fff", qualification: "M.Sc Chemistry, B.Ed", experience: "3-5 years", currentSchool: "Bharathi Vidyalaya", city: "Salem", bio: "Chemistry teacher with strong lab handling and concept-visualization skills.", subjects: ["Chemistry", "Biology"], preferredBoards: ["CBSE", "STATE_BOARD"], preferredGrades: ["9-12", "11-12"], expectedSalary: 50000, applicationCount: 3, roleTitle: "PGT Chemistry", certName: "Advanced Chemistry Lab Safety" },
  { name: "Meena Selvaraj", email: "meena.selvaraj@eduhire-demo.in", phone: "9001000005", avatarUrl: "https://ui-avatars.com/api/?name=Meena+Selvaraj&background=6A4C93&color=fff", qualification: "MCA, B.Ed", experience: "2-5 years", currentSchool: "Future Minds School", city: "Coimbatore", bio: "Computer Science teacher blending coding projects with strong classroom structure.", subjects: ["Computer Science", "Mathematics"], preferredBoards: ["CBSE"], preferredGrades: ["9-12"], expectedSalary: 52000, applicationCount: 4, roleTitle: "Computer Science Teacher", certName: "Python for Educators" },
  { name: "Nivetha Subramani", email: "nivetha.subramani@eduhire-demo.in", phone: "9001000006", avatarUrl: "https://ui-avatars.com/api/?name=Nivetha+Subramani&background=F4A261&color=fff", qualification: "BA Tamil, MA Tamil, B.Ed", experience: "3-5 years", currentSchool: "Government Girls Higher Secondary School", city: "Madurai", bio: "Tamil teacher with a strong interest in literature, grammar, and cultural events.", subjects: ["Tamil"], preferredBoards: ["STATE_BOARD"], preferredGrades: ["9-12"], expectedSalary: 38000, applicationCount: 2, roleTitle: "Tamil Teacher", certName: "Tamil Pedagogy Enrichment Certificate" },
  { name: "Suresh Balan", email: "suresh.balan@eduhire-demo.in", phone: "9001000007", avatarUrl: "https://ui-avatars.com/api/?name=Suresh+Balan&background=457B9D&color=fff", qualification: "MA History, B.Ed", experience: "2-4 years", currentSchool: "National Matric School", city: "Madurai", bio: "Social Science teacher using maps, timelines, and current affairs to build curiosity.", subjects: ["Social Science"], preferredBoards: ["STATE_BOARD", "CBSE"], preferredGrades: ["6-8", "9-10"], expectedSalary: 36000, applicationCount: 3, roleTitle: "Social Science Teacher", certName: "Social Science Classroom Strategies" },
  { name: "Priyanka Nair", email: "priyanka.nair@eduhire-demo.in", phone: "9001000008", avatarUrl: "https://ui-avatars.com/api/?name=Priyanka+Nair&background=2A9D8F&color=fff", qualification: "M.Sc Biotechnology, B.Ed", experience: "2-4 years", currentSchool: "Spring Dale School", city: "Salem", bio: "Biology educator who enjoys visual teaching aids and practical reinforcement.", subjects: ["Biology", "Chemistry"], preferredBoards: ["CBSE"], preferredGrades: ["9-12"], expectedSalary: 42000, applicationCount: 3, roleTitle: "Biology Teacher", certName: "Life Sciences for Senior School Teachers" },
  { name: "Raghav Iyer", email: "raghav.iyer@eduhire-demo.in", phone: "9001000009", avatarUrl: "https://ui-avatars.com/api/?name=Raghav+Iyer&background=8D99AE&color=fff", qualification: "M.P.Ed", experience: "2-4 years", currentSchool: "City Central School", city: "Trichy", bio: "PE teacher focused on structured fitness, team coaching, and positive participation.", subjects: ["Physical Education"], preferredBoards: ["CBSE", "STATE_BOARD"], preferredGrades: ["6-8", "9-10"], expectedSalary: 34000, applicationCount: 2, roleTitle: "PE Teacher", certName: "School Sports Coaching Certificate" },
  { name: "Lavanya Mohan", email: "lavanya.mohan@eduhire-demo.in", phone: "9001000010", avatarUrl: "https://ui-avatars.com/api/?name=Lavanya+Mohan&background=C1121F&color=fff", qualification: "BFA, Diploma in Art Education", experience: "1-3 years", currentSchool: "Shine Kids Academy", city: "Tirunelveli", bio: "Art educator who builds confidence through craft, colour, and exhibition-based activities.", subjects: ["Art & Craft", "Music"], preferredBoards: ["STATE_BOARD", "CBSE"], preferredGrades: ["1-5", "6-8"], expectedSalary: 26000, applicationCount: 3, roleTitle: "Art Teacher", certName: "Creative Arts in Primary Education" },
  { name: "Deepika Anand", email: "deepika.anand@eduhire-demo.in", phone: "9001000011", avatarUrl: "https://ui-avatars.com/api/?name=Deepika+Anand&background=588157&color=fff", qualification: "MA English, Montessori Certification", experience: "2-4 years", currentSchool: "Little Steps Preschool", city: "Vellore", bio: "Early childhood educator using play-based routines and language-rich classrooms.", subjects: ["Early Childhood", "English"], preferredBoards: ["ICSE", "CBSE"], preferredGrades: ["Pre-K", "1-5"], expectedSalary: 31000, applicationCount: 3, roleTitle: "Early Years Facilitator", certName: "Montessori Early Years Certificate" },
  { name: "Mohammed Azeem", email: "mohammed.azeem@eduhire-demo.in", phone: "9001000012", avatarUrl: "https://ui-avatars.com/api/?name=Mohammed+Azeem&background=3A86FF&color=fff", qualification: "M.Sc Mathematics, B.Ed", experience: "3-5 years", currentSchool: "Scholars High School", city: "Chennai", bio: "Secondary mathematics teacher with a calm, problem-solving classroom style.", subjects: ["Mathematics", "Computer Science"], preferredBoards: ["CBSE"], preferredGrades: ["6-8", "9-10"], expectedSalary: 47000, applicationCount: 4, roleTitle: "TGT Mathematics", certName: "Problem Solving in School Mathematics" },
];

function daysAgo(days: number) {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function parseYears(value: string) {
  const match = value.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

async function clearExistingData() {
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
}

async function createSchoolsAndJobs(hashedPassword: string) {
  const jobs: Array<{
    id: string;
    postedBy: string;
    city: string;
    schoolName: string;
    board: Board;
    subject: string;
    title: string;
    gradeLevel: string;
    salaryMin: number | null;
    salaryMax: number | null;
    experience: string | null;
  }> = [];

  for (const school of SCHOOLS) {
    const user = await prisma.user.create({
      data: {
        email: school.adminEmail,
        name: school.adminName,
        phone: school.phone,
        role: UserRole.SCHOOL_ADMIN,
        emailVerified: true,
        hashedPassword,
      },
    });

    const schoolProfile = await prisma.schoolProfile.create({
      data: {
        userId: user.id,
        schoolName: school.schoolName,
        city: school.city,
        board: school.board,
        address: school.address,
        website: school.website,
        about: school.about,
        verified: true,
      },
    });

    for (const job of school.jobs) {
      const createdJob = await prisma.jobPosting.create({
        data: {
          schoolId: schoolProfile.id,
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
          postedAt: daysAgo(job.daysAgo),
          expiresAt: daysAgo(job.daysAgo - 30),
        },
      });

      await prisma.jobRequirement.createMany({
        data: REQUIREMENTS.map((text, index) => ({ jobId: createdJob.id, text, sortOrder: index })),
      });
      await prisma.jobBenefit.createMany({
        data: BENEFITS.map((text, index) => ({ jobId: createdJob.id, text, sortOrder: index })),
      });

      jobs.push({
        id: createdJob.id,
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
      });
    }
  }

  return jobs;
}

async function createTeachers(hashedPassword: string) {
  const teachers: Array<{
    userId: string;
    name: string;
    subjects: string[];
    preferredBoards: string[];
    preferredGrades: string[];
    city: string;
    expectedSalary: number;
    applicationCount: number;
  }> = [];

  for (const teacher of TEACHERS) {
    const user = await prisma.user.create({
      data: {
        email: teacher.email,
        name: teacher.name,
        phone: teacher.phone,
        avatarUrl: teacher.avatarUrl,
        role: UserRole.TEACHER,
        emailVerified: true,
        hashedPassword,
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
        availabilityStatus: AvailabilityStatus.ACTIVELY_LOOKING,
      },
    });

    await prisma.experience.create({
      data: {
        teacherProfileId: profile.id,
        schoolName: teacher.currentSchool,
        role: teacher.roleTitle,
        startDate: new Date("2021-06-01T00:00:00.000Z"),
        endDate: null,
        isCurrent: true,
        description: `Handled ${teacher.preferredGrades.join(", ")} classes with consistent lesson planning and assessment.`,
      },
    });

    await prisma.certification.create({
      data: {
        teacherProfileId: profile.id,
        name: teacher.certName,
        issuedBy: "EduHire Demo Board",
        issuedAt: new Date("2023-08-01T00:00:00.000Z"),
        credentialId: `CERT-${teacher.name.replace(/\s+/g, "-").toUpperCase()}`,
      },
    });

    await prisma.resume.create({
      data: {
        userId: user.id,
        fileUrl: `${RESUME_URL}?teacher=${encodeURIComponent(teacher.email)}`,
        fileName: `${teacher.name.replace(/\s+/g, "_")}_Resume.pdf`,
        fileSize: 150000,
        isGenerated: false,
      },
    });

    teachers.push({
      userId: user.id,
      name: teacher.name,
      subjects: teacher.subjects,
      preferredBoards: teacher.preferredBoards,
      preferredGrades: teacher.preferredGrades,
      city: teacher.city,
      expectedSalary: teacher.expectedSalary,
      applicationCount: teacher.applicationCount,
    });
  }

  return teachers;
}

function scoreJob(
  teacher: {
    subjects: string[];
    preferredBoards: string[];
    preferredGrades: string[];
    city: string;
    expectedSalary: number;
  },
  job: {
    subject: string;
    board: Board;
    gradeLevel: string;
    city: string;
    salaryMin: number | null;
    salaryMax: number | null;
    experience: string | null;
  }
) {
  const jobSubject = job.subject.toLowerCase();
  const subjectMatch = teacher.subjects.some((subject) => {
    const normalized = subject.toLowerCase();
    return jobSubject === normalized || jobSubject.includes(normalized) || normalized.includes(jobSubject);
  });

  const boardMatch = teacher.preferredBoards.includes(job.board);
  const gradeMatch = teacher.preferredGrades.includes(job.gradeLevel);
  const cityMatch = teacher.city === job.city;
  const salaryMatch =
    (job.salaryMin ?? 0) <= teacher.expectedSalary + 8000 &&
    (job.salaryMax ?? teacher.expectedSalary) >= teacher.expectedSalary - 5000;

  let score = 0;
  if (subjectMatch) score += 50;
  if (boardMatch) score += 20;
  if (cityMatch) score += 15;
  if (gradeMatch) score += 10;
  if (salaryMatch) score += 5;

  return { score, subjectMatch };
}

function buildTimeline(
  index: number
): Array<{ toStatus: ApplicationStatus; note: string; rejectionReason?: RejectionReason }> {
  const pattern = index % 6;

  if (pattern === 0) {
    return [
      { toStatus: ApplicationStatus.REVIEWED, note: "Profile aligned well with the role requirements." },
      { toStatus: ApplicationStatus.SHORTLISTED, note: "Shortlisted for the next round." },
    ];
  }
  if (pattern === 1) {
    return [{ toStatus: ApplicationStatus.REVIEWED, note: "Application reviewed by the academic coordinator." }];
  }
  if (pattern === 2) {
    return [
      { toStatus: ApplicationStatus.REVIEWED, note: "Initial screening completed." },
      { toStatus: ApplicationStatus.REJECTED, note: "A stronger fit was available for this grade band.", rejectionReason: RejectionReason.EXPERIENCE_MISMATCH },
    ];
  }
  if (pattern === 3) {
    return [
      { toStatus: ApplicationStatus.REVIEWED, note: "Subject expertise looks promising." },
      { toStatus: ApplicationStatus.SHORTLISTED, note: "Moved to shortlist for demo-class review." },
      { toStatus: ApplicationStatus.HIRED, note: "Selected after the final panel interaction." },
    ];
  }
  if (pattern === 4) return [];
  return [{ toStatus: ApplicationStatus.REJECTED, note: "Current vacancy was filled internally.", rejectionReason: RejectionReason.POSITION_FILLED }];
}

async function createApplications(
  teachers: Awaited<ReturnType<typeof createTeachers>>,
  jobs: Awaited<ReturnType<typeof createSchoolsAndJobs>>
) {
  let createdCount = 0;

  for (let teacherIndex = 0; teacherIndex < teachers.length; teacherIndex++) {
    const teacher = teachers[teacherIndex];
    const ranked = jobs
      .map((job) => ({ job, ...scoreJob(teacher, job) }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return parseYears(b.job.experience || "") - parseYears(a.job.experience || "");
      });

    const strong = ranked.filter((entry) => entry.subjectMatch && entry.score >= 50);
    const chosen: typeof ranked = [];
    const used = new Set<string>();
    const minStrong = Math.min(2, Math.max(1, strong.length));

    for (const entry of strong) {
      if (chosen.length >= minStrong) break;
      chosen.push(entry);
      used.add(entry.job.id);
    }
    for (const entry of ranked) {
      if (chosen.length >= teacher.applicationCount) break;
      if (used.has(entry.job.id)) continue;
      chosen.push(entry);
      used.add(entry.job.id);
    }

    for (let appIndex = 0; appIndex < chosen.length; appIndex++) {
      const selected = chosen[appIndex];
      const appliedAt = daysAgo((teacherIndex % 5) + appIndex + 1);
      const timeline = buildTimeline(teacherIndex + appIndex);
      const finalStatus = timeline.length ? timeline[timeline.length - 1].toStatus : ApplicationStatus.PENDING;

      const application = await prisma.application.create({
        data: {
          jobId: selected.job.id,
          applicantId: teacher.userId,
          coverLetter: `I am excited to apply for the ${selected.job.title} role at ${selected.job.schoolName}. My background in ${teacher.subjects.join(", ")} makes this a strong fit.`,
          status: finalStatus,
          appliedAt,
          reviewedAt: timeline.length ? addHours(appliedAt, 18) : null,
          schoolNotes: finalStatus === ApplicationStatus.HIRED ? "Candidate accepted and onboarding initiated." : null,
          rejectionReason: timeline[timeline.length - 1]?.rejectionReason,
        },
      });

      let previousStatus: ApplicationStatus = ApplicationStatus.PENDING;
      for (let i = 0; i < timeline.length; i++) {
        const step = timeline[i];
        await prisma.applicationStatusHistory.create({
          data: {
            applicationId: application.id,
            fromStatus: previousStatus,
            toStatus: step.toStatus,
            changedBy: selected.job.postedBy,
            changedAt: addHours(appliedAt, 18 + i * 18),
            note: step.note,
            rejectionReason: step.rejectionReason,
          },
        });
        previousStatus = step.toStatus;
      }

      createdCount += 1;
    }
  }

  return createdCount;
}

async function createAdmin(hashedPassword: string) {
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
}

async function verifyProfiles() {
  const teachers = await prisma.user.findMany({
    where: { role: UserRole.TEACHER },
    select: {
      name: true,
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
    return {
      name: teacher.name,
      ...calculateProfileCompletion({
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
      }),
    };
  });
}

async function main() {
  console.log("Reseeding EduHire demo data...\n");
  const hashedPassword = await hash(PASSWORD, 10);

  await clearExistingData();
  const jobs = await createSchoolsAndJobs(hashedPassword);
  const teachers = await createTeachers(hashedPassword);
  await createAdmin(hashedPassword);
  const applicationCount = await createApplications(teachers, jobs);
  const profileChecks = await verifyProfiles();

  console.log("Seed summary");
  console.log(`- Schools: ${await prisma.schoolProfile.count()}`);
  console.log(`- Jobs: ${await prisma.jobPosting.count()}`);
  console.log(`- Teachers: ${await prisma.user.count({ where: { role: UserRole.TEACHER } })}`);
  console.log(`- School admins: ${await prisma.user.count({ where: { role: UserRole.SCHOOL_ADMIN } })}`);
  console.log(`- Applications: ${await prisma.application.count()}`);
  console.log(`- Shortlisted: ${await prisma.application.count({ where: { status: ApplicationStatus.SHORTLISTED } })}`);
  console.log(`- Hired: ${await prisma.application.count({ where: { status: ApplicationStatus.HIRED } })}`);
  console.log(`- Applications created this run: ${applicationCount}`);

  const incomplete = profileChecks.filter((item) => item.percentage < 100);
  console.log(`- Teachers at 100% completion: ${profileChecks.length - incomplete.length}/${profileChecks.length}`);
  if (incomplete.length) {
    console.log("\nProfiles below 100%");
    for (const item of incomplete) {
      console.log(`- ${item.name}: ${item.percentage}% (${item.incomplete.join(", ")})`);
    }
  }

  console.log("\nLogin credentials");
  console.log(`- Shared password: ${PASSWORD}`);
  console.log("- Admin: admin@theeduhire.in");
  console.log("- Schools: hr.chennai@eduhire-demo.in to careers.vellore@eduhire-demo.in");
  console.log("- Teachers: kavitha.rajan@eduhire-demo.in to mohammed.azeem@eduhire-demo.in");
}

main()
  .catch((error) => {
    console.error("Reseed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
