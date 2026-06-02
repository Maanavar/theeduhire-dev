import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Briefcase, Calendar, Clock, ArrowRight, ShieldCheck, Star } from "lucide-react";
import { ProfileViewLogger } from "@/components/profile/profile-view-logger";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/users/${id}/profile`, {
      cache: "no-store",
    });

    if (!res.ok) return { title: "Profile Not Found" };

    const data = await res.json();
    if (!data.success) return { title: "Profile Not Found" };

    const { user, profile } = data.data;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://theeduhire.in";
    const canonicalUrl = `${baseUrl}/profile/${id}`;
    const subjectLine = profile.subjects?.length ? ` Teaches ${profile.subjects.slice(0, 3).join(", ")}.` : "";
    const locationLine = profile.city ? ` Based in ${profile.city}.` : "";
    const description = (profile.bio || `${user.name} is a teacher seeking opportunities in Tamil Nadu.${subjectLine}${locationLine}`).slice(0, 160);

    return {
      title: `${user.name} — Teacher Profile | EduHire`,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: `${user.name} — Teacher Profile | EduHire`,
        description,
        url: canonicalUrl,
        type: "profile",
      },
      twitter: {
        card: "summary",
        title: `${user.name} — Teacher Profile | EduHire`,
        description,
      },
    };
  } catch {
    return { title: "Profile Not Found" };
  }
}

function getAvailabilityColor(status: string) {
  switch (status) {
    case "ACTIVELY_LOOKING":
      return "bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)] border-[var(--eh-primary-100)]";
    case "OPEN_TO_OFFERS":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "IMMEDIATE_JOINER":
      return "bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)] border-[var(--eh-primary-100)]";
    case "PART_TIME_ONLY":
      return "bg-sky-50 text-sky-700 border-sky-100";
    case "ONLINE_ONLY":
      return "bg-violet-50 text-violet-700 border-violet-100";
    case "EXAM_SEASON":
      return "bg-orange-50 text-orange-700 border-orange-100";
    default:
      return "bg-gray-50 text-gray-700 border-gray-100";
  }
}

function getAvailabilityLabel(status: string) {
  switch (status) {
    case "ACTIVELY_LOOKING":
      return "Actively looking";
    case "OPEN_TO_OFFERS":
      return "Open to offers";
    case "IMMEDIATE_JOINER":
      return "Available immediately";
    case "PART_TIME_ONLY":
      return "Part-time only";
    case "ONLINE_ONLY":
      return "Online classes only";
    case "EXAM_SEASON":
      return "Exam season / revision";
    default:
      return "Not looking";
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/users/${id}/profile`, {
      cache: "no-store",
    });

    if (!res.ok) notFound();

    const apiData = await res.json();
    if (!apiData.success) notFound();

    const { user, profile, resumeCount } = apiData.data;
    const isFeatured = user.isFeatured ?? false;

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": user.name,
      "jobTitle": "Teacher",
      "description": profile.bio,
      "address": profile.city ? {
        "@type": "PostalAddress",
        "addressLocality": profile.city,
        "addressCountry": "IN"
      } : undefined,
      "knowsAbout": [
        ...(profile.subjects || []),
        ...(profile.preferredBoards || []),
        ...(profile.preferredGrades || [])
      ].filter(Boolean),
      "hasOccupation": {
        "@type": "Occupation",
        "name": "Teacher",
        "occupationLocation": profile.city ? {
          "@type": "City",
          "name": profile.city
        } : undefined
      }
    };

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://theeduhire.in";
    const breadcrumbJsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": baseUrl
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": user.name,
          "item": `${baseUrl}/profile/${id}`
        }
      ]
    };

    return (
      <div className="bg-[var(--surface-base)]">
        <ProfileViewLogger teacherId={id} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
        <section className="border-b border-[var(--eh-border)] bg-white px-5 pb-8 pt-10 md:px-8 md:pt-12">
          <div className="mx-auto max-w-[1320px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-eh-primary">Teacher profile</p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-[var(--eh-primary-50)]">
                {user.avatarUrl ? (
                  <Image src={user.avatarUrl} alt={user.name || "Profile photo"} width={56} height={56} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[20px] font-semibold text-eh-primary">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-[clamp(1.4rem,2.5vw,1.8rem)] font-semibold leading-[1.2] tracking-[-0.02em] text-[var(--eh-text)]">
                    {user.name}
                  </h1>
                  {isFeatured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200">
                      <Star size={10} className="fill-amber-500 text-amber-500" />
                      Featured
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-3">
                  {profile.currentSchool && (
                    <span className="text-[13px] text-[var(--eh-text-2)]">{profile.currentSchool}</span>
                  )}
                  {profile.city && (
                    <span className="inline-flex items-center gap-1 text-[13px] text-[var(--eh-text-3)]">
                      <MapPin size={13} /> {profile.city}
                    </span>
                  )}
                  {profile.experience && (
                    <span className="inline-flex items-center gap-1 text-[13px] text-[var(--eh-text-3)]">
                      <Briefcase size={13} /> {profile.experience}
                    </span>
                  )}
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getAvailabilityColor(profile.availabilityStatus)}`}>
                    {getAvailabilityLabel(profile.availabilityStatus)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1320px] px-5 py-8 md:px-8">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-5">
              {profile.bio && (
                <section className="rounded-2xl border border-[var(--eh-border)] bg-white p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">About</p>
                  <p className="mt-3 whitespace-pre-line text-[14px] leading-[1.75] text-[var(--eh-text-2)]">{profile.bio}</p>
                </section>
              )}

              {(profile.subjects.length > 0 || profile.preferredBoards.length > 0 || profile.preferredGrades.length > 0 || profile.preferredJobTypes?.length > 0) && (
                <section className="rounded-2xl border border-[var(--eh-border)] bg-white p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Teaching expertise</p>
                  <div className="mt-4 space-y-4">
                    {profile.subjects.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Subjects</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {profile.subjects.map((subject: string) => (
                            <span key={subject} className="rounded-full border border-[var(--eh-primary-100)] bg-[var(--eh-primary-50)] px-3 py-1 text-[12px] font-medium text-eh-primary">
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {profile.preferredBoards.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Boards</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {profile.preferredBoards.map((board: string) => (
                            <span key={board} className="rounded-full border border-[var(--eh-border)] bg-[var(--surface-base)] px-3 py-1 text-[12px] font-medium text-[var(--eh-text-2)]">
                              {board}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {profile.preferredGrades.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Grade levels</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {profile.preferredGrades.map((grade: string) => (
                            <span key={grade} className="rounded-full border border-[var(--eh-border)] bg-[var(--surface-base)] px-3 py-1 text-[12px] font-medium text-[var(--eh-text-2)]">
                              {grade}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {profile.preferredJobTypes?.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Preferred roles</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {profile.preferredJobTypes.map((jobType: string) => (
                            <span key={jobType} className="rounded-full border border-[var(--eh-border)] bg-[var(--surface-base)] px-3 py-1 text-[12px] font-medium text-[var(--eh-text-2)]">
                              {jobType}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {profile.qualification && (
                <section className="rounded-2xl border border-[var(--eh-border)] bg-white p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Qualification</p>
                  <p className="mt-3 text-[14px] text-[var(--eh-text-2)]">{profile.qualification}</p>
                </section>
              )}

              {profile.experiences && profile.experiences.length > 0 && (
                <section className="rounded-2xl border border-[var(--eh-border)] bg-white p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Work experience</p>
                  <div className="mt-4 space-y-5">
                    {profile.experiences.map((exp: any, idx: number) => (
                      <div key={exp.id} className={idx > 0 ? "border-t border-[var(--eh-border)] pt-5" : ""}>
                        <div className="flex gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--eh-primary-50)] text-eh-primary">
                            <Briefcase size={15} />
                          </div>
                          <div className="flex-1">
                            <p className="text-[14px] font-semibold text-[var(--eh-text)]">{exp.role}</p>
                            <p className="text-[13px] text-[var(--eh-text-2)]">{exp.schoolName}</p>
                            <p className="mt-1 flex items-center gap-1 text-[12px] text-[var(--eh-text-3)]">
                              <Calendar size={11} />
                              {new Date(exp.startDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                              {" - "}
                              {exp.isCurrent ? "Present" : new Date(exp.endDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                            </p>
                            {exp.description && (
                              <p className="mt-2 text-[13px] leading-[1.65] text-[var(--eh-text-2)]">{exp.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {profile.certifications && profile.certifications.length > 0 && (
                <section className="rounded-2xl border border-[var(--eh-border)] bg-white p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Certifications</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {profile.certifications.map((cert: any) => (
                      <div key={cert.id} className="rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] p-4">
                        <p className="text-[13px] font-semibold text-[var(--eh-text)]">{cert.name}</p>
                        <p className="mt-0.5 text-[12px] text-[var(--eh-text-3)]">{cert.issuedBy}</p>
                        <p className="mt-2 flex items-center gap-1 text-[11px] text-[var(--eh-text-4)]">
                          <Clock size={11} />
                          {new Date(cert.issuedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                          {cert.expiresAt && <> - Expires {new Date(cert.expiresAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</>}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-4">
              <section className="rounded-2xl border border-[var(--eh-border)] bg-white p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Details</p>
                <div className="mt-3 space-y-3">
                  {profile.expectedSalary && (
                    <div>
                      <p className="text-[11px] text-[var(--eh-text-4)]">Expected salary</p>
                      <p className="mt-0.5 text-[13px] font-semibold text-[var(--eh-text)]">
                        Rs {profile.expectedSalary.toLocaleString("en-IN")}/month
                      </p>
                    </div>
                  )}
                  {profile.tetStatus && profile.tetStatus !== "NONE" && (
                    <div>
                      <p className="text-[11px] text-[var(--eh-text-4)]">TET / CTET</p>
                      <p className="mt-0.5 text-[13px] font-semibold text-[var(--eh-text)]">
                        {profile.tetStatus === "BOTH" ? "TET and CTET cleared" : `${profile.tetStatus} cleared`}
                      </p>
                    </div>
                  )}
                  {profile.teachingMediums?.length > 0 && (
                    <div>
                      <p className="text-[11px] text-[var(--eh-text-4)]">Teaching medium</p>
                      <p className="mt-0.5 text-[13px] font-semibold text-[var(--eh-text)]">{profile.teachingMediums.join(", ")}</p>
                    </div>
                  )}
                  {typeof profile.noticePeriodDays === "number" && (
                    <div>
                      <p className="text-[11px] text-[var(--eh-text-4)]">Notice period</p>
                      <p className="mt-0.5 text-[13px] font-semibold text-[var(--eh-text)]">{profile.noticePeriodDays} days</p>
                    </div>
                  )}
                  {resumeCount > 0 && (
                    <div>
                      <p className="text-[11px] text-[var(--eh-text-4)]">Resume</p>
                      <p className="mt-0.5 text-[13px] font-semibold text-[var(--eh-text)]">
                        {resumeCount} document{resumeCount !== 1 ? "s" : ""} on file
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] text-[var(--eh-text-4)]">Status</p>
                    <span className={`mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getAvailabilityColor(profile.availabilityStatus)}`}>
                      {getAvailabilityLabel(profile.availabilityStatus)}
                    </span>
                  </div>
                  {profile.safetyBadgeGranted && (
                    <div className="flex items-center gap-1.5 rounded-xl border border-[var(--eh-primary-200)] bg-[var(--eh-primary-50)] px-3 py-2">
                      <ShieldCheck size={14} className="text-[var(--eh-primary-600)]" />
                      <span className="text-[12px] font-semibold text-[var(--eh-primary-700)]">Child Safety Verified</span>
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--eh-border)] bg-[#0f172a] p-5 text-white">
                <p className="text-[13px] font-semibold">Hiring for a school?</p>
                <p className="mt-1.5 text-[12px] leading-[1.6] text-white/60">
                  Post a role and connect with verified teachers like this one.
                </p>
                <div className="mt-4 space-y-2">
                  <Link href="/dashboard/post-job" className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-[13px] font-semibold text-[#0f172a] transition-colors hover:bg-white/90">
                    Post a role <ArrowRight size={13} />
                  </Link>
                  <Link href="/jobs" className="flex w-full items-center justify-center rounded-xl border border-white/20 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/8">
                    Browse jobs
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
