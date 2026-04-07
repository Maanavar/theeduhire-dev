import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-black/[0.05] py-7 px-5" style={{ background: "var(--surface-raised)" }}>
      <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #1f9b63 0%, #0f6340 100%)" }}
          >
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5C4 1.5 2 3.5 2 6.5c0 2 1 3.5 2.5 4.5L7 12.5l2.5-1.5C11 9.5 12 8 12 6c0-3-2-4.5-5-4.5z" fill="white" fillOpacity=".9"/>
            </svg>
          </div>
          <span className="font-display text-[16px] font-bold text-gray-900 tracking-[-0.02em]">
            EduHire
          </span>
        </div>

        {/* Links + copyright */}
        <div className="flex items-center gap-5 text-sm text-gray-400">
          <Link href="/about"   className="hover:text-gray-700 transition-colors duration-[120ms]">About</Link>
          <Link href="/contact" className="hover:text-gray-700 transition-colors duration-[120ms]">Contact</Link>
          <span className="hidden sm:inline text-gray-200">|</span>
          <span className="hidden sm:inline text-gray-400 text-xs">
            &copy; {new Date().getFullYear()} EduHire · Tamil Nadu
          </span>
        </div>
      </div>
    </footer>
  );
}
