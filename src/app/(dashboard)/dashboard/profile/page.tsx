"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Save,
  Loader2,
} from "lucide-react";
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
import { getSchoolProfileSections, getTeacherProfileSections } from "@/components/profile/profile-sections";
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
  const [schoolActiveSection, setSchoolActiveSection] = useState("school-information");
  const schoolLogoInputRef = useRef<HTMLInputElement>(null);
  const schoolCompletion = (() => {
    const checks = [
      !!schoolForm.name?.trim(),
      !!schoolForm.schoolName?.trim(),
      !!schoolForm.city?.trim(),
      !!schoolForm.board?.trim(),
      !!schoolForm.address?.trim(),
      !!schoolForm.website?.trim(),
      !!schoolForm.about?.trim(),
      !!profileData?.logoUrl,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  })();

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
  };

  const handleExperienceDeleted = (id: string) => {
    setProfileData((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        experiences: prev.experiences?.filter((e) => e.id !== id) || [],
      };
      setCompletion(calculateProfileCompletion(next).percentage);
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
  };

  const handleCertificationDeleted = (id: string) => {
    setProfileData((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        certifications: prev.certifications?.filter((c) => c.id !== id) || [],
      };
      setCompletion(calculateProfileCompletion(next).percentage);
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

    const schoolSections = getSchoolProfileSections(schoolForm);
    const activeSchoolSectionMeta = schoolSections.find((section) => section.id === schoolActiveSection) || schoolSections[0];

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
      if (schoolActiveSection === "school-information") {
        if (!schoolForm.schoolName.trim() || !schoolForm.city || !schoolForm.board) {
          toast.error("School name, city, and board are required in this section.");
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
          },
          "School Information saved"
        );
        return;
      }

      await saveSchoolPatch(
        {
          hasPfEsi: schoolForm.hasPfEsi,
          paymentTrackRecord: schoolForm.paymentTrackRecord || undefined,
          workingHours: schoolForm.workingHours || undefined,
          udiseCode: schoolForm.udiseCode || undefined,
        },
        "Trust & Compliance saved"
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

    const submitVerificationRequest = async () => {
      setRequestingVerification(true);
      try {
        const data = await requestSchoolVerification();
        setProfileData((prev) => (
          prev
            ? {
                ...prev,
                verificationStatus: data.verificationStatus,
                verified: data.verified,
              }
            : prev
        ));
        toast.success("Verification request submitted");
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Failed to request verification"));
      } finally {
        setRequestingVerification(false);
      }
    };

    return (
      <PageShell>
        <PageHeader
          title="School Profile"
          subtitle="Update your school's information for job listings."
        />

        <Panel className="mb-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 font-display">{schoolForm.schoolName || "School profile"}</h2>
              <p className="mt-1 text-xs text-gray-500">
                {verificationStatus === "VERIFIED"
                  ? "Verified school profile"
                  : verificationStatus === "PENDING"
                    ? "Verification under review"
                    : "Unverified school profile"}
              </p>
            </div>
            <StatusBadge tone={verificationStatus === "VERIFIED" ? "success" : verificationStatus === "PENDING" ? "neutral" : "warning"}>
              {verificationStatus === "VERIFIED" ? "Verified" : verificationStatus === "PENDING" ? "Pending" : "Unverified"}
            </StatusBadge>
          </div>
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Profile completion</span>
              <span className="text-xs font-bold text-brand-600">{schoolCompletion}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full bg-brand-500 transition-all duration-500" style={{ width: `${schoolCompletion}%` }} />
            </div>
          </div>
        </Panel>

        <Panel className="mb-5 p-5">
          {verificationStatus === "VERIFIED" ? (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-700 text-sm font-medium">
              Verified School ✓ Your profile has passed verification.
            </div>
          ) : verificationStatus === "PENDING" ? (
            <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-700 text-sm font-medium">
              Verification under review (2-3 business days).
            </div>
          ) : (
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-800">
                Complete your profile to apply for verification.
              </p>
              <button
                type="button"
                onClick={submitVerificationRequest}
                disabled={requestingVerification}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {requestingVerification ? <Loader2 size={12} className="animate-spin" /> : null}
                Submit for review
              </button>
            </div>
          )}
        </Panel>

        <div className="mb-6 overflow-x-auto">
          <div className="inline-flex min-w-full gap-2 rounded-2xl border border-[var(--eh-border)] bg-white p-2">
            {schoolSections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setSchoolActiveSection(section.id)}
                className={cn(
                  "rounded-xl px-4 py-2 text-[12px] font-semibold transition-colors whitespace-nowrap",
                  schoolActiveSection === section.id
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

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSchoolSectionSave();
          }}
          className="space-y-5"
        >
          <div className="rounded-2xl border border-[var(--eh-border)] bg-[var(--surface-base)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Current section</p>
            <h2 className="mt-1 text-[18px] font-semibold text-[var(--eh-text)]">{activeSchoolSectionMeta.label}</h2>
            <p className="mt-1 text-[13px] text-[var(--eh-text-3)]">{activeSchoolSectionMeta.description}</p>
          </div>

          {/* Basic Info */}
          {schoolActiveSection === "school-information" && (
          <div className="card p-6">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-black/[0.05]">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.07em]">
                School Information
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">School Logo</label>
                <input
                  ref={schoolLogoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleSchoolLogoUpload}
                  disabled={logoUploading}
                />
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-400">
                    {profileData?.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profileData.logoUrl} alt="School logo" className="h-full w-full object-cover" />
                    ) : (
                      "No logo"
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => schoolLogoInputRef.current?.click()}
                    disabled={logoUploading}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    {logoUploading ? <Loader2 size={12} className="animate-spin" /> : null}
                    {profileData?.logoUrl ? "Replace logo" : "Upload logo"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={schoolForm.name}
                  onChange={(e) => handleSchoolChange("name", e.target.value)}
                  className="input-base"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  School Name *
                </label>
                <input
                  type="text"
                  value={schoolForm.schoolName}
                  onChange={(e) => handleSchoolChange("schoolName", e.target.value)}
                  className="input-base"
                  placeholder="Your school name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    City *
                  </label>
                  <select
                    value={schoolForm.city}
                    onChange={(e) => handleSchoolChange("city", e.target.value)}
                    className="input-base appearance-none"
                    required
                  >
                    <option value="">Select city</option>
                    {LOCATIONS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Board *
                  </label>
                  <select
                    value={schoolForm.board}
                    onChange={(e) => handleSchoolChange("board", e.target.value)}
                    className="input-base appearance-none"
                    required
                  >
                    <option value="">Select board</option>
                    {BOARDS.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={schoolForm.address}
                  onChange={(e) => handleSchoolChange("address", e.target.value)}
                  className="input-base"
                  placeholder="School address"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={schoolForm.website}
                  onChange={(e) => handleSchoolChange("website", e.target.value)}
                  className="input-base"
                  placeholder="https://yourschool.edu.in"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  About Your School
                </label>
                <textarea
                  value={schoolForm.about}
                  onChange={(e) => handleSchoolChange("about", e.target.value)}
                  className="input-base min-h-[100px] resize-vertical"
                  placeholder="Tell teachers about your school, its vision, and why they should join..."
                  maxLength={2000}
                />
                <p className="text-xs text-gray-400 mt-1">{schoolForm.about.length}/2000</p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => void handleSchoolSectionSave()}
                  disabled={schoolSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-brand transition-colors hover:bg-brand-600 disabled:opacity-60"
                >
                  {schoolSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save School Information
                </button>
              </div>
            </div>
          </div>
          )}

          {schoolActiveSection === "trust-compliance" && (
          <div className="card p-6">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-black/[0.05]">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.07em]">
                Trust & Compliance
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">UDISE Code</label>
                <input
                  type="text"
                  value={schoolForm.udiseCode}
                  onChange={(e) => handleSchoolChange("udiseCode", e.target.value)}
                  className="input-base"
                  placeholder="Enter your UDISE code"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Payment track record</label>
                <select
                  value={schoolForm.paymentTrackRecord}
                  onChange={(e) => handleSchoolChange("paymentTrackRecord", e.target.value)}
                  className="input-base appearance-none"
                >
                  <option value="">Select payment history</option>
                  <option value="ON_TIME">Pays on time</option>
                  <option value="DELAYED">Sometimes delayed</option>
                  <option value="MIXED">Mixed record</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Working hours</label>
                <input
                  type="text"
                  value={schoolForm.workingHours}
                  onChange={(e) => handleSchoolChange("workingHours", e.target.value)}
                  className="input-base"
                  placeholder="e.g. 8am-4pm, Mon-Sat"
                />
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={schoolForm.hasPfEsi}
                  onChange={(e) => handleSchoolChange("hasPfEsi", e.target.checked)}
                  className="rounded"
                  id="school-has-pf-esi"
                />
                <label htmlFor="school-has-pf-esi" className="text-sm font-medium text-gray-700">
                  PF/ESI provided
                </label>
              </div>

              <div className="sm:col-span-2 flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => void handleSchoolSectionSave()}
                  disabled={schoolSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-brand transition-colors hover:bg-brand-600 disabled:opacity-60"
                >
                  {schoolSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Trust & Compliance
                </button>
              </div>
            </div>
          </div>
          )}
        </form>
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

            <Panel className="p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-[var(--eh-text)]">Readiness</h2>
                <span className="text-[13px] font-semibold text-brand-600">{completion}%</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-base)]">
                <div className="h-full bg-brand-500 transition-all duration-500" style={{ width: `${completion}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] text-[var(--eh-text-3)]">
                <div className="rounded-lg bg-[var(--surface-base)] px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--eh-text-4)]">Experience</p>
                  <p className="mt-1 font-medium text-[var(--eh-text-2)]">{profileData?.experiences?.length || 0} entries</p>
                </div>
                <div className="rounded-lg bg-[var(--surface-base)] px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--eh-text-4)]">Resume</p>
                  <p className="mt-1 font-medium text-[var(--eh-text-2)]">{profileData?.resumes?.length ? "Uploaded" : "Missing"}</p>
                </div>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-[var(--eh-text-3)]">
                Schools respond faster when your bio, specialisations, and resume are all complete.
              </p>
            </Panel>

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
