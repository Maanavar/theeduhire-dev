"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle } from "lucide-react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(
    errorParam === "CredentialsSignin" ? "Invalid email or password" : ""
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");
    setSuccess(null);

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

    if (result?.ok) {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = session?.user?.role;

      if (role !== "TEACHER") {
        setError("This sign-in page is for teachers only. Please use the school admin sign-in if you have a school account.");
        setLoading(false);
        return;
      }

      setSuccess("Welcome back!");
      setLoading(false);
      setTimeout(() => {
        const destination = searchParams.get("callbackUrl") || "/dashboard/applications";
        router.push(destination);
        router.refresh();
      }, 1000);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(31,155,99,0.1) 0%, transparent 60%), var(--surface-base)",
      }}
    >
      <div className="w-full max-w-[420px]">

        {/* Logo link */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-brand"
              style={{ background: "linear-gradient(135deg, #1f9b63 0%, #0f6340 100%)" }}
            >
              <svg width="17" height="17" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.5C4 1.5 2 3.5 2 6.5c0 2 1 3.5 2.5 4.5L7 12.5l2.5-1.5C11 9.5 12 8 12 6c0-3-2-4.5-5-4.5z" fill="white" fillOpacity=".9"/>
              </svg>
            </div>
            <span className="font-display text-[20px] font-bold text-gray-900 tracking-[-0.02em] group-hover:text-brand-600 transition-colors">
              EduHire
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="card p-8">
          {/* Header */}
          <div className="mb-7">
            <div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 text-xl">
              👨‍🏫
            </div>
            <h1 className="font-display text-[24px] font-bold text-gray-900 tracking-[-0.02em] mb-1">
              Teacher sign in
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              Access your applications, saved jobs, and profile
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
                <circle cx="8" cy="8" r="7.5" stroke="currentColor"/>
                <path d="M8 5V8.5M8 10.5H8.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm px-4 py-3 rounded-xl mb-5">
              <CheckCircle size={15} className="flex-shrink-0" />
              <span>{success} Redirecting…</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleCredentials} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teacher@school.edu"
                  required
                  autoComplete="email"
                  className="input-base pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="input-base pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[15px] font-semibold text-white transition-all duration-[120ms] shadow-brand disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-px active:translate-y-0 mt-1"
              style={{ background: "linear-gradient(135deg, #1f9b63 0%, #157d4e 100%)" }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-7 pt-5 border-t border-black/[0.05] space-y-3 text-center">
            <p className="text-sm text-gray-600">
              New to EduHire?{" "}
              <Link href="/auth/signup" className="text-brand-600 font-semibold hover:text-brand-700 transition-colors">
                Create account
              </Link>
            </p>
            <p className="text-xs text-gray-400">
              School administrator?{" "}
              <Link href="/auth/signin-school" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Sign in here →
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          By signing in, you agree to our{" "}
          <Link href="/about" className="underline hover:text-gray-600">Terms</Link>
        </p>
      </div>
    </div>
  );
}

export default function TeacherSignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="card w-full max-w-[420px] h-[520px] skeleton" /></div>}>
      <SignInForm />
    </Suspense>
  );
}
