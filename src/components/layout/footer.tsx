import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto bg-white border-t border-gray-200/60 py-8 px-5">
      <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-4">
        <span className="font-display text-lg font-bold text-brand-600">
          EduHire
        </span>
        <div className="flex items-center gap-6 text-[13px] text-gray-400">
          <Link href="/about" className="hover:text-gray-600 transition-colors">
            About
          </Link>
          <Link href="/contact" className="hover:text-gray-600 transition-colors">
            Contact
          </Link>
          <span>&copy; {new Date().getFullYear()} EduHire. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
