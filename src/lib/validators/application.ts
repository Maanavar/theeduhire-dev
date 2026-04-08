// Zod schemas for job application validation

import { z } from "zod";

export const applyJobSchema = z.object({
  coverLetter: z.string().optional(),
  resumeId: z.string().uuid().optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(["REVIEWED", "SHORTLISTED", "REJECTED", "HIRED"]),
  schoolNotes: z.string().optional(),
  rejectionReason: z
    .enum(["OVERQUALIFIED", "UNDERQUALIFIED", "POSITION_FILLED", "EXPERIENCE_MISMATCH", "LOCATION_MISMATCH", "SALARY_MISMATCH", "OTHER"])
    .optional(),
  note: z.string().optional(),
});

export const bulkStatusUpdateSchema = z.object({
  applicationIds: z.array(z.string().uuid()).min(1).max(50),
  status: z.enum(["REVIEWED", "SHORTLISTED", "REJECTED", "HIRED"]),
  rejectionReason: z
    .enum(["OVERQUALIFIED", "UNDERQUALIFIED", "POSITION_FILLED", "EXPERIENCE_MISMATCH", "LOCATION_MISMATCH", "SALARY_MISMATCH", "OTHER"])
    .optional(),
  note: z.string().optional(),
});

export type ApplyJobInput = z.infer<typeof applyJobSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
export type BulkStatusUpdateInput = z.infer<typeof bulkStatusUpdateSchema>;
