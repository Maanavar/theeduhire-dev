'use client';

interface MatchScoreBadgeProps {
  score: number; // 0-100
}

export function MatchScoreBadge({ score }: MatchScoreBadgeProps) {
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-700";
  let badgeColor = "text-gray-600";

  if (score >= 75) {
    bgColor = "bg-emerald-100";
    textColor = "text-emerald-700";
    badgeColor = "text-emerald-600";
  } else if (score >= 50) {
    bgColor = "bg-amber-100";
    textColor = "text-amber-700";
    badgeColor = "text-amber-600";
  }

  return (
    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${bgColor}`}>
      <div className="text-center">
        <div className={`text-lg font-bold ${textColor}`}>{score}%</div>
        <div className={`text-xs ${badgeColor}`}>match</div>
      </div>
    </div>
  );
}
