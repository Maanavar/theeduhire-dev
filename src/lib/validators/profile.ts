// Zod schemas for profile validation

import { z } from "zod";

export const availabilityStatusSchema = z.enum([
  "ACTIVELY_LOOKING",
  "OPEN_TO_OFFERS",
  "NOT_LOOKING",
]);

export const teacherProfileSchema = z.object({
  qualification: z.string().min(1).max(200).optional().or(z.literal("")),
  experience: z.string().min(1).max(100).optional().or(z.literal("")),
  currentSchool: z.string().min(1).max(200).optional().or(z.literal("")),
  city: z.string().min(1).max(100).optional().or(z.literal("")),
  bio: z.string().min(10).max(1000).optional().or(z.literal("")),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number").optional().or(z.literal("")),
  subjects: z.array(z.string()).default([]),
  preferredBoards: z.array(z.string()).default([]),
  preferredGrades: z.array(z.string()).default([]),
  expectedSalary: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.coerce.number().int().min(0).max(10000000).optional()
  ),
  availabilityStatus: availabilityStatusSchema.optional(),
});

export const experienceSchema = z.object({
  schoolName: z.string().min(1, "School name is required").max(200),
  role: z.string().min(1, "Role is required").max(200),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format").optional().nullable(),
  isCurrent: z.boolean().default(false),
  description: z.string().max(1000).optional(),
}).refine(
  (data) => data.isCurrent || !!data.endDate,
  { message: "End date is required unless this is your current position", path: ["endDate"] }
);

export const certificationSchema = z.object({
  name: z.string().min(1, "Certification name is required").max(200),
  issuedBy: z.string().min(1, "Issuing authority is required").max(200),
  issuedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format").optional().nullable(),
  credentialId: z.string().max(200).optional(),
});

export const schoolProfileSchema = z.object({
  schoolName: z.string().min(2, "School name is required"),
  city: z.string().min(1, "City is required"),
  board: z.enum(["CBSE", "ICSE", "STATE_BOARD", "IB", "CAMBRIDGE", "OTHER"]),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  about: z.string().max(2000).optional(),
});

export type TeacherProfileInput = z.infer<typeof teacherProfileSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type CertificationInput = z.infer<typeof certificationSchema>;
export type SchoolProfileInput = z.infer<typeof schoolProfileSchema>;
