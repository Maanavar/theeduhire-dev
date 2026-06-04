"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, ExternalLink, Loader2, Shield, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageShell, Panel } from "@/components/layout/page-shell";
import { getApiErrorMessage } from "@/lib/api/client";
import { getSchoolProfile } from "@/lib/api/school-client";
import { requestSchoolVerification } from "@/lib/api/profile-client";

type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED";

type SchoolData = {
  schoolName?: string | null;
  city?: string | null;
  board?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  udiseCode?: string | null;
  hasPfEsi?: boolean | null;
  verificationStatus?: VerificationStatus;
  verified?: boolean;
};

const STEPS = [
  { label: "School Details", description: "Completed" },
  { label: "Contact Verification", description: "Completed" },
  { label: "Document Upload", description: "Completed" },
  { label: "Review in Progress", description: "Current Step" },
  { label: "Approved", description: "Pending" },
];

const DOCUMENTS = [
  { key: "registration", label: "Registration Certificate", status: "Uploaded" as const },
  { key: "principal_id", label: "Principal ID Proof", status: "Uploaded" as const },
  { key: "school_photo", label: "School Photo", status: "Uploaded" as const },
  { key: "address_proof", label: "Address Proof", status: "Needs Re-upload" as const },
  { key: "udise_proof", label: "UDISE Proof", status: "Uploaded" as const },
];

export default function SchoolVerificationPage() {
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    getSchoolProfile()
      .then((data) => setSchool(data as SchoolData))
      .catch(() => toast.error("Failed to load school profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmitVerification = async () => {
    setRequesting(true);
    try {
      const data = await requestSchoolVerification();
      setSchool((prev) => prev ? { ...prev, verificationStatus: data.verificationStatus as VerificationStatus, verified: data.verified } : prev);
      toast.success("Verification request submitted");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to submit verification request"));
    } finally {
      setRequesting(false);
    }
  };

  const verificationStatus: VerificationStatus = school?.verificationStatus || (school?.verified ? "VERIFIED" : "UNVERIFIED");

  const checklist = [
    { label: "School Logo Uploaded", value: school?.logoUrl ? "Uploaded" : "Missing", done: !!school?.logoUrl },
    { label: "UDISE Code Entered", value: school?.udiseCode || "Missing", done: !!school?.udiseCode },
    { label: "Website Added", value: school?.website || "Missing", done: !!school?.website },
    { label: "Trust / Safety Declarations", value: school?.hasPfEsi ? "Accepted" : "Pending", done: !!school?.hasPfEsi },
    { label: "School Address Confirmed", value: school?.city ? `${school.city}, Tamil Nadu` : "Missing", done: !!school?.city },
    { label: "Verification Documents", value: "1 document needs re-upload", done: false, warn: true },
    { label: "Board / Affiliation Selected", value: school?.board || "Missing", done: !!school?.board },
  ];

  const completedChecklist = checklist.filter((c) => c.done).length;
  const currentStepIndex = verificationStatus === "VERIFIED" ? 4 : verificationStatus === "PENDING" ? 3 : 2;

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[var(--eh-text-4)]" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="School Verification"
        subtitle="Complete verification to build trust and unlock live job posting access."
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        {/* Main content */}
        <div className="space-y-4">
          {/* Verification status banner */}
          <Panel className={`p-5 border-l-4 ${verificationStatus === "VERIFIED" ? "border-l-emerald-500 bg-emerald-50" : verificationStatus === "PENDING" ? "border-l-amber-400 bg-amber-50" : "border-l-slate-300 bg-slate-50"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${verificationStatus === "VERIFIED" ? "bg-emerald-100" : verificationStatus === "PENDING" ? "bg-amber-100" : "bg-slate-100"}`}>
                  {verificationStatus === "VERIFIED"
                    ? <CheckCircle2 size={22} className="text-emerald-600" />
                    : verificationStatus === "PENDING"
                      ? <Clock size={22} className="text-amber-600" />
                      : <Shield size={22} className="text-slate-500" />
                  }
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Verification Status</p>
                  <p className={`text-[18px] font-bold mt-0.5 ${verificationStatus === "VERIFIED" ? "text-emerald-700" : verificationStatus === "PENDING" ? "text-amber-700" : "text-slate-600"}`}>
                    {verificationStatus === "VERIFIED" ? "Verified School" : verificationStatus === "PENDING" ? "Pending Review" : "Not Verified"}
                  </p>
                  <p className="text-[12px] text-[var(--eh-text-3)] mt-0.5">
                    {verificationStatus === "PENDING"
                      ? "Your documents and details are under review. We'll notify you once the review is complete."
                      : verificationStatus === "VERIFIED"
                        ? "Your school is verified. Jobs are now visible to candidates with a trust badge."
                        : "Complete your profile and submit documents to request verification."}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                {verificationStatus === "PENDING" && (
                  <>
                    <p className="text-[11px] text-[var(--eh-text-4)]">Submitted On</p>
                    <p className="text-[12px] font-semibold text-[var(--eh-text-2)]">Today, 10:24 AM</p>
                    <p className="mt-2 text-[11px] text-[var(--eh-text-4)]">Estimated Review Time</p>
                    <p className="text-[12px] font-semibold text-[var(--eh-text-2)]">1–2 Business Days</p>
                  </>
                )}
              </div>
            </div>
          </Panel>

          {/* Progress steps */}
          <Panel className="p-5">
            <div className="flex items-center">
              {STEPS.map((step, i) => (
                <div key={step.label} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div className={[
                      "flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold border-2 transition-all",
                      i < currentStepIndex ? "bg-[var(--eh-primary-600)] border-[var(--eh-primary-600)] text-white" :
                      i === currentStepIndex ? "bg-white border-[var(--eh-primary-600)] text-[var(--eh-primary-600)]" :
                      "bg-white border-[var(--eh-border)] text-[var(--eh-text-4)]",
                    ].join(" ")}>
                      {i < currentStepIndex ? "✓" : i + 1}
                    </div>
                    <p className="mt-1.5 text-center text-[11px] font-semibold text-[var(--eh-text-2)] max-w-[80px]">{step.label}</p>
                    <p className={`text-[10px] text-center mt-0.5 ${i === currentStepIndex ? "text-[var(--eh-primary-600)] font-semibold" : "text-[var(--eh-text-4)]"}`}>
                      {i < currentStepIndex ? "Completed" : i === currentStepIndex ? "Current Step" : "Pending"}
                    </p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${i < currentStepIndex ? "bg-[var(--eh-primary-600)]" : "bg-[var(--eh-border)]"}`} />
                  )}
                </div>
              ))}
            </div>
          </Panel>

          {/* Verification checklist */}
          <Panel className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-[var(--eh-text)]">Verification Checklist</h3>
              <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${completedChecklist === checklist.length ? "bg-emerald-100 text-emerald-700" : "bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]"}`}>
                {completedChecklist}/{checklist.length} Completed
              </span>
            </div>
            <p className="text-[12px] text-[var(--eh-text-3)] mb-4">Ensure all items are completed for a smooth verification process.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {checklist.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${item.done ? "bg-emerald-500 text-white" : item.warn ? "bg-amber-400 text-white" : "bg-[var(--surface-base)] border border-[var(--eh-border)] text-[var(--eh-text-4)]"}`}>
                      {item.done ? "✓" : item.warn ? "!" : "○"}
                    </div>
                    <span className="text-[12px] font-medium text-[var(--eh-text-2)]">{item.label}</span>
                  </div>
                  <span className={`text-[11px] font-semibold ${item.done ? "text-emerald-600" : item.warn ? "text-amber-600" : "text-[var(--eh-text-4)]"}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Documents */}
          <Panel className="p-5">
            <h3 className="text-[14px] font-semibold text-[var(--eh-text)] mb-1">Documents</h3>
            <p className="text-[12px] text-[var(--eh-text-3)] mb-4">Upload clear, valid documents for verification.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {DOCUMENTS.map((doc) => (
                <div key={doc.key} className={`flex flex-col items-center rounded-xl border p-4 text-center ${doc.status === "Needs Re-upload" ? "border-red-200 bg-red-50" : "border-[var(--eh-border)] bg-[var(--surface-base)]"}`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl mb-2 ${doc.status === "Needs Re-upload" ? "bg-red-100" : "bg-emerald-100"}`}>
                    {doc.status === "Needs Re-upload"
                      ? <span className="text-lg">📄</span>
                      : <CheckCircle2 size={18} className="text-emerald-600" />
                    }
                  </div>
                  <p className="text-[11px] font-semibold text-[var(--eh-text-2)] mb-1">{doc.label}</p>
                  <p className={`text-[10px] font-bold mb-2 ${doc.status === "Needs Re-upload" ? "text-red-600" : "text-emerald-600"}`}>{doc.status}</p>
                  {doc.status === "Needs Re-upload" ? (
                    <button className="rounded-lg bg-red-500 px-2 py-1 text-[10px] font-semibold text-white hover:bg-red-600">Re-upload</button>
                  ) : (
                    <button className="rounded-lg border border-[var(--eh-border)] px-2 py-1 text-[10px] font-semibold text-[var(--eh-text-2)] hover:bg-white">View</button>
                  )}
                </div>
              ))}
            </div>
          </Panel>

          {/* Verification notes */}
          {verificationStatus === "PENDING" && (
            <Panel className="p-5">
              <h3 className="text-[13px] font-semibold text-[var(--eh-text)] mb-3">Verification Notes (From Review Team)</h3>
              <p className="text-[12px] text-[var(--eh-text-3)] mb-3">We&apos;re reviewing your submitted documents.</p>
              <div className="flex items-start gap-3 rounded-xl bg-[var(--surface-base)] px-4 py-3">
                <Clock size={16} className="shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-[13px] text-[var(--eh-text-2)]">Please re-upload a clearer Address Proof document. The uploaded file is not fully readable.</p>
                  <p className="mt-1 text-[11px] text-[var(--eh-text-4)]">— Review Team · Today, 11:30 AM</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSubmitVerification}
                disabled={requesting}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--eh-primary-600)] py-3 text-[14px] font-semibold text-white hover:bg-[var(--eh-primary-700)] disabled:opacity-60"
              >
                {requesting ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                Resubmit Documents
              </button>
              <p className="mt-2 text-center text-[12px] text-[var(--eh-text-3)]">Please re-upload the required documents and resubmit for review.</p>
            </Panel>
          )}

          {verificationStatus === "UNVERIFIED" && (
            <button
              type="button"
              onClick={handleSubmitVerification}
              disabled={requesting || completedChecklist < checklist.length - 1}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--eh-primary-600)] py-3 text-[14px] font-semibold text-white hover:bg-[var(--eh-primary-700)] disabled:opacity-50"
            >
              {requesting ? <Loader2 size={15} className="animate-spin" /> : <Shield size={15} />}
              Submit for Verification
            </button>
          )}
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-4">
          {/* Why Get Verified */}
          <Panel className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--eh-primary-50)]">
                <Shield size={18} className="text-[var(--eh-primary-600)]" />
              </div>
              <h3 className="text-[13px] font-semibold text-[var(--eh-text)]">Why Get Verified?</h3>
            </div>
            <ul className="space-y-2">
              {[
                "Unlock live job posting and reach qualified candidates",
                "Build trust with applicants and parents",
                "Show a verified badge on your public profile",
                "Get priority support from EduHire",
              ].map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-[12px] text-[var(--eh-text-3)]">
                  <CheckCircle2 size={13} className="shrink-0 mt-0.5 text-emerald-500" /> {benefit}
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl bg-[var(--eh-primary-50)] px-3 py-2">
              <p className="text-[12px] text-[var(--eh-primary-700)]">Verification ensures a safe and trusted platform for schools and candidates.</p>
            </div>
          </Panel>

          {/* Need help */}
          <Panel className="p-5">
            <h3 className="text-[13px] font-semibold text-[var(--eh-text)] mb-3">Need Help?</h3>
            <div className="space-y-2">
              {[
                { label: "Verification Process Guide", sub: "Step-by-step instructions" },
                { label: "Document Requirements", sub: "See accepted formats" },
                { label: "Contact Support", sub: "We're here to help you" },
              ].map((item) => (
                <button key={item.label} className="flex w-full items-center justify-between rounded-lg border border-[var(--eh-border)] px-3 py-2.5 text-left hover:bg-[var(--surface-base)] transition-colors">
                  <div>
                    <p className="text-[12px] font-semibold text-[var(--eh-text-2)]">{item.label}</p>
                    <p className="text-[11px] text-[var(--eh-text-3)]">{item.sub}</p>
                  </div>
                  <span className="text-[var(--eh-text-4)]">›</span>
                </button>
              ))}
            </div>
            <button className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-[var(--eh-border)] py-2 text-[12px] font-semibold text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] transition-colors">
              Visit Help Center <ExternalLink size={11} />
            </button>
          </Panel>

          {/* Current plan usage */}
          <Panel className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[12px] font-semibold text-[var(--eh-text)]">Your Current Plan</h3>
              <span className="rounded-md border border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] px-2 py-0.5 text-[11px] font-bold text-[var(--eh-primary-700)]">Growth Plan</span>
            </div>
            <p className="text-[13px] font-bold text-[var(--eh-text)]">7 / 10</p>
            <p className="text-[11px] text-[var(--eh-text-3)] mb-2">Active job posts used</p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-base)]">
              <div className="h-full rounded-full bg-[var(--eh-primary-600)]" style={{ width: "70%" }} />
            </div>
            <p className="mt-1 text-[11px] text-[var(--eh-text-4)]">Renews 25 May, 2025</p>
            <Link href="/dashboard/billing" className="mt-3 block text-center text-[12px] font-semibold text-[var(--eh-primary-600)] hover:text-[var(--eh-primary-800)]">View Plan</Link>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
