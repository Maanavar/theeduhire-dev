import { z } from "zod";

const applicationStatusValues = [
  "PENDING",
  "REVIEWED",
  "SHORTLISTED",
  "REJECTED",
  "HIRED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_COMPLETED",
] as const;

const screeningAnswerSchema = z.object({
  questionId: z.string().uuid(),
  question: z.string().min(1),
  answer: z.string().trim().min(1).max(1500),
});

export const applyJobSchema = z.object({
  coverLetter: z.string().max(5000).optional(),
  resumeId: z.string().uuid().optional(),
  screeningAnswers: z.array(screeningAnswerSchema).max(10).optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(applicationStatusValues),
  schoolNotes: z.string().optional(),
  rejectionReason: z
    .enum(["OVERQUALIFIED", "UNDERQUALIFIED", "POSITION_FILLED", "EXPERIENCE_MISMATCH", "LOCATION_MISMATCH", "SALARY_MISMATCH", "OTHER"])
    .optional(),
  note: z.string().optional(),
});

export const bulkStatusUpdateSchema = z.object({
  applicationIds: z.array(z.string().uuid()).min(1).max(50),
  status: z.enum(applicationStatusValues),
  rejectionReason: z
    .enum(["OVERQUALIFIED", "UNDERQUALIFIED", "POSITION_FILLED", "EXPERIENCE_MISMATCH", "LOCATION_MISMATCH", "SALARY_MISMATCH", "OTHER"])
    .optional(),
  note: z.string().optional(),
});

export type ApplyJobInput = z.infer<typeof applyJobSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
export type BulkStatusUpdateInput = z.infer<typeof bulkStatusUpdateSchema>;
