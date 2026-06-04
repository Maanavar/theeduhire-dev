'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar, Clock, Loader2, MapPin, Phone, Video, X } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from "@/lib/api/client";
import { scheduleInterview, type InterviewRecord } from "@/lib/api/hiring-client";

interface ScheduleInterviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  onSuccess: (interview: InterviewRecord) => void;
}

const DURATION_OPTIONS = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '90 min' },
  { value: '120', label: '2 hours' },
];

const TYPE_OPTIONS = [
  { value: 'VIDEO', label: 'Video Call', Icon: Video },
  { value: 'PHONE', label: 'Phone', Icon: Phone },
  { value: 'IN_PERSON', label: 'In Person', Icon: MapPin },
] as const;

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
    type: 'VIDEO' as 'VIDEO' | 'PHONE' | 'IN_PERSON',
    meetingLink: '',
    location: '',
    schoolNotes: '',
  });

  const overlayRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    setTimeout(() => firstInputRef.current?.focus(), 60);
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.scheduledAt) { toast.error('Please select a date and time'); return; }
    if (formData.type === 'VIDEO' && !formData.meetingLink) { toast.error('Please add a meeting link'); return; }
    if (formData.type === 'IN_PERSON' && !formData.location) { toast.error('Please add a location'); return; }

    try {
      setLoading(true);
      const data = await scheduleInterview({
        applicationId,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        durationMins: parseInt(formData.durationMins),
        type: formData.type,
        meetingLink: formData.meetingLink || undefined,
        location: formData.location || undefined,
        schoolNotes: formData.schoolNotes || undefined,
      });
      toast.success('Interview scheduled');
      onSuccess(data);
      onOpenChange(false);
      setFormData({ scheduledAt: '', durationMins: '30', type: 'VIDEO', meetingLink: '', location: '', schoolNotes: '' });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to schedule interview'));
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-overlay-in"
      style={{ backgroundColor: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onOpenChange(false); }}
    >
      <div className="w-full sm:max-w-[480px] bg-white rounded-none sm:rounded-2xl shadow-2xl overflow-hidden animate-scale-in max-h-[96vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-[var(--eh-border)]">
          <div>
            <h2 className="text-[18px] font-semibold text-[var(--eh-text)] tracking-[-0.02em]">Schedule Interview</h2>
            <p className="mt-0.5 text-[13px] text-[var(--eh-text-3)]">Candidate gets an email invite with calendar details.</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="ml-4 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[var(--eh-text-3)] transition-colors hover:bg-[var(--surface-base)] hover:text-[var(--eh-text)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5 scrollbar-thin">

          {/* Date & Time */}
          <div>
            <label className="eh-label">Date &amp; Time *</label>
            <div className="relative">
              <Calendar size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--eh-text-4)]" />
              <input
                ref={firstInputRef}
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                disabled={loading}
                required
                className="input-base pl-9"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="eh-label">Duration</label>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={loading}
                  onClick={() => setFormData({ ...formData, durationMins: opt.value })}
                  className={[
                    'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-medium transition-all',
                    formData.durationMins === opt.value
                      ? 'border-[var(--eh-primary-400)] bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)] shadow-[0_0_0_2px_var(--eh-primary-100)]'
                      : 'border-[var(--eh-border)] bg-white text-[var(--eh-text-2)] hover:border-[var(--eh-border-strong)]',
                  ].join(' ')}
                >
                  <Clock size={12} /> {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interview Type */}
          <div>
            <label className="eh-label">Interview Type</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  disabled={loading}
                  onClick={() => setFormData({ ...formData, type: value, meetingLink: '', location: '' })}
                  className={[
                    'flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-[12px] font-medium transition-all',
                    formData.type === value
                      ? 'border-[var(--eh-primary-400)] bg-[var(--eh-primary-50)] text-[var(--eh-primary-700)] shadow-[0_0_0_2px_var(--eh-primary-100)]'
                      : 'border-[var(--eh-border)] bg-white text-[var(--eh-text-2)] hover:border-[var(--eh-border-strong)]',
                  ].join(' ')}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Meeting Link */}
          {formData.type === 'VIDEO' && (
            <div className="animate-slide-from-bottom">
              <label className="eh-label">Meeting Link *</label>
              <input
                type="url"
                placeholder="https://meet.google.com/ or https://zoom.us/..."
                value={formData.meetingLink}
                onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                disabled={loading}
                required
                className="input-base"
              />
            </div>
          )}

          {/* Location */}
          {formData.type === 'IN_PERSON' && (
            <div className="animate-slide-from-bottom">
              <label className="eh-label">Location *</label>
              <textarea
                placeholder="e.g. Conference Room A, 2nd Floor, Main Building"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={loading}
                required
                rows={2}
                className="input-base resize-none"
              />
            </div>
          )}

          {/* Phone notes */}
          {formData.type === 'PHONE' && (
            <div className="animate-slide-from-bottom">
              <label className="eh-label">Call Instructions <span className="font-normal text-[var(--eh-text-4)]">(optional)</span></label>
              <input
                type="text"
                placeholder="e.g. Dial +91 98xxx, ask for HR"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={loading}
                className="input-base"
              />
            </div>
          )}

          {/* Internal Notes */}
          <div>
            <label className="eh-label">Internal Notes <span className="font-normal text-[var(--eh-text-4)]">(optional, not sent to candidate)</span></label>
            <textarea
              placeholder="Panel members, assessment criteria, preparation notes..."
              value={formData.schoolNotes}
              onChange={(e) => setFormData({ ...formData, schoolNotes: e.target.value })}
              disabled={loading}
              rows={2}
              className="input-base resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 border-t border-[var(--eh-border)] px-6 py-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="eh-btn eh-btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            form=""
            disabled={loading}
            onClick={handleSubmit}
            className="eh-btn eh-btn-primary flex-1"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Schedule Interview
          </button>
        </div>
      </div>
    </div>
  );
}
