import Link from "next/link";
import { Mail } from "lucide-react";
import FooterUpdatesForm from "@/components/layout/footer-updates-form";

const FOOTER_COLUMNS = [
  {
    title: "For schools",
    links: [
      { label: "Register your school", href: "/auth/signup?role=school" },
      { label: "How it works", href: "/#platform" },
      { label: "Post a role", href: "/dashboard/post-job" },
      { label: "Browse teacher profiles", href: "/jobs" },
    ],
  },
  {
    title: "For teachers",
    links: [
      { label: "Find teaching jobs", href: "/jobs" },
      { label: "Create Teacher Passport", href: "/auth/signup?role=teacher" },
      { label: "How it works", href: "/#for-teachers" },
      { label: "FAQ", href: "/#questions" },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Sign in", href: "/auth/signin" },
      { label: "Create account", href: "/auth/signup" },
      { label: "Contact us", href: "/#contact" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--eh-border)] bg-white px-5 pb-6 pt-10 md:px-8 md:pt-12">
      <div className="mx-auto max-w-[1320px]">
        <div className="grid gap-10 border-b border-[var(--eh-border)] pb-10 lg:grid-cols-[1.3fr_0.9fr_0.9fr_0.9fr] lg:gap-8">
          <div className="max-w-[420px]">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="eh-logo-mark h-8 w-8 rounded-[10px]" />
              <span className="font-display text-[22px] font-semibold tracking-[-0.03em] text-[var(--eh-text)]">
                EduHire
              </span>
            </Link>
            <p className="mt-4 text-[14px] leading-[1.7] text-[var(--eh-text-2)]">
              Tamil Nadu&apos;s teacher hiring network in progress, designed around verified schools,
              verified teachers, salary clarity, and faster qualification-fit hiring.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/dashboard/post-job" className="eh-btn eh-btn-primary eh-btn-sm">
                Post a job
              </Link>
              <Link href="/jobs" className="eh-btn eh-btn-secondary eh-btn-sm">
                Explore jobs
              </Link>
            </div>
            <a
              href="mailto:hello@theeduhire.in"
              className="mt-5 inline-flex items-center gap-2 text-[13px] text-[var(--eh-text-3)] transition-colors hover:text-[var(--eh-text)]"
            >
              <Mail size={13} />
              hello@theeduhire.in
            </a>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--eh-text-4)]">
                {column.title}
              </h3>
              <div className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="block text-[14px] text-[var(--eh-text-2)] transition-colors hover:text-[var(--eh-text)]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="py-8">
          <FooterUpdatesForm />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 py-5 text-[12px] text-[var(--eh-text-3)]">
          <span>&copy; 2026 EduHire Technologies Pvt Ltd. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-[var(--eh-text)]">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[var(--eh-text)]">Terms of Service</Link>
            <span>Chennai / Coimbatore / Madurai</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
