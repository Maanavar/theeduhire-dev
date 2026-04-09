// ═══════════════════════════════════════════════
// AI Job Matching Engine — Phase 4
// Pure scoring function (no DB access, deterministic)
// Weights: subject (40%) + location (20%) + board (20%) + salary (10%) + experience (10%)
// ═══════════════════════════════════════════════

import type { TeacherProfile, JobPosting, SchoolProfile, Board } from "@prisma/client";

export interface MatchBreakdown {
  subject: number;
  location: number;
  board: number;
  salary: number;
  experience: number;
}

export interface MatchResult {
  score: number; // 0.0 - 1.0
  scorePercent: number; // 0 - 100
  breakdown: MatchBreakdown;
  explanation: string;
}

// Parse experience strings like "3-5 years" into [min, max] tuple
function parseExperienceRange(exp: string | null | undefined): [number, number] | null {
  if (!exp) return null;
  const match = exp.match(/(\d+)\s*-\s*(\d+)/);
  if (match) return [parseInt(match[1], 10), parseInt(match[2], 10)];
  const single = exp.match(/(\d+)/);
  if (single) return [parseInt(single[1], 10), parseInt(single[1], 10)];
  return null;
}

// Calculate overlap ratio between two ranges
function rangeOverlap(range1: [number, number], range2: [number, number]): number {
  const [a1, a2] = range1;
  const [b1, b2] = range2;
  const overlapStart = Math.max(a1, b1);
  const overlapEnd = Math.min(a2, b2);
  if (overlapStart > overlapEnd) return 0; // no overlap
  const overlapLen = overlapEnd - overlapStart + 1;
  const range1Len = a2 - a1 + 1;
  return overlapLen / range1Len; // ratio relative to teacher's range
}

// Subject match: Jaccard similarity
function scoreSubject(teacherSubjects: string[], jobSubject: string): number {
  if (!jobSubject || teacherSubjects.length === 0) return 0;

  const normalizedJob = jobSubject.toLowerCase().trim();
  const normalizedTeacher = teacherSubjects.map((s) => s.toLowerCase().trim());

  // Exact match
  if (normalizedTeacher.includes(normalizedJob)) return 1.0;

  // Partial word match (e.g. "Math" in "Mathematics")
  for (const subject of normalizedTeacher) {
    if (
      subject.includes(normalizedJob) ||
      normalizedJob.includes(subject)
    ) {
      return 0.6; // strong partial match
    }
  }

  return 0; // no match
}

// Location match
function scoreLocation(teacherCity: string | null | undefined, schoolCity: string): number {
  if (!teacherCity) return 0.3; // no preference → neutral
  const normalized1 = teacherCity.toLowerCase().trim();
  const normalized2 = schoolCity.toLowerCase().trim();
  return normalized1 === normalized2 ? 1.0 : 0;
}

// Board match
function scoreBoard(
  teacherPreferredBoards: string[],
  jobBoard: Board | string
): number {
  if (!jobBoard) return 0.5; // neutral
  if (!teacherPreferredBoards || teacherPreferredBoards.length === 0) {
    return 0.7; // no preference → open to boards
  }
  const normalizedBoards = teacherPreferredBoards.map((b) => b.toUpperCase().trim());
  const normalizedJob = (jobBoard as string).toUpperCase().trim();
  return normalizedBoards.includes(normalizedJob) ? 1.0 : 0;
}

// Salary match
function scoreSalary(
  teacherExpectedSalary: number | null | undefined,
  jobSalaryMin: number | null | undefined,
  jobSalaryMax: number | null | undefined
): number {
  if (!teacherExpectedSalary) return 0.7; // no preference → neutral
  if (!jobSalaryMin && !jobSalaryMax) return 0.7; // job has no salary info

  const min = jobSalaryMin || 0;
  const max = jobSalaryMax || Infinity;

  if (teacherExpectedSalary >= min && teacherExpectedSalary <= max) {
    return 1.0; // within range
  }

  // Within 20% tolerance (above or below range)
  const tolerance = Math.max(min, teacherExpectedSalary) * 0.2;
  if (
    teacherExpectedSalary + tolerance >= min &&
    teacherExpectedSalary - tolerance <= max
  ) {
    return 0.5;
  }

  return 0; // significant mismatch
}

// Experience match
function scoreExperience(
  teacherExp: string | null | undefined,
  jobExp: string | null | undefined
): number {
  const teacherRange = parseExperienceRange(teacherExp);
  const jobRange = parseExperienceRange(jobExp);

  if (!teacherRange || !jobRange) return 0.7; // incomplete info → neutral
  if (jobRange[0] === 0 && jobRange[1] === 0) return 0.7; // job has no requirement

  // Teacher has enough experience (min requirement met)
  if (teacherRange[1] >= jobRange[0]) {
    // Overlap ratio
    return Math.min(1.0, rangeOverlap(teacherRange, jobRange));
  }

  return 0; // teacher too junior
}

/**
 * Compute match score between a teacher and a job
 * Pure function — no side effects, deterministic
 */
export function computeMatchScore(
  teacher: TeacherProfile,
  job: JobPosting & { school: SchoolProfile }
): MatchResult {
  // Component scores (0.0 - 1.0)
  const subject = scoreSubject(teacher.subjects || [], job.subject);
  const location = scoreLocation(teacher.city, job.school.city);
  const board = scoreBoard(teacher.preferredBoards || [], job.board);
  const salary = scoreSalary(teacher.expectedSalary, job.salaryMin, job.salaryMax);
  const experience = scoreExperience(teacher.experience, job.experience);

  // Weights
  const weights = {
    subject: 0.4,
    location: 0.2,
    board: 0.2,
    salary: 0.1,
    experience: 0.1,
  };

  // Weighted average
  const score =
    subject * weights.subject +
    location * weights.location +
    board * weights.board +
    salary * weights.salary +
    experience * weights.experience;

  // Generate explanation
  const reasons: string[] = [];
  if (subject > 0.5) {
    reasons.push(
      teacher.subjects && teacher.subjects.length > 0
        ? `your ${teacher.subjects.slice(0, 2).join("+").toLowerCase()} skills`
        : `your teaching background`
    );
  }
  if (location > 0.5) {
    reasons.push(`in ${job.school.city}`);
  }
  if (board > 0.5 && teacher.preferredBoards && teacher.preferredBoards.includes(job.board)) {
    reasons.push(`${job.board} board preference`);
  }
  if (salary > 0.5) {
    reasons.push(`salary alignment`);
  }

  const explanation =
    reasons.length > 0
      ? `Matches ${reasons.join(", ")}`
      : `Potential match for ${job.subject} role`;

  return {
    score: Math.max(0, Math.min(1, score)), // clamp to [0, 1]
    scorePercent: Math.round(Math.max(0, Math.min(1, score)) * 100),
    breakdown: { subject, location, board, salary, experience },
    explanation,
  };
}

/**
 * Rank candidates for a job (teacher → job matching from school perspective)
 * Input: job + array of teachers
 * Output: sorted by score (descending)
 */
export function rankCandidatesForJob(
  job: JobPosting & { school: SchoolProfile },
  candidates: (TeacherProfile & { user: { id: string; name: string } })[]
): Array<{
  applicantId: string;
  applicantName: string;
  score: number;
  scorePercent: number;
  explanation: string;
}> {
  return candidates
    .map((candidate) => {
      const result = computeMatchScore(candidate, job);
      return {
        applicantId: candidate.userId,
        applicantName: candidate.user.name,
        score: result.score,
        scorePercent: result.scorePercent,
        explanation: result.explanation,
      };
    })
    .sort((a, b) => b.score - a.score); // descending
}
