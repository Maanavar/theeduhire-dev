"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const interval = setInterval(() => setCountdown((c) => c - 1), 1000);
    const timer = setTimeout(() => router.replace("/auth/signin-teacher"), 3000);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--surface-base)" }}
    >
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-brand"
              style={{ background: "linear-gradient(135deg, #1f9b63 0%, #0f6340 100%)" }}>
              <svg width="17" height="17" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.5C4 1.5 2 3.5 2 6.5c0 2 1 3.5 2.5 4.5L7 12.5l2.5-1.5C11 9.5 12 8 12 6c0-3-2-4.5-5-4.5z" fill="white" fillOpacity=".9"/>
              </svg>
            </div>
            <span className="font-display text-[20px] font-bold text-gray-900 tracking-[-0.02em]">EduHire</span>
          </Link>
        </div>

        <div className="card p-8 text-center">
          <h1 className="font-display text-[22px] font-bold text-gray-900 tracking-[-0.02em] mb-2">
            Sign in to EduHire
          </h1>
          <p className="text-sm text-gray-500 mb-7">Select your account type to continue</p>

          <div className="space-y-3">
            <Link
              href="/auth/signin-teacher"
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border border-black/[0.08] bg-white hover:border-blue-300 hover:bg-blue-50 transition-all duration-[120ms] group text-left"
            >
              <span className="text-2xl">👨‍🏫</span>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-gray-900">Teacher</div>
                <div className="text-xs text-gray-400">Browse & apply for jobs</div>
              </div>
              <ArrowRight size={14} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
            </Link>

            <Link
              href="/auth/signin-school"
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border border-black/[0.08] bg-white hover:border-brand-300 hover:bg-brand-50 transition-all duration-[120ms] group text-left"
            >
              <span className="text-2xl">🏫</span>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-gray-900">School Admin</div>
                <div className="text-xs text-gray-400">Post jobs & manage applications</div>
              </div>
              <ArrowRight size={14} className="text-gray-300 group-hover:text-brand-400 transition-colors" />
            </Link>
          </div>

          <div className="mt-6 pt-5 border-t border-black/[0.05]">
            <p className="text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="text-brand-600 font-semibold hover:text-brand-700 transition-colors">
                Sign up free
              </Link>
            </p>
            <p className="text-xs text-gray-400 mt-3">
              Auto-redirecting to teacher sign in in {countdown}s…
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
