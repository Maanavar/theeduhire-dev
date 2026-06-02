import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — EduHire",
  description: "How EduHire collects, uses, and protects your personal data under India's DPDP Act 2023.",
};

const EFFECTIVE_DATE = "17 May 2026";
const CONTACT_EMAIL = "privacy@theeduhire.in";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:px-8">
      <div className="mb-8">
        <Link href="/" className="text-[13px] text-[var(--eh-text-3)] hover:text-[var(--eh-text)]">
          &larr; Back to EduHire
        </Link>
        <h1 className="mt-4 font-display text-[32px] font-medium tracking-[-0.025em] text-[var(--eh-text)]">
          Privacy Policy
        </h1>
        <p className="mt-2 text-[13.5px] text-[var(--eh-text-3)]">
          Effective date: {EFFECTIVE_DATE} &nbsp;·&nbsp; Also available in Tamil upon request.
        </p>
      </div>

      <div className="prose prose-sm max-w-none space-y-8 text-[14px] leading-relaxed text-[var(--eh-text-2)]">

        <section>
          <h2 className="mb-3 text-[18px] font-semibold text-[var(--eh-text)]">1. Who we are</h2>
          <p>
            EduHire (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a teacher-school hiring platform serving Tamil Nadu, India.
            We operate the website at <strong>theeduhire.in</strong>. For privacy matters, contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--eh-primary-600)] hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-semibold text-[var(--eh-text)]">2. Data we collect</h2>
          <p>We collect the following categories of personal data:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Account data:</strong> name, email address, phone number, password hash.</li>
            <li><strong>Profile data:</strong> teaching subjects, years of experience, location, bio, photo.</li>
            <li><strong>Application data:</strong> resume/CV (PDF/DOC), demo videos, lesson plans, salary expectations.</li>
            <li><strong>Communication preferences:</strong> WhatsApp number and opt-in status (if you provide it).</li>
            <li><strong>Usage data:</strong> pages visited, job searches, application status changes (via server logs).</li>
            <li><strong>School data:</strong> school name, board affiliation, city, logo (for School Admin accounts).</li>
          </ul>
          <p className="mt-3">We do <strong>not</strong> collect Aadhaar, PAN, or financial account numbers.</p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-semibold text-[var(--eh-text)]">3. Why we collect it (purpose &amp; legal basis)</h2>
          <p>Under India&rsquo;s <strong>Digital Personal Data Protection Act 2023 (DPDP Act)</strong>, we process your data based on:</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li><strong>Consent</strong> (Section 6) — you consent when you sign up. You may withdraw consent at any time by deleting your account.</li>
            <li><strong>Legitimate use</strong> — providing the hiring platform, matching teachers to jobs, sending interview notifications, and preventing fraud.</li>
          </ul>
          <p className="mt-3">Specific purposes:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Create and manage your account.</li>
            <li>Show your profile to schools you have applied to.</li>
            <li>Send job-alert emails and interview reminders.</li>
            <li>Improve match scores and platform recommendations.</li>
            <li>Comply with legal obligations.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-semibold text-[var(--eh-text)]">4. Who we share your data with</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li><strong>Schools you apply to:</strong> your profile, resume, and application details are shared with the school that posted the job.</li>
            <li><strong>Service providers:</strong> Supabase (database/storage, EU and US regions), Resend (transactional email), Anthropic (AI recommendation features — only anonymised job-match data, no PII sent to Anthropic).</li>
            <li><strong>Analytics:</strong> PostHog (if enabled) — anonymised usage events only.</li>
          </ul>
          <p className="mt-3">We do <strong>not</strong> sell your data to third parties.</p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-semibold text-[var(--eh-text)]">5. Data retention</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Active accounts: data retained while your account is open.</li>
            <li>Deleted accounts: personal data purged within 30 days, except where required by law.</li>
            <li>Application records: retained for 1 year after the hiring decision to resolve disputes.</li>
            <li>Email logs: retained for 90 days.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-semibold text-[var(--eh-text)]">6. Your rights (DPDP Act 2023)</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li><strong>Right to access:</strong> request a copy of your personal data.</li>
            <li><strong>Right to correction:</strong> update inaccurate data via your Profile page.</li>
            <li><strong>Right to erasure:</strong> delete your account and all associated data at any time from your Profile settings, or by emailing us.</li>
            <li><strong>Right to withdraw consent:</strong> delete your account; we will stop processing your data.</li>
            <li><strong>Right to grievance redressal:</strong> contact our Privacy Officer at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--eh-primary-600)] hover:underline">{CONTACT_EMAIL}</a>. We respond within 72 hours.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-semibold text-[var(--eh-text)]">7. Cookies &amp; tracking</h2>
          <p>
            We use essential session cookies (NextAuth) required for login. We do not use advertising or third-party tracking cookies.
            If PostHog analytics is enabled, it runs in cookieless mode.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-semibold text-[var(--eh-text)]">8. Security</h2>
          <p>
            Passwords are hashed with bcrypt. All data is transmitted over HTTPS. Access to the production database is restricted to authorised
            service accounts. We conduct periodic security reviews.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-semibold text-[var(--eh-text)]">9. Children</h2>
          <p>EduHire is intended for adults (18+) seeking or offering employment. We do not knowingly collect data from minors.</p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-semibold text-[var(--eh-text)]">10. Changes to this policy</h2>
          <p>
            We will notify you by email at least 14 days before any material change. Continued use after the effective date constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-semibold text-[var(--eh-text)]">11. Contact</h2>
          <p>
            Privacy Officer &amp; Grievance Officer: <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--eh-primary-600)] hover:underline">{CONTACT_EMAIL}</a>
            <br />
            EduHire, Tamil Nadu, India.
          </p>
        </section>

      </div>
    </div>
  );
}
