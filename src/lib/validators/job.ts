// Zod schemas for job posting validation
// Used in both API routes and form components

import { z } from "zod";

const optionalDateInputSchema = z.preprocess(
  (value) => {
    if (value === undefined || value === null || value === "") return undefined;
    if (value instanceof Date) return value;
    if (typeof value === "string" || typeof value === "number") return new Date(value);
    return value;
  },
  z.date().optional()
);

const screeningQuestionSchema = z.object({
  question: z.string().trim().min(5, "Screening question must be at least 5 characters").max(240),
  required: z.boolean().optional().default(false),
  sortOrder: z.number().int().min(0).optional(),
});

const jobSchemaShape = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  subject: z.string().min(1, "Subject is required"),
  board: z.enum(["CBSE", "ICSE", "STATE_BOARD", "IB", "CAMBRIDGE", "OTHER"]),
  gradeLevel: z.string().min(1, "Grade level is required"),
  jobType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "VISITING_FACULTY"]).default("FULL_TIME"),
  experience: z.string().optional(),
  experienceLevel: z.enum(["FRESHER", "ONE_TO_TWO_YEARS", "TWO_TO_FIVE_YEARS", "FIVE_TO_TEN_YEARS", "TEN_PLUS_YEARS"]).optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  isUrgent: z.boolean().optional().default(false),
  requiredWithin48h: z.boolean().optional().default(false),
  requiresTet: z.boolean().optional().default(false),
  applicationDeadline: optionalDateInputSchema,
  description: z.string().min(50, "Description must be at least 50 characters"),
  requirements: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  screeningQuestions: z.array(screeningQuestionSchema).max(10).optional(),
});

const addJobGuards = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine((data: any, ctx) => {
    if (
      typeof data.salaryMin === "number" &&
      typeof data.salaryMax === "number" &&
      data.salaryMin > data.salaryMax
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["salaryMax"],
        message: "Maximum salary must be greater than or equal to minimum salary",
      });
    }

    if (data.applicationDeadline instanceof Date) {
      if (Number.isNaN(data.applicationDeadline.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["applicationDeadline"],
          message: "Application deadline is invalid",
        });
        return;
      }

      if (data.applicationDeadline.getTime() <= Date.now()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["applicationDeadline"],
          message: "Application deadline must be in the future",
        });
      }
    }
  });

export const createJobSchema = addJobGuards(jobSchemaShape);
export const updateJobSchema = addJobGuards(jobSchemaShape.partial());

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
