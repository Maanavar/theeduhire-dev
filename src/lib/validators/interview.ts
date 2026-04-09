import { z } from "zod";

export const scheduleInterviewSchema = z.object({
  applicationId: z.string().uuid("Invalid application ID"),
  scheduledAt: z.string().datetime("Invalid date/time format"),
  durationMins: z.number().int().min(15).max(120).default(30),
  type: z.enum(["VIDEO", "PHONE", "IN_PERSON"]),
  meetingLink: z.string().url().optional().or(z.literal("")),
  location: z.string().max(200).optional(),
});

export type ScheduleInterviewInput = z.infer<typeof scheduleInterviewSchema>;

export const updateInterviewSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]),
  teacherNotes: z.string().max(1000).optional(),
  schoolNotes: z.string().max(1000).optional(),
});

export type UpdateInterviewInput = z.infer<typeof updateInterviewSchema>;
