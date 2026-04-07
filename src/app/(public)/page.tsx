import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  Search, Plus, Clock, Building2, DollarSign, GraduationCap,
  ArrowRight, CheckCircle2,
} from "lucide-react";

const getStats = unstable_cache(
  async () => {
    const [jobCount, schoolCount] = await Promise.all([
      prisma.jobPosting.count({ where: { status: "ACTIVE" } }),
      prisma.schoolProfile.count(),
    ]);
    return { jobCount, schoolCount };
  },
  ["homepage-stats"],
  { revalidate: 3600 }
);

export default async function HomePage() {
  const { jobCount, schoolCount } = await getStats();

  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden px-5 pt-20 pb-14 lg:pt-24 lg:pb-16 text-center">
        {/* Radial gradient bg */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 70% 55% at 50% -5%, #D8F3DC 0%, transparent 70%)",
        }} />

        <div className="relative z-10 max-w-[660px] mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-accent-50 text-accent-500 text-[12.5px] font-semibold px-3.5 py-1 rounded-full mb-5 animate-fade-up">
            <GraduationCap size={14} />
            Tamil Nadu&apos;s Teacher Job Platform
          </div>

          <h1 className="font-display text-[clamp(32px,5.5vw,54px)] leading-[1.12] font-bold text-gray-900 mb-4 animate-fade-up [animation-delay:80ms]">
            Find Your{" "}
            <em className="text-brand-500 italic">Perfect Classroom</em>
          </h1>

          <p className="text-[16px] text-gray-500 leading-relaxed max-w-[480px] mx-auto mb-7 animate-fade-up [animation-delay:150ms]">
            Connecting passionate educators with leading schools across 15+ cities in Tamil Nadu. Your next teaching opportunity is just a click away.
          </p>

          <div className="flex gap-2.5 justify-center flex-wrap animate-fade-up [animation-delay:220ms]">
            <Link
              href="/jobs"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-[14.5px] font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Search size={16} />
              Browse Teaching Jobs
            </Link>
            <Link
              href="/dashboard/post-job"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-[14.5px] font-semibold bg-white text-gray-700 border border-gray-200 hover:border-brand-500 hover:text-brand-500 transition-all"
            >
              <Plus size={16} />
              Post a Job Opening
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-10 justify-center mt-14 animate-fade-up [animation-delay:300ms]">
            <div className="text-center">
              <div className="font-display text-[28px] font-bold text-brand-600">
                {jobCount}+
              </div>
              <div className="text-[12.5px] text-gray-400 mt-0.5">
                Open Positions
              </div>
            </div>
            <div className="text-center">
              <div className="font-display text-[28px] font-bold text-brand-600">
                15+
              </div>
              <div className="text-[12.5px] text-gray-400 mt-0.5">Cities</div>
            </div>
            <div className="text-center">
              <div className="font-display text-[28px] font-bold text-brand-600">
                {schoolCount}+
              </div>
              <div className="text-[12.5px] text-gray-400 mt-0.5">Schools</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="px-5 py-14 max-w-[1100px] mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-display text-[clamp(26px,3.5vw,36px)] font-bold">
            Why Choose EduHire?
          </h2>
          <p className="text-[14.5px] text-gray-500 mt-1">
            Built by educators, for educators
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: <Clock size={20} />,
              title: "Faster Hiring",
              desc: "From application to offer in 2-3 weeks. No middlemen, direct school connections.",
            },
            {
              icon: <Building2 size={20} />,
              title: "Verified Schools",
              desc: "Every institution vetted with 5-point verification for legitimate, fair opportunities.",
            },
            {
              icon: <DollarSign size={20} />,
              title: "Better Pay",
              desc: "Access positions with 15-30% above market average through our school partnerships.",
            },
            {
              icon: <GraduationCap size={20} />,
              title: "All Boards",
              desc: "CBSE, ICSE, State Board, IB, Cambridge — every curriculum covered.",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-2xl p-6 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-brand-500 group"
            >
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-500 mb-4 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                {f.icon}
              </div>
              <h3 className="text-[15px] font-semibold mb-1.5">{f.title}</h3>
              <p className="text-[13.5px] text-gray-500 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="px-5 py-14 bg-white">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-display text-[clamp(26px,3.5vw,36px)] font-bold">
              How It Works
            </h2>
            <p className="text-[14.5px] text-gray-500 mt-1">
              Three steps to your next teaching position
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Browse & Filter",
                desc: "Search by subject, location, board, and grade level. Our LinkedIn-style split view lets you scan listings and read details without leaving the page.",
              },
              {
                step: "02",
                title: "Apply Directly",
                desc: "One-click apply with your saved profile. Upload your resume, write a cover letter, and submit — directly to the school, no middlemen.",
              },
              {
                step: "03",
                title: "Get Hired",
                desc: "Track your application status in real-time. Schools review, shortlist, and reach out to you directly. Average time to offer: 2-3 weeks.",
              },
            ].map((s, i) => (
              <div key={i} className="relative">
                <div className="text-[48px] font-display font-bold text-brand-50 leading-none mb-3">
                  {s.step}
                </div>
                <h3 className="text-[16px] font-semibold mb-2">{s.title}</h3>
                <p className="text-[13.5px] text-gray-500 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── For Schools ─── */}
      <section className="px-5 py-14">
        <div className="max-w-[800px] mx-auto bg-brand-600 rounded-3xl p-10 lg:p-14 text-center text-white">
          <h2 className="font-display text-[clamp(24px,3vw,32px)] font-bold mb-3">
            Hiring Teachers?
          </h2>
          <p className="text-brand-100 text-[15px] leading-relaxed max-w-[500px] mx-auto mb-7">
            Post your teaching positions and reach thousands of qualified educators across Tamil Nadu. Free to get started.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/dashboard/post-job"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-[14.5px] font-semibold bg-white text-brand-600 hover:bg-brand-50 transition-colors"
            >
              Post a Job for Free
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/contact"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-[14.5px] font-semibold border border-white/30 text-white hover:bg-white/10 transition-colors"
            >
              Talk to Our Team
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="px-5 py-14 text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-display text-[clamp(26px,3.5vw,36px)] font-bold mb-2">
            Ready to Start?
          </h2>
          <p className="text-[14.5px] text-gray-500 mb-7">
            Whether you&apos;re hiring or looking — we&apos;ve got you covered
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/jobs"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-[14.5px] font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors"
            >
              I&apos;m a Teacher — Find Jobs
            </Link>
            <Link
              href="/dashboard/post-job"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-[14.5px] font-semibold bg-accent-500 text-white hover:bg-accent-600 transition-colors"
            >
              I&apos;m a School — Post a Job
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
