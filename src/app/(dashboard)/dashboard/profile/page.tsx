"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { SUBJECTS, BOARDS, LOCATIONS, GRADE_LEVELS, EXPERIENCE_LEVELS } from "@/config/constants";
import { Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

// Reusable multi-select chip group
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
  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[12.5px] font-medium text-gray-500">{label}</label>
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
              className={`px-2.5 py-1 rounded-lg text-[12px] font-medium border transition-all ${
                active
                  ? "bg-brand-500 text-white border-brand-500"
                  : "bg-white text-gray-500 border-gray-200 hover:border-brand-400 hover:text-brand-500"
              }`}
            >
              {lbl}
            </button>
          );
        })}
      </div>
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
      .then((data) => {
        if (data.success) setForm(data.data || {});
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
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

  const inputClass = "px-3 py-2.5 border border-gray-200 rounded-xl text-[13.5px] font-body bg-white focus:outline-none focus:border-brand-500 transition-colors";
  const labelClass = "text-[12.5px] font-medium text-gray-500";

  if (loading) {
    return (
      <div>
        <div className="h-8 w-1/3 bg-gray-100 rounded mb-6 animate-pulse" />
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[26px] font-bold">
            {isSchool ? "School Profile" : "My Profile"}
          </h1>
          <p className="text-[14px] text-gray-500 mt-0.5">
            {isSchool ? "Update your school's information" : "Update your teaching profile"}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Profile"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 text-[13px] px-4 py-2.5 rounded-xl mb-5">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        {isSchool ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>School name</label>
                <input className={inputClass} value={form.schoolName || ""} onChange={set("schoolName")} placeholder="Delhi Public School" />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>City</label>
                <select className={inputClass} value={form.city || ""} onChange={set("city")}>
                  <option value="">Select city</option>
                  {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Board</label>
                <select className={inputClass} value={form.board || ""} onChange={set("board")}>
                  <option value="">Select board</option>
                  {BOARDS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Website</label>
                <input className={inputClass} value={form.website || ""} onChange={set("website")} placeholder="https://yourschool.edu.in" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Address</label>
              <input className={inputClass} value={form.address || ""} onChange={set("address")} placeholder="Full address" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>About the school</label>
              <textarea className={`${inputClass} min-h-[120px] resize-vertical`} value={form.about || ""} onChange={set("about")} placeholder="Tell teachers about your school..." />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Basic info */}
            <div>
              <h3 className="text-[13px] font-semibold text-brand-500 pb-2 border-b border-gray-100 mb-4">Basic information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Qualification</label>
                  <input className={inputClass} value={form.qualification || ""} onChange={set("qualification")} placeholder="e.g. M.Sc Mathematics with B.Ed" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Experience</label>
                  <select className={inputClass} value={form.experience || ""} onChange={set("experience")}>
                    <option value="">Select</option>
                    {EXPERIENCE_LEVELS.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Current / previous school</label>
                  <input className={inputClass} value={form.currentSchool || ""} onChange={set("currentSchool")} placeholder="Where do you teach?" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>City</label>
                  <select className={inputClass} value={form.city || ""} onChange={set("city")}>
                    <option value="">Select city</option>
                    {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Expected salary (₹/month)</label>
                  <input type="number" className={inputClass} value={form.expectedSalary || ""} onChange={set("expectedSalary")} placeholder="e.g. 45000" />
                </div>
              </div>
              <div className="flex flex-col gap-1 mt-3.5">
                <label className={labelClass}>Bio</label>
                <textarea className={`${inputClass} min-h-[100px] resize-vertical`} value={form.bio || ""} onChange={set("bio")} placeholder="Tell schools about yourself, your teaching philosophy, achievements..." />
              </div>
            </div>

            {/* Subject specialisations */}
            <div>
              <h3 className="text-[13px] font-semibold text-brand-500 pb-2 border-b border-gray-100 mb-4">Teaching specialisations</h3>
              <div className="space-y-4">
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
