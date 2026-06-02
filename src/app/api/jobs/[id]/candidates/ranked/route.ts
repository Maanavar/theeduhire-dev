import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { RankedCandidate } from "@/types";
import { getStoredMatchScores } from "@/lib/match-score-read-model";
import { canManageJob } from "@/lib/policies/job-policy";
import { getSchoolProfileIdForUser } from "@/lib/policies/application-policy";
import { getTeacherDocumentAccessPath } from "@/lib/storage";
import { canViewContactDetails, canUseAIShortlist } from "@/lib/subscription";

async function getFeaturedApplicantIds(applicantIds: string[]): Promise<Set<string>> {
  if (applicantIds.length === 0) return new Set();
  const subs = await prisma.teacherSubscription.findMany({
    where: { teacherUserId: { in: applicantIds }, plan: "PRO", status: { not: "CANCELED" } },
    select: { teacherUserId: true },
  });
  return new Set(subs.map((s) => s.teacherUserId));
}

/**
 * GET /api/jobs/[id]/candidates/ranked
 * Returns all applicants for a job ranked by AI match score
 * Requires: SCHOOL_ADMIN (owner of job) or ADMIN
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(["SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || "20")));
    const sort = searchParams.get("sort") || "match_desc";

    // Get job with school info
    const job = await prisma.jobPosting.findUnique({
      where: { id },
      select: {
        id: true,
        postedBy: true,
        schoolId: true,
        school: true,
        applications: {
          include: {
            applicant: {
              include: {
                teacherProfile: true,
              },
            },
            interview: true,
            screeningAnswers: {
              include: {
                question: {
                  select: {
                    id: true,
                    question: true,
                    required: true,
                    sortOrder: true,
                  },
                },
              },
            },
            resume: {
              select: { id: true, fileName: true },
            },
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    const schoolProfileId = user.role === "SCHOOL_ADMIN"
      ? await getSchoolProfileIdForUser(prisma, user.id)
      : null;

    if (!canManageJob(user, { postedBy: job.postedBy, schoolId: job.schoolId }, schoolProfileId)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // ADMIN always gets full access; schools need Growth+ for AI scores and contact
    const applicantIds = job.applications.map((a) => a.applicantId);
    const [contactAllowed, aiAllowed, featuredIds] = user.role === "ADMIN"
      ? [true, true, new Set<string>()]
      : await Promise.all([
          canViewContactDetails(user.id),
          canUseAIShortlist(user.id),
          getFeaturedApplicantIds(applicantIds),
        ]);

    const scoreMap = await getStoredMatchScores(
      [job.id],
      job.applications.map((application) => application.applicantId)
    );
    const rankedCandidates: RankedCandidate[] = [];

    for (const application of job.applications) {
      if (!application.applicant.teacherProfile) {
        continue; // skip if no teacher profile
      }

      const matchScore = scoreMap.get(`${job.id}:${application.applicantId}`);

      const maskedApplicant = {
        ...application.applicant,
        phone: contactAllowed ? (application.applicant as any).phone : null,
        whatsappNumber: contactAllowed ? (application.applicant as any).whatsappNumber : null,
        contactHidden: !contactAllowed,
        isFeatured: featuredIds.has(application.applicantId),
        teacherProfile: application.applicant.teacherProfile
          ? {
              ...application.applicant.teacherProfile,
              demoVideoUrl: application.applicant.teacherProfile.demoVideoUrl
                ? getTeacherDocumentAccessPath("demo-video", application.applicantId)
                : null,
              lessonPlanUrl: application.applicant.teacherProfile.lessonPlanUrl
                ? getTeacherDocumentAccessPath("lesson-plan", application.applicantId)
                : null,
            }
          : null,
      };

      if (matchScore && aiAllowed) {
        rankedCandidates.push({
          ...application,
          applicant: maskedApplicant,
          matchScore: matchScore.score,
          explanation: matchScore.explanation,
        });
      } else {
        rankedCandidates.push({
          ...application,
          applicant: maskedApplicant,
          matchScore: 0,
          explanation: aiAllowed ? "Match score refreshing" : "Upgrade to Growth plan to unlock AI match scores",
        });
      }
    }

    if (sort === "applied_desc") {
      rankedCandidates.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
    } else if (sort === "applied_asc") {
      rankedCandidates.sort((a, b) => new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime());
    } else if (aiAllowed) {
      rankedCandidates.sort((a, b) => b.matchScore - a.matchScore);
    } else {
      // Fall back to newest-first when AI scores are unavailable
      rankedCandidates.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
    }

    const total = rankedCandidates.length;
    const paged = rankedCandidates.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      data: paged,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      meta: {
        aiAllowed,
        contactHidden: !contactAllowed,
      },
    });
  } catch (error) {
    console.error("[Ranked Candidates Error]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch ranked candidates" },
      { status: 500 }
    );
  }
}
