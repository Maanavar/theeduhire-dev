"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminEditTeacher } from "@/lib/api/admin-client";
import type { AdminTeacher } from "@/lib/api/admin-client";
import { getApiErrorMessage } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";

const SUBJECT_OPTIONS = [
  "Mathematics","Physics","Chemistry","Biology","English","Tamil","Hindi","History",
  "Geography","Civics","Economics","Commerce","Accountancy","Computer Science",
  "Physical Education","Art","Music","EVS","Social Science",
];

interface Props {
  teacher: AdminTeacher | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditTeacherDrawer({ teacher, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [city, setCity] = useState("");
  const [qualification, setQualification] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!teacher) return;
    setName(teacher.user.name ?? "");
    setEmail(teacher.user.email ?? "");
    setPhone("");
    setPassword("");
    setCity(teacher.city ?? "");
    setQualification(teacher.qualification ?? "");
    setExperience("");
    setBio("");
    setSubjects(teacher.subjects ?? []);
  }, [teacher]);

  useEffect(() => {
    if (!teacher) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [teacher, onClose]);

  if (!teacher) return null;

  const toggleSubject = (s: string) =>
    setSubjects((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setLoading(true);
    try {
      await adminEditTeacher({
        userId: teacher.userId,
        name, email, phone: phone || undefined,
        password: password || undefined,
        city, subjects, qualification, experience, bio,
      });
      toast.success("Teacher updated");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Update failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[70] flex justify-end animate-fade-in"
      style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === overlayRef.current && !loading) onClose(); }}
    >
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
          <div>
            <h2 className="text-[17px] font-bold tracking-[-0.02em] text-gray-900">Edit teacher</h2>
            <p className="text-[12.5px] text-gray-500 mt-0.5">{teacher.user.name}</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Account */}
          <section>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">Account</p>
            <div className="space-y-3">
              <Field label="Full name" required>
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
              </Field>
              <Field label="Email" required>
                <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" />
              </Field>
              <Field label="Phone">
                <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Leave blank to keep unchanged" />
              </Field>
              <Field label="New password">
                <div className="relative">
                  <input
                    className={cn(inputCls, "pr-10")}
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep unchanged"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </Field>
            </div>
          </section>

          {/* Profile */}
          <section>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">Profile</p>
            <div className="space-y-3">
              <Field label="City">
                <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
              </Field>
              <Field label="Qualification">
                <input className={inputCls} value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="e.g. B.Ed, M.A. English" />
              </Field>
              <Field label="Experience">
                <input className={inputCls} value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 3-5 years" />
              </Field>
              <Field label="Bio">
                <textarea
                  className={cn(inputCls, "resize-none")}
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Short bio..."
                />
              </Field>
              <div>
                <p className="mb-2 text-[12px] font-semibold text-gray-700">Subjects</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUBJECT_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSubject(s)}
                      className={cn(
                        "rounded-full px-3 py-1 text-[12px] font-medium border transition-colors",
                        subjects.includes(s)
                          ? "bg-brand-500 border-brand-500 text-white"
                          : "bg-white border-gray-200 text-gray-600 hover:border-brand-400"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-100 flex justify-end gap-2 px-6 py-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-gray-200 px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex min-w-[90px] items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">
        {label}{required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13.5px] text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-brand-500 focus:bg-white";
