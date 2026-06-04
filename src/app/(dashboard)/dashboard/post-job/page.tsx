"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BOARDS,
  GRADE_LEVELS,
  JOB_TYPES,
  JOB_EXPERIENCE_LEVELS,
  EXPERIENCE_LEVEL_TO_RANGE,
  SUBJECTS,
} from "@/config/constants";
import { createJobSchema } from "@/lib/validators/job";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  Eye,
  IndianRupee,
  Loader2,
  Sparkles,
  Trash2,
  Plus,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api/client";
import { getJob, createJob, updateJob, improveJobWithAi } from "@/lib/api/jobs-client";
import { updateJobStatus } from "@/lib/api/hiring-client";

type FieldErrors = Partial<Record<string, string>>;
type QuestionType = "text" | "yes_no" | "rating" | "mcq";
type ScreeningQuestionInput = { question: string; questionType: QuestionType; options: string[]; required: boolean };
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

// ── Pill selector ─────────────────────────────────────────────────────────────
function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | T[];
  onChange: (v: T) => void;
}) {
  const selected = Array.isArray(value) ? value : [value];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all",
              active
                ? "border-[var(--eh-primary-500)] bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)] ring-1 ring-[var(--eh-primary-200)]"
                : "border-[var(--eh-border)] bg-white text-[var(--eh-text-2)] hover:border-[var(--eh-primary-300)] hover:text-[var(--eh-primary-600)]",
            ].join(" ")}
          >
            {active && <Check size={11} className="mr-1 inline" />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepBar({
  steps,
  current,
  onGo,
}: {
  steps: { label: string; done: boolean }[];
  current: number;
  onGo: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center">
          <button
            type="button"
            onClick={() => onGo(i)}
            className="flex items-center gap-2 px-1 py-0.5"
          >
            <span
              className={[
                "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all",
                i === current
                  ? "bg-[var(--eh-primary-600)] text-white"
                  : step.done
                    ? "bg-emerald-500 text-white"
                    : "border border-[var(--eh-border)] bg-white text-[var(--eh-text-3)]",
              ].join(" ")}
            >
              {step.done && i !== current ? <Check size={11} /> : i + 1}
            </span>
            <span
              className={[
                "hidden text-[13px] font-semibold sm:block",
                i === current
                  ? "text-[var(--eh-text)]"
                  : step.done
                    ? "text-emerald-600"
                    : "text-[var(--eh-text-3)]",
              ].join(" ")}
            >
              {step.label}
            </span>
          </button>
          {i < steps.length - 1 && (
            <div className={["mx-2 h-px w-8 flex-shrink-0 rounded", step.done ? "bg-emerald-300" : "bg-[var(--eh-border)]"].join(" ")} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Live preview card ─────────────────────────────────────────────────────────
function LivePreview({ form }: { form: PostJobFormState }) {
  const typeLabel = JOB_TYPES.find((t) => t.value === form.jobType)?.label || form.jobType;
  const boardLabel = BOARDS.find((b) => b.value === form.board)?.label || form.board;
  const expLabel = JOB_EXPERIENCE_LEVELS.find((e) => e.value === form.experienceLevel)?.label || "";
  const salary =
    form.salaryMin && form.salaryMax
      ? `₹${Number(form.salaryMin).toLocaleString("en-IN")} – ₹${Number(form.salaryMax).toLocaleString("en-IN")} / mo`
      : form.salaryMin
        ? `From ₹${Number(form.salaryMin).toLocaleString("en-IN")}/mo`
        : "Salary not set";

  return (
    <div className="rounded-xl border border-[var(--eh-border)] bg-white p-5 shadow-sm">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--eh-text-4)]">Live preview</p>
      <h3 className="text-[17px] font-semibold leading-snug text-[var(--eh-text)]">
        {form.title || <span className="text-[var(--eh-text-4)]">Job title</span>}
      </h3>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-[var(--eh-text-3)]">
        <span>{form.subject || "Subject"}</span>
        <span>·</span>
        <span>Grade {form.gradeLevel}</span>
        <span>·</span>
        <span>{boardLabel}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {form.jobType && (
          <span className="rounded-full border border-[var(--eh-border)] bg-[var(--surface-base)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--eh-text-2)]">
            {typeLabel}
          </span>
        )}
        {expLabel && (
          <span className="rounded-full border border-[var(--eh-border)] bg-[var(--surface-base)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--eh-text-2)]">
            {expLabel}
          </span>
        )}
        {form.requiresTet && (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
            TET required
          </span>
        )}
        {form.isUrgent && (
          <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-600">
            Urgent
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--eh-text)]">
        <IndianRupee size={13} className="text-[var(--eh-text-3)]" />
        {salary}
      </div>
      {form.applicationDeadline && (
        <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[var(--eh-text-3)]">
          <Clock size={11} />
          Apply by {new Date(form.applicationDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      )}
      {form.description && (
        <p className="mt-3 line-clamp-3 text-[12px] leading-relaxed text-[var(--eh-text-2)]">{form.description}</p>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PostJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingJobId = searchParams.get("jobId");

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [improvingWithAi, setImprovingWithAi] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [draftJobId, setDraftJobId] = useState<string | null>(editingJobId);
  const topRef = useRef<HTMLDivElement>(null);

  type BankQuestion = { id: string; question: string; questionType: QuestionType; options: string[]; required: boolean; isPreset: boolean; category: string };
  const [bank, setBank] = useState<BankQuestion[]>([]);
  const [bankOpen, setBankOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [bankCategory, setBankCategory] = useState("All");

  useEffect(() => {
    fetch("/api/screening-questions")
      .then((r) => r.json())
      .then((j) => { if (j.success) setBank(j.data); })
      .catch(() => {});
  }, []);

  const [form, setForm] = useState<PostJobFormState>({
    title: "",
    subject: "Mathematics",
    board: "CBSE",
    gradeLevel: "11-12",
    jobType: "FULL_TIME",
    experience: "3-6 years",
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
    screeningQuestions: [{ question: "", questionType: "text" as QuestionType, options: [], required: false }],
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
          applicationDeadline: job.applicationDeadline
            ? new Date(job.applicationDeadline).toISOString().split("T")[0]
            : "",
          description: job.description || "",
          requirements: (job.requirements || []).map((item: { text: string }) => item.text).join("\n"),
          benefits: (job.benefits || []).map((item: { text: string }) => item.text).join("\n"),
          screeningQuestions:
            (job.screeningQuestions || []).length > 0
              ? job.screeningQuestions.map((item: { question: string; questionType?: string; options?: string[]; required: boolean }) => ({
                  question: item.question,
                  questionType: (item.questionType || "text") as QuestionType,
                  options: item.options || [],
                  required: !!item.required,
                }))
              : [{ question: "", questionType: "text" as QuestionType, options: [], required: false }],
        });
      })
      .catch(() => {});
  }, [editingJobId]);

  const setField = <K extends Exclude<keyof PostJobFormState, "screeningQuestions">>(
    key: K,
    value: PostJobFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const steps = useMemo(
    () => [
      {
        label: "Role",
        done: !!form.title && !!form.subject && !!form.gradeLevel && !!form.board && !!form.jobType,
      },
      {
        label: "Description",
        done: form.description.trim().length >= 50,
      },
      {
        label: "Compensation",
        done:
          !!(form.salaryMin && form.salaryMax) &&
          Number(form.salaryMin) <= Number(form.salaryMax) &&
          !!form.applicationDeadline,
      },
      {
        label: "Screening",
        done: form.screeningQuestions.some((q) => q.question.trim().length > 0),
      },
    ],
    [form]
  );

  const salaryRangeError =
    form.salaryMin && form.salaryMax && Number(form.salaryMin) > Number(form.salaryMax)
      ? "Max must be ≥ min"
      : "";

  const buildValidatedPayload = () => {
    setError("");
    setFieldErrors({});
    if (salaryRangeError) {
      setFieldErrors({ salaryMax: salaryRangeError });
      setError("Fix highlighted fields before continuing.");
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
      requirements: form.requirements.split("\n").map((l) => l.trim()).filter(Boolean),
      benefits: form.benefits.split("\n").map((l) => l.trim()).filter(Boolean),
      screeningQuestions: form.screeningQuestions
        .map((item, index) => ({
          question: item.question.trim(),
          questionType: item.questionType,
          options: item.options.filter((o) => o.trim().length > 0),
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
      setError("Fix highlighted fields before continuing.");
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
      const msg = getApiErrorMessage(err, "Failed to save draft");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const publish = async () => {
    setLoading(true);
    try {
      const id = await upsertJob("ACTIVE");
      if (!id) return;
      toast.success("Job published!");
      router.push(`/dashboard/my-jobs?published=${id}`);
      router.refresh();
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to publish job");
      setError(msg);
      toast.error(msg);
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
      toast.error(getApiErrorMessage(err, "Failed to open preview"));
    } finally {
      setLoading(false);
    }
  };

  const improveWithAi = async () => {
    setImprovingWithAi(true);
    try {
      const improved = await improveJobWithAi({
        title: form.title,
        subject: form.subject,
        gradeLevel: form.gradeLevel,
        board: form.board,
        experience: form.experience || undefined,
        description: form.description || undefined,
        requirements: form.requirements || undefined,
        benefits: form.benefits || undefined,
      });
      setForm((prev) => ({
        ...prev,
        ...(improved.description ? { description: improved.description } : {}),
        ...(improved.requirements?.length ? { requirements: improved.requirements.join("\n") } : {}),
        ...(improved.benefits?.length ? { benefits: improved.benefits.join("\n") } : {}),
      }));
      toast.success("AI suggestions applied");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "AI improvement failed"));
    } finally {
      setImprovingWithAi(false);
    }
  };

  const goTo = (i: number) => {
    setStep(i);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const next = () => goTo(Math.min(step + 1, steps.length - 1));
  const back = () => goTo(Math.max(step - 1, 0));

  const inputClass = (name: keyof typeof form) =>
    `input-base ${fieldErrors[name] ? "border-red-300 ring-1 ring-red-200" : ""}`;

  // ── Step 0: Role ────────────────────────────────────────────────────────────
  const renderRole = () => (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="mb-1.5 block text-[13px] font-semibold text-[var(--eh-text)]">
          Job title <span className="text-red-500">*</span>
        </label>
        <input
          value={form.title}
          onChange={(e) => setField("title", e.target.value)}
          className={`${inputClass("title")} text-[15px]`}
          placeholder="e.g. Senior Mathematics Teacher"
        />
        {fieldErrors.title && <p className="mt-1 text-[12px] text-red-600">{fieldErrors.title}</p>}
      </div>

      {/* Subject */}
      <div>
        <label className="mb-2 block text-[13px] font-semibold text-[var(--eh-text)]">
          Subject <span className="text-red-500">*</span>
        </label>
        <PillGroup
          options={SUBJECTS.map((s) => ({ value: s, label: s }))}
          value={form.subject as typeof SUBJECTS[number]}
          onChange={(v) => setField("subject", v)}
        />
      </div>

      {/* Board */}
      <div>
        <label className="mb-2 block text-[13px] font-semibold text-[var(--eh-text)]">
          Board <span className="text-red-500">*</span>
        </label>
        <PillGroup
          options={BOARDS.map((b) => ({ value: b.value, label: b.label }))}
          value={form.board as typeof BOARDS[number]["value"]}
          onChange={(v) => setField("board", v)}
        />
      </div>

      {/* Grade */}
      <div>
        <label className="mb-2 block text-[13px] font-semibold text-[var(--eh-text)]">
          Grade / class level <span className="text-red-500">*</span>
        </label>
        <PillGroup
          options={GRADE_LEVELS.map((g) => ({ value: g, label: `Grade ${g}` }))}
          value={form.gradeLevel as typeof GRADE_LEVELS[number]}
          onChange={(v) => setField("gradeLevel", v)}
        />
      </div>

      {/* Job type */}
      <div>
        <label className="mb-2 block text-[13px] font-semibold text-[var(--eh-text)]">
          Employment type <span className="text-red-500">*</span>
        </label>
        <PillGroup
          options={JOB_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          value={form.jobType as typeof JOB_TYPES[number]["value"]}
          onChange={(v) => setField("jobType", v)}
        />
      </div>

      {/* Experience */}
      <div>
        <label className="mb-2 block text-[13px] font-semibold text-[var(--eh-text)]">
          Experience required
        </label>
        <PillGroup
          options={JOB_EXPERIENCE_LEVELS.map((e) => ({ value: e.value, label: e.label }))}
          value={form.experienceLevel as typeof JOB_EXPERIENCE_LEVELS[number]["value"]}
          onChange={(v) => {
            setField("experienceLevel", v);
            setField("experience", EXPERIENCE_LEVEL_TO_RANGE[v] ?? "");
          }}
        />
      </div>

      {/* Flags */}
      <div>
        <label className="mb-2 block text-[13px] font-semibold text-[var(--eh-text)]">Role flags</label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setField("isUrgent", !form.isUrgent);
              setField("requiredWithin48h", !form.isUrgent);
            }}
            className={[
              "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all",
              form.isUrgent
                ? "border-red-300 bg-red-50 text-red-700 ring-1 ring-red-200"
                : "border-[var(--eh-border)] bg-white text-[var(--eh-text-2)] hover:border-red-300 hover:text-red-600",
            ].join(" ")}
          >
            {form.isUrgent && <Zap size={11} className="mr-1 inline fill-red-500 text-red-500" />}
            Urgent (48h)
          </button>
          <button
            type="button"
            onClick={() => setField("requiresTet", !form.requiresTet)}
            className={[
              "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all",
              form.requiresTet
                ? "border-amber-300 bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                : "border-[var(--eh-border)] bg-white text-[var(--eh-text-2)] hover:border-amber-300 hover:text-amber-600",
            ].join(" ")}
          >
            {form.requiresTet && <Check size={11} className="mr-1 inline" />}
            TET/CTET required
          </button>
        </div>
      </div>
    </div>
  );

  // ── Step 1: Description ─────────────────────────────────────────────────────
  const renderDescription = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-[var(--eh-text)]">Job description</p>
          <p className="text-[12px] text-[var(--eh-text-3)]">Explain the role, expectations, and what makes your school stand out.</p>
        </div>
        <button
          onClick={improveWithAi}
          disabled={improvingWithAi}
          type="button"
          className="eh-btn eh-btn-secondary eh-btn-sm border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]"
        >
          {improvingWithAi ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          Improve with AI
        </button>
      </div>

      <div>
        <label className="mb-1.5 block text-[13px] font-semibold text-[var(--eh-text)]">
          Overview <span className="text-red-500">*</span>
          <span className="ml-2 font-normal text-[var(--eh-text-3)]">(min 50 chars)</span>
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          className={`${inputClass("description")} min-h-[140px] resize-y`}
          placeholder="Describe the role, the department, and what this teacher will own day-to-day..."
        />
        <div className="mt-1 flex items-center justify-between">
          {fieldErrors.description && <p className="text-[12px] text-red-600">{fieldErrors.description}</p>}
          <p className={["ml-auto text-[11px]", form.description.length < 50 ? "text-[var(--eh-text-4)]" : "text-emerald-600"].join(" ")}>
            {form.description.length} / 50 min
          </p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[13px] font-semibold text-[var(--eh-text)]">
          Key responsibilities
          <span className="ml-2 font-normal text-[12px] text-[var(--eh-text-3)]">— one per line</span>
        </label>
        <textarea
          value={form.requirements}
          onChange={(e) => setField("requirements", e.target.value)}
          className={`${inputClass("requirements")} min-h-[110px] resize-y font-mono text-[13px]`}
          placeholder={"Plan and deliver lessons aligned to curriculum\nMaintain student progress records\nConduct parent-teacher meetings"}
        />
      </div>

      <div>
        <label className="mb-1 block text-[13px] font-semibold text-[var(--eh-text)]">
          Benefits &amp; perks
          <span className="ml-2 font-normal text-[12px] text-[var(--eh-text-3)]">— one per line</span>
        </label>
        <textarea
          value={form.benefits}
          onChange={(e) => setField("benefits", e.target.value)}
          className={`${inputClass("benefits")} min-h-[100px] resize-y font-mono text-[13px]`}
          placeholder={"Competitive salary + performance bonus\nPF, ESI, and health insurance\nProfessional development budget"}
        />
      </div>
    </div>
  );

  // ── Step 2: Compensation ────────────────────────────────────────────────────
  const renderCompensation = () => (
    <div className="space-y-5">
      <div>
        <label className="mb-1 block text-[13px] font-semibold text-[var(--eh-text)]">
          Monthly salary range (₹)
        </label>
        <p className="mb-3 text-[12px] text-[var(--eh-text-3)]">
          Jobs with declared salary get 2.4× more qualified applicants.
        </p>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[var(--eh-text-3)]">₹</span>
            <input
              type="number"
              value={form.salaryMin}
              onChange={(e) => setField("salaryMin", e.target.value)}
              className={`${inputClass("salaryMin")} pl-7`}
              placeholder="Minimum"
            />
          </div>
          <span className="text-[var(--eh-text-3)]">–</span>
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[var(--eh-text-3)]">₹</span>
            <input
              type="number"
              value={form.salaryMax}
              onChange={(e) => setField("salaryMax", e.target.value)}
              className={`${inputClass("salaryMax")} pl-7`}
              placeholder="Maximum"
            />
          </div>
        </div>
        {(salaryRangeError || fieldErrors.salaryMax) && (
          <p className="mt-1 text-[12px] text-red-600">{salaryRangeError || fieldErrors.salaryMax}</p>
        )}
        {form.salaryMin && form.salaryMax && !salaryRangeError && (
          <p className="mt-1.5 text-[12px] text-emerald-600">
            ₹{Number(form.salaryMin).toLocaleString("en-IN")} – ₹{Number(form.salaryMax).toLocaleString("en-IN")} / month
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-[13px] font-semibold text-[var(--eh-text)]">
          Application deadline <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={form.applicationDeadline}
          onChange={(e) => setField("applicationDeadline", e.target.value)}
          className={`${inputClass("applicationDeadline")} max-w-[220px]`}
          min={new Date().toISOString().split("T")[0]}
        />
        <p className="mt-1 text-[12px] text-[var(--eh-text-3)]">
          Set a close date so teachers know the window. This also builds urgency.
        </p>
        {fieldErrors.applicationDeadline && (
          <p className="mt-1 text-[12px] text-red-600">{fieldErrors.applicationDeadline}</p>
        )}
      </div>
    </div>
  );

  // ── Step 3: Screening ───────────────────────────────────────────────────────
  const QUESTION_TYPES: { value: QuestionType; label: string; hint: string }[] = [
    { value: "text", label: "Text", hint: "Free-text answer" },
    { value: "yes_no", label: "Yes / No", hint: "Boolean toggle" },
    { value: "rating", label: "Rating 1–5", hint: "Star rating" },
    { value: "mcq", label: "Multiple choice", hint: "Pick one option" },
  ];

  const patchQuestion = (index: number, patch: Partial<ScreeningQuestionInput>) =>
    setForm((prev) => ({
      ...prev,
      screeningQuestions: prev.screeningQuestions.map((q, i) => i === index ? { ...q, ...patch } : q),
    }));

  const addFromBank = (bq: BankQuestion) => {
    const alreadyAdded = form.screeningQuestions.some((q) => q.question.trim() === bq.question.trim());
    if (alreadyAdded) { toast.error("Question already added"); return; }
    const isEmpty = form.screeningQuestions.length === 1 && !form.screeningQuestions[0].question.trim();
    const newQ: ScreeningQuestionInput = { question: bq.question, questionType: bq.questionType, options: bq.options, required: bq.required };
    setForm((prev) => ({
      ...prev,
      screeningQuestions: isEmpty ? [newQ] : [...prev.screeningQuestions, newQ],
    }));
    toast.success("Question added");
  };

  const bankCategories = ["All", ...Array.from(new Set(bank.map((b) => b.category)))];
  const filteredBank = bank.filter((bq) => {
    const byCategory = bankCategory === "All" || bq.category === bankCategory;
    const bySearch = !bankSearch || bq.question.toLowerCase().includes(bankSearch.toLowerCase());
    return byCategory && bySearch;
  });

  const renderScreening = () => (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-[14px] font-semibold text-[var(--eh-text)]">Screening questions</p>
        <p className="text-[12px] text-[var(--eh-text-3)] mt-0.5">
          Candidates answer these when they apply. Ask only what helps you shortlist faster.
        </p>
      </div>

      {/* Question bank picker */}
      <div className="rounded-xl border border-[var(--eh-primary-200)] bg-[var(--eh-primary-50)]">
        <button
          type="button"
          onClick={() => setBankOpen((p) => !p)}
          className="flex w-full items-center justify-between px-4 py-3 text-[13px] font-semibold text-[var(--eh-primary-700)]"
        >
          <span className="flex items-center gap-2">
            <Sparkles size={14} /> Browse question bank ({bank.length} ready-to-use questions)
          </span>
          <span className="text-[11px] font-normal text-[var(--eh-primary-500)]">{bankOpen ? "▲ Close" : "▼ Open"}</span>
        </button>

        {bankOpen && (
          <div className="border-t border-[var(--eh-primary-200)] px-4 pb-4 pt-3 space-y-3">
            {/* Search + category filter */}
            <div className="flex flex-wrap gap-2">
              <input
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                placeholder="Search questions..."
                className="input-base flex-1 min-w-[180px] text-[13px]"
              />
              <div className="eh-select-wrap">
                <select value={bankCategory} onChange={(e) => setBankCategory(e.target.value)} className="input-base text-[13px]">
                  {bankCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Question list */}
            <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
              {filteredBank.length === 0 ? (
                <p className="text-[12px] text-[var(--eh-text-3)] py-4 text-center">No questions match your search.</p>
              ) : filteredBank.map((bq) => {
                const typeInfo = QUESTION_TYPES.find((t) => t.value === bq.questionType);
                const alreadyAdded = form.screeningQuestions.some((q) => q.question.trim() === bq.question.trim());
                return (
                  <div key={bq.id} className="flex items-start gap-3 rounded-xl border border-[var(--eh-border)] bg-white px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[var(--eh-text)] leading-snug">{bq.question}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded-full border border-[var(--eh-border)] bg-[var(--surface-base)] px-2 py-0.5 text-[10px] font-medium text-[var(--eh-text-3)]">
                          {typeInfo?.label}
                        </span>
                        <span className="text-[10px] text-[var(--eh-text-4)]">{bq.category}</span>
                        {bq.required && <span className="text-[10px] text-red-500 font-medium">Required</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => addFromBank(bq)}
                      disabled={alreadyAdded}
                      className={["rounded-lg px-3 py-1.5 text-[12px] font-semibold shrink-0 transition-colors", alreadyAdded ? "bg-[var(--surface-base)] text-[var(--eh-text-4)] cursor-default" : "bg-[var(--eh-primary-600)] text-white hover:bg-[var(--eh-primary-700)]"].join(" ")}
                    >
                      {alreadyAdded ? "Added" : "+ Use"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Added questions */}
      <div className="space-y-3">
        {form.screeningQuestions.map((item, index) => (
          <div key={`q-${index}`} className="rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold text-[var(--eh-text-3)]">Question {index + 1}</p>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    screeningQuestions:
                      prev.screeningQuestions.length > 1
                        ? prev.screeningQuestions.filter((_, i) => i !== index)
                        : [{ question: "", questionType: "text", options: [], required: false }],
                  }))
                }
                className="rounded-lg p-1 text-[var(--eh-text-3)] hover:bg-white hover:text-red-500"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Question text */}
            <textarea
              value={item.question}
              onChange={(e) => patchQuestion(index, { question: e.target.value })}
              className="input-base min-h-[64px] resize-y"
              placeholder="Type your question here..."
            />

            {/* Question type selector */}
            <div className="flex flex-wrap gap-2">
              {QUESTION_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => patchQuestion(index, { questionType: t.value, options: t.value !== "mcq" ? [] : item.options })}
                  className={["rounded-full border px-3 py-1 text-[11px] font-semibold transition-all", item.questionType === t.value ? "border-[var(--eh-primary-400)] bg-[var(--eh-primary-600)] text-white" : "border-[var(--eh-border)] bg-white text-[var(--eh-text-2)] hover:border-[var(--eh-primary-300)]"].join(" ")}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* MCQ options editor */}
            {item.questionType === "mcq" && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-[var(--eh-text-3)]">Answer choices</p>
                {item.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      value={opt}
                      onChange={(e) => patchQuestion(index, { options: item.options.map((o, j) => j === oi ? e.target.value : o) })}
                      className="input-base flex-1 text-[13px]"
                      placeholder={`Choice ${oi + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => patchQuestion(index, { options: item.options.filter((_, j) => j !== oi) })}
                      className="rounded-lg p-1.5 text-[var(--eh-text-3)] hover:text-red-500 hover:bg-white"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => patchQuestion(index, { options: [...item.options, ""] })}
                  className="text-[12px] font-semibold text-[var(--eh-primary-600)] hover:text-[var(--eh-primary-800)]"
                >
                  + Add choice
                </button>
              </div>
            )}

            {/* Required toggle */}
            <label className="inline-flex items-center gap-2 text-[12px] text-[var(--eh-text-2)] cursor-pointer">
              <input
                type="checkbox"
                checked={item.required}
                onChange={(e) => patchQuestion(index, { required: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              Required to apply
            </label>
          </div>
        ))}
      </div>

      {/* Add blank question */}
      <button
        type="button"
        className="eh-btn eh-btn-secondary w-full"
        onClick={() =>
          setForm((prev) => ({
            ...prev,
            screeningQuestions: [...prev.screeningQuestions, { question: "", questionType: "text", options: [], required: false }],
          }))
        }
      >
        <Plus size={13} /> Add custom question
      </button>
    </div>
  );

  const stepContent = [renderRole, renderDescription, renderCompensation, renderScreening];
  const allDone = steps.every((s) => s.done);

  return (
    <div ref={topRef}>
      {/* ── Header ── */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--eh-text-3)] hover:text-[var(--eh-text-2)]"
          >
            <ArrowLeft size={13} /> Back to jobs
          </button>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--eh-text)]">
            {draftJobId ? "Edit job posting" : "Create a job posting"}
          </h1>
          <p className="mt-0.5 text-[13px] text-[var(--eh-text-3)]">
            {form.title ? `"${form.title}"` : "Complete each section, then publish."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={saveDraft} disabled={loading} className="eh-btn eh-btn-ghost">
            {loading ? <Loader2 size={13} className="animate-spin" /> : null}
            Save draft
          </button>
          <button onClick={preview} disabled={loading} className="eh-btn eh-btn-secondary">
            <Eye size={13} /> Preview
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Left: step form */}
        <div>
          {/* Step bar */}
          <div className="mb-5 rounded-xl border border-[var(--eh-border)] bg-white px-5 py-4">
            <StepBar steps={steps} current={step} onGo={goTo} />
          </div>

          {/* Step content card */}
          <div className="rounded-xl border border-[var(--eh-border)] bg-white p-6">
            <div className="mb-5 border-b border-[var(--eh-border)] pb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--eh-primary-600)]">
                Step {step + 1} of {steps.length}
              </p>
              <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.01em] text-[var(--eh-text)]">
                {["Define the role", "Describe the job", "Set compensation", "Add screening questions"][step]}
              </h2>
              <p className="mt-1 text-[13px] text-[var(--eh-text-3)]">
                {[
                  "Title, subject, board, grade, and type — the essentials teachers filter by.",
                  "A clear description attracts better-fit applicants and reduces noise.",
                  "Salary transparency is your highest-converting signal for quality applications.",
                  "Filter early with targeted questions. Skip this step if you prefer open applications.",
                ][step]}
              </p>
            </div>

            {stepContent[step]()}

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between border-t border-[var(--eh-border)] pt-4">
              <button
                type="button"
                onClick={back}
                disabled={step === 0}
                className="eh-btn eh-btn-ghost disabled:opacity-40"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <div className="flex gap-2">
                {step < steps.length - 1 ? (
                  <button type="button" onClick={next} className="eh-btn eh-btn-primary">
                    Next <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={publish}
                    disabled={loading}
                    className="eh-btn eh-btn-primary"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                    {allDone ? "Publish job" : "Publish anyway"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: live preview + tips */}
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <LivePreview form={form} />

          {/* Completion progress */}
          <div className="rounded-xl border border-[var(--eh-border)] bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-[var(--eh-text)]">Completeness</p>
              <span className="text-[12px] font-semibold text-[var(--eh-primary-600)]">
                {steps.filter((s) => s.done).length}/{steps.length}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--eh-primary-100)]">
              <div
                className="h-full rounded-full bg-[var(--eh-primary-600)] transition-all duration-500"
                style={{ width: `${(steps.filter((s) => s.done).length / steps.length) * 100}%` }}
              />
            </div>
            <div className="mt-3 space-y-1.5">
              {steps.map((s, i) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => goTo(i)}
                  className="flex w-full items-center gap-2 text-left"
                >
                  <span
                    className={[
                      "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px]",
                      s.done
                        ? "bg-emerald-500 text-white"
                        : i === step
                          ? "border-2 border-[var(--eh-primary-500)] bg-white"
                          : "border border-[var(--eh-border)] bg-white",
                    ].join(" ")}
                  >
                    {s.done ? <Check size={9} /> : null}
                  </span>
                  <span className={["text-[12px]", s.done ? "text-[var(--eh-text-3)] line-through" : "text-[var(--eh-text-2)]"].join(" ")}>
                    {s.label}
                  </span>
                  {i === step && <ChevronRight size={11} className="ml-auto text-[var(--eh-primary-500)]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Context tip */}
          <div className="rounded-xl border border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] p-4">
            <p className="text-[12px] font-semibold text-[var(--eh-primary-700)]">
              {["Tip: be specific on grade", "Tip: use bullet points", "Tip: salary transparency", "Tip: keep it short"][step]}
            </p>
            <p className="mt-1 text-[12px] text-[var(--eh-primary-600)]">
              {[
                "Teachers filter by grade level first. Grade 1-5 vs 9-12 makes a big difference in who applies.",
                "Bullet responsibilities and benefits — teachers scan job posts, not read them.",
                "Salary-declared posts get 2.4× more qualified applicants. Even a range helps.",
                "2–3 targeted questions is optimal. More than 4 reduces application completion rates.",
              ][step]}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
