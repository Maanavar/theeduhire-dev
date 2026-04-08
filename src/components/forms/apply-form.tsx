"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, LogIn, X, FileText } from "lucide-react";
import Modal from "@/components/ui/modal";
import FileUpload from "@/components/ui/file-upload";
import { toast } from "@/components/ui/toast";

interface Resume {
  id: string;
  fileName: string;
  isGenerated: boolean;
  template?: string;
}

interface Props {
  jobId: string;
  jobTitle: string;
  schoolName: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApplyForm({ jobId, jobTitle, schoolName, open, onClose, onSuccess }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [coverLetter, setCoverLetter] = useState("");
  const [resumeId, setResumeId] = useState<string | undefined>();
  const [resumeName, setResumeName] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [existingResumes, setExistingResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [showResumeSelector, setShowResumeSelector] = useState(false);

  // Fetch existing resumes when modal opens
  useEffect(() => {
    if (open && session?.user) {
      setLoadingResumes(true);
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data.resumes) {
            setExistingResumes(data.data.resumes);
            // Auto-select the most recent resume
            if (data.data.resumes.length > 0 && !resumeId) {
              const latestResume = data.data.resumes[0];
              setResumeId(latestResume.id);
              setResumeName(latestResume.fileName);
            }
          }
        })
        .catch(() => {
          toast.error("Failed to load your resumes");
        })
        .finally(() => {
          setLoadingResumes(false);
        });
    }
  }, [open, session]);

  const handleUpload = (id: string, name: string) => {
    setResumeId(id);
    setResumeName(name);
  };

  const handleClearResume = () => {
    setResumeId(undefined);
    setResumeName(undefined);
  };

  const handleSubmit = async () => {
    if (!session?.user) {
      router.push(`/auth/signin?callbackUrl=/jobs`);
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
      onSuccess();
      onClose();
      setCoverLetter("");
      setResumeId(undefined);
      setResumeName(undefined);
    } catch {
      toast.error("Network error. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13.5px] font-body bg-white focus:outline-none focus:border-brand-500 transition-colors";
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
          {/* Position summary */}
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-[13px] font-semibold text-gray-800">{jobTitle}</p>
            <p className="text-[12px] text-gray-500 mt-0.5">{schoolName}</p>
          </div>

          {/* Applicant info */}
          <div>
            <label className={labelClass}>Applying as</label>
            <div className="px-3 py-2.5 border border-gray-100 rounded-xl bg-gray-50 text-[13.5px] text-gray-600">
              {session?.user?.name} · {session?.user?.email}
            </div>
          </div>

          {/* Cover letter */}
          <div>
            <label className={labelClass}>
              Cover letter <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              className={`${inputClass} min-h-[140px] resize-vertical`}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Introduce yourself, highlight your relevant experience, and explain why you're a great fit for this role..."
            />
            <p className="text-[11px] text-gray-400 mt-1">{coverLetter.length} characters</p>
          </div>

          {/* Resume selection */}
          <div>
            <label className={labelClass}>
              Resume <span className="text-gray-400 font-normal">(optional)</span>
            </label>

            {/* Selected Resume or Upload */}
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

                {/* Change resume option */}
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

            {/* Resume selector dropdown */}
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
                        resumeId === resume.id
                          ? "bg-blue-100 border border-blue-300"
                          : "hover:bg-white border border-transparent"
                      }`}
                    >
                      <FileText size={14} className="text-gray-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-medium text-gray-800 truncate">{resume.fileName}</p>
                        {resume.isGenerated && (
                          <p className="text-[11px] text-gray-500">Generated {resume.template}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Upload new resume */}
            <div>
              <p className="text-[12px] font-medium text-gray-500 mb-2">
                {resumeName ? "Or upload a different resume:" : "Upload a resume:"}
              </p>
              <FileUpload
                onUpload={handleUpload}
                onClear={handleClearResume}
                uploadedName={undefined}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-[14px] font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[14px] font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-60"
            >
              {submitting ? (
                <><Loader2 size={15} className="animate-spin" /> Submitting...</>
              ) : (
                <>Submit Application <ArrowRight size={15} /></>
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
