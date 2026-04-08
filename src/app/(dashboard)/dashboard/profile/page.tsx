"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Copy,
  X,
  Calendar,
} from "lucide-react";
import Modal from "@/components/ui/modal";
import FileUpload from "@/components/ui/file-upload";
import { toast } from "@/components/ui/toast";
import { SUBJECTS, BOARDS, LOCATIONS, GRADE_LEVELS, EXPERIENCE_LEVELS } from "@/config/constants";
import { calculateProfileCompletion } from "@/lib/profileCompletion";
import {
  teacherProfileSchema,
  experienceSchema,
  certificationSchema,
  type TeacherProfileInput,
  type ExperienceInput,
  type CertificationInput,
} from "@/lib/validators/profile";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────────────

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
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.08em]">{label}</label>
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
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-[120ms]",
                active
                  ? "bg-brand-500 text-white border-brand-500 shadow-brand"
                  : "bg-white text-gray-500 border-black/[0.09] hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50"
              )}
            >
              {lbl}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PROFILE HEADER CARD
// ─────────────────────────────────────────────────────────────

function ProfileHeaderCard({
  avatarUrl,
  name,
  availabilityStatus,
  completion,
  onAvatarChange,
}: {
  avatarUrl?: string | null;
  name?: string;
  availabilityStatus: string;
  completion: number;
  onAvatarChange: (url: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        onAvatarChange(data.data.avatarUrl);
        toast.success("Photo updated");
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const copyProfileLink = () => {
    const { protocol, host } = window.location;
    // Get userId from session — in a real app you'd pass this as a prop
    const url = `${protocol}//${host}/profile/[userId]`;
    navigator.clipboard.writeText(url);
    toast.success("Profile link copied");
  };

  const getAvailabilityColor = () => {
    switch (availabilityStatus) {
      case "ACTIVELY_LOOKING":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "OPEN_TO_OFFERS":
        return "bg-amber-50 text-amber-700 border-amber-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  const getAvailabilityLabel = () => {
    switch (availabilityStatus) {
      case "ACTIVELY_LOOKING":
        return "Actively looking";
      case "OPEN_TO_OFFERS":
        return "Open to offers";
      default:
        return "Not looking";
    }
  };

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-start gap-6">
        {/* Avatar */}
        <div className="relative shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarSelect}
            className="hidden"
            disabled={uploadingAvatar}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="relative group"
          >
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
{avatarUrl ? (
  <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
) : (
  (name || "U").charAt(0).toUpperCase()  // ✅ FIX: provide fallback "U"
)}

            </div>
            <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <Upload size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                <Loader2 size={16} className="text-white animate-spin" />
              </div>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h2 className="text-2xl font-bold text-gray-900 font-display">{name || "Teacher Profile"}</h2>
            <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border", getAvailabilityColor())}>
              {getAvailabilityLabel()}
            </span>
          </div>

          {/* Completion bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500">Profile completion</span>
              <span className="text-xs font-bold text-brand-600">{completion}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={copyProfileLink}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 transition-all"
            >
              <Copy size={13} /> Share profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EXPERIENCE MODAL
// ─────────────────────────────────────────────────────────────

function ExperienceModal({
  open,
  editingEntry,
  onClose,
  onSaved,
}: {
  open: boolean;
  editingEntry?: any;
  onClose: () => void;
  onSaved: (exp: any) => void;
}) {
  const form = useForm<ExperienceInput>({
    resolver: zodResolver(experienceSchema),
    defaultValues: editingEntry ? {
      ...editingEntry,
      startDate: new Date(editingEntry.startDate).toISOString().split("T")[0],
      endDate: editingEntry.endDate ? new Date(editingEntry.endDate).toISOString().split("T")[0] : "",
    } : {
      isCurrent: false,
    },
  });

  const isCurrent = form.watch("isCurrent");

  useEffect(() => {
    if (isCurrent) {
      form.setValue("endDate", null);
    }
  }, [isCurrent, form]);

  const onSubmit = async (data: ExperienceInput) => {
    const url = editingEntry ? `/api/profile/experience/${editingEntry.id}` : "/api/profile/experience";
    const method = editingEntry ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (result.success) {
        onSaved(result.data.experience);
        toast.success(editingEntry ? "Experience updated" : "Experience added");
        onClose();
        form.reset();
      } else {
        toast.error(result.error?.schoolName?.[0] || "Failed to save");
      }
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingEntry ? "Edit Experience" : "Add Experience"}
      maxWidth="max-w-lg"
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">School name *</label>
          <input
            type="text"
            {...form.register("schoolName")}
            placeholder="e.g. Delhi Public School"
            className="input-base"
          />
          {form.formState.errors.schoolName && (
            <p className="text-xs text-red-600 mt-1">{form.formState.errors.schoolName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Role *</label>
          <input
            type="text"
            {...form.register("role")}
            placeholder="e.g. Mathematics Teacher"
            className="input-base"
          />
          {form.formState.errors.role && (
            <p className="text-xs text-red-600 mt-1">{form.formState.errors.role.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Start date *</label>
            <input type="date" {...form.register("startDate")} className="input-base" />
            {form.formState.errors.startDate && (
              <p className="text-xs text-red-600 mt-1">{form.formState.errors.startDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">End date</label>
            <input
              type="date"
              {...form.register("endDate")}
              disabled={isCurrent}
              className={cn("input-base", isCurrent && "opacity-50 cursor-not-allowed")}
            />
            {form.formState.errors.endDate && (
              <p className="text-xs text-red-600 mt-1">{form.formState.errors.endDate.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" {...form.register("isCurrent")} id="isCurrent" className="rounded" />
          <label htmlFor="isCurrent" className="text-sm font-medium text-gray-700">
            I currently work here
          </label>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
          <textarea
            {...form.register("description")}
            placeholder="Your responsibilities and achievements..."
            className="input-base min-h-[100px] resize-vertical"
          />
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {form.formState.isSubmitting ? <Loader2 size={14} className="animate-spin" /> : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// CERTIFICATION MODAL
// ─────────────────────────────────────────────────────────────

function CertificationModal({
  open,
  editingEntry,
  onClose,
  onSaved,
}: {
  open: boolean;
  editingEntry?: any;
  onClose: () => void;
  onSaved: (cert: any) => void;
}) {
  const form = useForm<CertificationInput>({
    resolver: zodResolver(certificationSchema),
    defaultValues: editingEntry ? {
      ...editingEntry,
      issuedAt: new Date(editingEntry.issuedAt).toISOString().split("T")[0],
      expiresAt: editingEntry.expiresAt ? new Date(editingEntry.expiresAt).toISOString().split("T")[0] : "",
    } : {},
  });

  const onSubmit = async (data: CertificationInput) => {
    const url = editingEntry ? `/api/profile/certifications/${editingEntry.id}` : "/api/profile/certifications";
    const method = editingEntry ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (result.success) {
        onSaved(result.data.certification);
        toast.success(editingEntry ? "Certification updated" : "Certification added");
        onClose();
        form.reset();
      } else {
        toast.error(result.error?.name?.[0] || "Failed to save");
      }
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingEntry ? "Edit Certification" : "Add Certification"}
      maxWidth="max-w-lg"
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Certification name *</label>
          <input
            type="text"
            {...form.register("name")}
            placeholder="e.g. B.Ed, M.Ed, CTET"
            className="input-base"
          />
          {form.formState.errors.name && (
            <p className="text-xs text-red-600 mt-1">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Issued by *</label>
          <input
            type="text"
            {...form.register("issuedBy")}
            placeholder="e.g. University of Delhi"
            className="input-base"
          />
          {form.formState.errors.issuedBy && (
            <p className="text-xs text-red-600 mt-1">{form.formState.errors.issuedBy.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Issued date *</label>
            <input type="date" {...form.register("issuedAt")} className="input-base" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Expires on</label>
            <input type="date" {...form.register("expiresAt")} className="input-base" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Credential ID</label>
          <input
            type="text"
            {...form.register("credentialId")}
            placeholder="Optional credential ID"
            className="input-base"
          />
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {form.formState.isSubmitting ? <Loader2 size={14} className="animate-spin" /> : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { data: session } = useSession();
  const isSchool = session?.user?.role === "SCHOOL_ADMIN";

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completion, setCompletion] = useState(0);

  // Experience/Cert modals
  const [experienceModalOpen, setExperienceModalOpen] = useState(false);
  const [certificationModalOpen, setCertificationModalOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<any>(null);
  const [editingCertification, setEditingCertification] = useState<any>(null);

  // Form for teacher profile (basic + specializations)
  const form = useForm<TeacherProfileInput>({
    resolver: zodResolver(teacherProfileSchema),
    defaultValues: {},
  });

  // Load profile on mount
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setProfileData(data.data);
          // Update form defaults
          form.reset(data.data);
          // Calculate completion
          const { percentage } = calculateProfileCompletion(data.data);
          setCompletion(percentage);
        }
      })
      .finally(() => setLoading(false));
  }, [form]);

  const handleProfileSave = async (formData: TeacherProfileInput) => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setProfileData(data.data);
        const { percentage } = calculateProfileCompletion(data.data);
        setCompletion(percentage);
        toast.success("Profile saved");
      } else {
        toast.error(data.error?.qualification?.[0] || "Failed to save");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (url: string) => {
    setProfileData((prev: any) => ({ ...prev, avatarUrl: url }));
  };

  const handleExperienceAdded = (exp: any) => {
    setProfileData((prev: any) => ({
      ...prev,
      experiences: [exp, ...(prev.experiences || [])],
    }));
    const { percentage } = calculateProfileCompletion({
      ...profileData,
      experiences: [exp, ...(profileData?.experiences || [])],
    });
    setCompletion(percentage);
  };

  const handleExperienceDeleted = (id: string) => {
    setProfileData((prev: any) => ({
      ...prev,
      experiences: prev.experiences.filter((e: any) => e.id !== id),
    }));
  };

  const handleCertificationAdded = (cert: any) => {
    setProfileData((prev: any) => ({
      ...prev,
      certifications: [cert, ...(prev.certifications || [])],
    }));
    const { percentage } = calculateProfileCompletion({
      ...profileData,
      certifications: [cert, ...(profileData?.certifications || [])],
    });
    setCompletion(percentage);
  };

  const handleCertificationDeleted = (id: string) => {
    setProfileData((prev: any) => ({
      ...prev,
      certifications: prev.certifications.filter((c: any) => c.id !== id),
    }));
  };

  const handleResumeDeleted = (id: string) => {
    setProfileData((prev: any) => ({
      ...prev,
      resumes: prev.resumes.filter((r: any) => r.id !== id),
    }));
    const { percentage } = calculateProfileCompletion({
      ...profileData,
      resumes: profileData?.resumes?.filter((r: any) => r.id !== id) || [],
    });
    setCompletion(percentage);
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton h-8 w-1/3 rounded-xl mb-6" />
        <div className="card p-6 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-11 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // School profile form (keep existing)
  if (isSchool) {
    return (
      <div>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-[26px] font-bold text-gray-900 tracking-[-0.02em]">
              School Profile
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Update your school's information for job listings
            </p>
          </div>
        </div>

        <div className="card p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">School name</label>
              <input
                type="text"
                defaultValue={profileData?.schoolName || ""}
                className="input-base"
                placeholder="School name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
              <select defaultValue={profileData?.city || ""} className="input-base appearance-none">
                <option value="">Select city</option>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Teacher profile
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[26px] font-bold text-gray-900 tracking-[-0.02em]">
          My Profile
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Keep your profile current to attract the right opportunities
        </p>
      </div>

      {/* Header with avatar and completion */}
      {profileData && (
        <ProfileHeaderCard
          avatarUrl={profileData.avatarUrl}
          name={profileData.name}
          availabilityStatus={profileData.availabilityStatus}
          completion={completion}
          onAvatarChange={handleAvatarChange}
        />
      )}

      {/* Modals */}
      <ExperienceModal
        open={experienceModalOpen}
        editingEntry={editingExperience}
        onClose={() => {
          setExperienceModalOpen(false);
          setEditingExperience(null);
        }}
        onSaved={handleExperienceAdded}
      />

      <CertificationModal
        open={certificationModalOpen}
        editingEntry={editingCertification}
        onClose={() => {
          setCertificationModalOpen(false);
          setEditingCertification(null);
        }}
        onSaved={handleCertificationAdded}
      />

      {/* Main form */}
      <form onSubmit={form.handleSubmit(handleProfileSave)} className="space-y-5">
        {/* Basic Info Card */}
        <div className="card p-6">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-black/[0.05]">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.07em]">Basic Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Qualification</label>
              <input
                type="text"
                {...form.register("qualification")}
                placeholder="e.g. M.Sc Mathematics with B.Ed"
                className="input-base"
              />
              {form.formState.errors.qualification && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.qualification.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Experience</label>
                <select {...form.register("experience")} className="input-base appearance-none">
                  <option value="">Select level</option>
                  {EXPERIENCE_LEVELS.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                <select {...form.register("city")} className="input-base appearance-none">
                  <option value="">Select city</option>
                  {LOCATIONS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Current / Previous School</label>
              <input
                type="text"
                {...form.register("currentSchool")}
                placeholder="Where do you teach/taught?"
                className="input-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                <input type="tel" {...form.register("phone")} placeholder="+91 XXXXX XXXXX" className="input-base" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Expected Salary (₹/month)</label>
                <input
                  type="number"
                  {...form.register("expectedSalary")}
                  placeholder="e.g. 45000"
                  className="input-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Availability</label>
              <select {...form.register("availabilityStatus")} className="input-base appearance-none">
                <option value="ACTIVELY_LOOKING">Actively looking</option>
                <option value="OPEN_TO_OFFERS">Open to offers</option>
                <option value="NOT_LOOKING">Not looking</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Bio</label>
              <textarea
                {...form.register("bio")}
                placeholder="Tell schools about yourself..."
                className="input-base min-h-[100px] resize-vertical"
              />
              {form.formState.errors.bio && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.bio.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Teaching Specializations */}
        <div className="card p-6">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-black/[0.05]">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.07em]">Teaching Specialisations</h2>
          </div>

          <div className="space-y-5">
            <Controller
              control={form.control}
              name="subjects"
              render={({ field }) => (
                <ChipGroup
                  label="Subjects you teach"
                  options={SUBJECTS}
                  selected={field.value || []}
                  onChange={field.onChange}
                />
              )}
            />

            <Controller
              control={form.control}
              name="preferredBoards"
              render={({ field }) => (
                <ChipGroup
                  label="Preferred boards"
                  options={BOARDS}
                  selected={field.value || []}
                  onChange={field.onChange}
                />
              )}
            />

            <Controller
              control={form.control}
              name="preferredGrades"
              render={({ field }) => (
                <ChipGroup
                  label="Preferred grade levels"
                  options={GRADE_LEVELS}
                  selected={field.value || []}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>

        {/* Work Experience */}
        <div className="card p-6">
          <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-black/[0.05]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.07em]">Work Experience</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingExperience(null);
                setExperienceModalOpen(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors"
            >
              <Plus size={12} /> Add
            </button>
          </div>

          {profileData?.experiences && profileData.experiences.length > 0 ? (
            <div className="space-y-3">
              {profileData.experiences.map((exp: any) => (
                <div key={exp.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{exp.role}</h3>
                      <p className="text-xs text-gray-500">{exp.schoolName}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingExperience(exp);
                          setExperienceModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white transition-colors"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await fetch(`/api/profile/experience/${exp.id}`, { method: "DELETE" });
                          if (res.ok) {
                            handleExperienceDeleted(exp.id);
                            toast.success("Experience deleted");
                          }
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(exp.startDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} –{" "}
                    {exp.isCurrent ? "Present" : new Date(exp.endDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic py-4">No work experience added yet</p>
          )}
        </div>

        {/* Certifications */}
        <div className="card p-6">
          <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-black/[0.05]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.07em]">Certifications</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingCertification(null);
                setCertificationModalOpen(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors"
            >
              <Plus size={12} /> Add
            </button>
          </div>

          {profileData?.certifications && profileData.certifications.length > 0 ? (
            <div className="space-y-2">
              {profileData.certifications.map((cert: any) => (
                <div key={cert.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 group">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{cert.name}</p>
                    <p className="text-xs text-gray-500">{cert.issuedBy}</p>
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCertification(cert);
                        setCertificationModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white transition-colors"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await fetch(`/api/profile/certifications/${cert.id}`, { method: "DELETE" });
                        if (res.ok) {
                          handleCertificationDeleted(cert.id);
                          toast.success("Certification deleted");
                        }
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic py-4">No certifications added yet</p>
          )}
        </div>

        {/* Resume Section */}
        <div className="card p-6">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-black/[0.05]">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.07em]">Resume</h2>
          </div>

          <div className="mb-4">
            <FileUpload
              onUpload={async (_, fileName) => {
                // Auto-delete oldest resume if multiple exist
                if (profileData?.resumes && profileData.resumes.length > 0) {
                  const oldest = profileData.resumes.reduce((prev: any, current: any) =>
                    new Date(prev.uploadedAt) < new Date(current.uploadedAt) ? prev : current
                  );

                  const deleteRes = await fetch(`/api/resumes/${oldest.id}`, { method: "DELETE" });
                  if (deleteRes.ok) {
                    toast.success(`Old resume "${oldest.fileName}" deleted automatically`);
                  }
                }

                // Refresh profile to get new resume
                fetch("/api/profile")
                  .then((r) => r.json())
                  .then((data) => {
                    if (data.success) {
                      setProfileData(data.data);
                    }
                  });
              }}
              onClear={() => {
                // No active resume preview state to clear here.
              }}
            />
          </div>

          {profileData?.resumes && profileData.resumes.length > 0 && (
            <div className="space-y-2">
              {profileData.resumes.length > 1 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <p className="text-xs font-medium text-amber-700">
                    💡 You have {profileData.resumes.length} resumes. Uploading a new one will delete the oldest.
                  </p>
                </div>
              )}
              {profileData.resumes.map((resume: any) => (
                <div key={resume.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 group">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{resume.fileName}</p>
                    <p className="text-xs text-gray-500">Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <a
                      href={resume.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                    >
                      Download
                    </a>
                    <button
                      onClick={async () => {
                        const res = await fetch(`/api/resumes/${resume.id}`, { method: "DELETE" });
                        if (res.ok) {
                          handleResumeDeleted(resume.id);
                          toast.success("Resume deleted");
                        } else {
                          toast.error("Failed to delete resume");
                        }
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-all duration-[120ms] shadow-brand hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save size={14} /> Save Profile
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
