"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BOARDS, GRADE_LEVELS, JOB_TYPES, JOB_EXPERIENCE_LEVELS, SUBJECTS } from "@/config/constants";
import { createJobSchema } from "@/lib/validators/job";
import { Eye, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api/client";
import { getJob, createJob, updateJob, improveJobWithAi } from "@/lib/api/jobs-client";
import { updateJobStatus } from "@/lib/api/hiring-client";

type FieldErrors = Partial<Record<string, string>>;
type ScreeningQuestionInput = { question: string; required: boolean };
type PostJobFormState = {
  title: string;
  subject: string;
  board: string;
  gradeLevel: string;
  jobType: string;
  experience: string;
  experienceLevel: string;
  salaryMin: string;
  salaryMax: string;
  isUrgent: boolean;
  requiredWithin48h: boolean;
  requiresTet: boolean;
  applicationDeadline: string;
  description: string;
  requirements: string;
  benefits: string;
  screeningQuestions: ScreeningQuestionInput[];
};

export default function PostJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingJobId = searchParams.get("jobId");

  const [loading, setLoading] = useState(false);
  const [improvingWithAi, setImprovingWithAi] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [draftJobId, setDraftJobId] = useState<string | null>(editingJobId);

  const [form, setForm] = useState<PostJobFormState>({
    title: "",
    subject: "Mathematics",
    board: "CBSE",
    gradeLevel: "11-12",
    jobType: "FULL_TIME",
    experience: "3-5 years",
    experienceLevel: "TWO_TO_FIVE_YEARS",
    salaryMin: "",
    salaryMax: "",
    isUrgent: false,
    requiredWithin48h: false,
    requiresTet: false,
    applicationDeadline: "",
    description: "",
    requirements: "",
    benefits: "",
    screeningQuestions: [{ question: "", required: false }],
  });

  useEffect(() => {
    if (!editingJobId) return;
    getJob(editingJobId)
      .then((job) => {
        setForm({
          title: job.title || "",
          subject: job.subject || "Mathematics",
          board: job.board || "CBSE",
          gradeLevel: job.gradeLevel || "11-12",
          jobType: job.jobType || "FULL_TIME",
          experience: job.experience || "",
          experienceLevel: job.experienceLevel || "TWO_TO_FIVE_YEARS",
          salaryMin: job.salaryMin ? String(job.salaryMin) : "",
          salaryMax: job.salaryMax ? String(job.salaryMax) : "",
          isUrgent: !!job.isUrgent,
          requiredWithin48h: !!job.requiredWithin48h,
          requiresTet: !!job.requiresTet,
          applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString().split("T")[0] : "",
          description: job.description || "",
          requirements: (job.requirements || []).map((item: { text: string }) => item.text).join("\n"),
          benefits: (job.benefits || []).map((item: { text: string }) => item.text).join("\n"),
          screeningQuestions:
            (job.screeningQuestions || []).length > 0
              ? job.screeningQuestions.map((item: { question: string; required: boolean }) => ({ question: item.question, required: !!item.required }))
              : [{ question: "", required: false }],
        });
      })
      .catch(() => {});
  }, [editingJobId]);

  const setField = <K extends Exclude<keyof PostJobFormState, "screeningQuestions">>(key: K, value: PostJobFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const checklist = useMemo(
    () => [
      { label: "Title & basics", done: !!form.title && !!form.subject && !!form.gradeLevel },
      { label: "Description", done: form.description.trim().length >= 50 },
      { label: "Responsibilities", done: form.requirements.trim().length > 0 },
      { label: "Benefits", done: form.benefits.trim().length > 0 },
      {
        label: "Compensation",
        done:
          ((!form.salaryMin && !form.salaryMax) || (!!form.salaryMin && !!form.salaryMax)) &&
          (!form.salaryMin || !form.salaryMax || Number(form.salaryMin) <= Number(form.salaryMax)),
      },
    ],
    [form]
  );
  const sections = useMemo(
    () => [
      {
        id: "basics",
        step: "01",
        label: "Basics",
        description: "Role, board, class level, and hiring context.",
        done: !!form.title && !!form.subject && !!form.gradeLevel && !!form.board && !!form.jobType,
      },
      {
        id: "description",
        step: "02",
        label: "Description",
        description: "What the teacher will own and why the role stands out.",
        done: form.description.trim().length >= 50 && form.requirements.trim().length > 0 && form.benefits.trim().length > 0,
      },
      {
        id: "compensation",
        step: "03",
        label: "Compensation",
        description: "Salary guidance and application timing.",
        done:
          ((!form.salaryMin && !form.salaryMax) || (!!form.salaryMin && !!form.salaryMax)) &&
          (!form.salaryMin || !form.salaryMax || Number(form.salaryMin) <= Number(form.salaryMax)) &&
          !!form.applicationDeadline,
      },
      {
        id: "screening",
        step: "04",
        label: "Screening",
        description: "Optional questions to improve applicant quality.",
        done: form.screeningQuestions.some((item) => item.question.trim().length > 0),
      },
    ],
    [form]
  );
  const completed = checklist.filter((entry) => entry.done).length;
  const completedSections = sections.filter((entry) => entry.done).length;
  const salaryRangeError =
    form.salaryMin && form.salaryMax && Number(form.salaryMin) > Number(form.salaryMax)
      ? "Maximum salary must be greater than or equal to minimum salary."
      : "";

  const buildValidatedPayload = () => {
    setError("");
    setFieldErrors({});
    if (salaryRangeError) {
      setFieldErrors({ salaryMax: salaryRangeError });
      setError("Please fix the highlighted fields before continuing.");
      return null;
    }

    const payload = {
      title: form.title,
      subject: form.subject,
      board: form.board as (typeof BOARDS)[number]["value"],
      gradeLevel: form.gradeLevel,
      jobType: form.jobType as (typeof JOB_TYPES)[number]["value"],
      experience: form.experience,
      experienceLevel: form.experienceLevel as (typeof JOB_EXPERIENCE_LEVELS)[number]["value"],
      salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
      salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
      isUrgent: form.isUrgent,
      requiredWithin48h: form.requiredWithin48h,
      requiresTet: form.requiresTet,
      applicationDeadline: form.applicationDeadline || undefined,
      description: form.description,
      requirements: form.requirements
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      benefits: form.benefits
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      screeningQuestions: form.screeningQuestions
        .map((item, index) => ({
          question: item.question.trim(),
          required: item.required,
          sortOrder: index,
        }))
        .filter((item) => item.question.length > 0),
    };

    const parsed = createJobSchema.safeParse(payload);
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string;
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      setError("Please fix the highlighted fields before continuing.");
      return null;
    }

    return parsed.data;
  };

  const upsertJob = async (status: "DRAFT" | "ACTIVE") => {
    const parsed = buildValidatedPayload();
    if (!parsed) return null;

    if (draftJobId) {
      await updateJob(draftJobId, parsed);
      await updateJobStatus(draftJobId, status);
      return draftJobId;
    }

    const created = await createJob({ ...parsed, status });
    setDraftJobId(created.id);
    return created.id;
  };

  const saveDraft = async () => {
    setLoading(true);
    try {
      const id = await upsertJob("DRAFT");
      if (!id) return;
      toast.success("Draft saved");
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to save draft");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const publish = async () => {
    setLoading(true);
    try {
      const id = await upsertJob("ACTIVE");
      if (!id) return;
      toast.success("Job published");
      router.push(`/dashboard/my-jobs?published=${id}`);
      router.refresh();
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to publish job");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const preview = async () => {
    try {
      setLoading(true);
      const id = draftJobId || (await upsertJob("DRAFT"));
      if (!id) return;
      window.open(`/jobs/${id}?preview=1`, "_blank");
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to open preview");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const improveWithAi = async () => {
    setImprovingWithAi(true);
    try {
      const improved = await improveJobWithAi({
        title: form.title,
        description: form.description,
        requirements: form.requirements,
        benefits: form.benefits,
      });
      setForm((prev) => ({
        ...prev,
        ...(improved.description ? { description: improved.description } : {}),
        ...(improved.requirements ? { requirements: improved.requirements } : {}),
        ...(improved.benefits ? { benefits: improved.benefits } : {}),
      }));
      toast.success("AI suggestions applied.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "AI improvement failed"));
    } finally {
      setImprovingWithAi(false);
    }
  };

  const inputClass = (name: keyof typeof form) =>
    `input-base ${fieldErrors[name] ? "border-red-300 ring-1 ring-red-200" : ""}`;
  const scrollToSection = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[13px] text-[var(--eh-text-3)]">Jobs · {draftJobId ? "Edit draft" : "New posting"}</p>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-[var(--eh-text)]">{form.title || "New Job"}</h1>
          <p className="mt-1 text-[14px] text-[var(--eh-text-3)]">
            Build the post in four steps, then preview and publish when the brief feels complete.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={saveDraft} disabled={loading} className="eh-btn eh-btn-ghost">
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            Save draft
          </button>
          <button onClick={preview} disabled={loading} className="eh-btn eh-btn-secondary">
            <Eye size={14} /> Preview
          </button>
          <button onClick={publish} disabled={loading} className="eh-btn eh-btn-primary">
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            Publish job
          </button>
        </div>
      </div>

      {error ? <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">{error}</div> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <section id="basics" className="scroll-mt-24 rounded-xl border border-[var(--eh-border)] bg-white p-5">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-[var(--eh-border)] pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-eh-primary">Step 1 · Basics</p>
                <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.01em] text-[var(--eh-text)]">Anchor the role clearly</h2>
                <p className="mt-1 text-[13px] text-[var(--eh-text-3)]">Set the fundamentals first so every later detail has the right context.</p>
              </div>
              <span className="rounded-full border border-[var(--eh-border)] bg-[var(--surface-base)] px-2.5 py-1 text-[11px] font-semibold text-[var(--eh-text-3)]">
                {sections[0]?.done ? "Ready" : "In progress"}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="eh-label">Job title</label>
                <input value={form.title} onChange={(e) => setField("title", e.target.value)} className={inputClass("title")} />
              </div>

              <div>
                <label className="eh-label">Subject</label>
                <select value={form.subject} onChange={(e) => setField("subject", e.target.value)} className={inputClass("subject")}>
                  {SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="eh-label">Grade / class level</label>
                <select value={form.gradeLevel} onChange={(e) => setField("gradeLevel", e.target.value)} className={inputClass("gradeLevel")}>
                  {GRADE_LEVELS.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="eh-label">Board</label>
                <select value={form.board} onChange={(e) => setField("board", e.target.value)} className={inputClass("board")}>
                  {BOARDS.map((board) => (
                    <option key={board.value} value={board.value}>
                      {board.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="eh-label">Job type</label>
                <select value={form.jobType} onChange={(e) => setField("jobType", e.target.value)} className={inputClass("jobType")}>
                  {JOB_TYPES.map((jobType) => (
                    <option key={jobType.value} value={jobType.value}>
                      {jobType.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 space-y-2 rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] px-4 py-3">
                <label className="flex items-center gap-3 text-[13px] font-medium text-[var(--eh-text)]">
                  <input
                    type="checkbox"
                    checked={form.isUrgent}
                    onChange={(e) => {
                      setField("isUrgent", e.target.checked);
                      setField("requiredWithin48h", e.target.checked);
                    }}
                    className="rounded"
                  />
                  Urgent vacancy - needed within 48 hours
                </label>
                <label className="flex items-center gap-3 text-[13px] font-medium text-[var(--eh-text)]">
                  <input
                    type="checkbox"
                    checked={form.requiresTet}
                    onChange={(e) => setField("requiresTet", e.target.checked)}
                    className="rounded"
                  />
                  TET/CTET required
                </label>
              </div>

              <div>
                <label className="eh-label">Experience level</label>
                <select value={form.experienceLevel} onChange={(e) => setField("experienceLevel", e.target.value)} className={inputClass("experienceLevel")}>
                  {JOB_EXPERIENCE_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="eh-label">Legacy experience note (optional)</label>
                <input value={form.experience} onChange={(e) => setField("experience", e.target.value)} className={inputClass("experience")} />
              </div>
            </div>
          </section>

          <section id="description" className="scroll-mt-24 rounded-xl border border-[var(--eh-border)] bg-white p-5">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-[var(--eh-border)] pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-eh-primary">Step 2 · Description</p>
                <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.01em] text-[var(--eh-text)]">Explain the job in plain language</h2>
                <p className="mt-1 text-[13px] text-[var(--eh-text-3)]">Schools that describe expectations, support, and outcomes attract stronger applicants.</p>
              </div>
              <button
                onClick={improveWithAi}
                disabled={improvingWithAi}
                type="button"
                className="eh-btn eh-btn-secondary eh-btn-sm border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] text-eh-primary"
              >
                {improvingWithAi ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                Improve with AI
              </button>
            </div>
            <label className="eh-label">Description</label>
            <textarea value={form.description} onChange={(e) => setField("description", e.target.value)} className={`${inputClass("description")} min-h-[150px]`} />
            <label className="eh-label mt-3">Responsibilities</label>
            <textarea value={form.requirements} onChange={(e) => setField("requirements", e.target.value)} className={`${inputClass("requirements")} min-h-[120px]`} />
            <label className="eh-label mt-3">Benefits</label>
            <textarea value={form.benefits} onChange={(e) => setField("benefits", e.target.value)} className={`${inputClass("benefits")} min-h-[110px]`} />
          </section>

          <section id="compensation" className="scroll-mt-24 rounded-xl border border-[var(--eh-border)] bg-white p-5">
            <div className="mb-5 border-b border-[var(--eh-border)] pb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-eh-primary">Step 3 · Compensation</p>
              <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.01em] text-[var(--eh-text)]">Set timing and salary expectations</h2>
              <p className="mt-1 text-[13px] text-[var(--eh-text-3)]">Clear ranges and deadlines help candidates self-select and apply faster.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <label className="eh-label">Min salary (Rs/month)</label>
                  <input type="number" value={form.salaryMin} onChange={(e) => setField("salaryMin", e.target.value)} className={inputClass("salaryMin")} />
                </div>
                <div>
                  <label className="eh-label">Max salary (Rs/month)</label>
                  <input type="number" value={form.salaryMax} onChange={(e) => setField("salaryMax", e.target.value)} className={inputClass("salaryMax")} />
                </div>
                {salaryRangeError || fieldErrors.salaryMax ? (
                  <p className="text-[12px] text-red-600 md:col-span-2">{salaryRangeError || fieldErrors.salaryMax}</p>
                ) : null}
              </div>
              <div>
                <label className="eh-label">Application deadline</label>
                <input
                  type="date"
                  value={form.applicationDeadline}
                  onChange={(e) => setField("applicationDeadline", e.target.value)}
                  className={inputClass("applicationDeadline")}
                />
                <p className="mt-1 text-[12px] text-[var(--eh-text-3)]">Set a close date so applicants know the response window.</p>
                {fieldErrors.applicationDeadline ? (
                  <p className="mt-1 text-[12px] text-red-600">{fieldErrors.applicationDeadline}</p>
                ) : null}
              </div>
            </div>
          </section>

          <section id="screening" className="scroll-mt-24 rounded-xl border border-[var(--eh-border)] bg-white p-5">
            <div className="mb-5 flex items-center justify-between border-b border-[var(--eh-border)] pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-eh-primary">Step 4 · Screening</p>
                <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.01em] text-[var(--eh-text)]">Filter for fit before interviews</h2>
                <p className="mt-1 text-[13px] text-[var(--eh-text-3)]">Ask only the questions that help your team review faster.</p>
              </div>
              <button
                type="button"
                className="eh-btn eh-btn-secondary eh-btn-sm"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    screeningQuestions: [...prev.screeningQuestions, { question: "", required: false }],
                  }))
                }
              >
                <Plus size={13} /> Add question
              </button>
            </div>
            <div className="space-y-2.5">
              {form.screeningQuestions.map((item, index) => (
                <div key={`q-${index}`} className="rounded-xl border border-[var(--eh-border)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-medium text-[var(--eh-text-3)]">Question {index + 1}</p>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          screeningQuestions:
                            prev.screeningQuestions.length > 1
                              ? prev.screeningQuestions.filter((_, i) => i !== index)
                              : [{ question: "", required: false }],
                        }))
                      }
                      className="rounded-lg border border-[var(--eh-border)] p-1.5 text-[var(--eh-text-3)] hover:bg-[var(--surface-base)]"
                      aria-label={`Remove question ${index + 1}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <textarea
                    value={item.question}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        screeningQuestions: prev.screeningQuestions.map((q, i) =>
                          i === index ? { ...q, question: e.target.value } : q
                        ),
                      }))
                    }
                    className="input-base mt-2 min-h-[82px]"
                    placeholder="e.g. Do you have B.Ed and CBSE teaching experience?"
                  />
                  <label className="mt-2 inline-flex items-center gap-2 text-[12px] text-[var(--eh-text-2)]">
                    <input
                      type="checkbox"
                      checked={item.required}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          screeningQuestions: prev.screeningQuestions.map((q, i) =>
                            i === index ? { ...q, required: e.target.checked } : q
                          ),
                        }))
                      }
                    />
                    Required
                  </label>
                </div>
              ))}
            </div>
            {fieldErrors.screeningQuestions ? <p className="mt-2 text-[12px] text-red-600">{fieldErrors.screeningQuestions}</p> : null}
          </section>
        </div>

        <aside className="sticky top-24 space-y-4 self-start">
          <section className="rounded-xl border border-[var(--eh-border)] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-3)]">Publishing plan</p>
                <h3 className="mt-1 text-[14px] font-semibold text-[var(--eh-text)]">Move through the post in order</h3>
              </div>
              <span className="rounded-full bg-[var(--eh-primary-50)] px-2 py-1 text-[11px] font-semibold text-eh-primary">
                {completedSections}/{sections.length}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollToSection(section.id)}
                  className="flex w-full items-start gap-3 rounded-xl border border-[var(--eh-border)] px-3 py-3 text-left transition-colors hover:bg-[var(--surface-base)]"
                >
                  <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${section.done ? "bg-[var(--eh-success)] text-white" : "bg-[var(--surface-base)] text-[var(--eh-text-3)]"}`}>
                    {section.done ? "✓" : section.step}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-[var(--eh-text)]">{section.label}</span>
                    <span className="mt-0.5 block text-[12px] leading-relaxed text-[var(--eh-text-3)]">{section.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[var(--eh-border)] bg-white p-4">
            <h3 className="mb-2 text-[14px] font-semibold text-[var(--eh-text)]">Posting checklist</h3>
            <div className="space-y-2">
              {checklist.map((entry) => (
                <div key={entry.label} className="flex items-center gap-2 text-[13px]">
                  <span className={["inline-flex h-4 w-4 items-center justify-center rounded-full border", entry.done ? "border-[var(--eh-success)] bg-[var(--eh-success)] text-white" : "border-[var(--eh-border-strong)] bg-white"].join(" ")}>
                    {entry.done ? "✓" : ""}
                  </span>
                  <span className={entry.done ? "text-[var(--eh-text-4)] line-through" : "text-[var(--eh-text-2)]"}>{entry.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-[var(--eh-primary-100)]">
              <div className="h-full rounded-full bg-[var(--eh-primary-600)]" style={{ width: `${(completed / checklist.length) * 100}%` }} />
            </div>
            <p className="mt-1 text-[12px] text-[var(--eh-text-3)]">
              {completed} of {checklist.length} complete
            </p>
          </section>

          <section className="rounded-xl border border-[var(--eh-border)] bg-white p-4">
            <h3 className="text-[14px] font-semibold text-[var(--eh-text)]">Preview snapshot</h3>
            <div className="mt-3 space-y-3 text-[12px] text-[var(--eh-text-3)]">
              <div>
                <p className="font-semibold text-[var(--eh-text)]">{form.title || "Untitled role"}</p>
                <p className="mt-0.5">{form.subject} · {form.gradeLevel} · {form.board}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-[var(--surface-base)] px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--eh-text-4)]">Type</p>
                  <p className="mt-1 font-medium text-[var(--eh-text-2)]">{form.jobType.replaceAll("_", " ")}</p>
                </div>
                <div className="rounded-lg bg-[var(--surface-base)] px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--eh-text-4)]">Deadline</p>
                  <p className="mt-1 font-medium text-[var(--eh-text-2)]">{form.applicationDeadline || "Not set"}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] p-4">
            <p className="text-[13px] font-semibold text-[var(--eh-primary-700)]">Tip: list specific boards</p>
            <p className="mt-1 text-[12px] text-eh-primary">Posts that mention CBSE/ICSE/IB get 2.4x more qualified applications.</p>
          </section>

          <section className="rounded-xl border border-[var(--eh-border)] bg-white p-4">
            <h3 className="mb-2 text-[14px] font-semibold text-[var(--eh-text)]">Required documents</h3>
            <div className="flex flex-wrap gap-1.5">
              <span className="eh-chip eh-chip-active">Resume</span>
              <span className="eh-chip">Additional documents configured in apply flow</span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
