'use client';

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { JobRecommendation } from "@/types";
import { MatchScoreBadge } from "./match-score-badge";

interface RecommendationCardProps {
  recommendation: JobRecommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  return (
    <Link href={`/jobs/${recommendation.id}`}>
      <div className="h-full bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base line-clamp-2">{recommendation.title}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {recommendation.school.schoolName}
            </p>
          </div>
          <MatchScoreBadge score={recommendation.matchScore} />
        </div>

        {/* Match Explanation */}
        <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800 border border-blue-100">
          {recommendation.explanation}
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600 text-xs">Subject</span>
            <p className="font-medium">{recommendation.subject}</p>
          </div>
          <div>
            <span className="text-gray-600 text-xs">Board</span>
            <p className="font-medium">{recommendation.board}</p>
          </div>
          <div>
            <span className="text-gray-600 text-xs">Grades</span>
            <p className="font-medium">{recommendation.gradeLevel}</p>
          </div>
          <div>
            <span className="text-gray-600 text-xs">Type</span>
            <p className="font-medium inline-block px-2 py-1 bg-gray-100 rounded text-xs">
              {recommendation.jobType.replace(/_/g, " ")}
            </p>
          </div>
        </div>

        {/* Salary & Experience */}
        <div className="pt-2 border-t border-gray-200 text-sm space-y-1">
          {recommendation.salaryMin && recommendation.salaryMax && (
            <p className="text-gray-600">
              ₹{(recommendation.salaryMin / 1000).toFixed(0)}K - ₹{(recommendation.salaryMax / 1000).toFixed(0)}K/month
            </p>
          )}
          {recommendation.experience && (
            <p className="text-gray-600">Exp: {recommendation.experience}</p>
          )}
        </div>

        {/* Posted Date */}
        <div className="text-xs text-gray-500">
          Posted {formatDistanceToNow(new Date(recommendation.postedAt), { addSuffix: true })}
        </div>
      </div>
    </Link>
  );
}
