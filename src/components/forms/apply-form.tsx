"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, LogIn, X, FileText, ArrowLeft, AlertTriangle, UserRound } from "lucide-react";
import Modal from "@/components/ui/modal";
import FileUpload from "@/components/ui/file-upload";
import { toast } from "@/components/ui/toast";
import { trackEvent } from "@/lib/analytics";
import { getTeacherApplyReadiness } from "@/lib/profileCompletion";

interface Resume {
  id: string;
  fileName: string;
  isGenerated: boolean;
  template?: string;
}

interface JobScreeningQuestion {
  id: string;
  question: string;
  required: boolean;
  sortOrder: number;
}

interface Props {
  jobId: string;
  jobTitle: string;
  schoolName: string;
  screeningQuestions: JobScreeningQuestion[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ScreeningAnswer {
  questionId: string;
  question: string;
  answer: string;
}

interface ProfileSnapshot {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  qualification?: string | null;
  experience?: string | null;
  subjects?: string[] | null;
}

export default function ApplyForm({
  jobId,
  jobTitle,
  schoolName,
  screeningQuestions,
  open,
  onClose,
  onSuccess,
}: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [coverLetter, setCoverLetter] = useState("");
  const [resumeId, setResumeId] = useState<string | undefined>();
  const [resumeName, setResumeName] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [existingResumes, setExistingResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [showResumeSelector, setShowResumeSelector] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string>>({});
  const [profileSnapshot, setProfileSnapshot] = useState<ProfileSnapshot>({});
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [applyBlockers, setApplyBlockers] = useState<string[]>([]);

  const hasScreening = screeningQuestions.length > 0;
  const stepTitles = useMemo(() => ["Confirm", "Submit"], []);
  const reviewStepIndex = 1;

  useEffect(() => {
    if (!open || !session?.user) return;
    setLoadingResumes(true);
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (!data.success || !data.data) return;

        const resumes = (data.data.resumes || []) as Resume[];
        setExistingResumes(resumes);
        if (resumes.length > 0 && !resumeId) {
          const latestResume = resumes[0];
          setResumeId(latestResume.id);
          setResumeName(latestResume.fileName);
        }

        const snapshot: ProfileSnapshot = {
          name: data.data.name || session.user.name,
          email: data.data.email || session.user.email,
          phone: data.data.phone || null,
          avatarUrl: data.data.avatarUrl || null,
          qualification: data.data.qualification || null,
          experience: data.data.experience || null,
          subjects: data.data.subjects || [],
        };
        setProfileSnapshot(snapshot);

        const readiness = getTeacherApplyReadiness({
          avatarUrl: snapshot.avatarUrl,
          qualification: snapshot.qualification,
          experience: snapshot.experience,
          subjects: snapshot.subjects || [],
          resumes,
          bio: data.data.bio || null,
          city: data.data.city || null,
          preferredBoards: data.data.preferredBoards || [],
          preferredGrades: data.data.preferredGrades || [],
          experiences: data.data.experiences || [],
          certifications: data.data.certifications || [],
        });
        setProfileCompletion(readiness.completion);
        setApplyBlockers(readiness.blockers);
      })
      .catch(() => {
        toast.error("Failed to load your profile");
      })
      .finally(() => {
        setLoadingResumes(false);
      });
  }, [open, resumeId, session]);

  const handleUpload = (id: string, name: string) => {
    setResumeId(id);
    setResumeName(name);
  };

  const handleClearResume = () => {
    setResumeId(undefined);
    setResumeName(undefined);
  };

  const resetState = () => {
    setCoverLetter("");
    setResumeId(undefined);
    setResumeName(undefined);
    setScreeningAnswers({});
    setCurrentStep(0);
    setShowResumeSelector(false);
  };

  const buildScreeningPayload = (): ScreeningAnswer[] => {
    return screeningQuestions
      .map((q) => ({
        questionId: q.id,
        question: q.question,
        answer: (screeningAnswers[q.id] || "").trim(),
      }))
      .filter((item) => item.answer.length > 0);
  };

  const allRequiredScreeningAnswered = () => {
    return screeningQuestions
      .filter((q) => q.required)
      .every((q) => (screeningAnswers[q.id] || "").trim().length > 0);
  };

  const canMoveNext = () => {
    if (currentStep === 0) {
      return allRequiredScreeningAnswered();
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!session?.user) {
      router.push(`/auth/signin?callbackUrl=/jobs`);
      return;
    }

    if (applyBlockers.length > 0 || !resumeId) {
      toast.error(!resumeId ? "Upload or select a resume before applying." : applyBlockers[0]);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coverLetter: coverLetter.trim() || undefined,
          resumeId: resumeId || undefined,
          screeningAnswers: buildScreeningPayload(),
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        toast.error("You have already applied for this position.");
        onClose();
        return;
      }

      if (!data.success) {
        toast.error(data.error || "Failed to submit application. Please try again.");
        return;
      }

      toast.success("Application submitted successfully!");
      trackEvent("job_apply_submitted", {
        jobId,
        hasResume: !!resumeId,
        screeningCount: buildScreeningPayload().length,
      });
      trackEvent("job_applied", {
        jobId,
        hasResume: !!resumeId,
      });
      onSuccess();
      onClose();
      resetState();
    } catch {
      toast.error("Network error. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13.5px] font-body bg-white focus:outline-none focus:border-brand-500 transition-colors";
  const labelClass = "text-[12.5px] font-medium text-gray-500 mb-1 block";

  return (
    <Modal open={open} onClose={onClose} title="Apply for this position">
      {status === "unauthenticated" ? (
        <div className="text-center py-4">
          <p className="text-[14px] text-gray-500 mb-5">
            You need to sign in to apply for teaching positions.
          </p>
          <button
            onClick={() => router.push(`/auth/signin?callbackUrl=/jobs`)}
            className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl text-[14px] font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors"
          >
            <LogIn size={15} /> Sign in to Apply
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {stepTitles.map((title, idx) => (
                <div key={title} className="flex items-center gap-1.5">
                  <span
                    className={[
                      "h-6 w-6 rounded-full text-[11px] font-semibold inline-flex items-center justify-center",
                      idx <= currentStep ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500",
                    ].join(" ")}
                  >
                    {idx + 1}
                  </span>
                  <span className="hidden sm:inline text-[11px] font-medium text-gray-500">{title}</span>
                </div>
              ))}
            </div>
            <span className="text-[11px] text-gray-400">
              Step {currentStep + 1} of {stepTitles.length}
            </span>
          </div>

          {currentStep === 0 && (
            <>
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-[13px] font-semibold text-gray-800">{jobTitle}</p>
                <p className="text-[12px] text-gray-500 mt-0.5">{schoolName}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 overflow-hidden rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center">
                    {profileSnapshot.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profileSnapshot.avatarUrl} alt="Profile photo" className="h-full w-full object-cover" />
                    ) : (
                      <UserRound size={17} className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800">{profileSnapshot.name || session?.user?.name}</p>
                    <p className="text-[12px] text-gray-500">{profileSnapshot.email || session?.user?.email}</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 text-[12px]">
                  <div className="rounded-lg bg-gray-50 px-2.5 py-2">
                    <p className="text-gray-500">Qualification</p>
                    <p className="text-gray-700 font-medium">{profileSnapshot.qualification || "Not added yet"}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-2.5 py-2">
                    <p className="text-gray-500">Experience</p>
                    <p className="text-gray-700 font-medium">{profileSnapshot.experience || "Not added yet"}</p>
                  </div>
                </div>
              </div>

              {applyBlockers.length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <p className="text-[12px] font-medium text-amber-800 inline-flex items-center gap-1.5">
                    <AlertTriangle size={13} />
                    Your profile is {profileCompletion}% complete. Reach 80% and upload a resume before applying.
                  </p>
                  <div className="mt-2 space-y-1 text-[12px] text-amber-800">
                    {applyBlockers.map((blocker) => (
                      <p key={blocker}>{blocker}</p>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => window.open("/dashboard/profile", "_blank")}
                    className="mt-2 text-[12px] font-semibold text-amber-700 underline underline-offset-2"
                  >
                    Complete your profile first
                  </button>
                </div>
              ) : null}
              <label className={labelClass}>Resume (required)</label>
              {resumeName ? (
                <div className="mb-3">
                  <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                    <FileText size={16} className="text-blue-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-blue-700 font-medium truncate">{resumeName}</p>
                      <p className="text-[11px] text-blue-500">Selected for application</p>
                    </div>
                    <button
                      onClick={handleClearResume}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                      title="Remove resume"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  {existingResumes.length > 1 && (
                    <button
                      onClick={() => setShowResumeSelector(!showResumeSelector)}
                      className="mt-2 text-[12.5px] text-brand-500 hover:text-brand-600 font-medium transition-colors"
                    >
                      {showResumeSelector ? "Hide other resumes" : "Choose a different resume"}
                    </button>
                  )}
                </div>
              ) : null}

              {showResumeSelector && existingResumes.length > 1 && (
                <div className="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-[12px] font-medium text-gray-600 mb-2">Your resumes:</p>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto">
                    {existingResumes.map((resume) => (
                      <button
                        key={resume.id}
                        onClick={() => {
                          setResumeId(resume.id);
                          setResumeName(resume.fileName);
                          setShowResumeSelector(false);
                        }}
                        className={`w-full flex items-start gap-2 p-2.5 rounded-lg text-left transition-colors ${
                          resumeId === resume.id ? "bg-blue-100 border border-blue-300" : "hover:bg-white border border-transparent"
                        }`}
                      >
                        <FileText size={14} className="text-gray-500 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] font-medium text-gray-800 truncate">{resume.fileName}</p>
                          {resume.isGenerated && <p className="text-[11px] text-gray-500">Generated {resume.template}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[12px] font-medium text-gray-500 mb-2">
                  {resumeName ? "Or upload a different resume:" : "Upload a resume:"}
                </p>
                {loadingResumes ? (
                  <p className="text-[12px] text-gray-500">Loading resumes...</p>
                ) : (
                  <FileUpload onUpload={handleUpload} onClear={handleClearResume} uploadedName={undefined} />
                )}
              </div>

              {hasScreening ? (
                <div className="mt-4 space-y-4">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Screening Questions
                  </p>
                  {screeningQuestions.map((item) => (
                    <div key={item.id}>
                      <label className={labelClass}>
                        {item.question}
                        {item.required ? <span className="ml-1 text-red-500">*</span> : null}
                      </label>
                      <textarea
                        className={`${inputClass} min-h-[84px] resize-vertical`}
                        value={screeningAnswers[item.id] || ""}
                        onChange={(e) => setScreeningAnswers((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder={item.required ? "Required" : "Optional"}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}

          {currentStep === reviewStepIndex && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Cover letter (optional)</label>
                <textarea
                  className={`${inputClass} min-h-[120px] resize-vertical`}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Add any final note for the school hiring team"
                />
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-[12px] text-gray-600">
                <p>
                  <span className="font-semibold">Role:</span> {jobTitle}
                </p>
                <p>
                  <span className="font-semibold">School:</span> {schoolName}
                </p>
                <p>
                  <span className="font-semibold">Resume:</span> {resumeName || "Not attached"}
                </p>
                {hasScreening ? (
                  <p>
                    <span className="font-semibold">Screening answered:</span> {buildScreeningPayload().length}/{screeningQuestions.length}
                  </p>
                ) : null}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            {currentStep > 0 ? (
              <button
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft size={14} /> Back
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  resetState();
                }}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}

            {currentStep < reviewStepIndex ? (
              <button
                onClick={() => {
                  if (!canMoveNext()) {
                    toast.error("Please answer all required screening questions.");
                    return;
                  }
                  if (applyBlockers.length > 0 || !resumeId) {
                    toast.error(!resumeId ? "Upload or select a resume before continuing." : applyBlockers[0]);
                    return;
                  }
                  setCurrentStep((prev) => Math.min(reviewStepIndex, prev + 1));
                }}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors inline-flex items-center justify-center gap-2"
              >
                Continue <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || applyBlockers.length > 0 || !resumeId}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[14px] font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    Submit Application <ArrowRight size={15} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
