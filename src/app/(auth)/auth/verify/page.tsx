"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Suspense } from "react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setMessage("Your email has been verified. You can now sign in.");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed. The link may have expired.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, [token]);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
      {status === "loading" && (
        <>
          <Loader2 size={32} className="mx-auto text-brand-500 animate-spin mb-4" />
          <h1 className="font-display text-[22px] font-bold mb-2">Verifying your email...</h1>
          <p className="text-[14px] text-gray-500">Just a moment.</p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle2 size={36} className="mx-auto text-green-500 mb-4" />
          <h1 className="font-display text-[22px] font-bold mb-2">Email verified!</h1>
          <p className="text-[14px] text-gray-500 mb-6">{message}</p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors"
          >
            Sign in to your account
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle size={36} className="mx-auto text-red-400 mb-4" />
          <h1 className="font-display text-[22px] font-bold mb-2">Verification failed</h1>
          <p className="text-[14px] text-gray-500 mb-6">{message}</p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Back to sign up
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="bg-white border border-gray-100 rounded-2xl p-8 h-48 animate-pulse" />}>
      <VerifyContent />
    </Suspense>
  );
}
