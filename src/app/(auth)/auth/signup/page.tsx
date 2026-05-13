"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BOARDS, SUBJECTS } from "@/config/constants";
import { useLang } from "@/lib/i18n/context";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Shield,
} from "lucide-react";

type Role = "TEACHER" | "SCHOOL_ADMIN";
type SignupStep = "role" | "details";

function queryToRole(value: string | null): Role | null {
  if (value === "teacher") return "TEACHER";
  if (value === "school") return "SCHOOL_ADMIN";
  return null;
}

function roleToQuery(value: Role): string {
  return value === "TEACHER" ? "teacher" : "school";
}

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLang();

  const role = useMemo(() => queryToRole(searchParams.get("role")), [searchParams]);
  const step: SignupStep = searchParams.get("step") === "details" && role ? "details" : "role";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [schoolName, setSchoolName] = useState("");
  const [schoolCity, setSchoolCity] = useState("");
  const [schoolBoard, setSchoolBoard] = useState<(typeof BOARDS)[number]["value"]>("CBSE");

  const [experience, setExperience] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [location, setLocation] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [consent, setConsent] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const passwordScore = [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;

  const goToDetails = (selectedRole: Role) => {
    const next = `/auth/signup?role=${roleToQuery(selectedRole)}&step=details`;
    router.replace(next);
  };

  const toggleSubject = (value: string) => {
    setSubjects((current) =>
      current.includes(value) ? current.filter((subject) => subject !== value) : [...current, value].slice(0, 8)
    );
  };

  const validate = (selectedRole: Role) => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Full name is required";
    if (!email.trim()) nextErrors.email = "Email is required";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = "Enter a valid email address";
    if (!password) nextErrors.password = "Password is required";
    if (password && password.length < 8) nextErrors.password = "Password must be at least 8 characters";
    if (!consent) nextErrors.consent = "Please accept terms to continue";

    if (selectedRole === "TEACHER" && subjects.length === 0) {
      nextErrors.subjects = "Add at least one subject";
    }
    if (selectedRole === "SCHOOL_ADMIN" && !schoolName.trim()) {
      nextErrors.schoolName = "School name is required";
    }
    if (selectedRole === "SCHOOL_ADMIN" && !schoolCity.trim()) {
      nextErrors.schoolCity = "City is required";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!role) return;
    if (!validate(role)) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          phone: phone.trim() || undefined,
          teacherProfile:
            role === "TEACHER"
              ? {
                  experience: experience.trim() || undefined,
                  subjects,
                  city: location.trim() || undefined,
                  preferredJobType: jobType,
                }
              : undefined,
          schoolProfile:
            role === "SCHOOL_ADMIN"
              ? {
                  schoolName: schoolName.trim(),
                  city: schoolCity.trim(),
                  board: schoolBoard,
                }
              : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      router.push(`/auth/signin?notice=verify-email&email=${encodeURIComponent(normalizedEmail)}&role=${roleToQuery(role)}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (step === "role") {
    return (
      <div className="flex min-h-screen flex-col bg-eh-soft">
        <div className="flex h-16 items-center border-b border-eh bg-white px-5 md:px-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="eh-logo-mark h-7 w-7 rounded-lg" />
            <span className="font-display text-[20px] font-semibold tracking-[-0.02em] text-eh-text">EduHire</span>
          </Link>
          <div className="flex-1" />
          <p className="text-xs text-eh-text3 md:text-sm">
            {t.signup.alreadyHave}{" "}
            <Link href="/auth/signin" className="font-semibold text-eh-primary hover:text-eh-primary-700">
              {t.signup.signIn}
            </Link>
          </p>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 md:px-10">
          <div className="mb-9 text-center">
            <span className="eh-badge eh-badge-primary">Step 1 of 3 - Choose your workspace</span>
            <h1 className="mt-4 font-display text-[34px] font-medium tracking-[-0.025em] text-eh-text md:text-[38px]">Choose the path that matches your work</h1>
            <p className="mt-2 text-sm text-eh-text3 md:text-[14.5px]">
              Both flows start the same way: create your account, verify your email, then move into a focused setup.
            </p>
          </div>

          <div className="grid w-full max-w-[880px] gap-4 lg:grid-cols-2">
            <button
              type="button"
              onClick={() => goToDetails("SCHOOL_ADMIN")}
              className="eh-card p-8 text-left transition-all hover:border-[var(--eh-primary-600)] hover:ring-4 hover:ring-indigo-50"
            >
              <div className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-indigo-50 text-indigo-700">
                <BriefcaseBusiness size={24} />
              </div>
              <h2 className="text-xl font-semibold tracking-[-0.01em] text-eh-text">{t.signup.roleSchool}</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-eh-text3">
                {t.signup.roleSchoolSub}
              </p>
              <div className="mt-5 space-y-2">
                {[
                  "Post unlimited jobs",
                  "Pipeline and interview tools",
                  "Team roles and permissions",
                ].map((line) => (
                  <div key={line} className="flex items-center gap-2 text-[12.5px] text-eh-text2">
                    <Check size={12} className="text-[var(--eh-primary-700)]" />
                    {line}
                  </div>
                ))}
              </div>
              <p className="mt-5 text-[12.5px] text-eh-text3">Next: add your school profile, request verification, and open your first job.</p>
              <div className="eh-btn eh-btn-secondary mt-6 w-full justify-center">
                Continue as School Admin <ArrowRight size={14} />
              </div>
            </button>

            <button
              type="button"
              onClick={() => goToDetails("TEACHER")}
              className="eh-card p-8 text-left transition-all hover:border-[var(--eh-primary-600)] hover:ring-4 hover:ring-indigo-50"
            >
              <div className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]">
                <GraduationCap size={24} />
              </div>
              <h2 className="text-xl font-semibold tracking-[-0.01em] text-eh-text">{t.signup.roleTeacher}</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-eh-text3">
                {t.signup.roleTeacherSub}
              </p>
              <div className="mt-5 space-y-2">
                {[
                  "Free forever",
                  "Match scores on every job",
                  "One profile, many applications",
                ].map((line) => (
                  <div key={line} className="flex items-center gap-2 text-[12.5px] text-eh-text2">
                    <Check size={12} className="text-[var(--eh-primary-700)]" />
                    {line}
                  </div>
                ))}
              </div>
              <p className="mt-5 text-[12.5px] text-eh-text3">Next: finish your teaching profile, upload your resume, and start applying.</p>
              <div className="eh-btn eh-btn-secondary mt-6 w-full justify-center">
                Continue as Teacher <ArrowRight size={14} />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-eh-soft">
      <div className="flex h-16 items-center border-b border-eh bg-white px-5 md:px-8">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="eh-logo-mark h-7 w-7 rounded-lg" />
          <span className="font-display text-[20px] font-semibold tracking-[-0.02em] text-eh-text">EduHire</span>
        </Link>
        <div className="flex-1" />
        <span className="text-sm text-eh-text3">Step 2 of 3</span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-8 md:px-8">
        <div className="mx-auto max-w-[720px]">
          <button
            type="button"
            onClick={() => router.replace("/auth/signup")}
            className="text-[12.5px] text-eh-text3 hover:text-eh-text"
          >
            &larr; Choose a different role
          </button>

          <h1 className="mt-3 font-display text-[34px] font-medium tracking-[-0.025em] text-eh-text">
            {role === "TEACHER" ? "Create your teacher account" : "Create your school hiring account"}
          </h1>
          <p className="mt-1 text-sm text-eh-text3">
            {role === "TEACHER"
              ? "Step 2 of 3. Create your login, verify your email, then complete the profile schools will review."
              : "Step 2 of 3. Create your login, verify your email, then finish your school profile and verification request."}
          </p>

          <div className="mt-4 rounded-2xl border border-[var(--eh-border)] bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--eh-text-4)]">What happens next</p>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {(role === "TEACHER"
                ? [
                    "Verify your email",
                    "Complete your teaching profile",
                    "Upload your resume and start applying",
                  ]
                : [
                    "Verify your email",
                    "Finish school profile and logo",
                    "Request verification, then post your first job",
                  ]).map((item, index) => (
                <div key={item} className="rounded-xl bg-[var(--surface-base)] px-3 py-3 text-[12.5px] text-eh-text2">
                  <span className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-eh-text">
                    {index + 1}
                  </span>
                  <p className="mt-2">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="eh-card mt-6 p-7">
            {error ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            ) : null}

            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="eh-label">{t.signup.name}</label>
                  <input
                    className={`input-base ${fieldErrors.name ? "border-red-300" : ""}`}
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    placeholder={role === "TEACHER" ? "Ananya Sharma" : "Meera Iyer"}
                    autoComplete="name"
                  />
                  {fieldErrors.name ? <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p> : null}
                </div>

                <div>
                  <label className="eh-label">{t.signup.email}</label>
                  <input
                    className={`input-base ${fieldErrors.email ? "border-red-300" : ""}`}
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    placeholder={role === "TEACHER" ? "ananya.s@gmail.com" : "admin@school.edu.in"}
                    autoComplete="email"
                  />
                  {fieldErrors.email ? <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p> : null}
                </div>

                <div>
                  <label className="eh-label">Phone (optional)</label>
                  <input
                    className="input-base"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+91 98765 43210"
                    autoComplete="tel"
                  />
                </div>

                {role === "TEACHER" ? (
                  <>
                    <div>
                      <label className="eh-label">{t.signup.experience}</label>
                      <select className="input-base" value={experience} onChange={(event) => setExperience(event.target.value)}>
                        <option value="">Select experience</option>
                        <option>1 year</option>
                        <option>3 years</option>
                        <option>6 years</option>
                        <option>10+ years</option>
                      </select>
                    </div>

                    <div>
                      <label className="eh-label">{t.signup.jobType}</label>
                      <select className="input-base" value={jobType} onChange={(event) => setJobType(event.target.value)}>
                        <option>Full-time</option>
                        <option>Part-time</option>
                        <option>Substitute</option>
                        <option>Online</option>
                        <option>Hybrid</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="eh-label">{t.signup.subjects}</label>
                      <div className={`rounded-xl border bg-white p-3 ${fieldErrors.subjects ? "border-red-300" : "border-[var(--eh-border-strong)]"}`}>
                        <div className="flex flex-wrap gap-2">
                          {SUBJECTS.map((subject) => {
                            const active = subjects.includes(subject);
                            return (
                              <button
                                key={subject}
                                type="button"
                                onClick={() => {
                                  toggleSubject(subject);
                                  if (fieldErrors.subjects) setFieldErrors((prev) => ({ ...prev, subjects: "" }));
                                }}
                                className={[
                                  "rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                                  active
                                    ? "border-[var(--eh-primary-600)] bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]"
                                    : "border-[var(--eh-border)] text-eh-text2 hover:border-[var(--eh-primary-300)] hover:bg-[var(--surface-base)]",
                                ].join(" ")}
                                aria-pressed={active}
                              >
                                {subject}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <p className="mt-1 text-[11.5px] text-eh-text3">Choose one or more predefined subjects. Custom subject entry is disabled.</p>
                      {fieldErrors.subjects ? <p className="mt-1 text-xs text-red-600">{fieldErrors.subjects}</p> : null}
                    </div>

                    <div className="md:col-span-2">
                      <label className="eh-label">{t.signup.location}</label>
                      <input
                        className="input-base"
                        value={location}
                        onChange={(event) => setLocation(event.target.value)}
                        placeholder="Chennai, Tamil Nadu"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="eh-label">{t.signup.schoolName}</label>
                      <input
                        className={`input-base ${fieldErrors.schoolName ? "border-red-300" : ""}`}
                        value={schoolName}
                        onChange={(event) => {
                          setSchoolName(event.target.value);
                          if (fieldErrors.schoolName) setFieldErrors((prev) => ({ ...prev, schoolName: "" }));
                        }}
                        placeholder="Green Valley International School"
                      />
                      {fieldErrors.schoolName ? <p className="mt-1 text-xs text-red-600">{fieldErrors.schoolName}</p> : null}
                    </div>

                    <div>
                      <label className="eh-label">{t.signup.schoolCity}</label>
                      <input
                        className={`input-base ${fieldErrors.schoolCity ? "border-red-300" : ""}`}
                        value={schoolCity}
                        onChange={(event) => {
                          setSchoolCity(event.target.value);
                          if (fieldErrors.schoolCity) setFieldErrors((prev) => ({ ...prev, schoolCity: "" }));
                        }}
                        placeholder="Bengaluru"
                      />
                      {fieldErrors.schoolCity ? <p className="mt-1 text-xs text-red-600">{fieldErrors.schoolCity}</p> : null}
                    </div>

                    <div className="md:col-span-2">
                      <label className="eh-label">{t.signup.board}</label>
                      <select className="input-base" value={schoolBoard} onChange={(event) => setSchoolBoard(event.target.value as (typeof BOARDS)[number]["value"])}>
                        {BOARDS.map((board) => (
                          <option key={board.value} value={board.value}>
                            {board.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="eh-label">Create a password</label>
                  <div className="relative">
                    <input
                      className={`input-base pr-10 ${fieldErrors.password ? "border-red-300" : ""}`}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" }));
                      }}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--eh-text-4)] hover:text-[var(--eh-text-2)]"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-1 flex-1 rounded-full"
                        style={{
                          background: index < passwordScore ? "var(--eh-success)" : "var(--eh-bg-mute)",
                        }}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-[11.5px] text-eh-text3">Use 8+ chars with uppercase, number, and symbol.</p>
                  {fieldErrors.password ? <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p> : null}
                </div>
              </div>

              <label className="mt-2 flex gap-2.5 text-[12.5px] text-eh-text2">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => {
                    setConsent(event.target.checked);
                    if (fieldErrors.consent) setFieldErrors((prev) => ({ ...prev, consent: "" }));
                  }}
                  className="mt-[3px]"
                />
                <span>
                  I agree to the{" "}
                  <a href="mailto:hello@theeduhire.in?subject=Terms" className="text-eh-primary hover:text-eh-primary-700">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="mailto:hello@theeduhire.in?subject=Privacy" className="text-eh-primary hover:text-eh-primary-700">
                    Privacy Policy
                  </a>
                  . EduHire may send account and application updates.
                </span>
              </label>
              {fieldErrors.consent ? <p className="text-xs text-red-600">{fieldErrors.consent}</p> : null}

              <div className="rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] p-3 text-[12px] text-eh-text2">
                <p className="font-semibold text-eh-text">Before you continue</p>
                <div className="mt-2 space-y-2">
                  <details className="rounded-lg bg-white px-3 py-2">
                    <summary className="cursor-pointer font-medium text-eh-text">What the Terms of Service cover</summary>
                    <p className="mt-2 text-eh-text3">Account use, truthful profile information, acceptable platform behavior, and how applications are processed.</p>
                  </details>
                  <details className="rounded-lg bg-white px-3 py-2">
                    <summary className="cursor-pointer font-medium text-eh-text">What the Privacy Policy covers</summary>
                    <p className="mt-2 text-eh-text3">What profile, resume, and contact information schools can see, and how EduHire stores and processes your data.</p>
                  </details>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="eh-btn eh-btn-primary eh-btn-lg mt-1 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    {t.signup.submit} <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-4 flex gap-2 rounded-xl border border-[var(--eh-primary-200)] bg-[var(--eh-primary-50)] px-3.5 py-3">
            <Shield size={14} className="mt-0.5 text-[var(--eh-primary-700)]" />
            <p className="text-xs leading-relaxed text-eh-text2">
              We will send a verification link to your email. Your contact details are never shown to schools without your consent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen animate-pulse bg-eh-soft" />}>
      <SignUpForm />
    </Suspense>
  );
}
