// Zod schemas for job posting validation
// Used in both API routes and form components

import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  subject: z.string().min(1, "Subject is required"),
  board: z.enum(["CBSE", "ICSE", "STATE_BOARD", "IB", "CAMBRIDGE", "OTHER"]),
  gradeLevel: z.string().min(1, "Grade level is required"),
  jobType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "VISITING_FACULTY"]).default("FULL_TIME"),
  experience: z.string().optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  description: z.string().min(50, "Description must be at least 50 characters"),
  requirements: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
});

export const jobFiltersSchema = z.object({
  search: z.string().optional(),
  subject: z.string().optional(),
  board: z.string().optional(),
  location: z.string().optional(),
  gradeLevel: z.string().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type JobFiltersInput = z.infer<typeof jobFiltersSchema>;
