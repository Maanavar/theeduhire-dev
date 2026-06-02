"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminEditSchool } from "@/lib/api/admin-client";
import type { AdminSchool } from "@/lib/api/admin-client";
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

interface Props {
  school: AdminSchool | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditSchoolDrawer({ school, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [city, setCity] = useState("");
  const [board, setBoard] = useState("CBSE");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [about, setAbout] = useState("");
  const [udiseCode, setUdiseCode] = useState("");
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!school) return;
    setName("");
    setEmail(school.user.email ?? "");
    setPhone("");
    setPassword("");
    setSchoolName(school.schoolName ?? "");
    setCity(school.city ?? "");
    setBoard(school.board ?? "CBSE");
    setAddress("");
    setWebsite("");
    setAbout("");
    setUdiseCode("");
  }, [school]);

  useEffect(() => {
    if (!school) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [school, onClose]);

  if (!school) return null;

  const handleSave = async () => {
    if (!schoolName.trim() || !city.trim()) {
      toast.error("School name and city are required");
      return;
    }
    setLoading(true);
    try {
      await adminEditSchool({
        schoolId: school.id,
        name: name || undefined,
        email: email || undefined,
        phone: phone || undefined,
        password: password || undefined,
        schoolName, city, board,
        address: address || undefined,
        website: website || undefined,
        about: about || undefined,
        udiseCode: udiseCode || undefined,
      });
      toast.success("School updated");
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
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
          <div>
            <h2 className="text-[17px] font-bold tracking-[-0.02em] text-gray-900">Edit school</h2>
            <p className="text-[12.5px] text-gray-500 mt-0.5">{school.schoolName}</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Account */}
          <section>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">Account (admin login)</p>
            <div className="space-y-3">
              <Field label="Admin name">
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Leave blank to keep unchanged" />
              </Field>
              <Field label="Email">
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

          {/* School profile */}
          <section>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">School profile</p>
            <div className="space-y-3">
              <Field label="School name" required>
                <input className={inputCls} value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="School name" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="City" required>
                  <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
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
                <textarea
                  className={cn(inputCls, "resize-none")}
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full address"
                />
              </Field>
              <Field label="Website">
                <input className={inputCls} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
              </Field>
              <Field label="About">
                <textarea
                  className={cn(inputCls, "resize-none")}
                  rows={3}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="About the school..."
                />
              </Field>
              <Field label="UDISE Code">
                <input className={inputCls} value={udiseCode} onChange={(e) => setUdiseCode(e.target.value)} placeholder="UDISE code" />
              </Field>
            </div>
          </section>
        </div>

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
