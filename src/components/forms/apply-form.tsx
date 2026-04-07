"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, LogIn } from "lucide-react";
import Modal from "@/components/ui/modal";
import FileUpload from "@/components/ui/file-upload";
import { toast } from "@/components/ui/toast";

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

          {/* Resume upload */}
          <div>
            <label className={labelClass}>
              Resume <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <FileUpload
              onUpload={handleUpload}
              onClear={handleClearResume}
              uploadedName={resumeName}
            />
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
