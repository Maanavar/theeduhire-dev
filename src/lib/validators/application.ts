// Zod schemas for job application validation

import { z } from "zod";

export const applyJobSchema = z.object({
  coverLetter: z.string().optional(),
  resumeId: z.string().uuid().optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(["REVIEWED", "SHORTLISTED", "REJECTED", "HIRED"]),
  schoolNotes: z.string().optional(),
});

export type ApplyJobInput = z.infer<typeof applyJobSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
