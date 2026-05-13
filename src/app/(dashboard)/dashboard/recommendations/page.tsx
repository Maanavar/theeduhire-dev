'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
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
import { EmptyState, ErrorState, LoadingState } from '@/components/system/system-states';
import type { JobRecommendation } from '@/types';
import { getApiErrorMessage } from '@/lib/api/client';
import { getRecommendations } from '@/lib/api/teacher-client';

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

  useEffect(() => {
    if (session && session.user.role !== 'TEACHER') {
      router.push('/dashboard');
    }
  }, [session, router]);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  async function fetchRecommendations() {
    try {
      setLoading(true);
      setError(null);
      const nextRecommendations = await getRecommendations();
      setRecommendations(nextRecommendations);
      setSelectedJobId((current) => current || nextRecommendations[0]?.id || null);
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

    if (sortBy === 'score') {
      filtered.sort((a, b) => b.matchScore - a.matchScore);
    } else if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
    } else if (sortBy === 'salary') {
      filtered.sort((a, b) => (b.salaryMax || 0) - (a.salaryMax || 0));
    }

    return filtered;
  }, [recommendations, filterSubject, filterBoard, searchTerm, sortBy]);

  useEffect(() => {
    if (filteredRecommendations.length === 0) {
      setSelectedJobId(null);
      return;
    }

    if (!selectedJobId || !filteredRecommendations.some((rec) => rec.id === selectedJobId)) {
      setSelectedJobId(filteredRecommendations[0].id);
    }
  }, [filteredRecommendations, selectedJobId]);

  const selectedRecommendation =
    filteredRecommendations.find((rec) => rec.id === selectedJobId) || filteredRecommendations[0] || null;

  const avgMatch = filteredRecommendations.length
    ? Math.round(filteredRecommendations.reduce((sum, rec) => sum + rec.matchScore, 0) / filteredRecommendations.length)
    : 0;

  if (loading) {
    return <LoadingState title="Loading recommendations" message="Scoring teaching roles against your profile." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load recommendations"
        message={error}
        actions={
          <button
            onClick={fetchRecommendations}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Try again
          </button>
        }
      />
    );
  }

  if (recommendations.length === 0) {
    return (
      <EmptyState
        title="No recommendations yet"
        message="Complete your profile to receive personalized job recommendations."
        actions={
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Complete profile <ArrowRight size={14} />
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-[#111827]">Recommendations</h1>
          <p className="text-[14px] text-slate-500">
            Your best-fit teaching roles, ranked by subject, board, and preference overlap.
          </p>
        </div>
        <Link href="/dashboard/jobs" className="eh-btn eh-btn-secondary">
          <BriefcaseBusiness size={14} /> Browse all jobs
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Matched roles" value={String(filteredRecommendations.length)} helper={`${recommendations.length} total scored`} />
        <StatCard label="Top match" value={`${filteredRecommendations[0]?.matchScore || 0}%`} helper={filteredRecommendations[0]?.school.schoolName || 'No role selected'} />
        <StatCard label="Average fit" value={`${avgMatch}%`} helper="Across current filters" />
        <StatCard label="Coverage" value={`${subjects.length} subjects`} helper={`${boards.length} boards represented`} />
      </div>

      <div className="rounded-2xl border border-[#e7ebf2] bg-white p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
          <SlidersHorizontal size={14} />
          Refine matches
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,0.7fr))]">
          <label className="flex items-center gap-2 rounded-[10px] border border-[#e6ebf3] bg-[#f8fafc] px-3 py-2">
            <Search size={15} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search by job, school, or city"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border-0 bg-transparent text-[14px] text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="rounded-[10px] border border-[#e6ebf3] bg-white px-3 py-2 text-[14px] text-slate-700 outline-none"
          >
            <option value="">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>

          <select
            value={filterBoard}
            onChange={(e) => setFilterBoard(e.target.value)}
            className="rounded-[10px] border border-[#e6ebf3] bg-white px-3 py-2 text-[14px] text-slate-700 outline-none"
          >
            <option value="">All boards</option>
            {boards.map((board) => (
              <option key={board} value={board}>
                {board}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortMode)}
            className="rounded-[10px] border border-[#e6ebf3] bg-white px-3 py-2 text-[14px] text-slate-700 outline-none"
          >
            <option value="score">Best match</option>
            <option value="recent">Most recent</option>
            <option value="salary">Highest salary</option>
          </select>
        </div>
      </div>

      {filteredRecommendations.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          No roles match the current filters. Try widening subject, board, or search terms.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className="overflow-hidden rounded-2xl border border-[#e7ebf2] bg-white">
            <div className="border-b border-[#edf1f6] px-4 py-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">Curated for you</p>
              <p className="mt-1 text-[13px] text-slate-500">
                Showing {filteredRecommendations.length} ranked recommendation{filteredRecommendations.length === 1 ? '' : 's'}.
              </p>
            </div>

            <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
              {filteredRecommendations.map((rec) => {
                const active = selectedRecommendation?.id === rec.id;
                return (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => setSelectedJobId(rec.id)}
                    className={[
                      'w-full border-b border-[#edf1f6] px-4 py-4 text-left transition-colors last:border-b-0',
                      active ? 'bg-[#eef2ff]' : 'hover:bg-[#f8fafd]',
                    ].join(' ')}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-slate-900">{rec.title}</p>
                        <p className="truncate text-[12px] text-slate-500">{rec.school.schoolName}</p>
                      </div>
                      <span className="rounded-full border border-[#d7dcfa] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#4f46e5]">
                        {rec.matchScore}%
                      </span>
                    </div>

                    <div className="mb-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#f8fafc] px-2 py-0.5">
                        <MapPin size={11} />
                        {rec.school.city}
                      </span>
                      <span className="rounded-full bg-[#f8fafc] px-2 py-0.5">{rec.subject}</span>
                      <span className="rounded-full bg-[#f8fafc] px-2 py-0.5">{rec.board}</span>
                    </div>

                    <p className="line-clamp-2 text-[12px] leading-5 text-slate-600">{rec.explanation}</p>
                    {rec.breakdown ? (
                      <div className="mt-3 space-y-1.5">
                        {[
                          { label: 'Subject', value: rec.breakdown.subject },
                          { label: 'Location', value: rec.breakdown.location },
                          { label: 'Board', value: rec.breakdown.board },
                          { label: 'Salary', value: rec.breakdown.salary },
                          { label: 'Experience', value: rec.breakdown.experience },
                          ...(typeof rec.breakdown.tet === 'number' ? [{ label: 'TET', value: rec.breakdown.tet }] : []),
                        ].map(({ label, value }) => (
                          <div key={label} className="flex items-center gap-2">
                            <span className="w-16 text-[11px] text-slate-400">{label}</span>
                            <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                              <div
                                className="h-1.5 rounded-full bg-[#4f46e5]"
                                style={{ width: `${Math.round(value * 100)}%` }}
                              />
                            </div>
                            <span className="w-8 text-right text-[11px] text-slate-500">
                              {Math.round(value * 100)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-4">
            {selectedRecommendation ? (
              <div className="rounded-2xl border border-[#e7ebf2] bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#4f46e5]">Selected match</p>
                    <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.02em] text-slate-900">
                      {selectedRecommendation.title}
                    </h2>
                    <p className="mt-1 text-[14px] text-slate-500">
                      {selectedRecommendation.school.schoolName} / {selectedRecommendation.school.city}
                    </p>
                    <div className="mt-3 inline-flex items-start gap-2 rounded-2xl bg-[#f8fafc] px-3 py-2 text-[13px] text-slate-600">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#4f46e5]" />
                      <span>{selectedRecommendation.explanation || 'This role aligns well with your current profile.'}</span>
                    </div>
                  </div>
                  <MatchScoreBadge score={selectedRecommendation.matchScore} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-[12px]">
                  <span className="rounded-full bg-[#eef2ff] px-2.5 py-1 font-semibold text-[#4f46e5]">
                    {selectedRecommendation.subject}
                  </span>
                  <span className="rounded-full bg-[#f8fafc] px-2.5 py-1 text-slate-600">
                    {selectedRecommendation.board}
                  </span>
                  <span className="rounded-full bg-[#f8fafc] px-2.5 py-1 text-slate-600">
                    Grade {selectedRecommendation.gradeLevel}
                  </span>
                  <span className="rounded-full bg-[#f8fafc] px-2.5 py-1 text-slate-600">
                    {selectedRecommendation.jobType.replace(/_/g, ' ')}
                  </span>
                </div>

                {selectedRecommendation.breakdown ? (
                  <div className="mt-4 rounded-2xl border border-[#e7ebf2] bg-[#f8fafc] p-4">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">Fit breakdown</p>
                    <div className="mt-3 space-y-2">
                      {[
                        { label: 'Subject', value: selectedRecommendation.breakdown.subject },
                        { label: 'Location', value: selectedRecommendation.breakdown.location },
                        { label: 'Board', value: selectedRecommendation.breakdown.board },
                        { label: 'Salary', value: selectedRecommendation.breakdown.salary },
                        { label: 'Experience', value: selectedRecommendation.breakdown.experience },
                        ...(typeof selectedRecommendation.breakdown.tet === 'number' ? [{ label: 'TET', value: selectedRecommendation.breakdown.tet }] : []),
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center gap-3">
                          <span className="w-20 text-[12px] font-medium text-slate-500">{label}</span>
                          <div className="h-2 flex-1 rounded-full bg-white">
                            <div
                              className="h-2 rounded-full bg-[#4f46e5]"
                              style={{ width: `${Math.round(value * 100)}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-[12px] font-semibold text-slate-700">
                            {Math.round(value * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="overflow-hidden rounded-2xl border border-[#e7ebf2] bg-white">
              {selectedRecommendation ? (
                <JobDetailPanel jobId={selectedRecommendation.id} />
              ) : (
                <div className="flex min-h-[320px] items-center justify-center text-slate-500">
                  Select a recommendation to view full role details.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#e7ebf2] bg-white p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
                <TrendingUp size={15} className="text-[#4f46e5]" />
                Match notes
              </div>
              <p className="mt-2 text-[13px] leading-6 text-slate-600">
                Recommendations improve as your profile gets richer. Add subjects, preferred boards, city, and experience
                details to sharpen the ranking.
              </p>
              <Link href="/dashboard/profile" className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[#4f46e5] hover:text-[#3730a3]">
                Improve profile <ArrowRight size={13} />
              </Link>
            </div>
          </section>
        </div>
      )}

      <div className="rounded-2xl border border-[#e7ebf2] bg-white p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-4 w-4 text-slate-400" />
          <p className="text-[13px] text-slate-500">
            Prefer manual browsing too? Open the full jobs explorer for every active role, not just AI-ranked ones.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-[#e7ebf2] bg-white p-4">
      <p className="text-[12px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-[42px] font-semibold leading-none tracking-[-0.03em] text-slate-900">{value}</p>
      <p className="mt-1 text-[12px] text-slate-500">{helper}</p>
    </div>
  );
}
