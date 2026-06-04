"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  Save,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/toast";
import { BOARDS, LOCATIONS } from "@/config/constants";
import { calculateProfileCompletion } from "@/lib/profileCompletion";
import {
  ApiRequestError,
  getApiErrorMessage,
  getApiFieldError,
} from "@/lib/api/client";
import {
  deleteCertification as deleteCertificationRequest,
  deleteExperience as deleteExperienceRequest,
  deleteResume as deleteResumeRequest,
  getProfile,
  type ProfileCertification,
  type ProfileExperience,
  type ProfilePageData,
  requestSchoolVerification,
  uploadSchoolLogo,
  updateProfile,
  uploadTeacherDocument,
} from "@/lib/api/profile-client";
import {
  teacherProfileSchema,
  type TeacherProfileInput,
} from "@/lib/validators/profile";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { PageHeader, PageShell, Panel, StatusBadge } from "@/components/layout/page-shell";
import { ProfileHeaderCard as SharedProfileHeaderCard } from "@/components/profile/profile-header-card";
import { ExperienceModal as ExtractedExperienceModal } from "@/components/profile/experience-modal";
import { CertificationModal as ExtractedCertificationModal } from "@/components/profile/certification-modal";
import { getTeacherProfileSections } from "@/components/profile/profile-sections";
import {
  TeacherBasicInfoSection,
  TeacherCredentialsSection,
  TeacherSpecialisationsSection,
} from "./_components/teacher-form-sections";
import {
  TeacherCertificationsSection,
  TeacherExperienceSection,
  TeacherResumeSection,
} from "./_components/teacher-record-sections";

const INDIAN_PHONE_REGEX = /^(\+91[-\s]?)?[6-9]\d{9}$/;
const SECTION_FIELD_MAP: Record<string, Array<keyof TeacherProfileInput>> = {
  "basic-info": ["name", "qualification", "experience", "currentSchool", "city", "bio", "phone", "expectedSalary", "availabilityStatus"],
  specialisations: ["subjects", "preferredBoards", "preferredGrades", "preferredJobTypes"],
  experience: [],
  certifications: [],
  "teaching-credentials": ["tetStatus", "noticePeriodDays", "teachingMediums", "pocsoAcknowledged", "referenceCheckDone", "codeOfConductSigned"],
  resume: [],
};

function getTeacherFormDefaults(
  data: ProfilePageData
): Partial<TeacherProfileInput> {
  return {
    name: data.name || "",
    qualification: data.qualification || "",
    experience: (data.experience || "") as TeacherProfileInput["experience"],
    currentSchool: data.currentSchool || "",
    city: (data.city || "") as TeacherProfileInput["city"],
    bio: data.bio || "",
    phone: data.phone || "",
    subjects: (data.subjects || []) as TeacherProfileInput["subjects"],
    preferredBoards: (data.preferredBoards || []) as TeacherProfileInput["preferredBoards"],
    preferredGrades: (data.preferredGrades || []) as TeacherProfileInput["preferredGrades"],
    expectedSalary: data.expectedSalary ?? undefined,
    availabilityStatus: (data.availabilityStatus ||
      "NOT_LOOKING") as TeacherProfileInput["availabilityStatus"],
    preferredJobTypes: (data.preferredJobTypes || []) as TeacherProfileInput["preferredJobTypes"],
    noticePeriodDays: data.noticePeriodDays ?? undefined,
    tetStatus: (data.tetStatus || undefined) as TeacherProfileInput["tetStatus"],
    teachingMediums: (data.teachingMediums || []) as TeacherProfileInput["teachingMediums"],
    pocsoAcknowledged: !!data.pocsoAcknowledged,
    referenceCheckDone: !!data.referenceCheckDone,
    codeOfConductSigned: !!data.codeOfConductSigned,
  };
}

// ─────────────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { data: session } = useSession();
  const isSchool = session?.user?.role === "SCHOOL_ADMIN";

  const [profileData, setProfileData] = useState<ProfilePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completion, setCompletion] = useState(0);
  const [phoneValidationError, setPhoneValidationError] = useState("");
  const [uploadingDemoVideo, setUploadingDemoVideo] = useState(false);
  const [uploadingLessonPlan, setUploadingLessonPlan] = useState(false);

  // Experience/Cert modals
  const [experienceModalOpen, setExperienceModalOpen] = useState(false);
  const [certificationModalOpen, setCertificationModalOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<ProfileExperience | null>(null);
  const [editingCertification, setEditingCertification] = useState<ProfileCertification | null>(null);

  // School form state (must be at top level, not in conditional)
  const [schoolForm, setSchoolForm] = useState({
    name: "",
    schoolName: "",
    city: "",
    board: "",
    address: "",
    website: "",
    about: "",
    hasPfEsi: false,
    paymentTrackRecord: "",
    workingHours: "",
    udiseCode: "",
  });
  const [schoolSaving, setSchoolSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [requestingVerification, setRequestingVerification] = useState(false);
  const [activeSection, setActiveSection] = useState("basic-info");

  const schoolLogoInputRef = useRef<HTMLInputElement>(null);

  // Form for teacher profile (basic + specializations)
  const form = useForm<TeacherProfileInput>({
    resolver: zodResolver(teacherProfileSchema),
    defaultValues: {},
  });

  const maybeTrackProfileCompleted = (percentage: number) => {
    if (percentage < 100 || typeof window === "undefined") return;
    const key = "eduhire_profile_completed_tracked";
    if (window.localStorage.getItem(key)) return;
    trackEvent("profile_completed", { completion: percentage });
    window.localStorage.setItem(key, "1");
  };

  // Load profile on mount
  useEffect(() => {
    void getProfile()
      .then((data) => {
        setProfileData(data);
        form.reset(getTeacherFormDefaults(data));

        const { percentage } = calculateProfileCompletion(data);
        setCompletion(percentage);
        maybeTrackProfileCompleted(percentage);

        if (isSchool) {
          setSchoolForm({
            name: data.name || "",
            schoolName: data.schoolName || "",
            city: data.city || "",
            board: data.board || "",
            address: data.address || "",
            website: data.website || "",
            about: data.about || "",
            hasPfEsi: !!data.hasPfEsi,
            paymentTrackRecord: data.paymentTrackRecord || "",
            workingHours: data.workingHours || "",
            udiseCode: data.udiseCode || "",
          });
        }
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Failed to load profile"));
      })
      .finally(() => setLoading(false));
  }, [form, isSchool]);

  const saveProfilePatch = async (patch: Partial<TeacherProfileInput>, successMessage: string) => {
    const normalizedPhone = patch.phone?.trim();
    if (normalizedPhone && !INDIAN_PHONE_REGEX.test(normalizedPhone)) {
      setPhoneValidationError("Enter a valid Indian mobile number");
      toast.error("Please enter a valid Indian mobile number");
      return;
    }
    setPhoneValidationError("");

    setSaving(true);
    try {
      const data = await updateProfile(patch);
      setProfileData(data);
      form.reset(getTeacherFormDefaults(data));
      const { percentage } = calculateProfileCompletion(data);
      setCompletion(percentage);
      maybeTrackProfileCompleted(percentage);
      window.dispatchEvent(new Event("profile-updated"));
      toast.success(successMessage);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        toast.error(
          getApiFieldError(error, "qualification") ||
            getApiErrorMessage(error, "Failed to save")
        );
      } else {
        toast.error(getApiErrorMessage(error, "Failed to save"));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleActiveSectionSave = async () => {
    const fields = SECTION_FIELD_MAP[activeSection] || [];

    if (fields.length === 0) {
      const autoSavedMessage =
        activeSection === "experience"
          ? "Experience entries save when you add or edit them."
          : activeSection === "certifications"
            ? "Certification entries save when you add or edit them."
            : "Resume changes save during upload or delete.";
      toast.success(autoSavedMessage);
      return;
    }

    const isValid = await form.trigger(fields);
    if (!isValid) {
      toast.error("Please correct the highlighted fields in this section before saving.");
      return;
    }

    const patch = Object.fromEntries(fields.map((field) => [field, form.getValues(field)])) as Partial<TeacherProfileInput>;
    await saveProfilePatch(patch, `${activeSectionMeta.label} saved`);
  };

  const handleAvatarChange = (url: string) => {
    setProfileData((prev) => (prev ? { ...prev, avatarUrl: url } : prev));
  };

  const handleExperienceAdded = (exp: ProfileExperience) => {
    setProfileData((prev) => (
      prev
        ? {
            ...prev,
            experiences: [exp, ...(prev.experiences || [])],
          }
        : prev
    ));
    const { percentage } = calculateProfileCompletion({
      ...profileData,
      experiences: [exp, ...(profileData?.experiences || [])],
    });
    setCompletion(percentage);
    window.dispatchEvent(new Event("profile-updated"));
  };

  const handleExperienceDeleted = (id: string) => {
    setProfileData((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        experiences: prev.experiences?.filter((e) => e.id !== id) || [],
      };
      setCompletion(calculateProfileCompletion(next).percentage);
      window.dispatchEvent(new Event("profile-updated"));
      return next;
    });
  };

  const handleCertificationAdded = (cert: ProfileCertification) => {
    setProfileData((prev) => (
      prev
        ? {
            ...prev,
            certifications: [cert, ...(prev.certifications || [])],
          }
        : prev
    ));
    const { percentage } = calculateProfileCompletion({
      ...profileData,
      certifications: [cert, ...(profileData?.certifications || [])],
    });
    setCompletion(percentage);
    window.dispatchEvent(new Event("profile-updated"));
  };

  const handleCertificationDeleted = (id: string) => {
    setProfileData((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        certifications: prev.certifications?.filter((c) => c.id !== id) || [],
      };
      setCompletion(calculateProfileCompletion(next).percentage);
      window.dispatchEvent(new Event("profile-updated"));
      return next;
    });
  };

  const handleResumeDeleted = (id: string) => {
    setProfileData((prev) => (
      prev
        ? {
            ...prev,
            resumes: prev.resumes?.filter((r) => r.id !== id) || [],
          }
        : prev
    ));
    const { percentage } = calculateProfileCompletion({
      ...profileData,
      resumes: profileData?.resumes?.filter((r) => r.id !== id) || [],
    });
    setCompletion(percentage);
    window.dispatchEvent(new Event("profile-updated"));
  };

  const openExperienceCreateModal = () => {
    setEditingExperience(null);
    setExperienceModalOpen(true);
  };

  const openExperienceEditModal = (experience: any) => {
    setEditingExperience(experience);
    setExperienceModalOpen(true);
  };

  const deleteExperience = async (experienceId: string) => {
    try {
      await deleteExperienceRequest(experienceId);
      handleExperienceDeleted(experienceId);
      toast.success("Experience deleted");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete experience"));
    }
  };

  const openCertificationCreateModal = () => {
    setEditingCertification(null);
    setCertificationModalOpen(true);
  };

  const openCertificationEditModal = (certification: any) => {
    setEditingCertification(certification);
    setCertificationModalOpen(true);
  };

  const deleteCertification = async (certificationId: string) => {
    try {
      await deleteCertificationRequest(certificationId);
      handleCertificationDeleted(certificationId);
      toast.success("Certification deleted");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete certification"));
    }
  };

  const deleteResume = async (resumeId: string) => {
    try {
      await deleteResumeRequest(resumeId);
      handleResumeDeleted(resumeId);
      toast.success("Resume deleted");
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete resume"));
      return false;
    }
  };

  const refreshProfileData = async () => {
    const data = await getProfile();
    setProfileData(data);
    form.reset(getTeacherFormDefaults(data));
    const { percentage } = calculateProfileCompletion(data);
    setCompletion(percentage);
    maybeTrackProfileCompleted(percentage);
  };

  const uploadCredentialFile = async (file: File, key: "demoVideoUrl" | "lessonPlanUrl") => {
    await uploadTeacherDocument(
      key === "demoVideoUrl" ? "demoVideo" : "lessonPlan",
      file
    );
    await refreshProfileData();
    toast.success(key === "demoVideoUrl" ? "Demo video uploaded" : "Lesson plan uploaded");
  };

  const handlePhoneBlur = (value: string) => {
    const normalized = value.trim();
    if (!normalized) {
      setPhoneValidationError("");
      return;
    }
    setPhoneValidationError(INDIAN_PHONE_REGEX.test(normalized) ? "" : "Enter a valid Indian mobile number");
  };

  const handleDemoVideoSelect = async (file: File) => {
    setUploadingDemoVideo(true);
    try {
      await uploadCredentialFile(file, "demoVideoUrl");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload demo video");
    } finally {
      setUploadingDemoVideo(false);
    }
  };

  const handleLessonPlanSelect = async (file: File) => {
    setUploadingLessonPlan(true);
    try {
      await uploadCredentialFile(file, "lessonPlanUrl");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload lesson plan");
    } finally {
      setUploadingLessonPlan(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="skeleton h-8 w-1/3 rounded-xl mb-6" />
        <Panel className="space-y-4 p-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-11 rounded-xl" />
          ))}
        </Panel>
      </PageShell>
    );
  }

  // School profile form
  if (isSchool) {
    const handleSchoolChange = (key: string, value: any) => {
      setSchoolForm((prev) => ({ ...prev, [key]: value }));
    };

    const saveSchoolPatch = async (patch: Record<string, any>, successMessage: string) => {
      setSchoolSaving(true);

      try {
        const data = await updateProfile(patch);
        setProfileData(data);
        setSchoolForm((prev) => ({
          ...prev,
          name: data.name || prev.name,
          schoolName: data.schoolName || prev.schoolName,
          city: data.city || prev.city,
          board: data.board || prev.board,
          address: data.address || "",
          website: data.website || "",
          about: data.about || "",
          hasPfEsi: !!data.hasPfEsi,
          paymentTrackRecord: data.paymentTrackRecord || "",
          workingHours: data.workingHours || "",
          udiseCode: data.udiseCode || "",
        }));
        toast.success(successMessage);
      } catch (error) {
        if (error instanceof ApiRequestError) {
          toast.error(
            getApiFieldError(error, "schoolName") ||
              getApiErrorMessage(error, "Failed to save")
          );
        } else {
          toast.error(getApiErrorMessage(error, "Failed to save"));
        }
      } finally {
        setSchoolSaving(false);
      }
    };

    const handleSchoolSectionSave = async () => {
      if (!schoolForm.schoolName.trim() || !schoolForm.city || !schoolForm.board) {
        toast.error("School name, city, and board are required.");
        return;
      }
      await saveSchoolPatch(
        {
          name: schoolForm.name,
          schoolName: schoolForm.schoolName,
          city: schoolForm.city,
          board: schoolForm.board,
          address: schoolForm.address || undefined,
          website: schoolForm.website || undefined,
          about: schoolForm.about || undefined,
          hasPfEsi: schoolForm.hasPfEsi,
          paymentTrackRecord: schoolForm.paymentTrackRecord || undefined,
          workingHours: schoolForm.workingHours || undefined,
          udiseCode: schoolForm.udiseCode || undefined,
        },
        "School profile saved"
      );
    };

    const verificationStatus =
      profileData?.verificationStatus || (profileData?.verified ? "VERIFIED" : "UNVERIFIED");

    const handleSchoolLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setLogoUploading(true);
      try {
        const data = await uploadSchoolLogo(file);
        setProfileData((prev) => (prev ? { ...prev, logoUrl: data.logoUrl } : prev));
        toast.success("School logo updated");
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Failed to upload school logo"));
      } finally {
        setLogoUploading(false);
        if (schoolLogoInputRef.current) schoolLogoInputRef.current.value = "";
      }
    };

    const completenessItems = [
      { label: "Basic Information", done: !!schoolForm.schoolName && !!schoolForm.city && !!schoolForm.board },
      { label: "Academic & Operational Details", done: !!schoolForm.workingHours && !!schoolForm.udiseCode },
      { label: "Trust & Compliance", done: !!schoolForm.udiseCode },
      { label: "Upload Banner Image", done: false },
    ];
    const completenessScore = Math.round((completenessItems.filter((i) => i.done).length / completenessItems.length) * 100);

    return (
      <PageShell>
        <PageHeader
          title="Edit School Profile"
          subtitle="Update your school information, credentials, and profile details."
        />

        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          {/* Left: Main form */}
          <form
            onSubmit={(e) => { e.preventDefault(); void handleSchoolSectionSave(); }}
            className="space-y-5"
          >
            {/* Basic Information */}
            <Panel className="p-6">
              <h3 className="text-[15px] font-semibold text-[var(--eh-text)] mb-5">Basic Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="eh-label">School Name *</label>
                    <input type="text" value={schoolForm.schoolName} onChange={(e) => handleSchoolChange("schoolName", e.target.value)} className="input-base" placeholder="Green Valley School" required />
                  </div>
                  <div>
                    <label className="eh-label">Admin Name *</label>
                    <input type="text" value={schoolForm.name} onChange={(e) => handleSchoolChange("name", e.target.value)} className="input-base" placeholder="Ramesh B" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="eh-label">City *</label>
                    <select value={schoolForm.city} onChange={(e) => handleSchoolChange("city", e.target.value)} className="input-base" required>
                      <option value="">Select city</option>
                      {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="eh-label">Board *</label>
                    <select value={schoolForm.board} onChange={(e) => handleSchoolChange("board", e.target.value)} className="input-base" required>
                      <option value="">Select board</option>
                      {BOARDS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="eh-label">Address *</label>
                    <input type="text" value={schoolForm.address} onChange={(e) => handleSchoolChange("address", e.target.value)} className="input-base" placeholder="No. 15, Avinashi Road, Coimbatore" />
                  </div>
                  <div>
                    <label className="eh-label">Website</label>
                    <input type="url" value={schoolForm.website} onChange={(e) => handleSchoolChange("website", e.target.value)} className="input-base" placeholder="https://yourschool.edu.in" />
                  </div>
                </div>
                <div>
                  <label className="eh-label">About School *</label>
                  <textarea value={schoolForm.about} onChange={(e) => handleSchoolChange("about", e.target.value)} className="input-base min-h-[110px] resize-y" placeholder="Tell teachers about your school's vision, values, and culture..." maxLength={500} />
                  <p className="mt-1 text-right text-[11px] text-[var(--eh-text-4)]">{schoolForm.about.length} / 500</p>
                </div>
              </div>
            </Panel>

            {/* Academic & Operational Details */}
            <Panel className="p-6">
              <h3 className="text-[15px] font-semibold text-[var(--eh-text)] mb-5">Academic & Operational Details</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="eh-label">Working Hours *</label>
                  <input type="text" value={schoolForm.workingHours} onChange={(e) => handleSchoolChange("workingHours", e.target.value)} className="input-base" placeholder="8:00 AM – 4:00 PM" />
                </div>
                <div>
                  <label className="eh-label">Grade Levels <span className="ml-1 text-[10px] font-normal text-[var(--eh-text-4)]">(coming soon)</span></label>
                  <select disabled className="input-base opacity-50 cursor-not-allowed">
                    <option>Pre-KG to Grade 12</option>
                    <option>Grade 1 to Grade 10</option>
                    <option>Grade 6 to Grade 12</option>
                  </select>
                </div>
                <div>
                  <label className="eh-label">Medium of Instruction <span className="ml-1 text-[10px] font-normal text-[var(--eh-text-4)]">(coming soon)</span></label>
                  <select disabled className="input-base opacity-50 cursor-not-allowed">
                    <option>English</option>
                    <option>Tamil</option>
                    <option>Hindi</option>
                  </select>
                </div>
                <div>
                  <label className="eh-label">School Type <span className="ml-1 text-[10px] font-normal text-[var(--eh-text-4)]">(coming soon)</span></label>
                  <select disabled className="input-base opacity-50 cursor-not-allowed">
                    <option>Co-educational</option>
                    <option>Boys only</option>
                    <option>Girls only</option>
                  </select>
                </div>
                <div>
                  <label className="eh-label">Student Strength <span className="ml-1 text-[10px] font-normal text-[var(--eh-text-4)]">(coming soon)</span></label>
                  <input type="number" disabled className="input-base opacity-50 cursor-not-allowed" placeholder="1,250" min={0} />
                </div>
                <div>
                  <label className="eh-label">Teacher Count <span className="ml-1 text-[10px] font-normal text-[var(--eh-text-4)]">(coming soon)</span></label>
                  <input type="number" disabled className="input-base opacity-50 cursor-not-allowed" placeholder="78" min={0} />
                </div>
                <div>
                  <label className="eh-label">UDISE Code *</label>
                  <input type="text" value={schoolForm.udiseCode} onChange={(e) => handleSchoolChange("udiseCode", e.target.value)} className="input-base" placeholder="33301234567" />
                </div>
              </div>
            </Panel>

            {/* Trust & Compliance */}
            <Panel className="p-6">
              <h3 className="text-[15px] font-semibold text-[var(--eh-text)] mb-5">Trust & Compliance</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] px-4 py-3">
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--eh-text)]">PF/ESI Compliance</p>
                    <p className="text-[11px] text-emerald-600 font-medium">Compliant</p>
                  </div>
                  <input type="checkbox" checked={schoolForm.hasPfEsi} onChange={(e) => handleSchoolChange("hasPfEsi", e.target.checked)} className="h-4 w-4 rounded" />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] px-4 py-3">
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--eh-text)]">Payment Track Record</p>
                    <p className="text-[11px] text-emerald-600 font-medium">On-time Payments</p>
                  </div>
                  <input type="checkbox" checked={schoolForm.paymentTrackRecord === "ON_TIME"} onChange={(e) => handleSchoolChange("paymentTrackRecord", e.target.checked ? "ON_TIME" : "")} className="h-4 w-4 rounded" />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] px-4 py-3">
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--eh-text)]">Child Safety / POCSO</p>
                    <p className="text-[11px] text-emerald-600 font-medium">Committed</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] px-4 py-3">
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--eh-text)]">Hiring Support Available</p>
                    <p className="text-[11px] text-emerald-600 font-medium">Yes</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="eh-label">PF Number</label>
                  <input type="text" className="input-base" placeholder="PF/COIM/2024/1187" />
                </div>
                <div>
                  <label className="eh-label">Last Reviewed On</label>
                  <input type="date" className="input-base" />
                </div>
                <div>
                  <label className="eh-label">Policy Document</label>
                  <button type="button" className="flex w-full items-center gap-2 rounded-xl border border-dashed border-[var(--eh-border)] px-4 py-3 text-[13px] text-[var(--eh-text-3)] hover:bg-[var(--surface-base)]">
                    ↑ Upload Document
                  </button>
                </div>
                <div>
                  <label className="eh-label">Support Contact Email</label>
                  <input type="email" className="input-base" placeholder="careers@yourschool.in" />
                </div>
              </div>
            </Panel>

            {/* Footer actions */}
            <div className="flex items-center justify-between">
              <button type="button" className="eh-btn eh-btn-secondary">Cancel</button>
              <button type="submit" disabled={schoolSaving} className="eh-btn eh-btn-primary">
                {schoolSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Changes
              </button>
            </div>
          </form>

          {/* Right sidebar */}
          <aside className="flex flex-col gap-4 xl:sticky xl:top-24 self-start">
            {/* School Logo */}
            <Panel className="p-5">
              <label className="eh-label mb-3 block">School Logo *</label>
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-[var(--eh-border)] bg-[var(--surface-base)]">
                  {profileData?.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profileData.logoUrl} alt="School logo" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[28px] font-bold text-[var(--eh-primary-600)]">{schoolForm.schoolName?.charAt(0) || "S"}</span>
                  )}
                </div>
                <input ref={schoolLogoInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleSchoolLogoUpload} disabled={logoUploading} />
                <button type="button" onClick={() => schoolLogoInputRef.current?.click()} disabled={logoUploading} className="eh-btn eh-btn-secondary w-full justify-center">
                  {logoUploading ? <Loader2 size={13} className="animate-spin" /> : null}
                  {profileData?.logoUrl ? "Change Logo" : "Upload Logo"}
                </button>
                <p className="text-[11px] text-[var(--eh-text-4)]">Recommended: 512x512px, JPG/PNG</p>
              </div>
            </Panel>

            {/* Banner Image */}
            <Panel className="p-5">
              <label className="eh-label mb-3 block">Banner Image</label>
              {(profileData as any)?.bannerUrl ? (
                <div className="relative overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={(profileData as any).bannerUrl} alt="School banner" className="h-28 w-full object-cover rounded-xl" />
                  <button type="button" className="absolute bottom-2 right-2 eh-btn eh-btn-secondary eh-btn-sm bg-white/90">
                    Change Banner
                  </button>
                </div>
              ) : (
                <button type="button" className="flex h-28 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-[var(--eh-border)] bg-[var(--surface-base)] hover:bg-white transition-colors">
                  <p className="text-[12px] font-medium text-[var(--eh-text-3)]">Click to upload banner</p>
                  <p className="text-[11px] text-[var(--eh-text-4)]">Recommended: 1600×400px, JPG/PNG, Max 2MB</p>
                </button>
              )}
            </Panel>

            {/* Profile Completeness */}
            <Panel className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-[var(--eh-text)]">Profile Completeness</h3>
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-[28px] font-bold text-[var(--eh-primary-700)]">{completenessScore}%</span>
                <span className="text-[13px] text-[var(--eh-text-3)]">Complete</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-base)] mb-4">
                <div className="h-full rounded-full bg-[var(--eh-primary-600)] transition-all" style={{ width: `${completenessScore}%` }} />
              </div>
              <p className="text-[12px] text-[var(--eh-text-3)] mb-3">Almost there! Fill the remaining details.</p>
              <ul className="space-y-2">
                {completenessItems.map((item) => (
                  <li key={item.label} className="flex items-center gap-2 text-[12px]">
                    <span className={["flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px]", item.done ? "bg-emerald-500 text-white" : "border border-[var(--eh-border)] text-[var(--eh-text-4)]"].join(" ")}>
                      {item.done ? "✓" : "○"}
                    </span>
                    <span className={item.done ? "text-[var(--eh-text-2)]" : "text-[var(--eh-text-3)]"}>{item.label}</span>
                  </li>
                ))}
              </ul>
            </Panel>

            {/* Public Preview */}
            <Panel className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--eh-primary-50)]">
                  <Eye size={14} className="text-[var(--eh-primary-600)]" />
                </div>
                <h3 className="text-[13px] font-semibold text-[var(--eh-text)]">Public Preview</h3>
              </div>
              <p className="text-[12px] text-[var(--eh-text-3)] mb-4">This is how your school profile appears to candidates.</p>
              <div className="rounded-xl border border-[var(--eh-border)] p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--eh-primary-100)] text-[14px] font-bold text-[var(--eh-primary-700)]">
                    {profileData?.logoUrl
                      ? <img src={profileData.logoUrl} alt="" className="h-full w-full object-cover rounded-xl" />
                      : schoolForm.schoolName?.charAt(0) || "S"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-semibold text-[var(--eh-text)] truncate">{schoolForm.schoolName || "Your School"}</p>
                      {verificationStatus === "VERIFIED" && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600">
                          <span>✓</span> Verified
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="flex items-center gap-0.5 text-[11px] text-[var(--eh-text-3)]">📍 {schoolForm.city || "City"}, Tamil Nadu</span>
                      <span className="flex items-center gap-0.5 text-[11px] text-[var(--eh-text-3)]">🏛 {schoolForm.board || "Board"}</span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed text-[var(--eh-text-3)] line-clamp-3">{schoolForm.about || "School description will appear here for candidates to read..."}</p>
              </div>
              <Link
                href={`/profile/${(profileData as any)?.id || ""}`}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--eh-border)] py-2 text-[12px] font-semibold text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] transition-colors"
              >
                View Full Public Page <span className="text-[var(--eh-text-4)]">↗</span>
              </Link>
            </Panel>

            {/* Tips */}
            <Panel className="p-5">
              <h3 className="text-[13px] font-semibold text-[var(--eh-text)] mb-3">💡 Tips</h3>
              <ul className="space-y-2">
                {[
                  "Add a high-quality banner image to make your school profile stand out.",
                  "Keep your compliance documents updated for trust and transparency.",
                  "Complete all sections to increase candidate trust and engagement.",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-1.5 text-[12px] text-[var(--eh-text-3)]">
                    <span className="text-emerald-500 shrink-0 mt-0.5">✓</span> {tip}
                  </li>
                ))}
              </ul>
              <button type="button" className="mt-3 text-[12px] font-semibold text-[var(--eh-primary-600)] hover:text-[var(--eh-primary-800)]">
                View Profile Best Practices →
              </button>
            </Panel>
          </aside>
        </div>
      </PageShell>
    );
  }

  // Teacher profile
  const watchedProfile = form.watch();
  const profileSections = getTeacherProfileSections(watchedProfile, profileData);
  const completedSections = profileSections.filter((section) => section.done).length;
  const activeSectionMeta = profileSections.find((section) => section.id === activeSection) || profileSections[0];
  const teacherVerificationStatus = ((profileData as any)?.verificationStatus ||
    ((profileData as any)?.safetyBadgeGranted ? "VERIFIED" : "UNVERIFIED")) as
    | "UNVERIFIED"
    | "PENDING"
    | "VERIFIED"
    | "REJECTED";

  const submitTeacherVerificationRequest = async () => {
    setRequestingVerification(true);
    try {
      const data = await requestSchoolVerification();
      setProfileData((prev) => (prev ? { ...prev, ...(data as Record<string, unknown>) } : prev));
      toast.success("Teacher verification request submitted");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to request verification"));
    } finally {
      setRequestingVerification(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="My Profile"
        subtitle="Keep your profile current to attract the right opportunities."
      />

      <div className="mb-6 overflow-x-auto">
        <div className="inline-flex min-w-full gap-2 rounded-2xl border border-[var(--eh-border)] bg-white p-2">
          {profileSections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "rounded-xl px-4 py-2 text-[12px] font-semibold transition-colors whitespace-nowrap",
                activeSection === section.id
                  ? "bg-brand-500 text-white shadow-brand"
                  : section.done
                    ? "bg-brand-50 text-brand-700"
                    : "text-[var(--eh-text-2)] hover:bg-[var(--surface-base)]"
              )}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Header with avatar and completion */}
      {profileData && (
        <SharedProfileHeaderCard
          avatarUrl={profileData.avatarUrl}
          name={profileData.name}
          availabilityStatus={profileData.availabilityStatus || "NOT_LOOKING"}
          completion={completion}
          onAvatarChange={handleAvatarChange}
        />
      )}

      {/* Modals */}
      <ExtractedExperienceModal
        open={experienceModalOpen}
        editingEntry={editingExperience}
        onClose={() => {
          setExperienceModalOpen(false);
          setEditingExperience(null);
        }}
        onSaved={handleExperienceAdded}
      />

      <ExtractedCertificationModal
        open={certificationModalOpen}
        editingEntry={editingCertification}
        onClose={() => {
          setCertificationModalOpen(false);
          setEditingCertification(null);
        }}
        onSaved={handleCertificationAdded}
      />

      {/* Main form */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleActiveSectionSave();
        }}
        className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]"
      >
        <div className="space-y-5">
        <Panel className="bg-[var(--surface-base)] px-4 py-3 shadow-none">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Current section</p>
          <h2 className="mt-1 text-[18px] font-semibold text-[var(--eh-text)]">{activeSectionMeta.label}</h2>
          <p className="mt-1 text-[13px] text-[var(--eh-text-3)]">{activeSectionMeta.description}</p>
        </Panel>

        {activeSection === "basic-info" && (
          <TeacherBasicInfoSection
            form={form}
            saving={saving}
            onSave={handleActiveSectionSave}
            phoneValidationError={phoneValidationError}
            onPhoneBlur={handlePhoneBlur}
          />
        )}

        {activeSection === "specialisations" && (
          <TeacherSpecialisationsSection
            form={form}
            saving={saving}
            onSave={handleActiveSectionSave}
          />
        )}

        {activeSection === "experience" && (
          <TeacherExperienceSection
            experiences={profileData?.experiences}
            onAdd={openExperienceCreateModal}
            onEdit={openExperienceEditModal}
            onDelete={deleteExperience}
          />
        )}

        {activeSection === "certifications" && (
          <TeacherCertificationsSection
            certifications={profileData?.certifications}
            onAdd={openCertificationCreateModal}
            onEdit={openCertificationEditModal}
            onDelete={deleteCertification}
          />
        )}

        {activeSection === "teaching-credentials" && (
          <TeacherCredentialsSection
            form={form}
            saving={saving}
            onSave={handleActiveSectionSave}
            profileData={profileData}
            uploadingDemoVideo={uploadingDemoVideo}
            uploadingLessonPlan={uploadingLessonPlan}
            onDemoVideoSelect={handleDemoVideoSelect}
            onLessonPlanSelect={handleLessonPlanSelect}
          />
        )}

        {activeSection === "resume" && (
          <TeacherResumeSection
            resumes={profileData?.resumes}
            onUploadComplete={refreshProfileData}
            onDeleteResume={deleteResume}
          />
        )}

        </div>

        <aside className="self-start xl:sticky xl:top-24">
          <div className="space-y-4">
            {completedSections < profileSections.length && (
              <Panel className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-3)]">Profile plan</p>
                    <h2 className="mt-1 text-[15px] font-semibold text-[var(--eh-text)]">Complete the profile in order</h2>
                  </div>
                  <span className="rounded-full bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-700">
                    {completedSections}/{profileSections.length}
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {profileSections.map((section, index) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      className="flex w-full items-start gap-3 rounded-xl border border-[var(--eh-border)] px-3 py-3 text-left transition-colors hover:bg-[var(--surface-base)]"
                    >
                      <span className={cn(
                        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                        section.done ? "bg-brand-500 text-white" : "bg-[var(--surface-base)] text-[var(--eh-text-3)]"
                      )}>
                        {section.done ? "✓" : index + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold text-[var(--eh-text)]">{section.label}</span>
                        <span className="mt-0.5 block text-[12px] leading-relaxed text-[var(--eh-text-3)]">{section.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </Panel>
            )}

            {completion < 100 && (
              <Panel className="p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[15px] font-semibold text-[var(--eh-text)]">Readiness</h2>
                  <span className="text-[13px] font-semibold text-brand-600">{completion}%</span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-base)]">
                  <div className="h-full bg-brand-500 transition-all duration-500" style={{ width: `${completion}%` }} />
                </div>
                <p className="mt-3 text-[12px] leading-relaxed text-[var(--eh-text-3)]">
                  Schools respond faster when your bio, specialisations, and resume are all complete.
                </p>
              </Panel>
            )}

            <Panel className="p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-[var(--eh-text)]">Verification</h2>
                <StatusBadge tone={teacherVerificationStatus === "VERIFIED" ? "success" : teacherVerificationStatus === "PENDING" ? "neutral" : teacherVerificationStatus === "REJECTED" ? "danger" : "warning"}>
                  {teacherVerificationStatus === "VERIFIED"
                    ? "Verified"
                    : teacherVerificationStatus === "PENDING"
                      ? "Pending"
                      : teacherVerificationStatus === "REJECTED"
                        ? "Rejected"
                        : "Unverified"}
                </StatusBadge>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-[var(--eh-text-3)]">
                Verified teachers are easier for schools to trust. Submit once your demo video, lesson plan, and declarations are complete.
              </p>
              <button
                type="button"
                onClick={() => void submitTeacherVerificationRequest()}
                disabled={requestingVerification || teacherVerificationStatus === "PENDING" || teacherVerificationStatus === "VERIFIED"}
                className="mt-3 w-full rounded-xl border border-[var(--eh-border)] px-4 py-2.5 text-sm font-semibold text-[var(--eh-text-2)] transition-colors hover:bg-[var(--surface-base)] disabled:opacity-50"
              >
                {requestingVerification
                  ? "Submitting..."
                  : teacherVerificationStatus === "VERIFIED"
                    ? "Already verified"
                    : teacherVerificationStatus === "PENDING"
                      ? "Verification in review"
                      : "Request teacher verification"}
              </button>
            </Panel>

            <Panel className="p-4">
              <h2 className="text-[15px] font-semibold text-[var(--eh-text)]">Actions</h2>
              <div className="mt-3 space-y-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-brand transition-all duration-[120ms] hover:-translate-y-px hover:bg-brand-600 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save size={14} /> Save This Section
                    </>
                  )}
                </button>
                <p className="text-[12px] leading-relaxed text-[var(--eh-text-3)]">
                  Only the fields in <span className="font-semibold text-[var(--eh-text-2)]">{activeSectionMeta.label}</span> are validated and saved here.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = profileSections.findIndex((section) => section.id === activeSection);
                    if (currentIndex < profileSections.length - 1) {
                      setActiveSection(profileSections[currentIndex + 1].id);
                    }
                  }}
                  className="w-full rounded-xl border border-[var(--eh-border)] px-4 py-2.5 text-sm font-semibold text-[var(--eh-text-2)] transition-colors hover:bg-[var(--surface-base)]"
                >
                  Next section
                </button>
              </div>
            </Panel>
          </div>
        </aside>

      </form>
    </PageShell>
  );
}
