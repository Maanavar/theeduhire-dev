"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { getTeacherApplyReadiness } from "@/lib/profileCompletion";
import { getProfile } from "@/lib/api/profile-client";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Star,
} from "lucide-react";

function resolveDashboard(role: string | null | undefined) {
  if (role === "SCHOOL_ADMIN") return "/dashboard/school";
  return "/dashboard";
}

function needsSchoolSetup(profile: any) {
  return !profile?.schoolName || !profile?.city || !profile?.board || !profile?.about || !profile?.logoUrl;
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const notice = searchParams.get("notice");
  const noticeEmail = searchParams.get("email");
  const roleHint = searchParams.get("role");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(errorParam === "CredentialsSignin" ? "Invalid email or password" : "");

  const resolvePostSignInDestination = async () => {
    const callbackUrl = searchParams.get("callbackUrl");
    if (callbackUrl) return callbackUrl;

    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    const role = session?.user?.role;

    if (role === "ADMIN") {
      return "/admin";
    }

    if (role === "SCHOOL_ADMIN") {
      const profile = await getProfile().catch(() => null);
      if (needsSchoolSetup(profile)) {
        return "/dashboard/profile";
      }
      return "/dashboard/school";
    }

    if (role === "TEACHER") {
      const profile = await getProfile().catch(() => null);
      const readiness = getTeacherApplyReadiness({
        avatarUrl: profile?.avatarUrl,
        bio: profile?.bio,
        qualification: profile?.qualification,
        experience: profile?.experience,
        city: profile?.city,
        subjects: profile?.subjects || [],
        preferredBoards: profile?.preferredBoards || [],
        preferredGrades: profile?.preferredGrades || [],
        experiences: profile?.experiences || [],
        certifications: profile?.certifications || [],
        resumes: profile?.resumes || [],
      });

      if (!readiness.ready) {
        return "/dashboard/profile";
      }
    }

    return resolveDashboard(role);
  };

  const onCredentialsSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    const destination = await resolvePostSignInDestination();

    router.push(destination);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[var(--surface-base)] lg:grid lg:grid-cols-[1fr_1.1fr]">
      <div className="mx-auto flex w-full max-w-[560px] flex-col justify-center px-6 py-10 lg:px-16">
        <Link href="/" className="inline-flex w-fit items-center gap-2">
          <div className="eh-logo-mark h-7 w-7 rounded-lg" />
          <span className="font-display text-[20px] font-semibold tracking-[-0.02em] text-eh-text">EduHire</span>
        </Link>

        <h1 className="mt-8 font-display text-[34px] font-medium tracking-[-0.025em] text-eh-text">
          {notice === "suspended" ? "Account unavailable" : notice === "verify-email" ? "Finish your first sign in" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-eh-text3">
          {notice === "suspended"
            ? "Your account has been suspended. Contact EduHire support if you believe this is a mistake."
            : notice === "verify-email"
            ? roleHint === "school"
              ? "Verify your email, then sign in to finish your school profile and verification."
              : "Verify your email, then sign in to finish your teacher profile and start applying."
            : "Sign in to continue to EduHire."}
        </p>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}
        {notice === "suspended" ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Your session was terminated because your account was suspended by an EduHire administrator. Please contact support at support@eduhire.in.
          </div>
        ) : null}
        {notice === "verify-email" ? (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            Verification required. Check your inbox{noticeEmail ? ` at ${noticeEmail}` : ""} and click the email link before signing in with the password you just created.
          </div>
        ) : null}

        <form onSubmit={onCredentialsSignIn} className="space-y-3.5">
          <div>
            <label className="eh-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input-base"
              autoComplete="email"
              placeholder="meera.iyer@greenvalley.edu.in"
              required
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="eh-label mb-0">Password</label>
              <Link href="/auth/forgot-password" className="text-xs font-medium text-eh-primary hover:text-eh-primary-700">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input-base pr-10"
                autoComplete="current-password"
                required
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
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="eh-btn eh-btn-primary eh-btn-lg mt-1 w-full justify-center text-[14px] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 flex items-start gap-2 rounded-[10px] bg-eh-soft px-3.5 py-3">
          <Shield size={14} className="mt-0.5 text-[var(--eh-primary-700)]" />
          <p className="text-xs leading-relaxed text-eh-text3">
            Your account is protected with secure authentication. We never reveal whether an email exists in our system.
          </p>
        </div>

        <p className="mt-6 text-center text-[13.5px] text-eh-text3">
          New to EduHire?{" "}
          <Link href="/auth/signup" className="font-semibold text-eh-primary hover:text-eh-primary-700">
            Create an account
          </Link>
        </p>
      </div>

      <div className="eh-mesh hidden items-center justify-center border-l border-eh p-14 lg:flex">
        <div className="w-full max-w-[460px]">
          <div className="eh-card -rotate-1 p-[18px] shadow-[var(--eh-shadow-xl)]">
            <div className="flex items-center gap-2.5">
              <div className="eh-avatar bg-[var(--eh-primary-700)]">AS</div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-eh-text">Ananya Sharma</p>
                <p className="text-[11px] text-eh-text3">Math Teacher - 6 yrs - Bengaluru</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--eh-primary-50)] text-[11px] font-semibold text-[var(--eh-primary-700)]">
                92
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-[10px] bg-[var(--eh-primary-50)] px-3 py-2.5 text-[12.5px] font-semibold text-[var(--eh-primary-700)]">
              <Star size={13} />
              Shortlisted for Sr. Math - Green Valley
            </div>
          </div>

          <div className="eh-card ml-14 mt-4 rotate-[1.5deg] p-[18px] shadow-[var(--eh-shadow-xl)]">
            <p className="text-[11.5px] text-eh-text3">Interview confirmed</p>
            <p className="mt-1 text-sm font-semibold text-eh-text">Tue 14 May, 4:30 PM IST</p>
            <div className="mt-2.5 flex gap-1.5">
              <span className="eh-chip">Google Meet</span>
              <span className="eh-chip">Sr. Math</span>
            </div>
          </div>

          <p className="mt-8 max-w-[380px] font-display text-[22px] font-medium leading-[1.3] tracking-[-0.015em] text-eh-text">
            &quot;Track every application from applied to hired - without juggling spreadsheets.&quot;
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen animate-pulse bg-eh-soft" />}>
      <SignInForm />
    </Suspense>
  );
}
