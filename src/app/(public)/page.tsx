import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { cacheTags } from "@/lib/cache-tags";
import { FAQAccordion } from "@/components/marketing/faq-accordion";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { HomeHeroText } from "@/components/marketing/home-hero-text";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Building2,
  Calendar,
  Check,
  ClipboardList,
  Clock,
  LockKeyhole,
  MapPin,
  MessageCircle,
  MessageSquareShare,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";

const getStats = unstable_cache(
  async () => {
    const [jobCountResult, schoolCountResult] = await Promise.allSettled([
      prisma.jobPosting.count({ where: { status: "ACTIVE" } }),
      prisma.schoolProfile.count(),
    ]);
    return {
      jobCount: jobCountResult.status === "fulfilled" ? jobCountResult.value : 0,
      schoolCount: schoolCountResult.status === "fulfilled" ? schoolCountResult.value : 0,
    };
  },
  ["homepage-stats"],
  { revalidate: 3600, tags: [cacheTags.homepageStats] }
);

const SIGNAL_ITEMS = [
  "Verified schools only",
  "Teacher Passport",
  "Salary transparency",
  "Smart eligibility matching",
  "Demo class proof",
  "WhatsApp and Tamil-first",
  "Child-safety layer",
  "No fee from teachers",
  "Hyperlocal commute fit",
  "TNTET and CTET aware",
  "Privacy-first hiring",
  "AI-assisted shortlisting",
  "Replacement teacher pool",
];

const FOR_SCHOOLS = [
  {
    icon: ShieldCheck,
    title: "Only verified, qualified teachers",
    body: "Every teacher profile includes qualification proof, TNTET or CTET status, board fit, subject strength, and previous school experience — before you see their name.",
  },
  {
    icon: Sparkles,
    title: "Shortlist by actual fit, not resume count",
    body: "Set class level, subject, board, medium, salary band, and joining date. See eligible, likely eligible, and missing-document candidates — sorted before you open a single profile.",
  },
  {
    icon: Video,
    title: "See teaching ability before the interview",
    body: "Teachers upload demo class videos, lesson plans, and board-writing samples. Assess real classroom ability before you spend time on a face-to-face round.",
  },
  {
    icon: ClipboardList,
    title: "One dashboard from post to joining",
    body: "Post a role, auto-shortlist, schedule interviews, send WhatsApp invites, collect documents, record demo feedback, send offers, and track joining status — all in one place.",
  },
  {
    icon: Clock,
    title: "Urgent vacancy? Replacement pool ready",
    body: "A dedicated pool of immediate joiners, substitutes, part-time teachers, retired teachers, and exam-season specialists. Filter for teachers who can join within 48 hours.",
  },
  {
    icon: Bot,
    title: "AI that saves your admin time",
    body: "Generate job descriptions, get salary range suggestions, summarise candidate profiles, prepare interview questions, and compare teachers against your role requirements automatically.",
  },
];

const FOR_TEACHERS = [
  {
    icon: Building2,
    title: "Know the school before you apply",
    body: "Every school profile shows salary band, working hours, PF or ESI details, demo class expectations, and payment track record — declared before you spend a minute applying.",
  },
  {
    icon: MapPin,
    title: "Jobs matched to where you live",
    body: "Filter by district, commute time, bus route, or accommodation availability. Mark yourself available immediately, after notice period, part-time, or for online classes only.",
  },
  {
    icon: BookOpen,
    title: "Your verified Teacher Passport",
    body: "One profile with your qualifications, TET status, subject, medium, experience, and demo class video. Schools see your full picture. You control who sees what.",
  },
  {
    icon: Sparkles,
    title: "Know your fit score before applying",
    body: 'Before you apply, see how well you match the role — subject, qualification, distance, salary, board, and joining date. "You are 82% fit. Missing: TNTET certificate." No guessing.',
  },
  {
    icon: MessageCircle,
    title: "WhatsApp alerts and Tamil interface",
    body: "Get job alerts on WhatsApp in Tamil or English. Use Tamil resume templates, Tamil interview tips, and a simple posting flow built for teachers, not tech users.",
  },
  {
    icon: Bot,
    title: "AI to help you get hired",
    body: "Improve your profile, create a lesson plan, practice interview questions, translate your profile between Tamil and English, and get personalised job suggestions with reasons.",
  },
];

const HOW_IT_WORKS_SCHOOL = [
  { step: "1", title: "Verify your school", body: "Submit your UDISE code, board affiliation, and contact. Verified schools earn a trust badge teachers actively look for." },
  { step: "2", title: "Post with full clarity", body: "Add salary band, class level, subject, board, medium, workload, and joining date. Vague posts attract weak applicants." },
  { step: "3", title: "Review matched candidates", body: "See only teachers who meet your qualification requirements — scored and sorted so your best options are at the top." },
  { step: "4", title: "Hire with confidence", body: "Schedule interviews, review demo videos, collect documents, and send offers — all from your hiring dashboard." },
];

const HOW_IT_WORKS_TEACHER = [
  { step: "1", title: "Build your Teacher Passport", body: "Add qualifications, TET status, subject, medium, experience, and a demo class video. One profile works everywhere on EduHire." },
  { step: "2", title: "Set your availability", body: "Mark yourself as available immediately, after notice period, part-time, or for online classes. Schools see exactly when you can join." },
  { step: "3", title: "Apply only where you fit", body: "See your fit score for every role before you apply. Schools with salary and workload declared upfront — no surprises after offer." },
  { step: "4", title: "Get shortlisted faster", body: "Verified profiles with complete qualification proof move to the top of school shortlists. Less waiting, more relevant callbacks." },
];

const FAQS = [
  {
    q: "Is EduHire free for teachers?",
    a: "Yes. Searching for jobs, building your Teacher Passport, and applying to roles is completely free for teachers. There is no placement fee, no pay-to-apply model, and no agent taking a commission. Teachers should never pay to get a job interview.",
  },
  {
    q: "How does EduHire verify schools?",
    a: "Schools submit their UDISE code or board registration, an official point of contact, and a declared salary band before any job post goes live. Verified schools earn a trust badge visible on every listing so teachers know the school is legitimate.",
  },
  {
    q: "Who controls my documents and profile data?",
    a: "You do. Teachers control which schools can see their documents. Phone numbers are masked until you are shortlisted. You can delete your account and data at any time. Documents are shared only with your consent — not automatically sent to every school that searches.",
  },
  {
    q: "Can I apply if I am a fresher with a B.Ed or D.El.Ed but no experience?",
    a: "Yes. Schools can filter for freshers specifically. Your Teacher Passport lets you upload qualification certificates, TET score, and a demo class video so schools can assess your readiness without prior employment.",
  },
  {
    q: "What if a school posts a fake job or charges a placement fee?",
    a: "Any school posting a job must pass verification first. If a school asks you to pay any fee to apply or get an interview, report it immediately. All listings carry a verified no-fee-from-teacher badge. Suspicious posts are reviewed and removed.",
  },
  {
    q: "How is this different from Naukri, LinkedIn, or a WhatsApp group?",
    a: "Generic platforms have no qualification verification, no salary transparency, and no commute matching. EduHire shows schools only teachers who meet actual role requirements — TNTET status, board fit, medium, commute distance — and shows teachers only schools that have declared salary and working conditions upfront.",
  },
];

export default async function HomePage() {
  const { jobCount, schoolCount } = await getStats();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQS.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "EduHire",
    "url": "https://theeduhire.in",
    "logo": "https://theeduhire.in/logo.png",
    "description": "Connecting passionate educators with leading schools across India through verified profiles and smart matching.",
    "foundingDate": "2024",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IN"
    },
    "sameAs": [
      "https://www.linkedin.com/company/eduhire",
      "https://twitter.com/eduhire"
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden border-b border-eh"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 10% 0%, rgba(10,102,194,0.1) 0%, transparent 55%), radial-gradient(ellipse 55% 45% at 90% 10%, rgba(0,65,130,0.07) 0%, transparent 50%), linear-gradient(180deg, #f0f6fc 0%, #e8f1fa 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.09) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative mx-auto grid max-w-[1280px] gap-12 px-5 pb-16 pt-20 md:px-8 md:pt-24 lg:grid-cols-[minmax(0,1.1fr)_minmax(400px,0.9fr)] lg:items-center lg:gap-14 lg:pb-28 lg:pt-32">
          <div className="max-w-[660px]">
            <HomeHeroText jobCount={jobCount} schoolCount={schoolCount} />
          </div>

          {/* Hero card */}
          <ScrollReveal delay={180} variant="scale-in" className="lg:justify-self-end">
            <div className="relative overflow-hidden rounded-[30px] border border-[rgba(15,23,42,0.09)] bg-[#0a1929] p-5 text-white shadow-[0_40px_100px_rgba(8,15,30,0.28)] md:p-6">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(96,165,250,0.18),transparent_42%)]" />
              <div className="relative">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/50">Live match example</p>
                    <h2 className="mt-1.5 text-[20px] font-semibold tracking-[-0.03em]">CBSE Maths, Grade 9–12</h2>
                  </div>
                  <div className="rounded-full bg-white/8 px-3 py-1 text-[11px] font-semibold text-[#93c5fd] ring-1 ring-[#60a5fa]/25">
                    English medium
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr]">
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={15} className="text-[#60a5fa]" />
                      <p className="text-[12.5px] font-semibold">Teacher Passport</p>
                    </div>
                    <div className="mt-3.5 space-y-2.5 text-[12px] text-white/65">
                      {[
                        "B.Sc Maths + B.Ed — verified",
                        "TNTET Paper II — passed",
                        "CBSE board · English medium",
                        "3 yrs experience · 30-day notice",
                      ].map((item) => (
                        <div key={item} className="flex items-start gap-2">
                          <Check size={12} className="mt-0.5 shrink-0 text-[#60a5fa]" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[12.5px] font-semibold">Your fit score</p>
                          <p className="mt-0.5 text-[11px] leading-tight text-white/55">Subject · Board · Salary · Distance</p>
                        </div>
                        <div className="rounded-full bg-[#60a5fa]/12 px-2.5 py-1 text-[11px] font-bold text-[#93c5fd] ring-1 ring-[#60a5fa]/25">
                          94% fit
                        </div>
                      </div>
                      <div className="mt-3 space-y-1.5 text-[11.5px]">
                        {[
                          { label: "Eligible", value: "8 teachers", color: "text-[#60a5fa]" },
                          { label: "Likely eligible", value: "5 teachers", color: "text-white/70" },
                          { label: "Needs docs", value: "3 teachers", color: "text-white/45" },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between rounded-xl border border-white/8 bg-black/10 px-3 py-2">
                            <span className="text-white/60">{item.label}</span>
                            <span className={`font-semibold ${item.color}`}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4">
                      <div className="flex items-center gap-2">
                        <Building2 size={15} className="text-[#60a5fa]" />
                        <p className="text-[12.5px] font-semibold">School declared</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5 text-[10.5px] text-white/65">
                        {["₹28,000/mo", "No Saturdays", "PF included", "Demo required", "30-day join"].map((item) => (
                          <span key={item} className="rounded-full bg-white/8 px-2.5 py-1 ring-1 ring-white/10">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3 text-[11.5px] leading-[1.6] text-white/55">
                  Schools see only matched teachers. Teachers see fit score and full salary before applying.
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── MARQUEE ──────────────────────────────────────────────────────────── */}
      <section className="overflow-hidden border-b border-eh bg-white py-4">
        <div className="marquee">
          <div className="marquee-track">
            {[0, 1].map((group) => (
              <div key={group} className="marquee-group">
                {SIGNAL_ITEMS.map((item, index) => (
                  <span
                    key={`${group}-${item}-${index}`}
                    className="inline-flex items-center gap-2.5 whitespace-nowrap px-6 text-[13px] font-medium tracking-[-0.01em] text-[var(--eh-text-3)]"
                  >
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-brand-400)]" />
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR SCHOOLS ──────────────────────────────────────────────────────── */}
      <section id="for-schools" className="border-b border-eh bg-white px-5 py-20 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1160px]">
          <ScrollReveal className="max-w-[620px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-600)]">For schools</p>
            <h2 className="mt-3 text-[clamp(1.9rem,3.2vw,2.8rem)] font-semibold leading-[1.08] tracking-[-0.04em] text-[var(--eh-text)]">
              Stop sorting through the wrong candidates.
            </h2>
            <p className="mt-4 max-w-[560px] text-[15px] leading-[1.8] text-[var(--eh-text-2)]">
              EduHire shows you teachers who match your actual requirements — right subject, right qualification, right commute distance — before your first conversation.
            </p>
          </ScrollReveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FOR_SCHOOLS.map((item, index) => (
              <ScrollReveal key={item.title} delay={index * 55}>
                <article className="flex h-full flex-col rounded-[28px] border border-[var(--eh-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f5f8fc_100%)] p-6 transition-shadow duration-300 hover:shadow-md">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-brand-50)] text-[var(--color-brand-600)]">
                    <item.icon size={20} />
                  </div>
                  <h3 className="mt-5 text-[16px] font-semibold tracking-[-0.025em] text-[var(--eh-text)]">{item.title}</h3>
                  <p className="mt-2.5 text-[13.5px] leading-[1.75] text-[var(--eh-text-2)]">{item.body}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={120} className="mt-8">
            <div className="flex flex-wrap gap-3">
              <Link href="/auth/signup?role=school" className="eh-btn eh-btn-primary shadow-[0_6px_18px_rgba(21,125,78,0.22)]">
                Register your school <ArrowRight size={14} />
              </Link>
              <Link href="/jobs" className="eh-btn eh-btn-secondary">
                Browse teacher profiles
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── FOR TEACHERS ─────────────────────────────────────────────────────── */}
      <section id="for-teachers" className="border-b border-eh bg-[var(--surface-base)] px-5 py-20 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1160px]">
          <ScrollReveal className="max-w-[620px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-600)]">For teachers</p>
            <h2 className="mt-3 text-[clamp(1.9rem,3.2vw,2.8rem)] font-semibold leading-[1.08] tracking-[-0.04em] text-[var(--eh-text)]">
              Apply knowing exactly what you are walking into.
            </h2>
            <p className="mt-4 max-w-[560px] text-[15px] leading-[1.8] text-[var(--eh-text-2)]">
              Every school on EduHire has declared their salary, workload, and joining terms before you spend time on a single application.
            </p>
          </ScrollReveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FOR_TEACHERS.map((item, index) => (
              <ScrollReveal key={item.title} delay={index * 55}>
                <article className="flex h-full flex-col rounded-[28px] border border-[var(--eh-border)] bg-white p-6 transition-shadow duration-300 hover:shadow-md">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-brand-50)] text-[var(--color-brand-600)]">
                    <item.icon size={20} />
                  </div>
                  <h3 className="mt-5 text-[16px] font-semibold tracking-[-0.025em] text-[var(--eh-text)]">{item.title}</h3>
                  <p className="mt-2.5 text-[13.5px] leading-[1.75] text-[var(--eh-text-2)]">{item.body}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={120} className="mt-8">
            <div className="flex flex-wrap gap-3">
              <Link href="/auth/signup?role=teacher" className="eh-btn eh-btn-primary shadow-[0_6px_18px_rgba(21,125,78,0.22)]">
                Create your Teacher Passport <ArrowRight size={14} />
              </Link>
              <Link href="/jobs" className="eh-btn eh-btn-secondary">
                Browse open roles
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section id="platform" className="border-b border-eh bg-white px-5 py-20 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1160px]">
          <ScrollReveal className="mx-auto max-w-[560px] text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-600)]">How it works</p>
            <h2 className="mt-3 font-display text-[clamp(1.9rem,3vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.04em] text-[var(--eh-text)]">
              Simple for schools. Simple for teachers.
            </h2>
          </ScrollReveal>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <ScrollReveal>
              <div className="rounded-[30px] border border-[var(--eh-border)] bg-[var(--surface-base)] p-7">
                <div className="flex items-center gap-3 border-b border-[var(--eh-border)] pb-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand-50)] text-[var(--color-brand-600)]">
                    <Building2 size={17} />
                  </div>
                  <h3 className="text-[17px] font-semibold tracking-[-0.025em] text-[var(--eh-text)]">For schools</h3>
                </div>
                <div className="mt-6 space-y-5">
                  {HOW_IT_WORKS_SCHOOL.map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-600)] text-[11px] font-bold text-white">
                        {item.step}
                      </span>
                      <div>
                        <p className="text-[14.5px] font-semibold text-[var(--eh-text)]">{item.title}</p>
                        <p className="mt-1 text-[13.5px] leading-[1.7] text-[var(--eh-text-3)]">{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-7 border-t border-[var(--eh-border)] pt-5">
                  <Link href="/auth/signup?role=school" className="eh-btn eh-btn-primary w-full justify-center">
                    Register your school
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={80}>
              <div className="rounded-[30px] border border-[var(--eh-border)] bg-[var(--surface-base)] p-7">
                <div className="flex items-center gap-3 border-b border-[var(--eh-border)] pb-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand-50)] text-[var(--color-brand-600)]">
                    <BookOpen size={17} />
                  </div>
                  <h3 className="text-[17px] font-semibold tracking-[-0.025em] text-[var(--eh-text)]">For teachers</h3>
                </div>
                <div className="mt-6 space-y-5">
                  {HOW_IT_WORKS_TEACHER.map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-600)] text-[11px] font-bold text-white">
                        {item.step}
                      </span>
                      <div>
                        <p className="text-[14.5px] font-semibold text-[var(--eh-text)]">{item.title}</p>
                        <p className="mt-1 text-[13.5px] leading-[1.7] text-[var(--eh-text-3)]">{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-7 border-t border-[var(--eh-border)] pt-5">
                  <Link href="/auth/signup?role=teacher" className="eh-btn eh-btn-secondary w-full justify-center border-[var(--color-brand-200)] text-[var(--color-brand-700)] hover:bg-[var(--color-brand-50)]">
                    Create your Teacher Passport
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── CHILD SAFETY — dedicated full-width moment ───────────────────────── */}
      <section className="border-b border-eh bg-[var(--surface-base)] px-5 py-20 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1160px]">
          <div className="overflow-hidden rounded-[32px] border border-[rgba(10,102,194,0.16)] bg-[linear-gradient(135deg,#f0f6fc_0%,#e8f1fa_100%)]">
            <div className="grid gap-0 lg:grid-cols-[1fr_1px_1fr]">
              <div className="p-8 md:p-10">
                <ScrollReveal>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-600)] text-white">
                    <ShieldCheck size={22} />
                  </div>
                  <h2 className="mt-5 text-[clamp(1.5rem,2.4vw,2rem)] font-semibold leading-[1.15] tracking-[-0.04em] text-[var(--eh-text)]">
                    Child-safety hiring is built in, not bolted on.
                  </h2>
                  <p className="mt-4 text-[15px] leading-[1.8] text-[var(--eh-text-2)]">
                    Every child deserves a safe classroom. EduHire builds child protection directly into the hiring process — not as a checkbox, but as a standard every teacher and school is expected to meet.
                  </p>
                  <div className="mt-6 space-y-3">
                    {[
                      "Police and character verification workflow for teachers",
                      "Previous employment reference check process",
                      "POCSO awareness declaration required before hiring",
                      "Child-safety training badge on verified teacher profiles",
                      "Code of conduct acceptance for every teacher",
                      "Documented onboarding checklist provided to schools",
                    ].map((pt) => (
                      <p key={pt} className="flex items-start gap-2.5 text-[14px] leading-[1.7] text-[var(--eh-text-2)]">
                        <Check size={15} className="mt-0.5 shrink-0 text-[var(--color-brand-600)]" />
                        {pt}
                      </p>
                    ))}
                  </div>
                </ScrollReveal>
              </div>

              <div className="hidden bg-[rgba(10,102,194,0.08)] lg:block" />

              <div className="p-8 md:p-10">
                <ScrollReveal delay={80}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[var(--color-brand-600)] ring-1 ring-[rgba(10,102,194,0.2)]">
                    <LockKeyhole size={22} />
                  </div>
                  <h2 className="mt-5 text-[clamp(1.5rem,2.4vw,2rem)] font-semibold leading-[1.15] tracking-[-0.04em] text-[var(--eh-text)]">
                    Your data stays yours. Always.
                  </h2>
                  <p className="mt-4 text-[15px] leading-[1.8] text-[var(--eh-text-2)]">
                    Teachers share sensitive documents — certificates, salary history, ID proof, address. We handle this with consent-first controls and zero unnecessary collection.
                  </p>
                  <div className="mt-6 space-y-3">
                    {[
                      "Your profile is shared with a school only when you consent",
                      "Phone number is masked until you are shortlisted",
                      "You control which documents each school can see",
                      "Delete your account and all data at any time",
                      "No Aadhaar storage beyond what is legally required",
                      "Privacy notice available in Tamil and English",
                    ].map((pt) => (
                      <p key={pt} className="flex items-start gap-2.5 text-[14px] leading-[1.7] text-[var(--eh-text-2)]">
                        <Check size={15} className="mt-0.5 shrink-0 text-[var(--color-brand-600)]" />
                        {pt}
                      </p>
                    ))}
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST COMMITMENTS — both sides ───────────────────────────────────── */}
      <section className="border-b border-eh bg-[#0a1929] px-5 py-16 text-white md:px-8 md:py-20">
        <div className="relative mx-auto max-w-[1160px]">
          <ScrollReveal className="mx-auto max-w-[580px] text-center">
            <h2 className="font-display text-[clamp(1.7rem,2.8vw,2.2rem)] font-semibold leading-[1.1] tracking-[-0.04em]">
              Built around one principle — both sides deserve clarity.
            </h2>
            <p className="mt-4 text-[15px] leading-[1.8] text-white/58">
              Teachers deserve salary, workload, and school conditions upfront. Schools deserve verified qualifications and real classroom proof before shortlisting.
            </p>
          </ScrollReveal>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "For teachers",
                points: [
                  "Always free to apply",
                  "No placement fee, ever",
                  "Salary visible before you apply",
                  "Verified schools only",
                  "You control your document access",
                  "Phone masked until shortlisted",
                ],
              },
              {
                label: "For schools",
                points: [
                  "Qualification-matched shortlists",
                  "Demo class proof before interview",
                  "Salary band required on every post",
                  "Document collection in one flow",
                  "AI-assisted job descriptions",
                  "WhatsApp interview reminders",
                ],
              },
              {
                label: "For everyone",
                points: [
                  "No fake job listings",
                  "No hidden agent commissions",
                  "Data shared only with consent",
                  "Child-safety standards required",
                  "Suspicious posts can be reported",
                  "No pay-to-get-interview model",
                ],
              },
            ].map((col, i) => (
              <ScrollReveal key={col.label} delay={i * 70}>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#60a5fa]">{col.label}</p>
                  <div className="mt-4 space-y-2.5">
                    {col.points.map((pt) => (
                      <p key={pt} className="flex items-start gap-2.5 text-[13px] leading-[1.6] text-white/70">
                        <Check size={13} className="mt-0.5 shrink-0 text-[#60a5fa]" />
                        {pt}
                      </p>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── AVAILABILITY + URGENT POOL — teacher-facing feature moment ───────── */}
      <section className="border-b border-eh bg-white px-5 py-20 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1160px]">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
            <ScrollReveal>
              <div className="rounded-[30px] border border-[var(--eh-border)] bg-[var(--surface-base)] p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-brand-50)] text-[var(--color-brand-600)]">
                  <Calendar size={20} />
                </div>
                <h3 className="mt-5 text-[20px] font-semibold tracking-[-0.03em] text-[var(--eh-text)]">
                  Set your availability once. Schools find you.
                </h3>
                <p className="mt-3 text-[14.5px] leading-[1.8] text-[var(--eh-text-2)]">
                  Teachers mark exactly when and how they are available. Schools filter by joining urgency — no more calling teachers who are unavailable.
                </p>
                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  {[
                    "Available immediately",
                    "After notice period",
                    "From next academic year",
                    "Part-time only",
                    "Online classes only",
                    "Open to relocation",
                    "Exam revision available",
                    "Hostel or residential roles",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 rounded-xl border border-[var(--eh-border)] bg-white px-3 py-2.5 text-[13px] text-[var(--eh-text-2)]">
                      <Check size={13} className="shrink-0 text-[var(--color-brand-500)]" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={80}>
              <div className="rounded-[30px] border border-[var(--eh-border)] bg-[var(--surface-base)] p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-brand-50)] text-[var(--color-brand-600)]">
                  <Clock size={20} />
                </div>
                <h3 className="mt-5 text-[20px] font-semibold tracking-[-0.03em] text-[var(--eh-text)]">
                  Need a teacher urgently? Replacement pool ready.
                </h3>
                <p className="mt-3 text-[14.5px] leading-[1.8] text-[var(--eh-text-2)]">
                  Resignation, maternity leave, board-exam season, sudden vacancy — a dedicated pool of teachers who can join fast, without going through a full hiring cycle.
                </p>
                <div className="mt-6 space-y-2.5">
                  {[
                    { badge: "Join in 48 hours", desc: "Immediate joiners verified and ready" },
                    { badge: "Available 3 months", desc: "Temporary and short-term specialists" },
                    { badge: "Board exam revision", desc: "Subject specialists for revision season" },
                    { badge: "KG substitute", desc: "Early childhood cover teachers" },
                    { badge: "NEET / JEE support", desc: "Foundation subject specialists" },
                  ].map((item) => (
                    <div key={item.badge} className="flex items-start gap-3 rounded-2xl border border-[var(--eh-border)] bg-white px-4 py-3">
                      <span className="mt-0.5 rounded-full bg-[var(--color-brand-50)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-brand-700)] ring-1 ring-[rgba(10,102,194,0.14)]">
                        {item.badge}
                      </span>
                      <p className="text-[13px] text-[var(--eh-text-3)]">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section id="questions" className="border-b border-eh bg-[var(--surface-base)] px-5 py-20 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1120px]">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:items-start">
            <ScrollReveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-600)]">Common questions</p>
              <h2 className="mt-3 font-display text-[clamp(1.8rem,3vw,2.4rem)] font-semibold leading-[1.1] tracking-[-0.04em] text-[var(--eh-text)]">
                Answers before you sign up.
              </h2>
              <p className="mt-4 text-[15px] leading-[1.8] text-[var(--eh-text-2)]">
                No vague promises. If something is not ready yet, we say so.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <FAQAccordion items={FAQS} />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────────────────────────────── */}
      <section id="contact" className="border-b border-eh bg-white px-5 py-20 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1160px]">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
            <ScrollReveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-600)]">Get in touch</p>
              <h2 className="mt-3 text-[clamp(1.7rem,2.9vw,2.4rem)] font-semibold leading-[1.12] tracking-[-0.04em] text-[var(--eh-text)]">
                Questions? We respond personally.
              </h2>
              <p className="mt-4 text-[15px] leading-[1.8] text-[var(--eh-text-2)]">
                Whether you are a school looking to register, a teacher with a profile question, or a B.Ed or D.El.Ed college exploring campus partnerships — write to us directly.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  "KG and primary schools",
                  "CBSE and Matriculation schools",
                  "B.Ed and D.El.Ed colleges",
                  "School management groups",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 rounded-2xl border border-[var(--eh-border)] bg-[var(--surface-base)] px-4 py-3 text-[14px] font-medium text-[var(--eh-text-2)]">
                    <Check size={13} className="shrink-0 text-[var(--color-brand-500)]" />
                    {item}
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={80}>
              <div className="rounded-[32px] border border-[var(--eh-border)] bg-[var(--surface-base)] p-6 md:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-600)]">Contact</p>
                <h2 className="mt-3 text-[clamp(1.5rem,2.4vw,1.9rem)] font-semibold leading-[1.2] tracking-[-0.04em] text-[var(--eh-text)]">
                  Write to us or start your free registration now.
                </h2>
                <p className="mt-4 text-[14.5px] leading-[1.8] text-[var(--eh-text-2)]">
                  Serving Tamil Nadu schools and teachers across Chennai, Coimbatore, Madurai, and beyond.
                </p>
                <div className="mt-6 space-y-2.5">
                  <a
                    href="mailto:hello@theeduhire.in"
                    className="flex items-center gap-3 rounded-2xl border border-[var(--eh-border)] bg-white px-4 py-3.5 text-[14px] font-medium text-[var(--eh-text)] transition-all hover:border-[var(--color-brand-200)] hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-700)]"
                  >
                    <MessageSquareShare size={15} className="shrink-0 text-[var(--color-brand-600)]" />
                    hello@theeduhire.in
                    <span className="ml-auto text-[12px] font-normal text-[var(--eh-text-4)]">Write to us</span>
                  </a>
                  <div className="flex items-center gap-3 rounded-2xl border border-[var(--eh-border)] bg-white px-4 py-3.5 text-[14px] text-[var(--eh-text-2)]">
                    <MapPin size={15} className="shrink-0 text-[var(--color-brand-600)]" />
                    Tamil Nadu — all districts welcome
                  </div>
                </div>
                <div className="mt-7 flex flex-wrap gap-3">
                  <a href="mailto:hello@theeduhire.in" className="eh-btn eh-btn-primary shadow-[0_6px_18px_rgba(21,125,78,0.24)]">
                    Email the team <ArrowRight size={14} />
                  </a>
                  <Link href="/auth/signup?role=school" className="eh-btn eh-btn-secondary">
                    Register your school
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────────── */}
      <section className="bg-[var(--surface-base)] px-5 pb-14 pt-6 md:px-8 md:pb-18">
        <ScrollReveal className="mx-auto max-w-[1160px] overflow-hidden rounded-[34px] border border-[rgba(15,23,42,0.08)] bg-[linear-gradient(135deg,#0a1929_0%,#0d2240_55%,#091b38_100%)] px-8 py-16 text-white md:px-14">
          <div className="mx-auto max-w-[560px] text-center">
            <h2 className="font-display text-[clamp(1.8rem,3.2vw,2.6rem)] font-semibold leading-[1.12] tracking-[-0.04em]">
              The right hire starts with the right information.
            </h2>
            <p className="mt-4 text-[15px] leading-[1.8] text-white/55">
              Join Tamil Nadu schools and teachers who are done with resume spam, salary surprises, and hiring through WhatsApp forwards.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/auth/signup?role=school"
                className="w-full rounded-2xl bg-white px-6 py-3 text-[14px] font-semibold text-[#0a1929] shadow-[0_8px_24px_rgba(255,255,255,0.14)] transition-all hover:bg-white/92 sm:w-auto"
              >
                Start hiring for free
              </Link>
              <Link
                href="/auth/signup?role=teacher"
                className="w-full rounded-2xl border border-white/14 bg-white/7 px-6 py-3 text-[14px] font-semibold text-white/80 transition-all hover:bg-white/12 hover:text-white sm:w-auto"
              >
                Find teaching jobs
              </Link>
            </div>
            <p className="mt-5 text-[12px] text-white/35">Free for teachers · Verified schools only · Tamil Nadu focused</p>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
