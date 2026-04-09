import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { computeMatchScore } from "@/lib/ai-match";
import type { JobRecommendation } from "@/types";

/**
 * GET /api/ai/recommendations
 * Returns top 10 job recommendations for logged-in teacher based on AI matching
 * Requires: TEACHER role
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(["TEACHER"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { user } = auth;

    // Get teacher profile
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
    });

    if (!teacherProfile) {
      return NextResponse.json(
        { success: false, error: "Teacher profile not found" },
        { status: 404 }
      );
    }

    // Get all active jobs with school details
    const activeJobs = await prisma.jobPosting.findMany({
      where: {
        status: "ACTIVE",
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        school: true,
      },
      orderBy: { postedAt: "desc" },
    });

    // Compute match scores for all jobs
    const recommendations: JobRecommendation[] = [];

    for (const job of activeJobs) {
      // Check if we already have a cached match score
      let matchScore = await prisma.aIMatchScore.findUnique({
        where: {
          jobId_applicantId: {
            jobId: job.id,
            applicantId: user.id,
          },
        },
      });

      // If not cached or stale (older than 7 days), recompute
      const now = new Date();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const isStale = !matchScore || now.getTime() - matchScore.computedAt.getTime() > sevenDaysMs;

      if (isStale) {
        const result = computeMatchScore(teacherProfile, job);

        // Cache the score
        matchScore = await prisma.aIMatchScore.upsert({
          where: {
            jobId_applicantId: {
              jobId: job.id,
              applicantId: user.id,
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
            applicantId: user.id,
            score: result.score,
            breakdown: result.breakdown as any,
            explanation: result.explanation,
          },
        });
      }

      if (matchScore) {
        recommendations.push({
          id: job.id,
          title: job.title,
          subject: job.subject,
          board: job.board,
          gradeLevel: job.gradeLevel,
          jobType: job.jobType,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          postedAt: job.postedAt,
          status: job.status,
          experience: job.experience,
          school: {
            schoolName: job.school.schoolName,
            city: job.school.city,
            verified: job.school.verified,
            logoUrl: job.school.logoUrl,
          },
          matchScore: Math.round(matchScore.score * 100),
          explanation: matchScore.explanation,
        });
      }
    }

    // Sort by match score (descending) and take top 10
    const topRecommendations = recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: topRecommendations,
    });
  } catch (error) {
    console.error("[AI Recommendations Error]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
