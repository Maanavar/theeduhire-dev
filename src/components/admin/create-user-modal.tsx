"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminCreateTeacher, adminCreateSchool } from "@/lib/api/admin-client";
import { getApiErrorMessage } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";

const BOARD_OPTIONS = [
  { value: "CBSE", label: "CBSE" },
  { value: "ICSE", label: "ICSE" },
  { value: "STATE_BOARD", label: "State Board" },
  { value: "IB", label: "IB" },
  { value: "CAMBRIDGE", label: "Cambridge" },
  { value: "OTHER", label: "Other" },
];

const SUBJECT_OPTIONS = [
  "Mathematics","Physics","Chemistry","Biology","English","Tamil","Hindi","History",
  "Geography","Civics","Economics","Commerce","Accountancy","Computer Science",
  "Physical Education","Art","Music","EVS","Social Science",
];

interface Props {
  open: boolean;
  defaultRole?: "TEACHER" | "SCHOOL_ADMIN";
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateUserModal({ open, defaultRole = "TEACHER", onClose, onCreated }: Props) {
  const [role, setRole] = useState<"TEACHER" | "SCHOOL_ADMIN">(defaultRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [phone, setPhone] = useState("");
  // Teacher fields
  const [city, setCity] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [qualification, setQualification] = useState("");
  const [experience, setExperience] = useState("");
  // School fields
  const [schoolName, setSchoolName] = useState("");
  const [schoolCity, setSchoolCity] = useState("");
  const [board, setBoard] = useState("CBSE");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setRole(defaultRole);
    setName(""); setEmail(""); setPassword(""); setPhone("");
    setCity(""); setSubjects([]); setQualification(""); setExperience("");
    setSchoolName(""); setSchoolCity(""); setBoard("CBSE"); setAddress(""); setWebsite("");
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, defaultRole, onClose]);

  if (!open) return null;

  const toggleSubject = (s: string) =>
    setSubjects((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const handleCreate = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Name, email and password are required");
      return;
    }
    if (role === "TEACHER" && subjects.length === 0) {
      toast.error("Select at least one subject");
      return;
    }
    if (role === "SCHOOL_ADMIN" && (!schoolName.trim() || !schoolCity.trim())) {
      toast.error("School name and city are required");
      return;
    }
    setLoading(true);
    try {
      if (role === "TEACHER") {
        await adminCreateTeacher({ name, email, password, phone: phone || undefined, city, subjects, qualification, experience });
        toast.success("Teacher account created");
      } else {
        await adminCreateSchool({ name, email, password, phone: phone || undefined, schoolName, city: schoolCity, board, address: address || undefined, website: website || undefined });
        toast.success("School account created");
      }
      onCreated();
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Creation failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === overlayRef.current && !loading) onClose(); }}
    >
      <div className="w-full max-w-lg max-h-[90vh] rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 shrink-0">
          <h2 className="text-[17px] font-bold tracking-[-0.02em] text-gray-900">Create user account</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 disabled:opacity-40"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Role picker */}
          <div>
            <p className="mb-2 text-[12px] font-semibold text-gray-700">Account type</p>
            <div className="grid grid-cols-2 gap-2">
              {(["TEACHER", "SCHOOL_ADMIN"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "rounded-xl border px-4 py-2.5 text-[13px] font-medium transition-colors",
                    role === r
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  )}
                >
                  {r === "TEACHER" ? "Teacher" : "School admin"}
                </button>
              ))}
            </div>
          </div>

          {/* Common account fields */}
          <section>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">Account</p>
            <div className="space-y-3">
              <Field label="Full name" required>
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
              </Field>
              <Field label="Email" required>
                <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" />
              </Field>
              <Field label="Password" required>
                <div className="relative">
                  <input
                    className={cn(inputCls, "pr-10")}
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
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
              <Field label="Phone">
                <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
              </Field>
            </div>
          </section>

          {/* Teacher-specific fields */}
          {role === "TEACHER" && (
            <section>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">Teacher profile</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City">
                    <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                  </Field>
                  <Field label="Experience">
                    <input className={inputCls} value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 2-5 years" />
                  </Field>
                </div>
                <Field label="Qualification">
                  <input className={inputCls} value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="e.g. B.Ed, M.Sc" />
                </Field>
                <div>
                  <p className="mb-2 text-[12px] font-semibold text-gray-700">
                    Subjects <span className="text-red-500">*</span>
                  </p>
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
          )}

          {/* School-specific fields */}
          {role === "SCHOOL_ADMIN" && (
            <section>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">School profile</p>
              <div className="space-y-3">
                <Field label="School name" required>
                  <input className={inputCls} value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="School name" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City" required>
                    <input className={inputCls} value={schoolCity} onChange={(e) => setSchoolCity(e.target.value)} placeholder="City" />
                  </Field>
                  <Field label="Board">
                    <select className={inputCls} value={board} onChange={(e) => setBoard(e.target.value)}>
                      {BOARD_OPTIONS.map((b) => (
                        <option key={b.value} value={b.value}>{b.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Address">
                  <input className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address (optional)" />
                </Field>
                <Field label="Website">
                  <input className={inputCls} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://... (optional)" />
                </Field>
              </div>
            </section>
          )}
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
            onClick={handleCreate}
            disabled={loading}
            className="flex min-w-[110px] items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            Create account
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
