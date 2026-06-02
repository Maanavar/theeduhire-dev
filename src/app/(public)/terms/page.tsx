import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — EduHire",
  description: "Terms governing your use of the EduHire teacher-school hiring platform.",
};

const EFFECTIVE_DATE = "17 May 2026";
const CONTACT_EMAIL = "legal@theeduhire.in";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:px-8">
      <div className="mb-8">
        <Link href="/" className="text-[13px] text-[var(--eh-text-3)] hover:text-[var(--eh-text)]">
          &larr; Back to EduHire
        </Link>
        <h1 className="mt-4 font-display text-[32px] font-medium tracking-[-0.025em] text-[var(--eh-text)]">
          Terms of Service
        </h1>
        <p className="mt-2 text-[13.5px] text-[var(--eh-text-3)]">
          Effective date: {EFFECTIVE_DATE}
        </p>
      </div>

      <div className="prose prose-sm max-w-none space-y-8 text-[14px] leading-relaxed text-[var(--eh-text-2)]">

        <section>
          <h2 className="mb-3 text-[18px] font-semibold text-[var(--eh-text)]">1. Acceptance</h2>
          <p>
            By creating an account on EduHire (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) you agree to these Terms. If you
            do not agree, do not use the platform. These Terms form a binding agreement under Indian law.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-semibold text-[var(--eh-text)]">2. The platform</h2>
          <p>
            EduHire is an online hiring platform that connects teachers (&ldquo;Teacher&rdquo;) with schools (&ldquo;School Admin&rdquo;)
            in Tamil Nadu, India. We provide tools for job posting, applications, interview scheduling, and AI-based matching. We are a
            marketplace — we are not a party to any employment contract formed through the platform.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-semibold text-[var(--eh-text)]">3. Account responsibilities</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>You must be at least 18 years old to create an account.</li>
            <li>You are responsible for keeping your password confidential.</li>
            <li>All information you provide (qualifications, school details, job descriptions) must be truthful and not misleading.</li>
            <li>You must not create multiple accounts or impersonate another person or organisation.</li>
            <li>You are solely responsible for any content you upload (resumes, lesson plans, demo videos).</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-semibold text-[var(--eh-text)]">4. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Post fraudulent, discriminatory, or illegal job listings.</li>
            <li>Harvest or scrape user data.</li>
            <li>Circumvent or attempt to bypass security controls.</li>
            <li>Use the platform to send spam or unsolicited messages.</li>
            <li>Upload malware or malicious code.</li>
          </ul>
          <p className="mt-3">We may suspend or terminate accounts that violate these rules without prior notice.</p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-semibold text-[var(--eh-text)]">5. Job postings and applications</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>School Admins are solely responsible for the accuracy of job postings and compliance with applicable labour laws.</li>
            <li>EduHire does not guarantee that a job posting will result in a hire.</li>
            <li>Teachers acknowledge that application visibility may be limited by subscription plan.</li>
            <li>EduHire&rsquo;s AI match scores are advisory only — schools make independent hiring decisions.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-semibold text-[var(--eh-text)]">6. Subscription plans and billing</h2>
          <p>
            Certain features (AI ranking, unlimited job posts, pipeline board) require a paid school subscription. Plan details and pricing
            are shown on the <Link href="/#pricing" className="text-[var(--eh-primary-600)] hover:underline">Pricing page</Link>. All
            fees are in Indian Rupees (INR) and are non-refundable except where required by law. We reserve the right to change pricing
            with 30 days&rsquo; notice.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-semibold text-[var(--eh-text)]">7. Intellectual property</h2>
          <p>
            EduHire retains all rights in the platform, trademarks, and software. You retain ownership of content you upload. By uploading
            content you grant EduHire a non-exclusive, royalty-free licence to store and display it to authorised users (e.g., schools you
            apply to).
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-semibold text-[var(--eh-text)]">8. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by Indian law, EduHire shall not be liable for indirect, incidental, or consequential damages
            arising from use of the platform, failed hirings, or data loss. Our total aggregate liability shall not exceed ₹10,000 or the
            amount you paid to us in the preceding 12 months, whichever is greater.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-semibold text-[var(--eh-text)]">9. Account deletion</h2>
          <p>
            You may delete your account at any time from your Profile settings page. Upon deletion, your personal data will be purged
            within 30 days in accordance with our{" "}
            <Link href="/privacy" className="text-[var(--eh-primary-600)] hover:underline">Privacy Policy</Link>.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-semibold text-[var(--eh-text)]">10. Governing law &amp; disputes</h2>
          <p>
            These Terms are governed by the laws of India. Any dispute shall be subject to the exclusive jurisdiction of courts in
            Tamil Nadu. We encourage you to contact us first at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--eh-primary-600)] hover:underline">{CONTACT_EMAIL}</a>{" "}
            to resolve issues informally.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-semibold text-[var(--eh-text)]">11. Changes to these Terms</h2>
          <p>
            We will notify you by email at least 14 days before any material change. Continued use after the effective date constitutes
            acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-semibold text-[var(--eh-text)]">12. Contact</h2>
          <p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--eh-primary-600)] hover:underline">{CONTACT_EMAIL}</a>
            <br />EduHire, Tamil Nadu, India.
          </p>
        </section>

      </div>
    </div>
  );
}
