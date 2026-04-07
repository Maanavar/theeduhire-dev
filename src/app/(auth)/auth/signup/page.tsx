"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { GraduationCap, Building2, CheckCircle2, Eye, EyeOff, ArrowRight } from "lucide-react";

type Role = "TEACHER" | "SCHOOL_ADMIN";

function getRoleDashboard(role: Role): string {
  return role === "SCHOOL_ADMIN" ? "/dashboard/my-jobs" : "/dashboard/applications";
}

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const initialRole: Role = roleParam === "school" ? "SCHOOL_ADMIN" : "TEACHER";

  const [role, setRole]         = useState<Role>(initialRole);
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }
      const signInResult = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });
      if (signInResult?.ok) { router.push(getRoleDashboard(role)); router.refresh(); }
      else { router.push("/auth/signin"); }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogle = () => signIn("google", { callbackUrl: "/dashboard/applications" });

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(31,155,99,0.09) 0%, transparent 60%), var(--surface-base)",
      }}
    >
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-brand"
              style={{ background: "linear-gradient(135deg, #1f9b63 0%, #0f6340 100%)" }}>
              <svg width="17" height="17" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.5C4 1.5 2 3.5 2 6.5c0 2 1 3.5 2.5 4.5L7 12.5l2.5-1.5C11 9.5 12 8 12 6c0-3-2-4.5-5-4.5z" fill="white" fillOpacity=".9"/>
              </svg>
            </div>
            <span className="font-display text-[20px] font-bold text-gray-900 tracking-[-0.02em] group-hover:text-brand-600 transition-colors">
              EduHire
            </span>
          </Link>
        </div>

        <div className="card p-8">
          <div className="mb-6">
            <h1 className="font-display text-[24px] font-bold text-gray-900 tracking-[-0.02em] mb-1">
              Create your account
            </h1>
            <p className="text-sm text-gray-500">Join thousands of educators on EduHire</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
                <circle cx="8" cy="8" r="7.5" stroke="currentColor"/>
                <path d="M8 5V8.5M8 10.5H8.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {([
              { r: "TEACHER" as Role,     icon: <GraduationCap size={20} />, label: "I'm a Teacher", sub: "Find teaching jobs" },
              { r: "SCHOOL_ADMIN" as Role, icon: <Building2 size={20} />,     label: "I'm a School",  sub: "Hire teachers" },
            ]).map(({ r, icon, label, sub }) => {
              const active = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={[
                    "relative flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all duration-[120ms] text-center",
                    active
                      ? "border-brand-500 bg-brand-50/60 shadow-brand"
                      : "border-black/[0.09] hover:border-black/[0.15] hover:bg-gray-50",
                  ].join(" ")}
                >
                  {active && (
                    <div className="absolute top-2.5 right-2.5">
                      <CheckCircle2 size={14} className="text-brand-500" />
                    </div>
                  )}
                  <span className={active ? "text-brand-500" : "text-gray-400"}>
                    {icon}
                  </span>
                  <span className={`text-xs font-bold ${active ? "text-brand-700" : "text-gray-700"}`}>
                    {label}
                  </span>
                  <span className="text-[10px] text-gray-400">{sub}</span>
                </button>
              );
            })}
          </div>

          {/* Google OAuth — teacher only */}
          {role === "TEACHER" && (
            <>
              <button
                onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-black/[0.09] rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-black/[0.15] transition-all duration-[120ms] mb-5"
              >
                <svg width="17" height="17" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-black/[0.06]" />
                <span className="text-xs text-gray-400 font-medium">or with email</span>
                <div className="flex-1 h-px bg-black/[0.06]" />
              </div>
            </>
          )}

          {role === "SCHOOL_ADMIN" && (
            <p className="text-xs text-gray-400 text-center mb-4 bg-gray-50 rounded-xl px-4 py-2.5 border border-black/[0.05]">
              School accounts use email registration for verification
            </p>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === "TEACHER" ? "Your full name" : "Admin contact name"}
                required
                autoComplete="name"
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                autoComplete="email"
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="input-base pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {password && password.length < 8 && (
                <p className="text-xs text-amber-600 mt-1.5 font-medium">
                  {8 - password.length} more character{8 - password.length !== 1 ? "s" : ""} needed
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !name || !email || !password || password.length < 8}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[15px] font-semibold text-white transition-all duration-[120ms] shadow-brand disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-px active:translate-y-0 mt-1"
              style={{ background: "linear-gradient(135deg, #1f9b63 0%, #157d4e 100%)" }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {loading
                ? "Creating account…"
                : role === "TEACHER"
                ? "Create Teacher Account"
                : "Create School Account"}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-6">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-brand-600 font-semibold hover:text-brand-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          By creating an account, you agree to our{" "}
          <Link href="/about" className="underline hover:text-gray-600">Terms of Service</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="card w-full max-w-[420px] h-[580px] skeleton" />
      </div>
    }>
      <SignUpForm />
    </Suspense>
  );
}
