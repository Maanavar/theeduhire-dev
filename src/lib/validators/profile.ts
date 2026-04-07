// Zod schemas for profile validation

import { z } from "zod";

export const teacherProfileSchema = z.object({
  qualification: z.string().optional(),
  experience: z.string().optional(),
  currentSchool: z.string().optional(),
  city: z.string().optional(),
  bio: z.string().max(1000).optional(),
  subjects: z.array(z.string()).optional(),
  preferredBoards: z.array(z.string()).optional(),
  preferredGrades: z.array(z.string()).optional(),
  expectedSalary: z.number().min(0).optional(),
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
export type SchoolProfileInput = z.infer<typeof schoolProfileSchema>;
