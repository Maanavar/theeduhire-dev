import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { JobRecommendation } from "@/types";
import { getStoredMatchScores } from "@/lib/match-score-read-model";
import { isPrismaMissingColumnError } from "@/lib/prisma-errors";

/**
 * GET /api/ai/recommendations
 * Returns top 10 job recommendations for logged-in teacher based on AI matching
 * Requires: TEACHER role
 */
export async function GET() {
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

    // Get all active jobs with school details.
    // Some environments might not have the newest job_postings columns yet,
    // so we retry with a legacy-safe selection.
    const where = {
      status: "ACTIVE" as const,
      expiresAt: {
        gt: new Date(),
      },
    };

    let activeJobs: any[] = [];

    try {
      activeJobs = await prisma.jobPosting.findMany({
        where,
        orderBy: { postedAt: "desc" },
        select: {
          id: true,
          title: true,
          subject: true,
          board: true,
          gradeLevel: true,
          jobType: true,
          salaryMin: true,
          salaryMax: true,
          isUrgent: true,
          requiredWithin48h: true,
          requiresTet: true,
          postedAt: true,
          status: true,
          experience: true,
          experienceLevel: true,
          school: {
            select: {
              schoolName: true,
              city: true,
              verified: true,
              logoUrl: true,
            },
          },
        },
      });
    } catch (error) {
      if (!isPrismaMissingColumnError(error, "experience_level")) {
        throw error;
      }

      activeJobs = await prisma.jobPosting.findMany({
        where,
        orderBy: { postedAt: "desc" },
        select: {
          id: true,
          title: true,
          subject: true,
          board: true,
          gradeLevel: true,
          jobType: true,
          salaryMin: true,
          salaryMax: true,
          isUrgent: true,
          requiredWithin48h: true,
          requiresTet: true,
          postedAt: true,
          status: true,
          experience: true,
          school: {
            select: {
              schoolName: true,
              city: true,
              verified: true,
              logoUrl: true,
            },
          },
        },
      });
    }

    const scoreMap = await getStoredMatchScores(
      activeJobs.map((job) => job.id),
      [user.id]
    );
    const recommendations: JobRecommendation[] = [];

    for (const job of activeJobs) {
      const matchScore = scoreMap.get(`${job.id}:${user.id}`);

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
          isUrgent: job.isUrgent,
          requiredWithin48h: job.requiredWithin48h,
          requiresTet: job.requiresTet,
          postedAt: job.postedAt,
          status: job.status,
          experience: job.experience,
          experienceLevel: job.experienceLevel ?? null,
          school: {
            schoolName: job.school.schoolName,
            city: job.school.city,
            verified: job.school.verified,
            logoUrl: job.school.logoUrl,
          },
          matchScore: matchScore.score,
          explanation: matchScore.explanation,
          breakdown: matchScore.breakdown ?? null,
        });
      } else {
        recommendations.push({
          id: job.id,
          title: job.title,
          subject: job.subject,
          board: job.board,
          gradeLevel: job.gradeLevel,
          jobType: job.jobType,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          isUrgent: job.isUrgent,
          requiredWithin48h: job.requiredWithin48h,
          requiresTet: job.requiresTet,
          postedAt: job.postedAt,
          status: job.status,
          experience: job.experience,
          experienceLevel: job.experienceLevel ?? null,
          school: {
            schoolName: job.school.schoolName,
            city: job.school.city,
            verified: job.school.verified,
            logoUrl: job.school.logoUrl,
          },
          matchScore: 0,
          explanation: "Match score refreshing",
          breakdown: null,
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
