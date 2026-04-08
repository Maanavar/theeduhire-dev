import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatSalary, timeAgo } from "@/lib/utils";
import { MapPin, Award, Briefcase, Calendar, Clock } from "lucide-react";

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

    return {
      title: `${user.name} - Teacher Profile | EduHire`,
      description: profile.bio || `${user.name} is a teacher looking for opportunities in Tamil Nadu`,
      openGraph: {
        title: `${user.name} - Teaching Profile`,
        description: profile.bio || `Check out ${user.name}'s teaching profile on EduHire`,
        type: "profile",
      },
    };
  } catch {
    return { title: "Profile Not Found" };
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

    const getAvailabilityColor = (status: string) => {
      switch (status) {
        case "ACTIVELY_LOOKING":
          return "bg-emerald-50 text-emerald-700 border-emerald-100";
        case "OPEN_TO_OFFERS":
          return "bg-amber-50 text-amber-700 border-amber-100";
        default:
          return "bg-gray-50 text-gray-700 border-gray-100";
      }
    };

    const getAvailabilityLabel = (status: string) => {
      switch (status) {
        case "ACTIVELY_LOOKING":
          return "Actively looking";
        case "OPEN_TO_OFFERS":
          return "Open to offers";
        default:
          return "Not looking";
      }
    };

    return (
      <div className="min-h-screen" style={{ background: "var(--surface-base)" }}>
        <div className="max-w-3xl mx-auto px-5 py-12">
          {/* Hero Section */}
          <div className="card p-8 mb-6">
            <div className="flex items-start gap-6 mb-6">
              {/* Avatar */}
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-4xl font-bold flex-shrink-0 overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name?.charAt(0).toUpperCase()
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="font-display text-[32px] font-bold text-gray-900 leading-tight">{user.name}</h1>
                </div>

                <p className="text-[15px] text-gray-600 mb-4">{profile.currentSchool || "Teacher"}</p>

                <div className="flex flex-wrap gap-3 mb-4">
                  {profile.city && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                      <MapPin size={16} className="text-gray-400" />
                      {profile.city}
                    </span>
                  )}

                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getAvailabilityColor(
                      profile.availabilityStatus
                    )}`}
                  >
                    {getAvailabilityLabel(profile.availabilityStatus)}
                  </span>
                </div>

                {profile.expectedSalary && (
                  <p className="text-[15px] font-semibold text-brand-600">
                    Expected: ₹{(profile.expectedSalary / 100000).toFixed(1)}L/month
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* About Section */}
          {profile.bio && (
            <div className="card p-6 mb-6">
              <h2 className="text-[15px] font-bold text-gray-900 mb-3">About</h2>
              <p className="text-[14px] text-gray-700 leading-relaxed whitespace-pre-line">{profile.bio}</p>
            </div>
          )}

          {/* Teaching Expertise */}
          {(profile.subjects.length > 0 ||
            profile.preferredBoards.length > 0 ||
            profile.preferredGrades.length > 0) && (
            <div className="card p-6 mb-6">
              <h2 className="text-[15px] font-bold text-gray-900 mb-4">Teaching Expertise</h2>

              {profile.subjects.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.08em] mb-2">
                    Subjects
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.subjects.map((subject: string) => (
                      <span
                        key={subject}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.preferredBoards.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.08em] mb-2">
                    Boards
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.preferredBoards.map((board: string) => (
                      <span
                        key={board}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        {board}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.preferredGrades.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.08em] mb-2">
                    Grade Levels
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.preferredGrades.map((grade: string) => (
                      <span
                        key={grade}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        {grade}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Qualifications */}
          {profile.qualification && (
            <div className="card p-6 mb-6">
              <h2 className="text-[15px] font-bold text-gray-900 mb-3">Qualification</h2>
              <p className="text-[14px] text-gray-700">{profile.qualification}</p>
            </div>
          )}

          {/* Work Experience Timeline */}
          {profile.experiences && profile.experiences.length > 0 && (
            <div className="card p-6 mb-6">
              <h2 className="text-[15px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase size={18} /> Work Experience
              </h2>

              <div className="space-y-6">
                {profile.experiences.map((exp: any, idx: number) => (
                  <div key={exp.id} className="relative">
                    {idx !== profile.experiences.length - 1 && (
                      <div className="absolute left-6 top-14 bottom-0 w-px bg-gray-200" />
                    )}

                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 relative z-10">
                        <Briefcase size={20} className="text-brand-600" />
                      </div>

                      <div className="flex-1 pt-1">
                        <h3 className="text-[15px] font-semibold text-gray-900">{exp.role}</h3>
                        <p className="text-[13px] text-gray-600">{exp.schoolName}</p>

                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(exp.startDate).toLocaleDateString("en-IN", {
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          –{" "}
                          {exp.isCurrent
                            ? "Present"
                            : new Date(exp.endDate).toLocaleDateString("en-IN", {
                                month: "short",
                                year: "numeric",
                              })}
                        </p>

                        {exp.description && (
                          <p className="text-[13px] text-gray-700 mt-2 leading-relaxed">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {profile.certifications && profile.certifications.length > 0 && (
            <div className="card p-6 mb-6">
              <h2 className="text-[15px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award size={18} /> Certifications
              </h2>

              <div className="grid gap-3 sm:grid-cols-2">
                {profile.certifications.map((cert: any) => (
                  <div key={cert.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <h3 className="text-[14px] font-semibold text-gray-900">{cert.name}</h3>
                    <p className="text-xs text-gray-600">{cert.issuedBy}</p>

                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                      <Clock size={12} />
                      {new Date(cert.issuedAt).toLocaleDateString("en-IN", {
                        month: "short",
                        year: "numeric",
                      })}
                      {cert.expiresAt && (
                        <>
                          {" "}
                          – Expires{" "}
                          {new Date(cert.expiresAt).toLocaleDateString("en-IN", {
                            month: "short",
                            year: "numeric",
                          })}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resume Count Card */}
          {resumeCount > 0 && (
            <div className="card p-6 mb-6 bg-brand-50 border border-brand-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center">
                  <Briefcase size={20} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-900">Resume on file</p>
                  <p className="text-xs text-brand-700">{resumeCount} document{resumeCount !== 1 ? "s" : ""} uploaded</p>
                </div>
              </div>
            </div>
          )}

          {/* CTA Section */}
          <div className="card p-6 bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200">
            <h2 className="text-[15px] font-bold text-gray-900 mb-2">Interested in this teacher?</h2>
            <p className="text-[13px] text-gray-700 mb-4">
              Post a teaching position and this profile might be a great match. Or browse more teacher profiles.
            </p>
            <div className="flex gap-3">
              <a
                href="/jobs"
                className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-white text-brand-600 border border-brand-200 hover:border-brand-400 hover:bg-brand-50 transition-colors"
              >
                Browse More Teachers
              </a>
              <a
                href="/auth/signup?role=school"
                className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors shadow-brand"
              >
                Post a Job
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
