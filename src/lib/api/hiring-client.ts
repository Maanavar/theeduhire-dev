import type { RankedCandidate } from "@/types";
import { apiRequest, apiRequestWithMeta } from "@/lib/api/client";

export type SchoolJobSummary = {
  id: string;
  title: string;
  status: "ACTIVE" | "DRAFT" | "CLOSED" | "EXPIRED";
  school?: {
    schoolName: string;
    city?: string | null;
    verified?: boolean;
    logoUrl?: string | null;
  };
};

export type InterviewRecord = {
  id: string;
  applicationId: string;
  scheduledAt: string;
  durationMins: number;
  type: "VIDEO" | "PHONE" | "IN_PERSON";
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  meetingLink: string | null;
  location: string | null;
  schoolNotes?: string | null;
  teacherNotes?: string | null;
  application: {
    id: string;
    applicantId?: string;
    job: {
      id: string;
      title: string;
      school: { schoolName: string };
    };
    applicant?: { id?: string; name: string; email?: string | null };
  };
};

export type ConversationSummary = {
  id: string;
  subject: string | null;
  unread: boolean;
  participants: Array<{ id: string; name: string; role: string }>;
  lastMessage:
    | { id: string; body: string; createdAt: string; sender: { id: string; name: string } }
    | null;
};

export type ConversationMessage = {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string };
};

export type ConversationDetail = {
  conversation: {
    id: string;
    subject: string | null;
    participants: Array<{ id: string; name: string; role: string }>;
    lastMessageAt: string | null;
  };
  messages: ConversationMessage[];
};

export type RankedCandidatesPage = {
  data: RankedCandidate[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ApplicantBoardCandidate = RankedCandidate & {
  schoolNotes: string | null;
  resume: { id: string; fileName: string } | null;
  screeningAnswers: Array<{
    id: string;
    questionSnapshot: string;
    answer: string;
    question: {
      id: string;
      question: string;
      required: boolean;
      sortOrder: number;
    };
  }>;
  applicant: RankedCandidate["applicant"] & {
    teacherProfile:
      | (NonNullable<RankedCandidate["applicant"]["teacherProfile"]> & {
          demoVideoUrl?: string | null;
          lessonPlanUrl?: string | null;
          safetyBadgeGranted?: boolean | null;
        })
      | null;
  };
};

export type ApplicantStatusUpdateInput = {
  status:
    | "PENDING"
    | "REVIEWED"
    | "SHORTLISTED"
    | "REJECTED"
    | "HIRED"
    | "INTERVIEW_SCHEDULED"
    | "INTERVIEW_COMPLETED";
  schoolNotes?: string;
  rejectionReason?: string;
  note?: string;
};

export type BulkApplicantStatusUpdateInput = {
  applicationIds: string[];
  status:
    | "PENDING"
    | "REVIEWED"
    | "SHORTLISTED"
    | "REJECTED"
    | "HIRED"
    | "INTERVIEW_SCHEDULED"
    | "INTERVIEW_COMPLETED";
  note?: string;
  rejectionReason?: string;
};

export type BulkApplicantStatusUpdateResult = {
  updated: number;
  failed: number;
};

export type ConversationCreateInput = {
  participantIds: string[];
  message: string;
  subject?: string;
};

export type ConversationCreateResult = {
  id: string;
};

export type ScheduleInterviewInput = {
  applicationId: string;
  scheduledAt: string;
  durationMins: number;
  type: "VIDEO" | "PHONE" | "IN_PERSON";
  meetingLink?: string;
  location?: string;
  schoolNotes?: string;
};

export type UpdateInterviewInput = {
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
  teacherNotes?: string;
  schoolNotes?: string;
};

export function getConversations() {
  return apiRequest<ConversationSummary[]>(
    "/api/messages",
    undefined,
    "Failed to load messages"
  );
}

export function getConversation(threadId: string) {
  return apiRequest<ConversationDetail>(
    `/api/messages/${threadId}`,
    undefined,
    "Failed to load conversation"
  );
}

export function sendConversationMessage(threadId: string, message: string) {
  return apiRequest<ConversationMessage>(
    `/api/messages/${threadId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    },
    "Failed to send message"
  );
}

export function getInterviews() {
  return apiRequest<InterviewRecord[]>(
    "/api/interviews",
    undefined,
    "Failed to load interviews"
  );
}

export function scheduleInterview(input: ScheduleInterviewInput) {
  return apiRequest<InterviewRecord>(
    "/api/interviews",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Failed to schedule interview"
  );
}

export function updateInterview(id: string, input: UpdateInterviewInput) {
  return apiRequest<InterviewRecord>(
    `/api/interviews/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Failed to update interview"
  );
}

export function getMyJobs() {
  return apiRequest<SchoolJobSummary[]>(
    "/api/my-jobs",
    undefined,
    "Failed to load jobs"
  );
}

export function getRankedCandidates(
  jobId: string,
  options: { page?: number; limit?: number; sort?: string } = {}
) {
  const params = new URLSearchParams();
  if (options.page) params.set("page", String(options.page));
  if (options.limit) params.set("limit", String(options.limit));
  if (options.sort) params.set("sort", options.sort);

  const query = params.toString();
  return apiRequestWithMeta<
    RankedCandidate[],
    string,
    RankedCandidatesPage["pagination"] extends infer TPagination
      ? { pagination?: TPagination }
      : {}
  >(
    `/api/jobs/${jobId}/candidates/ranked${query ? `?${query}` : ""}`,
    undefined,
    "Failed to load applicants"
  );
}

export async function getAllRankedCandidates(
  jobId: string,
  options: { limit?: number; sort?: string } = {}
): Promise<{ candidates: ApplicantBoardCandidate[]; contactHidden: boolean; aiAllowed: boolean }> {
  const allCandidates: ApplicantBoardCandidate[] = [];
  let page = 1;
  let totalPages = 1;
  let contactHidden = false;
  let aiAllowed = true;

  while (page <= totalPages) {
    const response = await apiRequestWithMeta<
      ApplicantBoardCandidate[],
      string,
      { pagination?: RankedCandidatesPage["pagination"]; meta?: { contactHidden: boolean; aiAllowed: boolean } }
    >(
      `/api/jobs/${jobId}/candidates/ranked?${new URLSearchParams({
        page: String(page),
        limit: String(options.limit ?? 50),
        ...(options.sort ? { sort: options.sort } : {}),
      }).toString()}`,
      undefined,
      "Failed to load applicants"
    );

    allCandidates.push(...response.data);
    totalPages = response.pagination?.totalPages || 1;
    if (response.meta) {
      contactHidden = response.meta.contactHidden;
      aiAllowed = response.meta.aiAllowed;
    }
    page += 1;
  }

  return { candidates: allCandidates, contactHidden, aiAllowed };
}

export function updateApplicationStatus(
  applicationId: string,
  input: ApplicantStatusUpdateInput
) {
  return apiRequest<ApplicantBoardCandidate>(
    `/api/applications/${applicationId}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Failed to update status"
  );
}

export function bulkUpdateApplicants(
  jobId: string,
  input: BulkApplicantStatusUpdateInput
) {
  return apiRequest<BulkApplicantStatusUpdateResult>(
    `/api/jobs/${jobId}/applicants/bulk`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Bulk update failed"
  );
}

export function createConversation(input: ConversationCreateInput) {
  return apiRequest<ConversationCreateResult>(
    "/api/messages",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Failed to create conversation"
  );
}

export function updateJobStatus(
  jobId: string,
  status: "DRAFT" | "ACTIVE" | "CLOSED" | "EXPIRED"
) {
  return apiRequest<{ id: string; status: string }>(
    `/api/jobs/${jobId}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
    "Failed to update job status"
  );
}
