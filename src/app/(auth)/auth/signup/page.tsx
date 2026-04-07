"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { GraduationCap, Building2, Check } from "lucide-react";

type Role = "TEACHER" | "SCHOOL_ADMIN";

function getRoleDashboard(role: Role): string {
  return role === "SCHOOL_ADMIN" ? "/dashboard/my-jobs" : "/dashboard/applications";
}

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-select role from query param: /auth/signup?role=school
  const roleParam = searchParams.get("role");
  const initialRole: Role = roleParam === "school" ? "SCHOOL_ADMIN" : "TEACHER";

  const [role, setRole] = useState<Role>(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

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

      // Auto sign-in after registration
      const signInResult = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (signInResult?.ok) {
        // Redirect based on the role they chose (not from session — we know it)
        router.push(getRoleDashboard(role));
        router.refresh();
      } else {
        router.push("/auth/signin");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    // Google OAuth always creates a Teacher account
    signIn("google", { callbackUrl: "/dashboard/applications" });
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-7">
      <h1 className="font-display text-[24px] font-bold text-center mb-1">
        Create your account
      </h1>
      <p className="text-[14px] text-gray-500 text-center mb-6">
        Join EduHire as a teacher or school
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 text-[13px] px-4 py-2.5 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Role selector */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          type="button"
          onClick={() => setRole("TEACHER")}
          className={`relative flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all ${
            role === "TEACHER"
              ? "border-brand-500 bg-brand-50/50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          {role === "TEACHER" && (
            <div className="absolute top-2 right-2">
              <Check size={14} className="text-brand-500" />
            </div>
          )}
          <GraduationCap
            size={22}
            className={role === "TEACHER" ? "text-brand-500" : "text-gray-400"}
          />
          <span className={`text-[13px] font-semibold ${role === "TEACHER" ? "text-brand-600" : "text-gray-600"}`}>
            I&apos;m a Teacher
          </span>
          <span className="text-[11px] text-gray-400">Looking for jobs</span>
        </button>

        <button
          type="button"
          onClick={() => setRole("SCHOOL_ADMIN")}
          className={`relative flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all ${
            role === "SCHOOL_ADMIN"
              ? "border-brand-500 bg-brand-50/50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          {role === "SCHOOL_ADMIN" && (
            <div className="absolute top-2 right-2">
              <Check size={14} className="text-brand-500" />
            </div>
          )}
          <Building2
            size={22}
            className={role === "SCHOOL_ADMIN" ? "text-brand-500" : "text-gray-400"}
          />
          <span className={`text-[13px] font-semibold ${role === "SCHOOL_ADMIN" ? "text-brand-600" : "text-gray-600"}`}>
            I&apos;m a School
          </span>
          <span className="text-[11px] text-gray-400">Hiring teachers</span>
        </button>
      </div>

      {/* Google OAuth — only shown for Teacher role */}
      {role === "TEACHER" && (
        <>
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[12px] text-gray-400">or register with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        </>
      )}

      {/* School admin notice */}
      {role === "SCHOOL_ADMIN" && (
        <p className="text-[12px] text-gray-400 text-center mb-4">
          School accounts require email registration for verification
        </p>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="flex flex-col gap-1">
          <label className="text-[12.5px] font-medium text-gray-500">Full name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={role === "TEACHER" ? "Your full name" : "Your name (school admin)"}
            required
            className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-[14px] font-body focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[12.5px] font-medium text-gray-500">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            required
            className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-[14px] font-body focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[12.5px] font-medium text-gray-500">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            required
            minLength={8}
            className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-[14px] font-body focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !name || !email || !password}
          className="w-full py-3 rounded-xl text-[14px] font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {loading
            ? "Creating account..."
            : role === "TEACHER"
            ? "Create Teacher Account"
            : "Create School Account"}
        </button>
      </form>

      <p className="text-[13px] text-gray-500 text-center mt-5">
        Already have an account?{" "}
        <Link href="/auth/signin" className="text-brand-500 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white border border-gray-100 rounded-2xl p-7 h-[560px] animate-pulse" />
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
