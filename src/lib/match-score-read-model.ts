import { prisma } from "@/lib/prisma";

export async function getStoredMatchScores(
  jobIds: string[],
  applicantIds: string[]
): Promise<Map<string, { score: number; explanation: string; breakdown: any; computedAt: Date }>> {
  if (jobIds.length === 0 || applicantIds.length === 0) {
    return new Map();
  }

  const rows = await prisma.aIMatchScore.findMany({
    where: {
      jobId: { in: jobIds },
      applicantId: { in: applicantIds },
    },
    select: {
      jobId: true,
      applicantId: true,
      score: true,
      explanation: true,
      breakdown: true,
      computedAt: true,
    },
  });

  return new Map(
    rows.map((row) => [
      `${row.jobId}:${row.applicantId}`,
      {
        score: Math.round(row.score * 100),
        explanation: row.explanation,
        breakdown: row.breakdown,
        computedAt: row.computedAt,
      },
    ])
  );
}
