"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignInPage() {
  const router = useRouter();

  // Auto-redirect to teacher signin after a brief delay to show the choice
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/auth/signin-teacher");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-7">
      <div className="text-center">
        <h1 className="font-display text-[24px] font-bold text-center mb-1">
          Choose Your Sign In
        </h1>
        <p className="text-[14px] text-gray-500 text-center mb-6">
          Select the type of account you want to sign in with
        </p>

        <div className="space-y-3 mb-6">
          <Link
            href="/auth/signin-teacher"
            className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl text-[15px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
          >
            <span className="text-2xl">👨‍🏫</span>
            Sign In as Teacher
            <span className="text-[12px] font-normal text-blue-600">Apply for jobs</span>
          </Link>

          <Link
            href="/auth/signin-school"
            className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl text-[15px] font-semibold bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors"
          >
            <span className="text-2xl">🏫</span>
            Sign In as School Admin
            <span className="text-[12px] font-normal text-green-600">Post jobs & manage applications</span>
          </Link>
        </div>

        <p className="text-[13px] text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-brand-500 font-medium hover:underline">
            Sign up
          </Link>
        </p>

        <div className="mt-4 text-[12px] text-gray-400">
          Redirecting to teacher sign in in 3 seconds...
        </div>
      </div>
    </div>
  );
}
