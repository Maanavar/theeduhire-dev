// Zod schemas for profile validation

import { z } from "zod";
import { BOARDS, EXPERIENCE_LEVELS, GRADE_LEVELS, LOCATIONS, SUBJECTS } from "@/config/constants";

const subjectSchema = z.enum(SUBJECTS);
const boardValueSchema = z.enum(BOARDS.map((board) => board.value) as [string, ...string[]]);
const gradeLevelSchema = z.enum(GRADE_LEVELS);
const experienceLevelSchema = z.enum(EXPERIENCE_LEVELS);
const locationSchema = z.enum(LOCATIONS);

export const availabilityStatusSchema = z.enum([
  "ACTIVELY_LOOKING",
  "OPEN_TO_OFFERS",
  "NOT_LOOKING",
  "IMMEDIATE_JOINER",
  "PART_TIME_ONLY",
  "ONLINE_ONLY",
  "EXAM_SEASON",
]);

export const teacherProfileSchema = z.object({
  name: z.string().min(2).max(100).optional().or(z.literal("")),
  qualification: z.string().min(1).max(200).optional().or(z.literal("")),
  experience: experienceLevelSchema.optional().or(z.literal("")),
  currentSchool: z.string().min(1).max(200).optional().or(z.literal("")),
  city: locationSchema.optional().or(z.literal("")),
  bio: z.string().min(10).max(1000).optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^(\+91[-\s]?)?[6-9]\d{9}$/, "Enter a valid Indian mobile number")
    .optional()
    .or(z.literal("")),
  subjects: z.array(subjectSchema).max(8).default([]),
  preferredBoards: z.array(boardValueSchema).default([]),
  preferredGrades: z.array(gradeLevelSchema).default([]),
  expectedSalary: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.coerce.number().int().min(0).max(10000000).optional()
  ),
  availabilityStatus: availabilityStatusSchema.optional(),
  preferredJobTypes: z.array(z.string()).default([]),
  noticePeriodDays: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.coerce.number().int().min(0).max(365).optional()
  ),
  tetStatus: z.enum(["NONE", "TET", "CTET", "BOTH"]).optional(),
  teachingMediums: z.array(z.string()).default([]),
  demoVideoUrl: z.string().url().optional().or(z.literal("")),
  lessonPlanUrl: z.string().url().optional().or(z.literal("")),
  pocsoAcknowledged: z.boolean().optional(),
  referenceCheckDone: z.boolean().optional(),
  codeOfConductSigned: z.boolean().optional(),
});

export const experienceSchema = z.object({
  schoolName: z.string().min(1, "School name is required").max(200),
  role: z.string().min(1, "Role is required").max(200),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format").optional().nullable(),
  isCurrent: z.boolean().default(false),
  description: z.string().max(1000).optional(),
}).superRefine((data, ctx) => {
  if (!data.isCurrent && !data.endDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDate"],
      message: "End date is required unless this is your current position",
    });
    return;
  }

  if (data.endDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && startDate > endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be on or after start date",
      });
    }
  }
});

export const certificationSchema = z.object({
  name: z.string().min(1, "Certification name is required").max(200),
  issuedBy: z.string().min(1, "Issuing authority is required").max(200),
  issuedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format").optional().nullable(),
  credentialId: z.string().max(200).optional(),
}).superRefine((data, ctx) => {
  if (!data.expiresAt) return;
  const issuedAt = new Date(data.issuedAt);
  const expiresAt = new Date(data.expiresAt);
  if (!Number.isNaN(issuedAt.getTime()) && !Number.isNaN(expiresAt.getTime()) && expiresAt < issuedAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["expiresAt"],
      message: "Expiry date must be on or after issue date",
    });
  }
});

export const schoolProfileSchema = z.object({
  schoolName: z.string().min(2, "School name is required"),
  city: z.string().min(1, "City is required"),
  board: z.enum(["CBSE", "ICSE", "STATE_BOARD", "IB", "CAMBRIDGE", "OTHER"]),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  about: z.string().max(2000).optional(),
  hasPfEsi: z.boolean().optional(),
  paymentTrackRecord: z.enum(["ON_TIME", "DELAYED", "MIXED"]).optional(),
  workingHours: z.string().max(100).optional(),
  udiseCode: z.string().max(20).optional(),
});

export type TeacherProfileInput = z.infer<typeof teacherProfileSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type CertificationInput = z.infer<typeof certificationSchema>;
export type SchoolProfileInput = z.infer<typeof schoolProfileSchema>;
