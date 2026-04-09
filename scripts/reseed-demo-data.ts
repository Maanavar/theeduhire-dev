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
const DAY_MS = 24 * 60 * 60 * 1000;
const RESUME_URL = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
const AVATAR_BACKGROUNDS = [
  "0D8ABC",
  "1F9B63",
  "E76F51",
  "264653",
  "6A4C93",
  "F4A261",
  "457B9D",
  "2A9D8F",
  "8D99AE",
  "C1121F",
];
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

function avatarFor(name: string, index: number) {
  const background = AVATAR_BACKGROUNDS[index % AVATAR_BACKGROUNDS.length];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${background}&color=fff`;
}

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
      { title: "Kindergarten Homeroom Teacher", subject: "Early Childhood", gradeLevel: "Pre-K", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 26000, salaryMax: 36000, description: "Play-based kindergarten classroom role with parent communication and observation notes.", daysAgo: 13 },
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
      { title: "PGT Commerce", subject: "Commerce", gradeLevel: "11-12", jobType: JobType.FULL_TIME, experience: "3-5 years", salaryMin: 42000, salaryMax: 56000, description: "Senior secondary commerce role with board-focused lesson planning.", daysAgo: 17 },
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
      { title: "Middle School Mathematics Teacher", subject: "Mathematics", gradeLevel: "6-8", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 31000, salaryMax: 42000, description: "Structured numeracy and problem-solving role for state-board learners.", daysAgo: 15 },
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
      { title: "Biology Teacher", subject: "Biology", gradeLevel: "9-12", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 39000, salaryMax: 51000, description: "Biology teaching with practical notebooks and revision cycles.", daysAgo: 19 },
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
      { title: "TGT Mathematics", subject: "Mathematics", gradeLevel: "6-8", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 35000, salaryMax: 46000, description: "Middle school mathematics with worksheet planning and skill reinforcement.", daysAgo: 16 },
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
      { title: "Primary Tamil Teacher", subject: "Tamil", gradeLevel: "3-5", jobType: JobType.FULL_TIME, experience: "1-3 years", salaryMin: 24000, salaryMax: 34000, description: "Tamil language teaching role for upper primary students.", daysAgo: 18 },
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
      { title: "Mathematics Teacher", subject: "Mathematics", gradeLevel: "6-8", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 36000, salaryMax: 48000, description: "ICSE middle school mathematics with problem-solving practice.", daysAgo: 20 },
    ],
  },
  {
    adminName: "Mahalakshmi Kumar",
    adminEmail: "admin.erode@eduhire-demo.in",
    phone: "04244001128",
    schoolName: "Sakthi Matric Higher Secondary School",
    city: "Erode",
    board: Board.STATE_BOARD,
    address: "Perundurai Road, Erode 638011",
    website: "https://sakthimatricerode.edu.in",
    about: "An Erode matric school with strong middle-school classroom systems and steady academic outcomes.",
    jobs: [
      { title: "Middle School Mathematics Teacher", subject: "Mathematics", gradeLevel: "6-8", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 30000, salaryMax: 40000, description: "Foundational algebra and geometry role for middle school learners.", daysAgo: 6 },
      { title: "Science Teacher", subject: "Science", gradeLevel: "6-8", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 32000, salaryMax: 43000, description: "Integrated science teaching with demos and notebook work.", daysAgo: 9 },
      { title: "Tamil Teacher", subject: "Tamil", gradeLevel: "6-8", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 28000, salaryMax: 36000, description: "Tamil grammar and reading support for middle school students.", daysAgo: 17 },
    ],
  },
  {
    adminName: "Vignesh Babu",
    adminEmail: "admin.thanjavur@eduhire-demo.in",
    phone: "04362401129",
    schoolName: "Cauvery Valley Senior Secondary School",
    city: "Thanjavur",
    board: Board.CBSE,
    address: "Medical College Road, Thanjavur 613004",
    website: "https://cauveryvalleythanjavur.edu.in",
    about: "A Thanjavur CBSE school with a growing commerce stream and disciplined academic systems.",
    jobs: [
      { title: "PGT Commerce", subject: "Commerce", gradeLevel: "11-12", jobType: JobType.FULL_TIME, experience: "3-5 years", salaryMin: 42000, salaryMax: 56000, description: "Commerce role with business-studies integration and board-prep routines.", daysAgo: 4 },
      { title: "Economics Teacher", subject: "Economics", gradeLevel: "11-12", jobType: JobType.FULL_TIME, experience: "3-5 years", salaryMin: 42000, salaryMax: 55000, description: "Economics teaching with analytical writing and graph work.", daysAgo: 10 },
      { title: "Accountancy Teacher", subject: "Accountancy", gradeLevel: "11-12", jobType: JobType.FULL_TIME, experience: "3-5 years", salaryMin: 43000, salaryMax: 57000, description: "Accountancy role with ledger practice and exam-writing support.", daysAgo: 18 },
    ],
  },
  {
    adminName: "Bhavani Sekar",
    adminEmail: "admin.hosur@eduhire-demo.in",
    phone: "04344201130",
    schoolName: "Innovators Public School Hosur",
    city: "Hosur",
    board: Board.CBSE,
    address: "Bagalur Road, Hosur 635109",
    website: "https://innovatorshosur.edu.in",
    about: "A Hosur CBSE campus with tech-enabled classrooms, bilingual support, and strong teacher coaching.",
    jobs: [
      { title: "Robotics Instructor", subject: "Robotics", gradeLevel: "6-8", jobType: JobType.CONTRACT, experience: "2-4 years", salaryMin: 42000, salaryMax: 54000, description: "Middle school robotics labs and innovation projects.", daysAgo: 5 },
      { title: "Hindi Teacher", subject: "Hindi", gradeLevel: "6-8", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 34000, salaryMax: 44000, description: "Hindi teaching with reading, grammar, and spoken support.", daysAgo: 12 },
      { title: "Computer Science Teacher", subject: "Computer Science", gradeLevel: "9-10", jobType: JobType.FULL_TIME, experience: "2-4 years", salaryMin: 40000, salaryMax: 52000, description: "Secondary CS with Python basics and practical projects.", daysAgo: 19 },
    ],
  },
];

const TEACHERS: TeacherSeed[] = [
  { name: "Kavitha Rajan", email: "kavitha.rajan@eduhire-demo.in", phone: "9001000001", avatarUrl: "https://ui-avatars.com/api/?name=Kavitha+Rajan&background=0D8ABC&color=fff", qualification: "M.Sc Mathematics, B.Ed", experience: "5+ years", currentSchool: "St. Anne's Matriculation School", city: "Chennai", bio: "Mathematics educator focused on board readiness and concept clarity.", subjects: ["Mathematics"], preferredBoards: ["CBSE", "ICSE"], preferredGrades: ["9-12", "11-12"], expectedSalary: 52000, applicationCount: 4, roleTitle: "PGT Mathematics", certName: "CBSE Mathematics Capacity Building" },
  { name: "Arun Prakash", email: "arun.prakash@eduhire-demo.in", phone: "9001000002", avatarUrl: "https://ui-avatars.com/api/?name=Arun+Prakash&background=1F9B63&color=fff", qualification: "M.Sc Physics, B.Ed", experience: "5+ years", currentSchool: "Noble Higher Secondary School", city: "Trichy", bio: "Physics teacher with strong practical-lab and senior-secondary experience.", subjects: ["Physics", "Mathematics"], preferredBoards: ["CBSE"], preferredGrades: ["9-12", "11-12"], expectedSalary: 56000, applicationCount: 4, roleTitle: "PGT Physics", certName: "Senior Secondary Physics Workshop" },
  { name: "Divya Shankar", email: "divya.shankar@eduhire-demo.in", phone: "9001000003", avatarUrl: "https://ui-avatars.com/api/?name=Divya+Shankar&background=E76F51&color=fff", qualification: "MA English, B.Ed", experience: "3-5 years", currentSchool: "St. Mary's Girls School", city: "Vellore", bio: "English teacher who enjoys reading circles, writing workshops, and spoken English practice.", subjects: ["English"], preferredBoards: ["CBSE", "ICSE"], preferredGrades: ["6-8", "9-10"], expectedSalary: 43000, applicationCount: 4, roleTitle: "TGT English", certName: "Cambridge English Teaching Qualification" },
  { name: "Harish Kumar", email: "harish.kumar@eduhire-demo.in", phone: "9001000004", avatarUrl: "https://ui-avatars.com/api/?name=Harish+Kumar&background=264653&color=fff", qualification: "M.Sc Chemistry, B.Ed", experience: "3-5 years", currentSchool: "Bharathi Vidyalaya", city: "Salem", bio: "Chemistry teacher with strong lab handling and concept-visualization skills.", subjects: ["Chemistry", "Biology"], preferredBoards: ["CBSE", "STATE_BOARD"], preferredGrades: ["9-12", "11-12"], expectedSalary: 50000, applicationCount: 4, roleTitle: "PGT Chemistry", certName: "Advanced Chemistry Lab Safety" },
  { name: "Meena Selvaraj", email: "meena.selvaraj@eduhire-demo.in", phone: "9001000005", avatarUrl: "https://ui-avatars.com/api/?name=Meena+Selvaraj&background=6A4C93&color=fff", qualification: "MCA, B.Ed", experience: "2-5 years", currentSchool: "Future Minds School", city: "Coimbatore", bio: "Computer Science teacher blending coding projects with strong classroom structure.", subjects: ["Computer Science", "Mathematics"], preferredBoards: ["CBSE"], preferredGrades: ["9-12"], expectedSalary: 52000, applicationCount: 4, roleTitle: "Computer Science Teacher", certName: "Python for Educators" },
  { name: "Nivetha Subramani", email: "nivetha.subramani@eduhire-demo.in", phone: "9001000006", avatarUrl: "https://ui-avatars.com/api/?name=Nivetha+Subramani&background=F4A261&color=fff", qualification: "BA Tamil, MA Tamil, B.Ed", experience: "3-5 years", currentSchool: "Government Girls Higher Secondary School", city: "Madurai", bio: "Tamil teacher with a strong interest in literature, grammar, and cultural events.", subjects: ["Tamil"], preferredBoards: ["STATE_BOARD"], preferredGrades: ["9-12"], expectedSalary: 38000, applicationCount: 4, roleTitle: "Tamil Teacher", certName: "Tamil Pedagogy Enrichment Certificate" },
  { name: "Suresh Balan", email: "suresh.balan@eduhire-demo.in", phone: "9001000007", avatarUrl: "https://ui-avatars.com/api/?name=Suresh+Balan&background=457B9D&color=fff", qualification: "MA History, B.Ed", experience: "2-4 years", currentSchool: "National Matric School", city: "Madurai", bio: "Social Science teacher using maps, timelines, and current affairs to build curiosity.", subjects: ["Social Science"], preferredBoards: ["STATE_BOARD", "CBSE"], preferredGrades: ["6-8", "9-10"], expectedSalary: 36000, applicationCount: 4, roleTitle: "Social Science Teacher", certName: "Social Science Classroom Strategies" },
  { name: "Priyanka Nair", email: "priyanka.nair@eduhire-demo.in", phone: "9001000008", avatarUrl: "https://ui-avatars.com/api/?name=Priyanka+Nair&background=2A9D8F&color=fff", qualification: "M.Sc Biotechnology, B.Ed", experience: "2-4 years", currentSchool: "Spring Dale School", city: "Salem", bio: "Biology educator who enjoys visual teaching aids and practical reinforcement.", subjects: ["Biology", "Chemistry"], preferredBoards: ["CBSE"], preferredGrades: ["9-12"], expectedSalary: 42000, applicationCount: 4, roleTitle: "Biology Teacher", certName: "Life Sciences for Senior School Teachers" },
  { name: "Raghav Iyer", email: "raghav.iyer@eduhire-demo.in", phone: "9001000009", avatarUrl: "https://ui-avatars.com/api/?name=Raghav+Iyer&background=8D99AE&color=fff", qualification: "M.P.Ed", experience: "2-4 years", currentSchool: "City Central School", city: "Trichy", bio: "PE teacher focused on structured fitness, team coaching, and positive participation.", subjects: ["Physical Education"], preferredBoards: ["CBSE", "STATE_BOARD"], preferredGrades: ["6-8", "9-10"], expectedSalary: 34000, applicationCount: 4, roleTitle: "PE Teacher", certName: "School Sports Coaching Certificate" },
  { name: "Lavanya Mohan", email: "lavanya.mohan@eduhire-demo.in", phone: "9001000010", avatarUrl: "https://ui-avatars.com/api/?name=Lavanya+Mohan&background=C1121F&color=fff", qualification: "BFA, Diploma in Art Education", experience: "1-3 years", currentSchool: "Shine Kids Academy", city: "Tirunelveli", bio: "Art educator who builds confidence through craft, colour, and exhibition-based activities.", subjects: ["Art & Craft", "Music"], preferredBoards: ["STATE_BOARD", "CBSE"], preferredGrades: ["1-5", "6-8"], expectedSalary: 26000, applicationCount: 4, roleTitle: "Art Teacher", certName: "Creative Arts in Primary Education" },
  { name: "Deepika Anand", email: "deepika.anand@eduhire-demo.in", phone: "9001000011", avatarUrl: "https://ui-avatars.com/api/?name=Deepika+Anand&background=588157&color=fff", qualification: "MA English, Montessori Certification", experience: "2-4 years", currentSchool: "Little Steps Preschool", city: "Vellore", bio: "Early childhood educator using play-based routines and language-rich classrooms.", subjects: ["Early Childhood", "English"], preferredBoards: ["ICSE", "CBSE"], preferredGrades: ["Pre-K", "1-5"], expectedSalary: 31000, applicationCount: 4, roleTitle: "Early Years Facilitator", certName: "Montessori Early Years Certificate" },
  { name: "Mohammed Azeem", email: "mohammed.azeem@eduhire-demo.in", phone: "9001000012", avatarUrl: "https://ui-avatars.com/api/?name=Mohammed+Azeem&background=3A86FF&color=fff", qualification: "M.Sc Mathematics, B.Ed", experience: "3-5 years", currentSchool: "Scholars High School", city: "Chennai", bio: "Secondary mathematics teacher with a calm, problem-solving classroom style.", subjects: ["Mathematics", "Computer Science"], preferredBoards: ["CBSE"], preferredGrades: ["6-8", "9-10", "9-12"], expectedSalary: 47000, applicationCount: 4, roleTitle: "TGT Mathematics", certName: "Problem Solving in School Mathematics" },
  { name: "Ashwin Daniel", email: "ashwin.daniel@eduhire-demo.in", phone: "9001000013", avatarUrl: "https://ui-avatars.com/api/?name=Ashwin+Daniel&background=9F1239&color=fff", qualification: "MA Music, Diploma in Carnatic Vocal", experience: "2-4 years", currentSchool: "Infant Jesus Matric School", city: "Tirunelveli", bio: "Music teacher with a strong Carnatic base and steady primary-classroom routines.", subjects: ["Music", "Art & Craft"], preferredBoards: ["STATE_BOARD", "CBSE"], preferredGrades: ["1-5", "3-5"], expectedSalary: 22000, applicationCount: 4, roleTitle: "Music Teacher", certName: "Carnatic Music Pedagogy Workshop" },
  { name: "Poornima Shankar", email: "poornima.shankar@eduhire-demo.in", phone: "9001000014", avatarUrl: "https://ui-avatars.com/api/?name=Poornima+Shankar&background=166534&color=fff", qualification: "M.Sc Mathematics, B.Ed", experience: "3-5 years", currentSchool: "Victory Matric School", city: "Erode", bio: "Mathematics teacher focused on foundational fluency and calm one-to-one support.", subjects: ["Mathematics", "Tamil"], preferredBoards: ["STATE_BOARD", "CBSE"], preferredGrades: ["6-8", "9-10"], expectedSalary: 35000, applicationCount: 4, roleTitle: "Middle School Mathematics Teacher", certName: "Problem Solving in School Mathematics" },
  { name: "Karthik Raja", email: "karthik.raja@eduhire-demo.in", phone: "9001000015", avatarUrl: "https://ui-avatars.com/api/?name=Karthik+Raja&background=15803D&color=fff", qualification: "M.Sc General Science, B.Ed", experience: "3-5 years", currentSchool: "Kongu Vidyalaya", city: "Erode", bio: "Science teacher who brings clarity through experiments and tightly planned notebook work.", subjects: ["Science", "Mathematics"], preferredBoards: ["STATE_BOARD", "CBSE"], preferredGrades: ["6-8", "9-10"], expectedSalary: 37000, applicationCount: 4, roleTitle: "Science Teacher", certName: "Middle School Science Teaching Strategies" },
  { name: "Sowmya Nandakumar", email: "sowmya.nandakumar@eduhire-demo.in", phone: "9001000016", avatarUrl: "https://ui-avatars.com/api/?name=Sowmya+Nandakumar&background=A16207&color=fff", qualification: "M.Com, B.Ed", experience: "4-6 years", currentSchool: "Sri Saraswathi Vidyalaya", city: "Thanjavur", bio: "Commerce teacher with strong board-paper planning and practical examples.", subjects: ["Commerce", "Accountancy"], preferredBoards: ["CBSE", "STATE_BOARD"], preferredGrades: ["11-12"], expectedSalary: 48000, applicationCount: 4, roleTitle: "PGT Commerce", certName: "Senior Secondary Commerce Enrichment" },
  { name: "Naren Chandran", email: "naren.chandran@eduhire-demo.in", phone: "9001000017", avatarUrl: "https://ui-avatars.com/api/?name=Naren+Chandran&background=854D0E&color=fff", qualification: "MA Economics, B.Ed", experience: "4-6 years", currentSchool: "Delta Higher Secondary School", city: "Thanjavur", bio: "Economics teacher who simplifies graphs, analytical writing, and case discussion.", subjects: ["Economics", "Commerce"], preferredBoards: ["CBSE"], preferredGrades: ["11-12"], expectedSalary: 47000, applicationCount: 4, roleTitle: "Economics Teacher", certName: "Applied Economics for School Teachers" },
  { name: "Deepa Lakshmi", email: "deepa.lakshmi@eduhire-demo.in", phone: "9001000018", avatarUrl: "https://ui-avatars.com/api/?name=Deepa+Lakshmi&background=334155&color=fff", qualification: "B.Tech Electronics, B.Ed", experience: "3-5 years", currentSchool: "Tech Valley School", city: "Hosur", bio: "STEM teacher with robotics-club experience and kit-based sessions.", subjects: ["Robotics", "Computer Science"], preferredBoards: ["CBSE"], preferredGrades: ["6-8", "9-10"], expectedSalary: 48000, applicationCount: 4, roleTitle: "Robotics Instructor", certName: "Robotics and AI for Educators" },
  { name: "Yasmin Fathima", email: "yasmin.fathima@eduhire-demo.in", phone: "9001000019", avatarUrl: "https://ui-avatars.com/api/?name=Yasmin+Fathima&background=0F172A&color=fff", qualification: "MA Hindi, B.Ed", experience: "3-5 years", currentSchool: "Oxford Public School", city: "Hosur", bio: "Hindi teacher who strengthens reading fluency, grammar practice, and spoken confidence.", subjects: ["Hindi", "Social Science"], preferredBoards: ["CBSE", "STATE_BOARD"], preferredGrades: ["6-8", "9-10"], expectedSalary: 39000, applicationCount: 4, roleTitle: "Hindi Teacher", certName: "Hindi Language Teaching Certificate" },
  { name: "Gokul Rajendran", email: "gokul.rajendran@eduhire-demo.in", phone: "9001000020", avatarUrl: "https://ui-avatars.com/api/?name=Gokul+Rajendran&background=15803D&color=fff", qualification: "BA English, D.El.Ed", experience: "2-4 years", currentSchool: "Rainbow Primary School", city: "Coimbatore", bio: "Primary teacher managing all core subjects with activity-based routines.", subjects: ["All Subjects", "English"], preferredBoards: ["CBSE", "STATE_BOARD"], preferredGrades: ["1-5", "Pre-K"], expectedSalary: 33000, applicationCount: 4, roleTitle: "Primary Teacher", certName: "Foundational Literacy and Numeracy Training" },
];

function daysAgo(days: number) {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function pickAppliedAt(postedAt: Date, seed: number) {
  const ageInDays = Math.max(1, Math.floor((NOW.getTime() - postedAt.getTime()) / DAY_MS));
  const delayInDays = Math.min(3, Math.max(0, ageInDays - 1));
  return addHours(new Date(postedAt.getTime() + delayInDays * DAY_MS), 8 + (seed % 8));
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
    postedAt: Date;
  }> = [];

  for (let index = 0; index < SCHOOLS.length; index++) {
    const school = SCHOOLS[index];
    const user = await prisma.user.create({
      data: {
        email: school.adminEmail,
        name: school.adminName,
        phone: school.phone,
        avatarUrl: avatarFor(school.adminName, index),
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
        logoUrl: avatarFor(school.schoolName, index),
        verified: true,
      },
    });

    for (const job of school.jobs) {
      const postedAt = daysAgo(job.daysAgo);
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
          postedAt,
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
        postedAt,
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

  return {
    score,
    subjectMatch,
    boardMatch,
    cityMatch,
    gradeMatch,
    salaryMatch,
    perfectMatch: subjectMatch && boardMatch && cityMatch && gradeMatch && salaryMatch,
  };
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

    const perfect = ranked.find((entry) => entry.perfectMatch);
    if (!perfect) {
      throw new Error(`No perfect match found for ${teacher.name}`);
    }

    const strong = ranked.filter((entry) => entry.subjectMatch && entry.score >= 50);
    const chosen: typeof ranked = [];
    const used = new Set<string>();
    chosen.push(perfect);
    used.add(perfect.job.id);
    const minStrong = Math.min(2, Math.max(1, strong.length));

    for (const entry of strong) {
      if (chosen.length >= minStrong) break;
      if (used.has(entry.job.id)) continue;
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
      const appliedAt = pickAppliedAt(selected.job.postedAt, teacherIndex + appIndex);
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

  return schools.map((school) => ({
    name: school.schoolProfile?.schoolName || school.name,
    incomplete: [
      ...(school.phone ? [] : ["Phone"]),
      ...(school.avatarUrl ? [] : ["Admin avatar"]),
      ...(school.schoolProfile?.address ? [] : ["Address"]),
      ...(school.schoolProfile?.website ? [] : ["Website"]),
      ...(school.schoolProfile?.about ? [] : ["About"]),
      ...(school.schoolProfile?.logoUrl ? [] : ["Logo"]),
      ...(school.schoolProfile?.verified ? [] : ["Verified badge"]),
    ],
  }));
}

async function validateDataset() {
  const counts = {
    schools: await prisma.schoolProfile.count(),
    jobs: await prisma.jobPosting.count(),
    teachers: await prisma.user.count({ where: { role: UserRole.TEACHER } }),
    schoolAdmins: await prisma.user.count({ where: { role: UserRole.SCHOOL_ADMIN } }),
    applications: await prisma.application.count(),
  };

  if (counts.schools < 10) throw new Error(`Expected at least 10 schools, found ${counts.schools}`);
  if (counts.jobs < 30) throw new Error(`Expected at least 30 jobs, found ${counts.jobs}`);
  if (counts.teachers < 20) throw new Error(`Expected at least 20 teachers, found ${counts.teachers}`);
  if (counts.schoolAdmins < 10) throw new Error(`Expected at least 10 school admins, found ${counts.schoolAdmins}`);
  if (counts.applications < 80) throw new Error(`Expected at least 80 applications, found ${counts.applications}`);

  const jobsPerSchool = await prisma.schoolProfile.findMany({
    select: { schoolName: true, _count: { select: { jobPostings: true } } },
  });
  const applicationsPerTeacher = await prisma.user.findMany({
    where: { role: UserRole.TEACHER },
    select: { name: true, _count: { select: { applications: true } } },
  });

  for (const school of jobsPerSchool) {
    if (school._count.jobPostings < 3) throw new Error(`${school.schoolName} has fewer than 3 jobs`);
  }
  for (const teacher of applicationsPerTeacher) {
    if (teacher._count.applications < 4) throw new Error(`${teacher.name} has fewer than 4 applications`);
  }

  const incompleteTeachers = (await verifyProfiles()).filter(
    (teacher) => teacher.percentage < 100 || teacher.incomplete.length > 0
  );
  const incompleteSchools = (await verifySchoolProfiles()).filter(
    (school) => school.incomplete.length > 0
  );

  if (incompleteTeachers.length) {
    throw new Error(
      `Teacher profiles incomplete: ${incompleteTeachers
        .map((teacher) => `${teacher.name} (${teacher.incomplete.join(", ")})`)
        .join("; ")}`
    );
  }
  if (incompleteSchools.length) {
    throw new Error(
      `School profiles incomplete: ${incompleteSchools
        .map((school) => `${school.name} (${school.incomplete.join(", ")})`)
        .join("; ")}`
    );
  }

  return counts;
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
  const schoolChecks = await verifySchoolProfiles();
  const counts = await validateDataset();

  console.log("Seed summary");
  console.log(`- Schools: ${counts.schools}`);
  console.log(`- Jobs: ${counts.jobs}`);
  console.log(`- Teachers: ${counts.teachers}`);
  console.log(`- School admins: ${counts.schoolAdmins}`);
  console.log(`- Applications: ${counts.applications}`);
  console.log(`- Shortlisted: ${await prisma.application.count({ where: { status: ApplicationStatus.SHORTLISTED } })}`);
  console.log(`- Hired: ${await prisma.application.count({ where: { status: ApplicationStatus.HIRED } })}`);
  console.log(`- Applications created this run: ${applicationCount}`);
  console.log(`- Jobs posted in the last 20 days: ${jobs.filter((job) => NOW.getTime() - job.postedAt.getTime() <= 20 * DAY_MS).length}/${jobs.length}`);

  const incomplete = profileChecks.filter((item) => item.percentage < 100 || item.incomplete.length > 0);
  const incompleteSchools = schoolChecks.filter((item) => item.incomplete.length > 0);
  console.log(`- Teachers at 100% completion: ${profileChecks.length - incomplete.length}/${profileChecks.length}`);
  console.log(`- School profiles fully filled: ${schoolChecks.length - incompleteSchools.length}/${schoolChecks.length}`);
  if (incomplete.length) {
    console.log("\nProfiles below 100%");
    for (const item of incomplete) {
      console.log(`- ${item.name}: ${item.percentage}% (${item.incomplete.join(", ")})`);
    }
  }

  console.log("\nLogin credentials");
  console.log(`- Shared password: ${PASSWORD}`);
  console.log("- Admin: admin@theeduhire.in");
  console.log("- Schools: 10 accounts on the @eduhire-demo.in domain");
  console.log("- Teachers: 20 accounts on the @eduhire-demo.in domain");
}

main()
  .catch((error) => {
    console.error("Reseed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
