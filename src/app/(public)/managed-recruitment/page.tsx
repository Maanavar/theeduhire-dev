"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Clock, ShieldCheck, Users } from "lucide-react";

export default function ManagedRecruitmentPage() {
  const [form, setForm] = useState({
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    schoolName: "",
    jobTitle: "",
    jobDescription: "",
    requirementsText: "",
    salaryBudgetMin: "",
    salaryBudgetMax: "",
    targetJoinDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.contactName.trim() || form.contactName.length < 2) e.contactName = "Enter your name";
    if (!form.contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) e.contactEmail = "Enter a valid email";
    if (!form.contactPhone.trim() || form.contactPhone.length < 7) e.contactPhone = "Enter a valid phone number";
    if (!form.schoolName.trim() || form.schoolName.length < 2) e.schoolName = "Enter your school name";
    if (!form.jobTitle.trim() || form.jobTitle.length < 2) e.jobTitle = "Enter the role title";
    if (!form.jobDescription.trim() || form.jobDescription.length < 30)
      e.jobDescription = "Please describe the role in at least 30 characters";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    setServerError("");
    try {
      const res = await fetch("/api/managed-recruitment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          salaryBudgetMin: form.salaryBudgetMin ? Number(form.salaryBudgetMin) : null,
          salaryBudgetMax: form.salaryBudgetMax ? Number(form.salaryBudgetMax) : null,
          targetJoinDate: form.targetJoinDate || null,
          requirementsText: form.requirementsText || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setServerError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-[60vh] bg-[var(--surface-base)] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-[560px] text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-brand-50)]">
            <CheckCircle2 size={32} className="text-[var(--color-brand-600)]" />
          </div>
          <h1 className="font-display text-[1.9rem] font-semibold tracking-[-0.03em] text-[var(--eh-text)]">
            Request received
          </h1>
          <p className="mt-4 text-[15px] leading-[1.8] text-[var(--eh-text-2)]">
            Thank you. Our team will review your requirement and reach out within 1 business day to discuss the hiring process.
          </p>
          <div className="mt-8 rounded-[24px] border border-[var(--eh-border)] bg-white p-6 text-left">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-600)]">What happens next</p>
            <div className="mt-4 space-y-3">
              {[
                "Our team reviews your JD and salary range",
                "We source and screen qualified teachers from our verified pool",
                "You receive 3–5 shortlisted candidates within 5 business days",
                "You interview and select — we confirm the hire",
                "₹10,000 invoice raised only on confirmed joining",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-600)] text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="text-[14px] leading-[1.65] text-[var(--eh-text-2)]">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface-base)] px-5 py-16 md:px-8 md:py-20">
      <div className="mx-auto max-w-[1100px]">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-start">
          {/* Left — explanation */}
          <div className="lg:sticky lg:top-24">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-600)]">
              Managed recruitment
            </p>
            <h1 className="mt-3 font-display text-[clamp(1.8rem,3vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.04em] text-[var(--eh-text)]">
              We find the teacher. You confirm the hire.
            </h1>
            <p className="mt-4 text-[15px] leading-[1.8] text-[var(--eh-text-2)]">
              Submit your requirement. Our team handles sourcing, screening, and shortlisting from EduHire's verified teacher pool. You only pay ₹10,000 on a confirmed hire — no upfront cost.
            </p>

            <div className="mt-8 space-y-4">
              {[
                {
                  icon: Users,
                  title: "Screened candidates only",
                  body: "We shortlist 3–5 teachers who match your qualification, board, subject, and salary requirements. No resume spam.",
                },
                {
                  icon: Clock,
                  title: "Shortlist in 5 business days",
                  body: "We turn around a candidate shortlist within 5 working days of receiving your requirement.",
                },
                {
                  icon: ShieldCheck,
                  title: "Pay only on confirmed hire",
                  body: "₹10,000 per teacher who actually joins. Zero cost if no one is hired. No placement retainer.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 rounded-[20px] border border-[var(--eh-border)] bg-white p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-50)] text-[var(--color-brand-600)]">
                    <item.icon size={18} />
                  </div>
                  <div>
                    <p className="text-[14.5px] font-semibold text-[var(--eh-text)]">{item.title}</p>
                    <p className="mt-1 text-[13.5px] leading-[1.7] text-[var(--eh-text-2)]">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[20px] bg-[#0a1929] px-5 py-4 text-white">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#93c5fd]">Pricing</p>
              <p className="mt-2 text-[28px] font-semibold tracking-[-0.04em]">
                ₹10,000 <span className="text-[16px] font-normal text-white/55">per confirmed hire</span>
              </p>
              <p className="mt-1 text-[13px] text-white/55">No retainer. No upfront fee. Billed only on joining.</p>
            </div>
          </div>

          {/* Right — form */}
          <div className="rounded-[32px] border border-[var(--eh-border)] bg-white p-7 md:p-9">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-600)]">Submit your requirement</p>
            <h2 className="mt-2 font-display text-[1.4rem] font-semibold tracking-[-0.03em] text-[var(--eh-text)]">
              Tell us about the role
            </h2>

            {serverError && (
              <div className="mt-4 rounded-xl border border-[var(--eh-danger-border)] bg-[var(--eh-danger-bg)] px-4 py-3 text-[13.5px] text-[var(--eh-danger)]">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name" error={errors.contactName}>
                  <input
                    name="contactName"
                    value={form.contactName}
                    onChange={handleChange}
                    placeholder="Priya Rajan"
                    className={inputCls(errors.contactName)}
                  />
                </Field>
                <Field label="School name" error={errors.schoolName}>
                  <input
                    name="schoolName"
                    value={form.schoolName}
                    onChange={handleChange}
                    placeholder="Sri Lakshmi CBSE School"
                    className={inputCls(errors.schoolName)}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email address" error={errors.contactEmail}>
                  <input
                    type="email"
                    name="contactEmail"
                    value={form.contactEmail}
                    onChange={handleChange}
                    placeholder="principal@school.in"
                    className={inputCls(errors.contactEmail)}
                  />
                </Field>
                <Field label="Phone / WhatsApp" error={errors.contactPhone}>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={form.contactPhone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className={inputCls(errors.contactPhone)}
                  />
                </Field>
              </div>

              <Field label="Role you are hiring for" error={errors.jobTitle}>
                <input
                  name="jobTitle"
                  value={form.jobTitle}
                  onChange={handleChange}
                  placeholder="CBSE Maths Teacher, Grades 9–12"
                  className={inputCls(errors.jobTitle)}
                />
              </Field>

              <Field label="Job description & requirements" error={errors.jobDescription}>
                <textarea
                  name="jobDescription"
                  value={form.jobDescription}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Describe the role: subject, board, grade level, experience required, teaching medium, joining date expectations, and anything else relevant..."
                  className={inputCls(errors.jobDescription) + " resize-none"}
                />
              </Field>

              <Field label="Preferred qualifications (optional)" error={errors.requirementsText}>
                <textarea
                  name="requirementsText"
                  value={form.requirementsText}
                  onChange={handleChange}
                  rows={3}
                  placeholder="e.g. B.Sc Maths + B.Ed, TNTET Paper II preferred, 2+ years CBSE experience..."
                  className={inputCls(errors.requirementsText) + " resize-none"}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Min salary (₹/mo)" error={errors.salaryBudgetMin}>
                  <input
                    type="number"
                    name="salaryBudgetMin"
                    value={form.salaryBudgetMin}
                    onChange={handleChange}
                    placeholder="20000"
                    className={inputCls(errors.salaryBudgetMin)}
                  />
                </Field>
                <Field label="Max salary (₹/mo)" error={errors.salaryBudgetMax}>
                  <input
                    type="number"
                    name="salaryBudgetMax"
                    value={form.salaryBudgetMax}
                    onChange={handleChange}
                    placeholder="35000"
                    className={inputCls(errors.salaryBudgetMax)}
                  />
                </Field>
                <Field label="Target join date" error={errors.targetJoinDate}>
                  <input
                    type="date"
                    name="targetJoinDate"
                    value={form.targetJoinDate}
                    onChange={handleChange}
                    className={inputCls(errors.targetJoinDate)}
                  />
                </Field>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="eh-btn eh-btn-primary w-full justify-center shadow-[0_6px_18px_rgba(10,102,194,0.22)] disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit requirement"}
                {!submitting && <ArrowRight size={14} />}
              </button>

              <p className="text-center text-[12px] text-[var(--eh-text-4)]">
                Our team responds within 1 business day · No upfront fee
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-[var(--eh-text-2)]">{label}</label>
      {children}
      {error && <p className="mt-1 text-[12px] text-[var(--eh-danger)]">{error}</p>}
    </div>
  );
}

function inputCls(error?: string) {
  return [
    "w-full rounded-xl border px-3.5 py-2.5 text-[14px] text-[var(--eh-text)] outline-none transition-colors",
    "placeholder:text-[var(--eh-text-4)]",
    error
      ? "border-[var(--eh-danger)] bg-[var(--eh-danger-bg)] focus:border-[var(--eh-danger)]"
      : "border-[var(--eh-border)] bg-white focus:border-[var(--color-brand-400)]",
  ].join(" ");
}
