'use client';

import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Interview } from '@prisma/client';

interface ScheduleInterviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  onSuccess: (interview: Interview) => void;
}

export function ScheduleInterviewModal({
  open,
  onOpenChange,
  applicationId,
  onSuccess,
}: ScheduleInterviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    scheduledAt: '',
    durationMins: '30',
    type: 'VIDEO',
    meetingLink: '',
    location: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.scheduledAt) {
      toast.error('Please select a date and time');
      return;
    }

    if (formData.type === 'VIDEO' && !formData.meetingLink) {
      toast.error('Please provide a meeting link for video interviews');
      return;
    }

    if (formData.type === 'IN_PERSON' && !formData.location) {
      toast.error('Please provide a location for in-person interviews');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          scheduledAt: new Date(formData.scheduledAt).toISOString(),
          durationMins: parseInt(formData.durationMins),
          type: formData.type,
          meetingLink: formData.meetingLink || undefined,
          location: formData.location || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to schedule interview');
      }

      const data = await res.json();
      toast.success('Interview scheduled successfully');
      onSuccess(data.data);
      onOpenChange(false);
      setFormData({
        scheduledAt: '',
        durationMins: '30',
        type: 'VIDEO',
        meetingLink: '',
        location: '',
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to schedule interview');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-[500px] w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Schedule Interview</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 px-6 pt-4">
          Set up an interview with the candidate. They'll receive an email invitation with calendar details.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Date & Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              disabled={loading}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <select
              value={formData.durationMins}
              onChange={(e) => setFormData({ ...formData, durationMins: e.target.value })}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
              <option value="120">120 minutes</option>
            </select>
          </div>

          {/* Interview Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interview Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value, meetingLink: '', location: '' })}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50"
            >
              <option value="VIDEO">Video Call</option>
              <option value="PHONE">Phone Call</option>
              <option value="IN_PERSON">In Person</option>
            </select>
          </div>

          {/* Meeting Link (for video) */}
          {formData.type === 'VIDEO' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Link
              </label>
              <input
                type="url"
                placeholder="https://meet.google.com/... or https://zoom.us/..."
                value={formData.meetingLink}
                onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                disabled={loading}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50"
              />
            </div>
          )}

          {/* Location (for in-person) */}
          {formData.type === 'IN_PERSON' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <textarea
                placeholder="e.g., Conference Room A, Building B, 2nd Floor"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={loading}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 resize-none"
                rows={3}
              />
            </div>
          )}

          {/* Notes (for phone) */}
          {formData.type === 'PHONE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (optional)
              </label>
              <textarea
                placeholder="e.g., Call number, preferred time, dial-in instructions..."
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 resize-none"
                rows={3}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Schedule Interview
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
