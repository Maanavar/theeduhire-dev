import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-5 relative overflow-hidden">
      {/* Subtle gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, #D8F3DC40 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center justify-center gap-1.5 mb-8"
        >
          <span className="font-display text-[26px] font-bold text-brand-600">
            EduHire
          </span>
          <span className="font-body text-[10px] font-semibold bg-accent-50 text-accent-500 px-2 py-0.5 rounded-full tracking-wide">
            TN
          </span>
        </Link>

        {children}

        {/* Footer */}
        <p className="text-center text-[12px] text-gray-400 mt-6">
          &copy; {new Date().getFullYear()} EduHire. All rights reserved.
        </p>
      </div>
    </main>
  );
}
