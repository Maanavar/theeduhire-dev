"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Download,
  Eye,
  Loader2,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
  ShieldCheck,
  Star,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell, Panel, StatusBadge } from "@/components/layout/page-shell";
import { ErrorState } from "@/components/system/system-states";
import { getApiErrorMessage } from "@/lib/api/client";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ScheduleInterviewModal } from "@/components/interviews/schedule-interview-modal";

type ApplicantProfile = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  teacherProfile?: {
    city?: string;
    experience?: string;
    qualification?: string;
    subjects?: string[];
    bio?: string;
    salaryMin?: number;
    salaryMax?: number;
    noticePeriodDays?: number;
    safetyBadgeGranted?: boolean;
    demoVideoUrl?: string;
    lessonPlanUrl?: string;
    preferredBoards?: string[];
    preferredGrades?: string[];
  };
};

type QuestionType = "text" | "yes_no" | "rating" | "mcq";
type ScreeningAnswerRow = {
  questionId: string;
  question: string;
  questionType: QuestionType;
  options: string[];
  required: boolean;
  answer: string | null;
  answeredAt: string | null;
};

const PROFILE_TABS = ["Overview", "Resume & Docs", "Application", "Screening Answers", "Notes", "Activity"] as const;

const TYPE_LABEL: Record<QuestionType, string> = {
  text: "Text",
  yes_no: "Yes / No",
  rating: "Rating",
  mcq: "Multiple choice",
};

function ScreeningAnswersTab({ applicationId }: { applicationId: string | null }) {
  const [rows, setRows] = useState<ScreeningAnswerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!applicationId) return;
    setLoading(true);
    fetch(`/api/applications/${applicationId}/screening-answers`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setRows(j.data);
        else setError(j.error || "Failed to load answers");
      })
      .catch(() => setError("Failed to load screening answers"))
      .finally(() => setLoading(false));
  }, [applicationId]);

  if (!applicationId) {
    return (
      <Panel className="flex items-center justify-center p-12 text-center">
        <div>
          <p className="text-[14px] font-semibold text-[var(--eh-text)]">No application linked</p>
          <p className="mt-1 text-[13px] text-[var(--eh-text-3)]">Open this page from the Applicants table to see screening answers.</p>
        </div>
      </Panel>
    );
  }

  if (loading) {
    return (
      <Panel className="flex items-center justify-center p-12">
        <Loader2 size={20} className="animate-spin text-[var(--eh-text-4)]" />
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel className="p-6">
        <p className="text-[13px] text-red-600">{error}</p>
      </Panel>
    );
  }

  if (rows.length === 0) {
    return (
      <Panel className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-base)]">
          <span className="text-[22px]">📋</span>
        </div>
        <div>
          <p className="text-[14px] font-semibold text-[var(--eh-text)]">No screening questions for this job</p>
          <p className="mt-1 text-[13px] text-[var(--eh-text-3)]">
            Add screening questions when posting a job to see candidate answers here.
          </p>
        </div>
        <Link href="/dashboard/post-job" className="eh-btn eh-btn-secondary eh-btn-sm">
          Post a job with questions
        </Link>
      </Panel>
    );
  }

  const answered = rows.filter((r) => r.answer !== null).length;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <Panel className="flex items-center justify-between px-5 py-3">
        <p className="text-[13px] text-[var(--eh-text-2)]">
          <span className="font-semibold text-[var(--eh-text)]">{answered}</span> of {rows.length} questions answered
        </p>
        <div className="flex items-center gap-2">
          <div className="h-2 w-32 overflow-hidden rounded-full bg-[var(--surface-base)]">
            <div
              className="h-full rounded-full bg-[var(--eh-primary-600)] transition-all"
              style={{ width: `${rows.length > 0 ? (answered / rows.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[12px] text-[var(--eh-text-3)]">
            {rows.length > 0 ? Math.round((answered / rows.length) * 100) : 0}%
          </span>
        </div>
      </Panel>

      {/* Question + answer cards */}
      {rows.map((row, i) => {
        const hasAnswer = row.answer !== null && row.answer.trim() !== "";
        return (
          <Panel key={row.questionId} className="p-5">
            {/* Question header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--eh-primary-100)] text-[11px] font-bold text-[var(--eh-primary-700)]">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-[var(--eh-text)] leading-snug">{row.question}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-full border border-[var(--eh-border)] bg-[var(--surface-base)] px-2 py-0.5 text-[10px] font-medium text-[var(--eh-text-3)]">
                      {TYPE_LABEL[row.questionType]}
                    </span>
                    {row.required && (
                      <span className="text-[10px] font-semibold text-red-500">Required</span>
                    )}
                  </div>
                </div>
              </div>
              {hasAnswer ? (
                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                  Answered
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-[var(--surface-base)] px-2 py-0.5 text-[11px] font-semibold text-[var(--eh-text-4)] border border-[var(--eh-border)]">
                  Skipped
                </span>
              )}
            </div>

            {/* Answer display */}
            {hasAnswer ? (
              <div className="rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] p-4">
                {row.questionType === "text" && (
                  <p className="text-[13px] leading-relaxed text-[var(--eh-text-2)] whitespace-pre-wrap">{row.answer}</p>
                )}

                {row.questionType === "yes_no" && (
                  <span className={[
                    "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-bold",
                    row.answer === "Yes" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200",
                  ].join(" ")}>
                    {row.answer === "Yes" ? "✓" : "✗"} {row.answer}
                  </span>
                )}

                {row.questionType === "rating" && (
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className={["text-[22px]", Number(row.answer) >= n ? "text-amber-400" : "text-gray-200"].join(" ")}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-[13px] font-bold text-[var(--eh-text)]">{row.answer} / 5</span>
                  </div>
                )}

                {row.questionType === "mcq" && (
                  <div className="space-y-1.5">
                    {row.options.map((opt) => (
                      <div
                        key={opt}
                        className={[
                          "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-[13px]",
                          opt === row.answer
                            ? "border-[var(--eh-primary-300)] bg-[var(--eh-primary-50)] font-semibold text-[var(--eh-primary-700)]"
                            : "border-[var(--eh-border)] text-[var(--eh-text-3)]",
                        ].join(" ")}
                      >
                        <span className={["h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0", opt === row.answer ? "border-[var(--eh-primary-600)]" : "border-[var(--eh-border)]"].join(" ")}>
                          {opt === row.answer && <span className="h-2 w-2 rounded-full bg-[var(--eh-primary-600)]" />}
                        </span>
                        {opt}
                      </div>
                    ))}
                  </div>
                )}

                {row.answeredAt && (
                  <p className="mt-2 text-[11px] text-[var(--eh-text-4)]">
                    Answered {new Date(row.answeredAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[13px] italic text-[var(--eh-text-4)]">
                {row.required ? "Candidate did not answer this required question." : "Candidate skipped this question."}
              </p>
            )}
          </Panel>
        );
      })}
    </div>
  );
}

export default function ApplicantDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const applicantId = params?.id as string;
  const applicationId = searchParams.get("applicationId");

  const [profile, setProfile] = useState<ApplicantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<typeof PROFILE_TABS[number]>("Overview");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [matchScore] = useState(92);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/users/${applicantId}/profile`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to load profile");
      setProfile(json.data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load applicant profile"));
    } finally {
      setLoading(false);
    }
  }, [applicantId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[var(--eh-text-4)]" />
        </div>
      </PageShell>
    );
  }

  if (error || !profile) {
    return (
      <ErrorState
        title="Applicant not found"
        message={error || "This applicant may no longer be available."}
        actions={<Link href="/dashboard/applicants" className="eh-btn eh-btn-secondary eh-btn-sm">Back to Applicants</Link>}
      />
    );
  }

  const tp = profile.teacherProfile;
  const scoreColor = matchScore >= 90 ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : matchScore >= 75 ? "text-[var(--eh-primary-700)] bg-[var(--eh-primary-50)] border-[var(--eh-primary-100)]"
    : "text-amber-700 bg-amber-50 border-amber-200";

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-[var(--eh-text-3)]">
        <Link href="/dashboard/applicants" className="hover:text-[var(--eh-text-2)] flex items-center gap-1">
          <ArrowLeft size={13} /> Applicants
        </Link>
        <ChevronRight size={12} />
        <span className="text-[var(--eh-text)]">{profile.name}</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        {/* Main content */}
        <div className="space-y-4">
          {/* Profile header */}
          <Panel className="p-5">
            <div className="flex items-start gap-4">
              <UserAvatar name={profile.name} avatarUrl={profile.avatarUrl} size={72} className="shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-[22px] font-semibold text-[var(--eh-text)]">{profile.name}</h1>
                  {tp?.safetyBadgeGranted && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                      <ShieldCheck size={11} /> Safety Verified
                    </span>
                  )}
                  <span className={`rounded-md border px-2.5 py-1 text-[13px] font-bold ${scoreColor}`}>
                    {matchScore}% Match
                  </span>
                </div>
                <p className="mt-1 text-[14px] text-[var(--eh-text-3)]">
                  {tp?.subjects?.[0] ? `${tp.subjects[0]} Teacher` : "Teacher"}
                  {tp?.city ? ` · ${tp.city}, Tamil Nadu` : ""}
                  {tp?.experience ? ` · ${tp.experience}` : ""}
                </p>
                {profile.email && (
                  <a href={`mailto:${profile.email}`} className="mt-1 flex items-center gap-1 text-[13px] text-[var(--eh-text-3)] hover:underline">
                    <Mail size={12} /> {profile.email}
                  </a>
                )}
                {profile.phone && (
                  <a href={`tel:${profile.phone}`} className="flex items-center gap-1 text-[13px] text-[var(--eh-text-3)] hover:underline">
                    <Phone size={12} /> {profile.phone}
                  </a>
                )}
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <button className="eh-btn eh-btn-primary"><Star size={13} /> Shortlist</button>
                <button className="eh-btn eh-btn-secondary"><MessageSquare size={13} /> Message</button>
                <button onClick={() => setScheduleOpen(true)} className="eh-btn eh-btn-secondary"><Calendar size={13} /> Schedule Interview</button>
                <button className="eh-btn eh-btn-secondary"><MoreHorizontal size={13} /> More</button>
              </div>
            </div>

            {/* Tab bar */}
            <div className="mt-5 flex overflow-x-auto border-b border-[var(--eh-border)]">
              {PROFILE_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={["whitespace-nowrap px-4 py-3 text-[13px] font-semibold border-b-2 transition-colors", activeTab === tab ? "border-[var(--eh-primary-600)] text-[var(--eh-primary-700)]" : "border-transparent text-[var(--eh-text-3)] hover:text-[var(--eh-text-2)]"].join(" ")}
                >
                  {tab}
                </button>
              ))}
            </div>
          </Panel>

          {activeTab === "Overview" && (
            <div className="space-y-4">
              {tp?.bio && (
                <Panel className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[14px] font-semibold text-[var(--eh-text)]">About</h3>
                    <button className="text-[var(--eh-text-4)] hover:text-[var(--eh-text-2)]"><span className="text-[14px]">✏</span></button>
                  </div>
                  <p className="text-[13px] leading-relaxed text-[var(--eh-text-2)]">{tp.bio}</p>
                </Panel>
              )}

              <Panel className="p-5">
                <h3 className="text-[14px] font-semibold text-[var(--eh-text)] mb-4">Profile Details</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {[
                    { icon: "💼", label: "Experience", value: tp?.experience || "—" },
                    { icon: "🎓", label: "Qualification", value: tp?.qualification || "—" },
                    { icon: "📚", label: "Subjects", value: tp?.subjects?.join(", ") || "—" },
                    { icon: "🏫", label: "Grades", value: tp?.preferredGrades?.join(", ") || "—" },
                    { icon: "🏛", label: "Board Experience", value: tp?.preferredBoards?.join(", ") || "—" },
                    { icon: "💰", label: "Salary Expectation", value: tp?.salaryMin && tp?.salaryMax ? `₹${(tp.salaryMin / 1000).toFixed(0)}K – ₹${(tp.salaryMax / 1000).toFixed(0)}K` : "—" },
                    { icon: "⏰", label: "Notice Period", value: tp?.noticePeriodDays ? `${tp.noticePeriodDays} days` : "—" },
                    { icon: "📍", label: "Location", value: tp?.city ? `${tp.city}, Tamil Nadu` : "—" },
                  ].map((item) => (
                    <div key={item.label} className="flex gap-3 rounded-xl bg-[var(--surface-base)] px-3 py-3">
                      <span className="shrink-0 text-[16px]">{item.icon}</span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--eh-text-4)]">{item.label}</p>
                        <p className="mt-0.5 text-[13px] font-medium text-[var(--eh-text-2)]">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel className="p-5">
                <h3 className="text-[14px] font-semibold text-[var(--eh-text)] mb-4">Resume & Documents</h3>
                <div className="space-y-2">
                  {tp?.demoVideoUrl && (
                    <a href={tp.demoVideoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-[var(--eh-border)] px-4 py-3 hover:bg-[var(--surface-base)] transition-colors">
                      <span className="text-[20px]">🎥</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-[var(--eh-text)]">Demo Video</p>
                        <p className="text-[11px] text-[var(--eh-text-3)]">Teaching demonstration video</p>
                      </div>
                      <Eye size={15} className="shrink-0 text-[var(--eh-text-4)]" />
                    </a>
                  )}
                  {tp?.lessonPlanUrl && (
                    <a href={tp.lessonPlanUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-[var(--eh-border)] px-4 py-3 hover:bg-[var(--surface-base)] transition-colors">
                      <span className="text-[20px]">📄</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-[var(--eh-text)]">Lesson Plan</p>
                        <p className="text-[11px] text-[var(--eh-text-3)]">Sample lesson plan document</p>
                      </div>
                      <Download size={15} className="shrink-0 text-[var(--eh-text-4)]" />
                    </a>
                  )}
                  {!tp?.demoVideoUrl && !tp?.lessonPlanUrl && (
                    <div className="flex items-center justify-center rounded-xl border border-dashed border-[var(--eh-border)] py-8 text-center">
                      <div>
                        <Upload size={20} className="mx-auto mb-2 text-[var(--eh-text-4)]" />
                        <p className="text-[13px] text-[var(--eh-text-3)]">No documents uploaded yet</p>
                      </div>
                    </div>
                  )}
                </div>
              </Panel>
            </div>
          )}

          {activeTab === "Screening Answers" && (
            <ScreeningAnswersTab applicationId={applicationId} />
          )}

          {activeTab !== "Overview" && activeTab !== "Screening Answers" && (
            <Panel className="flex items-center justify-center p-12 text-center">
              <p className="text-[14px] text-[var(--eh-text-3)]">{activeTab} content coming soon.</p>
            </Panel>
          )}
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-4">
          {/* AI Match Insights */}
          <Panel className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-[var(--eh-text)]">AI Match Insights</h3>
              <span className={`rounded-md border px-2 py-0.5 text-[12px] font-bold ${scoreColor}`}>{matchScore}% Match</span>
            </div>
            <ul className="space-y-2">
              {[
                "Strong subject alignment with job requirements",
                "Experience level matches the role requirements",
                "Board experience aligns with school curriculum",
                "Location preference matches job location",
              ].map((point) => (
                <li key={point} className="flex items-start gap-2 text-[12px] text-[var(--eh-text-2)]">
                  <span className="mt-0.5 shrink-0 text-emerald-500">✓</span> {point}
                </li>
              ))}
            </ul>
            <button className="mt-3 text-[11px] font-semibold text-[var(--eh-text-4)] hover:text-[var(--eh-text-2)]">How match score is calculated ⓘ</button>
          </Panel>

          {/* Application Status */}
          <Panel className="p-5">
            <h3 className="text-[13px] font-semibold text-[var(--eh-text)] mb-3">Application Status</h3>
            <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--eh-text-4)] mb-1">Current Status</p>
            <StatusBadge tone="brand">New</StatusBadge>
            <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--eh-primary-600)] py-2.5 text-[13px] font-semibold text-white hover:bg-[var(--eh-primary-700)] transition-colors">
              Move to Reviewed →
            </button>
          </Panel>

          {/* Quick nav to screening */}
          {applicationId && (
            <Panel className="p-5">
              <h3 className="text-[13px] font-semibold text-[var(--eh-text)] mb-3">Screening</h3>
              <button
                onClick={() => setActiveTab("Screening Answers")}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[13px] text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] transition-colors"
              >
                <span className="flex items-center gap-2">📋 View screening answers</span>
                <ChevronRight size={13} className="text-[var(--eh-text-4)]" />
              </button>
            </Panel>
          )}

          {/* Actions */}
          <Panel className="p-5">
            <h3 className="text-[13px] font-semibold text-[var(--eh-text)] mb-3">Actions</h3>
            <div className="space-y-1.5">
              {[
                { label: "View Full Profile", icon: <Eye size={13} />, href: `/dashboard/applicants/${applicantId}` },
                { label: "Download Resume", icon: <Download size={13} /> },
                { label: "Schedule Interview", icon: <Calendar size={13} />, action: () => setScheduleOpen(true) },
                { label: "Add Note", icon: <span className="text-[13px]">📝</span> },
                { label: "Share Profile", icon: <span className="text-[13px]">↗</span>, action: async () => {
                  await navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied");
                }},
              ].map((item) => (
                item.href ? (
                  <Link key={item.label} href={item.href} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[13px] text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] transition-colors">
                    <span className="flex items-center gap-2">{item.icon} {item.label}</span>
                    <ChevronRight size={13} className="text-[var(--eh-text-4)]" />
                  </Link>
                ) : (
                  <button key={item.label} onClick={item.action} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[13px] text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] transition-colors text-left">
                    <span className="flex items-center gap-2">{item.icon} {item.label}</span>
                    <ChevronRight size={13} className="text-[var(--eh-text-4)]" />
                  </button>
                )
              ))}
              <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] text-red-600 hover:bg-red-50 transition-colors">
                <XCircle size={13} /> Reject Applicant
              </button>
            </div>
          </Panel>

          {/* Notes */}
          <Panel className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-[var(--eh-text)]">Notes</h3>
              <button className="text-[var(--eh-text-4)]">✏</button>
            </div>
            <textarea
              placeholder="Add a note about this applicant..."
              className="input-base min-h-[80px] resize-y text-[12px]"
            />
          </Panel>
        </div>
      </div>

      {applicationId && (
        <ScheduleInterviewModal
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
          applicationId={applicationId}
          onSuccess={() => { toast.success("Interview scheduled"); setScheduleOpen(false); }}
        />
      )}
    </PageShell>
  );
}
