"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { SUBJECTS, BOARDS, LOCATIONS, GRADE_LEVELS, EXPERIENCE_LEVELS } from "@/config/constants";
import { Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

function ChipGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly string[] | readonly { value: string; label: string }[];
  selected: string[];
  onChange: (vals: string[]) => void;
}) {
  const toggle = (val: string) =>
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-gray-500">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const val = typeof opt === "string" ? opt : opt.value;
          const lbl = typeof opt === "string" ? opt : opt.label;
          const active = selected.includes(val);
          return (
            <button
              key={val}
              type="button"
              onClick={() => toggle(val)}
              className={[
                "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-[120ms]",
                active
                  ? "bg-brand-500 text-white border-brand-500 shadow-brand"
                  : "bg-white text-gray-500 border-black/[0.09] hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50",
              ].join(" ")}
            >
              {lbl}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-black/[0.05]">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.07em]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function FieldWrapper({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const isSchool = session?.user?.role === "SCHOOL_ADMIN";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => { if (data.success) setForm(data.data || {}); })
      .finally(() => setLoading(false));
  }, []);

  const set = (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const setArray = (key: string) => (vals: string[]) =>
    setForm((f) => ({ ...f, [key]: vals }));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to save profile. Please try again.");
        setSaving(false);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Network error. Please check your connection and try again.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton h-8 w-1/3 rounded-xl mb-6" />
        <div className="card p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-11 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-[26px] font-bold text-gray-900 tracking-[-0.02em]">
            {isSchool ? "School Profile" : "My Profile"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isSchool ? "Update your school's information for job listings" : "Keep your profile current to attract the right opportunities"}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-all duration-[120ms] shadow-brand hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none shrink-0"
        >
          {saving    ? <Loader2 size={14} className="animate-spin" />
           : saved   ? <CheckCircle2 size={14} />
           :           <Save size={14} />}
          {saving ? "Saving…" : saved ? "Saved!" : "Save Profile"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
          <AlertCircle size={15} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Success inline */}
      {saved && (
        <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm px-4 py-3 rounded-xl mb-5">
          <CheckCircle2 size={15} className="flex-shrink-0" />
          Profile saved successfully!
        </div>
      )}

      <div className="card p-6">
        {isSchool ? (
          <div className="space-y-6">
            <Section title="School information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldWrapper label="School name">
                  <input className="input-base" value={form.schoolName || ""} onChange={set("schoolName")} placeholder="e.g. Delhi Public School" />
                </FieldWrapper>
                <FieldWrapper label="City">
                  <select className="input-base appearance-none" value={form.city || ""} onChange={set("city")}>
                    <option value="">Select city</option>
                    {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </FieldWrapper>
                <FieldWrapper label="Board">
                  <select className="input-base appearance-none" value={form.board || ""} onChange={set("board")}>
                    <option value="">Select board</option>
                    {BOARDS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                </FieldWrapper>
                <FieldWrapper label="Website">
                  <input className="input-base" value={form.website || ""} onChange={set("website")} placeholder="https://yourschool.edu.in" />
                </FieldWrapper>
              </div>
              <div className="mt-4">
                <FieldWrapper label="Address">
                  <input className="input-base" value={form.address || ""} onChange={set("address")} placeholder="Full school address" />
                </FieldWrapper>
              </div>
            </Section>

            <Section title="About your school">
              <FieldWrapper label="Description">
                <textarea
                  className="input-base min-h-[120px] resize-vertical"
                  value={form.about || ""}
                  onChange={set("about")}
                  placeholder="Tell teachers about your school — curriculum, culture, facilities, vision…"
                />
              </FieldWrapper>
            </Section>
          </div>
        ) : (
          <div className="space-y-6">
            <Section title="Basic information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldWrapper label="Qualification">
                  <input className="input-base" value={form.qualification || ""} onChange={set("qualification")} placeholder="e.g. M.Sc Mathematics with B.Ed" />
                </FieldWrapper>
                <FieldWrapper label="Experience">
                  <select className="input-base appearance-none" value={form.experience || ""} onChange={set("experience")}>
                    <option value="">Select level</option>
                    {EXPERIENCE_LEVELS.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </FieldWrapper>
                <FieldWrapper label="Current / previous school">
                  <input className="input-base" value={form.currentSchool || ""} onChange={set("currentSchool")} placeholder="Where do you currently teach?" />
                </FieldWrapper>
                <FieldWrapper label="City">
                  <select className="input-base appearance-none" value={form.city || ""} onChange={set("city")}>
                    <option value="">Select city</option>
                    {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </FieldWrapper>
                <FieldWrapper label="Expected salary (₹/month)">
                  <input type="number" className="input-base" value={form.expectedSalary || ""} onChange={set("expectedSalary")} placeholder="e.g. 45000" />
                </FieldWrapper>
              </div>
              <div className="mt-4">
                <FieldWrapper label="Bio">
                  <textarea
                    className="input-base min-h-[100px] resize-vertical"
                    value={form.bio || ""}
                    onChange={set("bio")}
                    placeholder="Tell schools about yourself — teaching philosophy, achievements, what makes you unique…"
                  />
                </FieldWrapper>
              </div>
            </Section>

            <Section title="Teaching specialisations">
              <div className="space-y-5">
                <ChipGroup
                  label="Subjects you teach"
                  options={SUBJECTS}
                  selected={form.subjects || []}
                  onChange={setArray("subjects")}
                />
                <ChipGroup
                  label="Preferred boards"
                  options={BOARDS}
                  selected={form.preferredBoards || []}
                  onChange={setArray("preferredBoards")}
                />
                <ChipGroup
                  label="Preferred grade levels"
                  options={GRADE_LEVELS}
                  selected={form.preferredGrades || []}
                  onChange={setArray("preferredGrades")}
                />
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}
