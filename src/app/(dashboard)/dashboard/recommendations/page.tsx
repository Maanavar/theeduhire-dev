'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  MapPin,
  Search,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';
import JobDetailPanel from '@/components/jobs/job-detail-panel';
import { MatchScoreBadge } from '@/components/recommendations/match-score-badge';
import { ProfileIncompleteState, SomethingWentWrongState } from '@/components/system/illustrated-states';
import { CardListSkeleton } from '@/components/system/dashboard-skeletons';
import { PageHeader, PageShell, Panel, PanelHeader } from '@/components/layout/page-shell';
import type { JobRecommendation } from '@/types';
import { getApiErrorMessage } from '@/lib/api/client';
import { getRecommendations } from '@/lib/api/teacher-client';
import { getProfile } from '@/lib/api/profile-client';
import { formatSalary } from '@/lib/utils';

type SortMode = 'score' | 'recent' | 'salary';

export default function RecommendationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortMode>('score');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterBoard, setFilterBoard] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [completion, setCompletion] = useState<number | null>(null);

  useEffect(() => {
    if (session && session.user.role !== 'TEACHER') router.push('/dashboard');
  }, [session, router]);

  useEffect(() => { fetchRecommendations(); }, []);

  useEffect(() => {
    getProfile()
      .then((p) => {
        const checks = [
          !!p.name,
          !!p.phone,
          !!p.bio,
          !!p.qualification,
          !!(p.subjects && p.subjects.length),
          !!(p.preferredGrades && p.preferredGrades.length),
          !!(p.preferredBoards && p.preferredBoards.length),
          !!p.city,
          !!p.experience,
          !!p.expectedSalary,
          !!p.avatarUrl,
        ];
        setCompletion(Math.round((checks.filter(Boolean).length / checks.length) * 100));
      })
      .catch(() => {});
  }, []);

  async function fetchRecommendations() {
    try {
      setLoading(true);
      setError(null);
      const data = await getRecommendations();
      setRecommendations(data);
      setSelectedJobId((current) => current || data[0]?.id || null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to fetch recommendations'));
    } finally {
      setLoading(false);
    }
  }

  const subjects = useMemo(
    () => [...new Set(recommendations.map((r) => r.subject).filter(Boolean))].sort(),
    [recommendations]
  );

  const boards = useMemo(
    () => [...new Set(recommendations.map((r) => r.board).filter(Boolean))].sort(),
    [recommendations]
  );

  const topSkills = useMemo(() => {
    const counts = new Map<string, number>();
    for (const rec of recommendations) {
      if (rec.subject) counts.set(rec.subject, (counts.get(rec.subject) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([subject]) => subject).slice(0, 6);
  }, [recommendations]);

  const filteredRecommendations = useMemo(() => {
    const filtered = recommendations.filter((rec) => {
      const matchesSearch =
        rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.school.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.school.city.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject = !filterSubject || rec.subject === filterSubject;
      const matchesBoard = !filterBoard || rec.board === filterBoard;
      return matchesSearch && matchesSubject && matchesBoard;
    });

    if (sortBy === 'score') filtered.sort((a, b) => b.matchScore - a.matchScore);
    else if (sortBy === 'recent') filtered.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
    else if (sortBy === 'salary') filtered.sort((a, b) => (b.salaryMax || 0) - (a.salaryMax || 0));

    return filtered;
  }, [recommendations, filterSubject, filterBoard, searchTerm, sortBy]);

  useEffect(() => {
    if (filteredRecommendations.length === 0) { setSelectedJobId(null); return; }
    if (!selectedJobId || !filteredRecommendations.some((r) => r.id === selectedJobId)) {
      setSelectedJobId(filteredRecommendations[0].id);
    }
  }, [filteredRecommendations, selectedJobId]);

  const selectedRec = filteredRecommendations.find((r) => r.id === selectedJobId) || filteredRecommendations[0] || null;

  if (loading) return <CardListSkeleton cards={5} />;

  if (error) {
    return (
      <SomethingWentWrongState
        title="Failed to load recommendations"
        message={error}
        onRetry={fetchRecommendations}
      />
    );
  }

  if (recommendations.length === 0) {
    return (
      <ProfileIncompleteState
        actions={
          <Link href="/dashboard/profile" className="eh-btn eh-btn-primary">
            Complete profile <ArrowRight size={14} />
          </Link>
        }
      />
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Recommended for You"
        subtitle="AI-powered job matches based on your profile and preferences."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSortBy('score')}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${sortBy === 'score' ? 'border-[var(--eh-primary-200)] bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]' : 'border-[var(--eh-border)] text-[var(--eh-text-2)]'}`}
            >
              Highest Match
            </button>
            <button
              onClick={() => setSortBy('recent')}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${sortBy === 'recent' ? 'border-[var(--eh-primary-200)] bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]' : 'border-[var(--eh-border)] text-[var(--eh-text-2)]'}`}
            >
              Latest
            </button>
            <button
              onClick={() => setSortBy('salary')}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${sortBy === 'salary' ? 'border-[var(--eh-primary-200)] bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]' : 'border-[var(--eh-border)] text-[var(--eh-text-2)]'}`}
            >
              Better Salary Range
            </button>
          </div>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <label className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-[var(--eh-border)] bg-white px-3 py-2">
          <Search size={14} className="shrink-0 text-[var(--eh-text-4)]" />
          <input
            type="text"
            placeholder="Search by job, school, or city"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-[var(--eh-text)] outline-none placeholder:text-[var(--eh-text-4)]"
          />
        </label>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="rounded-lg border border-[var(--eh-border)] bg-white px-3 py-2 text-[13px] text-[var(--eh-text-2)] outline-none"
        >
          <option value="">All subjects</option>
          {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterBoard}
          onChange={(e) => setFilterBoard(e.target.value)}
          className="rounded-lg border border-[var(--eh-border)] bg-white px-3 py-2 text-[13px] text-[var(--eh-text-2)] outline-none"
        >
          <option value="">All boards</option>
          {boards.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <div className="flex items-center gap-2 text-[12px] text-[var(--eh-text-3)]">
          <SlidersHorizontal size={13} />
          {filteredRecommendations.length} match{filteredRecommendations.length !== 1 ? 'es' : ''} found
        </div>
      </div>

      {filteredRecommendations.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-700">
          No roles match the current filters. Try widening subject, board, or search terms.
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
          {/* Job list */}
          <div className="space-y-3">
            {filteredRecommendations.map((rec) => {
              const score = rec.matchScore;
              const selected = selectedRec?.id === rec.id;
              const matchPoints = rec.explanation
                ? [rec.explanation]
                : [];

              if (rec.breakdown) {
                if (rec.breakdown.subject > 0.5) matchPoints.push('Your subject background is a strong match');
                if (rec.breakdown.location > 0.5) matchPoints.push('Location matches your preference');
                if (rec.breakdown.board > 0.5) matchPoints.push('Board preference aligned');
              }

              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedJobId(rec.id)}
                  className={`cursor-pointer rounded-xl border p-5 transition-all ${selected ? 'border-[var(--eh-primary-300)] shadow-[0_0_0_2px_var(--eh-primary-100)]' : 'border-[var(--eh-border)] bg-white hover:border-[var(--eh-border-strong)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.07)]'}`}
                >
                  <div className="flex items-start gap-3">
                    {/* School logo */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--eh-primary-50)] text-[15px] font-bold text-[var(--eh-primary-700)]">
                      {rec.school.schoolName.charAt(0)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold text-[var(--eh-text)]">{rec.title}</p>
                          <p className="text-[13px] text-[var(--eh-text-3)]">{rec.school.schoolName}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          score >= 85 ? 'bg-emerald-50 text-emerald-700'
                          : score >= 70 ? 'bg-amber-50 text-amber-700'
                          : 'bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)]'
                        }`}>
                          {score}% match
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[var(--eh-text-4)]">
                        {rec.school.city && <span className="flex items-center gap-1"><MapPin size={10} />{rec.school.city}</span>}
                        {rec.subject && <span>{rec.subject}</span>}
                        {rec.board && <span>{rec.board}</span>}
                        {rec.jobType && <span>{rec.jobType.replace(/_/g, ' ')}</span>}
                        {(rec.salaryMin || rec.salaryMax) && (
                          <span className="font-semibold text-[var(--eh-primary-700)]">
                            {formatSalary(rec.salaryMin ?? 0, rec.salaryMax ?? 0)}/mo
                          </span>
                        )}
                      </div>

                      {/* Why it matches */}
                      {matchPoints.length > 0 && (
                        <div className="mt-3 rounded-lg border border-[var(--eh-border)] bg-[var(--surface-base)] p-3">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Why it matches</p>
                          <div className="space-y-1.5">
                            {matchPoints.slice(0, 3).map((point, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-500" />
                                <p className="text-[12px] leading-[1.4] text-[var(--eh-text-2)]">{point}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Score breakdown bars */}
                      {rec.breakdown && (
                        <div className="mt-3 space-y-1.5">
                          {[
                            { label: 'Subject', value: rec.breakdown.subject },
                            { label: 'Location', value: rec.breakdown.location },
                            { label: 'Board', value: rec.breakdown.board },
                            { label: 'Salary', value: rec.breakdown.salary },
                            { label: 'Experience', value: rec.breakdown.experience },
                          ].map(({ label, value }) => (
                            <div key={label} className="flex items-center gap-2">
                              <span className="w-16 text-[11px] text-[var(--eh-text-4)]">{label}</span>
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-base)]">
                                <div className="h-full rounded-full bg-[var(--eh-primary-500)]" style={{ width: `${Math.round(value * 100)}%` }} />
                              </div>
                              <span className="w-8 text-right text-[11px] font-semibold text-[var(--eh-text-3)]">
                                {Math.round(value * 100)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Link
                      href={`/dashboard/jobs?selected=${rec.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="eh-btn eh-btn-primary eh-btn-sm"
                    >
                      View Job
                    </Link>
                  </div>
                </div>
              );
            })}

            <div className="text-center">
              <Link href="/dashboard/jobs" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--eh-primary-600)] hover:underline">
                <BriefcaseBusiness size={14} /> View More Recommendations
              </Link>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="hidden xl:flex xl:flex-col xl:gap-4">
            {/* Profile completion */}
            <Panel className="p-5 text-center">
              <p className="mb-3 text-[13px] font-semibold text-[var(--eh-text)]">Your Profile Completion</p>
              <div className="relative mx-auto mb-3 flex h-24 w-24 items-center justify-center">
                <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--eh-border)" strokeWidth="9" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke="var(--eh-primary-600)" strokeWidth="9"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - (completion ?? 0) / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-[18px] font-bold text-[var(--eh-primary-700)]">{completion === null ? '—' : `${completion}%`}</span>
              </div>
              <p className="text-[12px] text-[var(--eh-text-3)]">
                {completion !== null && completion >= 90
                  ? 'Excellent! A complete profile gets you better matches.'
                  : 'Complete your profile to get even better matches.'}
              </p>
              <Link
                href="/dashboard/profile"
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--eh-primary-600)] px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[var(--eh-primary-700)]"
              >
                Complete Profile <ArrowRight size={12} />
              </Link>
            </Panel>

            {/* Top Subjects in Your Matches */}
            {topSkills.length > 0 && (
              <Panel className="p-5">
                <PanelHeader title="Top Subjects in Your Matches" compact />
                <div className="flex flex-wrap gap-2">
                  {topSkills.map((skill) => (
                    <span key={skill} className="rounded-full border border-[var(--eh-border)] bg-[var(--surface-base)] px-2.5 py-1 text-[11px] font-medium text-[var(--eh-text-2)]">
                      {skill}
                    </span>
                  ))}
                </div>
              </Panel>
            )}

            {/* Match notes */}
            <Panel className="p-5">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--eh-text)]">
                <TrendingUp size={14} className="text-[var(--eh-primary-600)]" />
                Improve Matches
              </div>
              <p className="mt-2 text-[12px] leading-[1.5] text-[var(--eh-text-3)]">
                Add subjects, preferred boards, city, and experience details to sharpen your match ranking.
              </p>
              <Link href="/dashboard/profile" className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--eh-primary-600)] hover:underline">
                Improve profile <ArrowRight size={11} />
              </Link>
            </Panel>
          </div>
        </div>
      )}
    </PageShell>
  );
}
