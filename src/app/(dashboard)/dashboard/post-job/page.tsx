"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SUBJECTS, BOARDS, GRADE_LEVELS, JOB_TYPES, EXPERIENCE_LEVELS } from "@/config/constants";
import { createJobSchema } from "@/lib/validators/job";
import { Plus, X, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

type FieldErrors = Partial<Record<string, string>>;

export default function PostJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [form, setForm] = useState({
    title: "", subject: "", board: "", gradeLevel: "", jobType: "FULL_TIME",
    experience: "", salaryMin: "", salaryMax: "", description: "",
  });
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [benefits, setBenefits] = useState<string[]>([""]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (fieldErrors[key]) setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
  };

  const updateListItem = (list: string[], setList: (v: string[]) => void, idx: number, val: string) => {
    const copy = [...list]; copy[idx] = val; setList(copy);
  };
  const addListItem = (list: string[], setList: (v: string[]) => void) => setList([...list, ""]);
  const removeListItem = (list: string[], setList: (v: string[]) => void, idx: number) => {
    if (list.length <= 1) return;
    setList(list.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setError("");
    setFieldErrors({});

    const payload = {
      ...form,
      salaryMin: form.salaryMin ? parseInt(form.salaryMin) : undefined,
      salaryMax: form.salaryMax ? parseInt(form.salaryMax) : undefined,
      requirements: requirements.filter(Boolean),
      benefits: benefits.filter(Boolean),
    };

    // Run same Zod schema as server for field-level errors
    const parsed = createJobSchema.safeParse(payload);
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string;
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      setError("Please fix the highlighted fields before submitting.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to create job");
        setLoading(false);
        return;
      }

      router.push("/dashboard/my-jobs");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const ic = (field?: string) =>
    `px-3 py-2.5 border rounded-xl text-[13.5px] font-body bg-white focus:outline-none transition-colors ${
      field && fieldErrors[field]
        ? "border-red-300 focus:border-red-400"
        : "border-gray-200 focus:border-brand-500"
    }`;
  const lc = "text-[12.5px] font-medium text-gray-500";
  const FieldError = ({ field }: { field: string }) =>
    fieldErrors[field] ? <p className="text-[11.5px] text-red-500 mt-1">{fieldErrors[field]}</p> : null;

  const descLen = form.description.length;
  const descOk = descLen >= 50;

  return (
    <div>
      <h1 className="font-display text-[26px] font-bold mb-1">Post a Teaching Position</h1>
      <p className="text-[14px] text-gray-500 mb-6">Fill in the details and your job will be live immediately.</p>

      {error && (
        <div className="bg-red-50 text-red-600 text-[13px] px-4 py-2.5 rounded-xl mb-5">{error}</div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-6">

        {/* Position Details */}
        <div>
          <h3 className="text-[13.5px] font-semibold text-brand-500 mb-4 pb-2 border-b border-gray-100">Position details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1">
              <label className={lc}>Job title <span className="text-red-400">*</span></label>
              <input className={ic("title")} value={form.title} onChange={set("title")} placeholder="e.g. PGT Mathematics" />
              <FieldError field="title" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lc}>Subject <span className="text-red-400">*</span></label>
              <select className={ic("subject")} value={form.subject} onChange={set("subject")}>
                <option value="">Select subject</option>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <FieldError field="subject" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lc}>Board <span className="text-red-400">*</span></label>
              <select className={ic("board")} value={form.board} onChange={set("board")}>
                <option value="">Select board</option>
                {BOARDS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
              <FieldError field="board" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lc}>Grade level <span className="text-red-400">*</span></label>
              <select className={ic("gradeLevel")} value={form.gradeLevel} onChange={set("gradeLevel")}>
                <option value="">Select grade</option>
                {GRADE_LEVELS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <FieldError field="gradeLevel" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lc}>Job type</label>
              <select className={ic()} value={form.jobType} onChange={set("jobType")}>
                {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className={lc}>Experience required</label>
              <select className={ic()} value={form.experience} onChange={set("experience")}>
                <option value="">Any experience</option>
                {EXPERIENCE_LEVELS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className={lc}>Min salary (₹/month)</label>
              <input type="number" className={ic()} value={form.salaryMin} onChange={set("salaryMin")} placeholder="35000" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lc}>Max salary (₹/month)</label>
              <input type="number" className={ic()} value={form.salaryMax} onChange={set("salaryMax")} placeholder="55000" />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-[13.5px] font-semibold text-brand-500 mb-4 pb-2 border-b border-gray-100">Description</h3>
          <div className="flex flex-col gap-1">
            <label className={lc}>Job description <span className="text-red-400">*</span></label>
            <textarea
              className={`${ic("description")} min-h-[140px] resize-vertical`}
              value={form.description}
              onChange={set("description")}
              placeholder="Describe the role, responsibilities, and what makes your school great..."
            />
            <div className="flex items-center gap-1.5 mt-1">
              {descOk
                ? <><CheckCircle2 size={12} className="text-green-500" /><span className="text-[11px] text-green-600">{descLen} characters — good to go</span></>
                : <span className="text-[11px] text-amber-500">{50 - descLen} more characters needed (min 50)</span>
              }
            </div>
            <FieldError field="description" />
          </div>
        </div>

        {/* Requirements */}
        <div>
          <h3 className="text-[13.5px] font-semibold text-brand-500 mb-4 pb-2 border-b border-gray-100">Requirements</h3>
          <div className="space-y-2">
            {requirements.map((r, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className={`${ic()} flex-1`}
                  value={r}
                  onChange={(e) => updateListItem(requirements, setRequirements, i, e.target.value)}
                  placeholder={`Requirement ${i + 1}`}
                />
                {requirements.length > 1 && (
                  <button onClick={() => removeListItem(requirements, setRequirements, i)} className="p-2 text-gray-400 hover:text-red-500">
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addListItem(requirements, setRequirements)}
              className="flex items-center gap-1.5 text-[13px] text-brand-500 hover:text-brand-600 font-medium"
            >
              <Plus size={14} /> Add requirement
            </button>
          </div>
        </div>

        {/* Benefits */}
        <div>
          <h3 className="text-[13.5px] font-semibold text-brand-500 mb-4 pb-2 border-b border-gray-100">Benefits</h3>
          <div className="space-y-2">
            {benefits.map((b, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className={`${ic()} flex-1`}
                  value={b}
                  onChange={(e) => updateListItem(benefits, setBenefits, i, e.target.value)}
                  placeholder={`Benefit ${i + 1}`}
                />
                {benefits.length > 1 && (
                  <button onClick={() => removeListItem(benefits, setBenefits, i)} className="p-2 text-gray-400 hover:text-red-500">
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addListItem(benefits, setBenefits)}
              className="flex items-center gap-1.5 text-[13px] text-brand-500 hover:text-brand-600 font-medium"
            >
              <Plus size={14} /> Add benefit
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <button onClick={() => router.back()} className="px-5 py-2.5 rounded-xl text-[14px] font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[14px] font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            {loading ? "Publishing..." : "Publish Job"}
          </button>
        </div>
      </div>
    </div>
  );
}
