// GET  /api/screening-questions  — returns predefined bank + school's saved custom questions
// POST /api/screening-questions  — save a new custom question to school's bank

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";

export type QuestionType = "text" | "yes_no" | "rating" | "mcq";

export interface BankQuestion {
  id: string;        // "preset:<slug>" or "custom:<uuid>"
  question: string;
  questionType: QuestionType;
  options: string[]; // only for mcq
  required: boolean;
  isPreset: boolean;
  category: string;
}

const PRESET_BANK: BankQuestion[] = [
  // ── Eligibility & Qualifications ──────────────────────────────────────────
  {
    id: "preset:bed-degree",
    question: "Do you hold a B.Ed degree or equivalent teaching qualification?",
    questionType: "yes_no", options: [], required: true, isPreset: true,
    category: "Qualifications",
  },
  {
    id: "preset:tet-cleared",
    question: "Have you cleared TET (Teacher Eligibility Test)?",
    questionType: "yes_no", options: [], required: false, isPreset: true,
    category: "Qualifications",
  },
  {
    id: "preset:years-experience",
    question: "How many years of full-time teaching experience do you have?",
    questionType: "mcq",
    options: ["Less than 1 year", "1–2 years", "3–5 years", "6–10 years", "10+ years"],
    required: true, isPreset: true,
    category: "Qualifications",
  },
  {
    id: "preset:highest-qualification",
    question: "What is your highest academic qualification?",
    questionType: "mcq",
    options: ["Diploma", "Bachelor's degree", "Master's degree", "M.Phil / PhD", "Other"],
    required: true, isPreset: true,
    category: "Qualifications",
  },

  // ── Subject & Curriculum ──────────────────────────────────────────────────
  {
    id: "preset:boards-experience",
    question: "Which boards have you taught under?",
    questionType: "text", options: [], required: false, isPreset: true,
    category: "Subject & Curriculum",
  },
  {
    id: "preset:grade-comfort",
    question: "Which grade levels are you most comfortable teaching?",
    questionType: "text", options: [], required: false, isPreset: true,
    category: "Subject & Curriculum",
  },
  {
    id: "preset:curriculum-familiarity",
    question: "How familiar are you with the NCERT / State Board curriculum?",
    questionType: "rating", options: [], required: false, isPreset: true,
    category: "Subject & Curriculum",
  },

  // ── Availability & Logistics ──────────────────────────────────────────────
  {
    id: "preset:join-immediately",
    question: "Can you join within 30 days of selection?",
    questionType: "yes_no", options: [], required: false, isPreset: true,
    category: "Availability",
  },
  {
    id: "preset:notice-period",
    question: "What is your current notice period?",
    questionType: "mcq",
    options: ["Immediate joiner", "15 days", "30 days", "60 days", "More than 60 days"],
    required: false, isPreset: true,
    category: "Availability",
  },
  {
    id: "preset:relocation",
    question: "Are you open to relocating for this role?",
    questionType: "yes_no", options: [], required: false, isPreset: true,
    category: "Availability",
  },
  {
    id: "preset:part-time-full-time",
    question: "Are you looking for a full-time or part-time position?",
    questionType: "mcq",
    options: ["Full-time only", "Part-time only", "Either is fine"],
    required: false, isPreset: true,
    category: "Availability",
  },

  // ── Teaching Style & Approach ─────────────────────────────────────────────
  {
    id: "preset:classroom-management",
    question: "Rate your classroom management skills.",
    questionType: "rating", options: [], required: false, isPreset: true,
    category: "Teaching Style",
  },
  {
    id: "preset:tech-tools",
    question: "Are you comfortable using technology and digital tools in the classroom?",
    questionType: "yes_no", options: [], required: false, isPreset: true,
    category: "Teaching Style",
  },
  {
    id: "preset:differentiated-instruction",
    question: "Describe your approach to differentiated instruction for mixed-ability classrooms.",
    questionType: "text", options: [], required: false, isPreset: true,
    category: "Teaching Style",
  },
  {
    id: "preset:extracurricular",
    question: "Are you willing to take on extracurricular activities or clubs?",
    questionType: "yes_no", options: [], required: false, isPreset: true,
    category: "Teaching Style",
  },

  // ── Motivation & Fit ──────────────────────────────────────────────────────
  {
    id: "preset:why-school",
    question: "Why are you interested in teaching at our school?",
    questionType: "text", options: [], required: false, isPreset: true,
    category: "Motivation & Fit",
  },
  {
    id: "preset:salary-expectation",
    question: "What is your expected monthly salary (in ₹)?",
    questionType: "text", options: [], required: false, isPreset: true,
    category: "Motivation & Fit",
  },
  {
    id: "preset:long-term-goals",
    question: "Where do you see yourself professionally in 3 years?",
    questionType: "text", options: [], required: false, isPreset: true,
    category: "Motivation & Fit",
  },
];

export async function GET() {
  const auth = await requireAuth(["SCHOOL_ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  return NextResponse.json({ success: true, data: PRESET_BANK });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(["SCHOOL_ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { question, questionType, options, required } = body;

  if (!question?.trim()) {
    return NextResponse.json({ success: false, error: "Question text is required" }, { status: 400 });
  }

  const newQuestion: BankQuestion = {
    id: `custom:${Date.now()}-${Math.random().toString(36).slice(2)}`,
    question: question.trim(),
    questionType: questionType || "text",
    options: Array.isArray(options) ? options.filter((o: string) => o.trim()) : [],
    required: !!required,
    isPreset: false,
    category: "Custom",
  };

  return NextResponse.json({ success: true, data: newQuestion }, { status: 201 });
}
