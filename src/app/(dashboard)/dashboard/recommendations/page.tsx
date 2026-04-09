'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, Sparkles, TrendingUp } from 'lucide-react';
import { RecommendationCard } from '@/components/recommendations/recommendation-card';
import type { JobRecommendation } from '@/types';

export default function RecommendationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'recent' | 'salary'>('score');
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [filterBoard, setFilterBoard] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Redirect non-teachers
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
      const res = await fetch('/api/ai/recommendations');
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to fetch recommendations');
        return;
      }

      setRecommendations(data.data || []);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setError('Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  }

  // Get unique subjects and boards for filters
  const subjects = useMemo(() =>
    [...new Set(recommendations.map(r => r.subject).filter(Boolean))].sort(),
    [recommendations]
  );

  const boards = useMemo(() =>
    [...new Set(recommendations.map(r => r.board).filter(Boolean))].sort(),
    [recommendations]
  );

  // Filter and sort recommendations
  const filteredRecommendations = useMemo(() => {
    let filtered = recommendations.filter(rec => {
      const matchesSearch =
        rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.school.schoolName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject = !filterSubject || rec.subject === filterSubject;
      const matchesBoard = !filterBoard || rec.board === filterBoard;

      return matchesSearch && matchesSubject && matchesBoard;
    });

    // Sort
    if (sortBy === 'score') {
      filtered.sort((a, b) => b.matchScore - a.matchScore);
    } else if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
    } else if (sortBy === 'salary') {
      filtered.sort((a, b) => (b.salaryMax || 0) - (a.salaryMax || 0));
    }

    return filtered;
  }, [recommendations, filterSubject, filterBoard, searchTerm, sortBy]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Recommendations</h1>
          <p className="text-gray-600 mt-2">Personalized job matches based on your profile</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-brand-50 rounded-lg">
            <Sparkles className="w-6 h-6 text-brand-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Job Recommendations</h1>
        </div>
        <p className="text-gray-600 mt-2">
          Personalized job matches based on your profile and preferences
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!error && recommendations.length === 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">No recommendations yet</p>
            <p className="text-sm text-amber-700 mt-1">Complete your profile to receive personalized job recommendations</p>
          </div>
        </div>
      )}

      {/* Filters & Sort (shown only if recommendations exist) */}
      {recommendations.length > 0 && (
        <div className="card p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by job title or school..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            {/* Subject Filter */}
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white"
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>

            {/* Board Filter */}
            <select
              value={filterBoard}
              onChange={(e) => setFilterBoard(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white"
            >
              <option value="">All Boards</option>
              {boards.map(board => (
                <option key={board} value={board}>{board}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white"
            >
              <option value="score">Best Match</option>
              <option value="recent">Most Recent</option>
              <option value="salary">Highest Salary</option>
            </select>
          </div>

          {/* Results info */}
          {filteredRecommendations.length > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t border-gray-200">
              <span>Showing {filteredRecommendations.length} of {recommendations.length} jobs</span>
              {filteredRecommendations.length > 0 && (
                <div className="flex items-center gap-1 text-brand-600 font-medium">
                  <TrendingUp className="w-4 h-4" />
                  Top match: {filteredRecommendations[0].matchScore}%
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* No results */}
      {recommendations.length > 0 && filteredRecommendations.length === 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">No jobs match your filters. Try adjusting your search.</p>
        </div>
      )}

      {/* Recommendations Grid */}
      {filteredRecommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecommendations.map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      )}
    </div>
  );
}
