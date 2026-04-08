import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  Search, Plus, Clock, Building2, DollarSign, GraduationCap, ArrowRight, CheckCircle2,
} from "lucide-react";

const getStats = unstable_cache(
  async () => {
    try {
      const [jobCount, schoolCount] = await Promise.all([
        prisma.jobPosting.count({ where: { status: "ACTIVE" } }),
        prisma.schoolProfile.count(),
      ]);
      return { jobCount, schoolCount };
    } catch (error) {
      console.error("Failed to load homepage stats:", error);
      return { jobCount: 0, schoolCount: 0 };
    }
  },
  ["homepage-stats"],
  { revalidate: 3600 }
);

export default async function HomePage() {
  const { jobCount, schoolCount } = await getStats();

  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden px-5 pt-16 pb-20 lg:pt-20 lg:pb-24">
        {/* Background layers */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{
            background: "radial-gradient(ellipse 90% 70% at 50% -5%, rgba(31,155,99,0.11) 0%, transparent 65%)",
          }} className="absolute inset-0" />
          <div style={{
            background: "radial-gradient(ellipse 40% 40% at 85% 30%, rgba(234,108,10,0.06) 0%, transparent 60%)",
          }} className="absolute inset-0" />
        </div>

        <div className="relative z-10 max-w-[700px] mx-auto text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-brand-100 text-brand-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 shadow-xs animate-fade-up">
            <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
            Tamil Nadu&apos;s Premier Teacher Job Platform
          </div>

          <h1 className="font-display text-[clamp(2rem,5.5vw+0.5rem,3.5rem)] leading-[1.1] font-bold text-gray-900 tracking-[-0.02em] mb-5 animate-fade-up delay-75">
            Find Your{" "}
            <em className="text-brand-500 not-italic" style={{ fontStyle: "italic" }}>
              Perfect Classroom
            </em>
          </h1>

          <p className="text-[clamp(15px,1.5vw,17px)] text-gray-500 leading-relaxed max-w-[500px] mx-auto mb-8 animate-fade-up delay-150">
            Connecting passionate educators with leading schools across 15+ cities in Tamil Nadu. Your next teaching opportunity is a click away.
          </p>

          {/* CTAs */}
          <div className="flex gap-3 justify-center flex-wrap animate-fade-up delay-200">
            <Link
              href="/jobs"
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-[15px] font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-all duration-200 shadow-brand hover:shadow-brand-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              <Search size={15} />
              Browse Teaching Jobs
              <ArrowRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-150" />
            </Link>
            <Link
              href="/dashboard/post-job"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-[15px] font-semibold bg-white text-gray-700 border border-black/[0.08] hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200 shadow-sm"
            >
              <Plus size={15} />
              Post a Job Opening
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex gap-8 sm:gap-12 justify-center mt-14 animate-fade-up delay-300">
            {[
              { value: `${jobCount}+`, label: "Open Positions" },
              { value: "15+", label: "Cities" },
              { value: `${schoolCount}+`, label: "Partner Schools" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-[clamp(22px,3vw,32px)] font-bold text-brand-600 leading-none tracking-[-0.02em]">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-400 mt-1.5 font-medium tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="px-5 py-16 max-w-[1100px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-gray-900 tracking-[-0.02em]">
            Why EduHire?
          </h2>
          <p className="text-sm text-gray-500 mt-2">Built by educators, for educators</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: <Clock size={18} />,
              title: "Faster Hiring",
              desc: "From application to offer in 2–3 weeks. Direct school connections, no middlemen.",
              color: "brand",
            },
            {
              icon: <Building2 size={18} />,
              title: "Verified Schools",
              desc: "Every institution vetted with 5-point verification for legitimate, fair opportunities.",
              color: "blue",
            },
            {
              icon: <DollarSign size={18} />,
              title: "Better Pay",
              desc: "Access positions 15–30% above market average through our school partnerships.",
              color: "accent",
            },
            {
              icon: <GraduationCap size={18} />,
              title: "All Boards",
              desc: "CBSE, ICSE, State Board, IB, Cambridge — every curriculum covered.",
              color: "purple",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="card card-hover p-6 group"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 transition-all duration-200 ${
                f.color === "brand" ? "bg-brand-50 text-brand-600 group-hover:bg-brand-500 group-hover:text-white" :
                f.color === "blue"  ? "bg-blue-50 text-blue-600 group-hover:bg-blue-500 group-hover:text-white" :
                f.color === "accent"? "bg-accent-50 text-accent-500 group-hover:bg-accent-500 group-hover:text-white" :
                "bg-purple-50 text-purple-600 group-hover:bg-purple-500 group-hover:text-white"
              }`}>
                {f.icon}
              </div>
              <h3 className="text-[15px] font-semibold text-gray-900 mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="px-5 py-16 bg-white border-y border-black/[0.05]">
        <div className="max-w-[920px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-gray-900 tracking-[-0.02em]">
              How It Works
            </h2>
            <p className="text-sm text-gray-500 mt-2">Three steps to your next teaching position</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                step: "01",
                title: "Browse & Filter",
                desc: "Search by subject, location, board, and grade level. Our split-view lets you scan listings and read details without leaving the page.",
              },
              {
                step: "02",
                title: "Apply Directly",
                desc: "One-click apply with your saved profile. Upload your resume, write a cover letter, and submit — directly to the school.",
              },
              {
                step: "03",
                title: "Get Hired",
                desc: "Track application status in real-time. Schools review, shortlist, and reach out directly. Average time to offer: 2–3 weeks.",
              },
            ].map((s, i) => (
              <div key={i} className="relative">
                <div
                  className="text-[64px] font-display font-bold leading-none mb-4 tracking-[-0.04em]"
                  style={{ color: "rgba(31,155,99,0.08)" }}
                >
                  {s.step}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  <h3 className="text-[15px] font-semibold text-gray-900">{s.title}</h3>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed pl-3.5">{s.desc}</p>

                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute right-0 top-8 w-10 h-px bg-gradient-to-r from-brand-200 to-transparent translate-x-full" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── For Schools ─── */}
      <section className="px-5 py-16">
        <div className="max-w-[840px] mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-10 lg:p-14 text-center">
            {/* Background decoration */}
            <div className="absolute inset-0 pointer-events-none">
              <div style={{
                background: "radial-gradient(ellipse 60% 60% at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 60%)"
              }} className="absolute inset-0" />
              <div style={{
                background: "radial-gradient(ellipse 40% 40% at 20% 80%, rgba(255,255,255,0.05) 0%, transparent 60%)"
              }} className="absolute inset-0" />
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5">
                <Building2 size={12} />
                For Schools & Institutions
              </div>
              <h2 className="font-display text-[clamp(1.4rem,2.8vw,2rem)] font-bold text-white mb-3 tracking-[-0.02em]">
                Hiring Teachers?
              </h2>
              <p className="text-brand-100 text-[15px] leading-relaxed max-w-[480px] mx-auto mb-8">
                Post your teaching positions and reach thousands of qualified educators across Tamil Nadu. Free to get started.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link
                  href="/dashboard/post-job"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-[15px] font-semibold bg-white text-brand-700 hover:bg-brand-50 transition-all duration-150 shadow-lg"
                >
                  Post a Job for Free
                  <ArrowRight size={15} />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-[15px] font-semibold border border-white/25 text-white hover:bg-white/10 transition-all duration-150"
                >
                  Talk to Our Team
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="px-5 py-16 text-center border-t border-black/[0.05] bg-white">
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-display text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-gray-900 mb-2 tracking-[-0.02em]">
            Ready to Start?
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Whether you&apos;re hiring or looking — we&apos;ve got you covered
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-[15px] font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-all duration-150 shadow-brand hover:-translate-y-0.5"
            >
              <Search size={15} />
              I&apos;m a Teacher — Find Jobs
            </Link>
            <Link
              href="/dashboard/post-job"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-[15px] font-semibold bg-accent-500 text-white hover:bg-accent-600 transition-all duration-150 shadow-md hover:-translate-y-0.5"
            >
              <Plus size={15} />
              I&apos;m a School — Post a Job
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
