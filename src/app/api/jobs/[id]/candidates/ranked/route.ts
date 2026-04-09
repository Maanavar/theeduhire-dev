import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { computeMatchScore } from "@/lib/ai-match";
import type { RankedCandidate } from "@/types";

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

    // Get job with school info
    const job = await prisma.jobPosting.findUnique({
      where: { id },
      include: {
        school: true,
        applications: {
          include: {
            applicant: {
              include: {
                teacherProfile: true,
              },
            },
            interview: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    // Permission check: SCHOOL_ADMIN must own the job
    if (user.role === "SCHOOL_ADMIN") {
      const schoolProfile = await prisma.schoolProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!schoolProfile || schoolProfile.id !== job.schoolId) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 403 }
        );
      }
    }

    // Compute match scores for all applicants
    const rankedCandidates: RankedCandidate[] = [];

    for (const application of job.applications) {
      if (!application.applicant.teacherProfile) {
        continue; // skip if no teacher profile
      }

      // Check if we already have a cached match score
      let matchScore = await prisma.aIMatchScore.findUnique({
        where: {
          jobId_applicantId: {
            jobId: job.id,
            applicantId: application.applicantId,
          },
        },
      });

      // If not cached or stale, recompute
      const now = new Date();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const isStale = !matchScore || now.getTime() - matchScore.computedAt.getTime() > sevenDaysMs;

      if (isStale) {
        const result = computeMatchScore(
          application.applicant.teacherProfile,
          job
        );

        // Cache the score
        matchScore = await prisma.aIMatchScore.upsert({
          where: {
            jobId_applicantId: {
              jobId: job.id,
              applicantId: application.applicantId,
            },
          },
          update: {
            score: result.score,
            breakdown: result.breakdown as any,
            explanation: result.explanation,
            computedAt: new Date(),
          },
          create: {
            jobId: job.id,
            applicantId: application.applicantId,
            score: result.score,
            breakdown: result.breakdown as any,
            explanation: result.explanation,
          },
        });
      }

      if (matchScore) {
        rankedCandidates.push({
          ...application,
          matchScore: Math.round(matchScore.score * 100),
          explanation: matchScore.explanation,
        });
      }
    }

    // Sort by match score (descending)
    rankedCandidates.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      success: true,
      data: rankedCandidates,
    });
  } catch (error) {
    console.error("[Ranked Candidates Error]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch ranked candidates" },
      { status: 500 }
    );
  }
}
