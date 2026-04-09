'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, Calendar, MapPin, Video, Phone, Users, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import type { InterviewWithApplication } from '@/types';

export default function InterviewsPage() {
  const { data: session } = useSession();
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'confirmed' | 'completed'>('all');
  const [interviews, setInterviews] = useState<InterviewWithApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchInterviews();
  }, []);

  async function fetchInterviews() {
    try {
      setLoading(true);
      const res = await fetch('/api/interviews');
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setInterviews(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load interviews');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(interviewId: string, status: string) {
    try {
      setUpdating(interviewId);
      const res = await fetch(`/api/interviews/${interviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success('Interview updated');
      fetchInterviews();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setUpdating(null);
    }
  }

  const isTeacher = session?.user?.role === 'TEACHER';
  const isSchool = session?.user?.role === 'SCHOOL_ADMIN';

  const filteredInterviews = interviews.filter((interview) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'upcoming') return new Date(interview.scheduledAt) > new Date();
    if (statusFilter === 'confirmed') return interview.status === 'CONFIRMED';
    if (statusFilter === 'completed') return interview.status === 'COMPLETED';
    return true;
  });

  const getStatusColor = (status: string) => {
    if (status === 'CONFIRMED') return 'bg-emerald-100 text-emerald-800';
    if (status === 'PENDING') return 'bg-amber-100 text-amber-800';
    if (status === 'COMPLETED') return 'bg-blue-100 text-blue-800';
    if (status === 'CANCELLED') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Interviews</h1>
        <p className="text-gray-600 mt-2">
          {isTeacher
            ? 'Track your interview invitations and confirmations'
            : 'Manage interviews for your job postings'}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['all', 'upcoming', 'confirmed', 'completed'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === filter
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredInterviews.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">
            {isTeacher ? 'No interview invitations yet' : 'No scheduled interviews'}
          </p>
        </div>
      )}

      {/* Interviews List */}
      <div className="space-y-4">
        {filteredInterviews.map((interview) => (
          <div key={interview.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-gray-200 flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{interview.application.job.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {interview.application.job.school.schoolName}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(interview.status)}`}>
                {interview.status}
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Interview Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {/* Date & Time */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-600">Date & Time</p>
                    <p className="font-medium">
                      {format(new Date(interview.scheduledAt), 'MMM dd, yyyy • h:mm a')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(interview.scheduledAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-600">Duration</p>
                    <p className="font-medium">{interview.durationMins} minutes</p>
                  </div>
                </div>

                {/* Type & Location */}
                <div className="flex items-start gap-3">
                  {interview.type === 'VIDEO' ? (
                    <Video className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                  ) : interview.type === 'PHONE' ? (
                    <Phone className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <MapPin className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-gray-600">
                      {interview.type === 'VIDEO' ? 'Video Call' : interview.type === 'PHONE' ? 'Phone Call' : 'In Person'}
                    </p>
                    <p className="font-medium">
                      {interview.meetingLink ? (
                        <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                          Join Meeting
                        </a>
                      ) : interview.location ? (
                        interview.location
                      ) : (
                        'To be confirmed'
                      )}
                    </p>
                  </div>
                </div>

                {/* School/Candidate */}
                <div className="flex items-start gap-3">
                  <Users className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-600">
                      {isTeacher ? 'School' : 'Candidate'}
                    </p>
                    <p className="font-medium">
                      {isTeacher
                        ? interview.application.job.school.schoolName
                        : (interview.application as any).applicant?.name || 'Candidate'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {(interview.schoolNotes || interview.teacherNotes) && (
                <div className="bg-gray-50 p-3 rounded text-sm border border-gray-200">
                  <p className="text-gray-600 font-medium mb-1">Notes:</p>
                  <p className="text-gray-700">{interview.schoolNotes || interview.teacherNotes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                {isTeacher && interview.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => updateStatus(interview.id, 'CONFIRMED')}
                      disabled={updating === interview.id}
                      className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 font-medium text-sm flex items-center justify-center gap-2"
                    >
                      {updating === interview.id && <Loader2 className="w-4 h-4 animate-spin" />}
                      Confirm Interview
                    </button>
                    <button
                      onClick={() => updateStatus(interview.id, 'CANCELLED')}
                      disabled={updating === interview.id}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium text-sm"
                    >
                      Decline
                    </button>
                  </>
                )}

                {isSchool && interview.status !== 'COMPLETED' && interview.status !== 'CANCELLED' && (
                  <>
                    <button
                      onClick={() => updateStatus(interview.id, 'COMPLETED')}
                      disabled={updating === interview.id}
                      className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 font-medium text-sm"
                    >
                      Mark Complete
                    </button>
                    <button
                      onClick={() => updateStatus(interview.id, 'CANCELLED')}
                      disabled={updating === interview.id}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 font-medium text-sm"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
