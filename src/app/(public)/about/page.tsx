import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Heart, Target, Users, Shield, ArrowRight, GraduationCap,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "EduHire is Tamil Nadu's dedicated teaching job platform, built by educators to connect passionate teachers with leading schools.",
};

async function getStats() {
  try {
    const [jobCount, schoolCount, teacherCount] = await Promise.all([
      prisma.jobPosting.count({ where: { status: "ACTIVE" } }),
      prisma.schoolProfile.count(),
      prisma.user.count({ where: { role: "TEACHER" } }),
    ]);
    return { jobCount, schoolCount, teacherCount };
  } catch (error) {
    console.error("Failed to load about page stats:", error);
    return { jobCount: 0, schoolCount: 0, teacherCount: 0 };
  }
}

export default async function AboutPage() {
  const stats = await getStats();

  return (
    <div className="max-w-[900px] mx-auto px-5 py-10 lg:py-14">
      {/* Hero */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-500 text-[12.5px] font-semibold px-3.5 py-1 rounded-full mb-4">
          <Heart size={13} />
          Our Story
        </div>
        <h1 className="font-display text-[clamp(30px,4.5vw,44px)] font-bold leading-tight mb-4">
          Shaping Education&apos;s{" "}
          <em className="text-brand-500 italic">Future</em>
        </h1>
        <p className="text-[16px] text-gray-500 leading-relaxed max-w-[560px] mx-auto">
          We saw a gap — talented teachers overlooked, schools searching endlessly.
          EduHire was built to turn that disconnect into opportunity, starting right here in Tamil Nadu.
        </p>
      </div>

      {/* Mission */}
      <div className="bg-white border border-gray-100 rounded-3xl p-8 lg:p-10 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="font-display text-[24px] font-bold mb-3">
              Our Mission
            </h2>
            <p className="text-[15px] text-gray-600 leading-relaxed mb-4">
              To become Tamil Nadu&apos;s most trusted platform for teaching careers.
              We believe every passionate educator deserves access to the right school,
              and every school deserves to find the right teacher — without the friction
              of traditional hiring.
            </p>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Built by educators who understand the challenges of finding the right fit,
              EduHire combines smart matching with a deep connection to India&apos;s
              education ecosystem.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { icon: <Target size={18} />, title: "Focused", desc: "Teaching jobs only — we do one thing and do it exceptionally well." },
              { icon: <Shield size={18} />, title: "Verified", desc: "Every school undergoes 5-point verification before listing." },
              { icon: <Users size={18} />, title: "Free for Teachers", desc: "Teachers never pay. Schools invest, educators benefit." },
            ].map((v, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center text-brand-500 shrink-0">
                  {v.icon}
                </div>
                <div>
                  <h4 className="text-[14px] font-semibold">{v.title}</h4>
                  <p className="text-[13px] text-gray-500">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
        {[
          { num: `${stats.jobCount}+`, label: "Active Jobs" },
          { num: `${stats.schoolCount}+`, label: "Partner Schools" },
          { num: `${stats.teacherCount}+`, label: "Registered Teachers" },
          { num: "15+", label: "Cities in Tamil Nadu" },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white border border-gray-100 rounded-2xl p-6 text-center"
          >
            <div className="font-display text-[26px] font-bold text-brand-600">
              {s.num}
            </div>
            <div className="text-[12.5px] text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Boards we cover */}
      <div className="text-center mb-14">
        <h2 className="font-display text-[24px] font-bold mb-6">
          All Boards, All Grades
        </h2>
        <div className="flex gap-3 justify-center flex-wrap">
          {["CBSE", "ICSE", "State Board", "IB", "Cambridge", "Montessori"].map(
            (b) => (
              <span
                key={b}
                className="px-5 py-2.5 bg-white border border-gray-100 rounded-xl text-[14px] font-medium text-gray-600 hover:border-brand-500 hover:text-brand-500 transition-colors"
              >
                {b}
              </span>
            )
          )}
        </div>
        <p className="text-[14px] text-gray-400 mt-4">
          Pre-K through Grade 12 — every level covered
        </p>
      </div>

      {/* CTA */}
      <div className="bg-brand-600 rounded-3xl p-10 text-center text-white">
        <GraduationCap size={32} className="mx-auto mb-3 text-brand-100" />
        <h2 className="font-display text-[26px] font-bold mb-2">
          Join EduHire Today
        </h2>
        <p className="text-brand-100 text-[15px] max-w-[420px] mx-auto mb-6">
          Whether you&apos;re a teacher looking for your next role or a school hiring great educators — we&apos;re here for you.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/jobs"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold bg-white text-brand-600 hover:bg-brand-50 transition-colors"
          >
            Browse Jobs
            <ArrowRight size={15} />
          </Link>
          <Link
            href="/contact"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold border border-white/30 text-white hover:bg-white/10 transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
