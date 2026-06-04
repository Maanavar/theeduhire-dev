'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Edit2, Plus, Trash2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Modal from '@/components/ui/modal';
import { PageHeader, PageShell, Panel, PanelHeader, StatusBadge } from '@/components/layout/page-shell';
import { EmptyState, LoadingState } from '@/components/system/system-states';
import { getApiErrorMessage } from '@/lib/api/client';
import { getAlerts, createAlert, updateAlert, deleteAlert as apiDeleteAlert } from '@/lib/api/alerts-client';
import { getProfile, updateProfile } from '@/lib/api/profile-client';
import { JOB_EXPERIENCE_LEVELS } from '@/config/constants';
import Link from 'next/link';

import type { JobAlert } from '@/lib/api/alerts-client';

const BOARDS = ['CBSE', 'ICSE', 'STATE_BOARD', 'IB', 'CAMBRIDGE', 'OTHER'];
const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'VISITING_FACULTY'];
const FREQUENCIES = [
  { value: 'IMMEDIATE', label: 'As posted' },
  { value: 'DAILY_DIGEST', label: 'Daily digest (8 AM)' },
  { value: 'WEEKLY_DIGEST', label: 'Weekly digest (Monday 8 AM)' },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingWhatsApp, setSavingWhatsApp] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappOptin, setWhatsappOptin] = useState(false);
  const [isProTeacher, setIsProTeacher] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', subject: '', city: '', board: '', gradeLevel: '',
    jobType: '', experienceLevel: '', salaryMin: '', salaryMax: '', frequency: 'DAILY_DIGEST',
  });

  useEffect(() => {
    fetchAlerts();
    getProfile()
      .then((data) => { setWhatsappNumber(data.whatsappNumber || ''); setWhatsappOptin(!!data.whatsappOptin); })
      .catch(() => {});
    fetch('/api/billing/teacher-plan')
      .then((res) => res.json())
      .then((json) => { if (json.success) setIsProTeacher(json.data.plan === 'PRO'); })
      .catch(() => {});
  }, []);

  async function fetchAlerts() {
    try {
      setLoading(true);
      const data = await getAlerts();
      setAlerts(data);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to fetch alerts'));
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({ name: '', subject: '', city: '', board: '', gradeLevel: '', jobType: '', experienceLevel: '', salaryMin: '', salaryMax: '', frequency: 'DAILY_DIGEST' });
    setEditingId(null);
  }

  async function saveAlert() {
    if (!formData.name.trim()) { toast.error('Alert name is required'); return; }
    const payload: Record<string, unknown> = { name: formData.name, frequency: formData.frequency };
    if (formData.subject) payload.subject = formData.subject;
    if (formData.city) payload.city = formData.city;
    if (formData.board) payload.board = formData.board;
    if (formData.gradeLevel) payload.gradeLevel = formData.gradeLevel;
    if (formData.jobType) payload.jobType = formData.jobType;
    if (formData.experienceLevel) payload.experienceLevel = formData.experienceLevel;
    if (formData.salaryMin) payload.salaryMin = Number(formData.salaryMin);
    if (formData.salaryMax) payload.salaryMax = Number(formData.salaryMax);
    try {
      if (editingId) { await updateAlert(editingId, payload); } else { await createAlert(payload as Parameters<typeof createAlert>[0]); }
      toast.success(`Alert ${editingId ? 'updated' : 'created'}`);
      setIsOpen(false); resetForm(); await fetchAlerts();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save alert'));
    }
  }

  async function deleteAlert(id: string) {
    if (!window.confirm('Delete this alert?')) return;
    try { await apiDeleteAlert(id); toast.success('Alert deleted'); await fetchAlerts(); }
    catch (err) { toast.error(getApiErrorMessage(err, 'Failed to delete alert')); }
  }

  async function toggleAlert(alert: JobAlert) {
    try { await updateAlert(alert.id, { isActive: !alert.isActive }); toast.success(alert.isActive ? 'Alert paused' : 'Alert activated'); await fetchAlerts(); }
    catch (err) { toast.error(getApiErrorMessage(err, 'Failed to update alert')); }
  }

  function editAlert(alert: JobAlert) {
    setFormData({
      name: alert.name, subject: alert.subject || '', city: alert.city || '',
      board: alert.board || '', gradeLevel: alert.gradeLevel || '', jobType: alert.jobType || '',
      experienceLevel: (alert as Record<string, unknown>).experienceLevel as string || '',
      salaryMin: alert.salaryMin ? String(alert.salaryMin) : '',
      salaryMax: alert.salaryMax ? String(alert.salaryMax) : '',
      frequency: alert.frequency,
    });
    setEditingId(alert.id);
    setIsOpen(true);
  }

  async function saveWhatsAppSettings() {
    try {
      setSavingWhatsApp(true);
      await updateProfile({ whatsappNumber, whatsappOptin });
      toast.success('WhatsApp settings saved');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save WhatsApp settings'));
    } finally {
      setSavingWhatsApp(false);
    }
  }

  const activeAlerts = alerts.filter((a) => a.isActive);
  const pausedAlerts = alerts.filter((a) => !a.isActive);

  return (
    <PageShell>
      <PageHeader
        title="Job Alerts"
        subtitle="Stay updated with the latest job opportunities that match your preferences."
        actions={
          <button onClick={() => { resetForm(); setIsOpen(true); }} className="eh-btn eh-btn-primary">
            <Plus size={14} /> Create New Alert
          </button>
        }
      />

      {/* Create/Edit Modal */}
      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingId ? 'Edit Alert' : 'Create Job Alert'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={saveAlert}>{editingId ? 'Update' : 'Create'} Alert</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="eh-label">Alert Name *</label>
            <Input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="e.g., Math jobs in Bangalore" />
          </div>
          <div>
            <label className="eh-label">Subject</label>
            <Input value={formData.subject} onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))} placeholder="e.g., Mathematics" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eh-label">City</label>
              <Input value={formData.city} onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))} />
            </div>
            <div>
              <label className="eh-label">Board</label>
              <select value={formData.board} onChange={(e) => setFormData((p) => ({ ...p, board: e.target.value }))} className="input-base w-full">
                <option value="">Any</option>
                {BOARDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eh-label">Grade Level</label>
              <Input value={formData.gradeLevel} onChange={(e) => setFormData((p) => ({ ...p, gradeLevel: e.target.value }))} />
            </div>
            <div>
              <label className="eh-label">Job Type</label>
              <select value={formData.jobType} onChange={(e) => setFormData((p) => ({ ...p, jobType: e.target.value }))} className="input-base w-full">
                <option value="">Any</option>
                {JOB_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="eh-label">Experience Level</label>
            <select value={formData.experienceLevel} onChange={(e) => setFormData((p) => ({ ...p, experienceLevel: e.target.value }))} className="input-base w-full">
              <option value="">Any</option>
              {JOB_EXPERIENCE_LEVELS.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eh-label">Min Salary (INR)</label>
              <Input type="number" value={formData.salaryMin} onChange={(e) => setFormData((p) => ({ ...p, salaryMin: e.target.value }))} />
            </div>
            <div>
              <label className="eh-label">Max Salary (INR)</label>
              <Input type="number" value={formData.salaryMax} onChange={(e) => setFormData((p) => ({ ...p, salaryMax: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="eh-label">Notification Frequency *</label>
            <select
              value={formData.frequency}
              onChange={(e) => { if (e.target.value === 'IMMEDIATE' && !isProTeacher) return; setFormData((p) => ({ ...p, frequency: e.target.value })); }}
              className="input-base w-full"
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value} disabled={f.value === 'IMMEDIATE' && !isProTeacher}>
                  {f.label}{f.value === 'IMMEDIATE' && !isProTeacher ? ' (Pro only)' : ''}
                </option>
              ))}
            </select>
            {!isProTeacher && (
              <p className="mt-1.5 text-[12px] text-[var(--eh-text-3)]">
                Instant alerts require{' '}
                <Link href="/dashboard/subscription" className="font-semibold text-[var(--eh-primary-600)] underline underline-offset-2">Teacher Pro</Link>.
              </p>
            )}
          </div>
        </div>
      </Modal>

      <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
        {/* Main content */}
        <div className="min-w-0 space-y-4">
          {loading ? (
            <LoadingState title="Loading alerts" message="Fetching your alert subscriptions." />
          ) : alerts.length === 0 ? (
            <EmptyState
              title="No alerts yet"
              message="Create your first job alert to get notified when matching jobs are posted."
              actions={
                <button onClick={() => { resetForm(); setIsOpen(true); }} className="eh-btn eh-btn-primary">
                  <Plus size={14} /> Create New Alert
                </button>
              }
            />
          ) : (
            <>
              {/* Active alerts */}
              {activeAlerts.length > 0 && (
                <div className="space-y-3">
                  {activeAlerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} onEdit={editAlert} onDelete={deleteAlert} onToggle={toggleAlert} />
                  ))}
                </div>
              )}

              {/* Paused alerts */}
              {pausedAlerts.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">Paused Alerts ({pausedAlerts.length})</p>
                  {pausedAlerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} onEdit={editAlert} onDelete={deleteAlert} onToggle={toggleAlert} paused />
                  ))}
                </div>
              )}
            </>
          )}

          {/* WhatsApp section */}
          <Panel className="p-5">
            <PanelHeader title="WhatsApp Alerts" subtitle="Receive job alerts and interview reminders on WhatsApp." compact />
            <div className="space-y-3">
              <Input
                type="tel"
                placeholder="+91 98765 43210"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
              />
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={whatsappOptin} onChange={(e) => setWhatsappOptin(e.target.checked)} />
                <span className="text-[13px] text-[var(--eh-text-2)]">Send me job alerts on WhatsApp</span>
              </label>
              <Button onClick={saveWhatsAppSettings} disabled={savingWhatsApp} variant="secondary" size="sm">
                {savingWhatsApp ? 'Saving…' : 'Save WhatsApp Settings'}
              </Button>
            </div>
          </Panel>
        </div>

        {/* Right sidebar */}
        <div className="hidden xl:flex xl:flex-col xl:gap-4">
          {/* Alert Insights */}
          <Panel className="p-5">
            <PanelHeader title="Alert Insights" compact />
            <div className="space-y-3">
              <div className="rounded-lg bg-[var(--surface-base)] px-3 py-3 text-center">
                <p className="text-[24px] font-bold text-[var(--eh-primary-700)]">{activeAlerts.length}</p>
                <p className="text-[11px] text-[var(--eh-text-4)]">Active Alerts</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-[var(--surface-base)] px-2 py-2 text-center">
                  <p className="text-[18px] font-bold text-[var(--eh-text)]">—</p>
                  <p className="text-[10px] text-[var(--eh-text-4)]">Emails Sent</p>
                </div>
                <div className="rounded-lg bg-[var(--surface-base)] px-2 py-2 text-center">
                  <p className="text-[18px] font-bold text-[var(--eh-text)]">—</p>
                  <p className="text-[10px] text-[var(--eh-text-4)]">New Matches</p>
                </div>
              </div>
            </div>
          </Panel>

          {/* Tips */}
          <Panel className="p-5">
            <PanelHeader title="Tips to Get Better Alerts" compact />
            <div className="space-y-2">
              {[
                "Be specific — add subject, board, and location for precise matches.",
                "Add preferred salary range to filter out mismatched roles.",
                "Create multiple alerts for different roles or locations.",
              ].map((tip, i) => (
                <div key={i} className="flex gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--eh-primary-50)] text-[10px] font-bold text-[var(--eh-primary-700)]">{i + 1}</span>
                  <p className="text-[12px] leading-[1.4] text-[var(--eh-text-3)]">{tip}</p>
                </div>
              ))}
            </div>
          </Panel>

          {/* Help */}
          <Panel className="p-4">
            <div className="flex items-start gap-2">
              <TrendingUp size={14} className="mt-0.5 shrink-0 text-[var(--eh-primary-600)]" />
              <div>
                <p className="text-[13px] font-semibold text-[var(--eh-text)]">Need Help?</p>
                <Link href="mailto:support@theeduhire.in" className="mt-1 inline-block text-[12px] font-semibold text-[var(--eh-primary-600)] hover:underline">
                  Contact Support →
                </Link>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}

function AlertCard({
  alert, onEdit, onDelete, onToggle, paused = false,
}: {
  alert: JobAlert;
  onEdit: (a: JobAlert) => void;
  onDelete: (id: string) => void;
  onToggle: (a: JobAlert) => void;
  paused?: boolean;
}) {
  const freqLabel = { IMMEDIATE: 'As posted', DAILY_DIGEST: 'Daily', WEEKLY_DIGEST: 'Weekly' }[alert.frequency] ?? alert.frequency;
  const filters = [alert.subject, alert.city, alert.board, alert.jobType?.replace(/_/g, ' ')].filter(Boolean);

  return (
    <Panel className={`p-4 ${paused ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-semibold text-[var(--eh-text)]">{alert.name}</p>
            <StatusBadge tone={alert.isActive ? 'success' : 'neutral'} dot>
              {alert.isActive ? 'Active' : 'Paused'}
            </StatusBadge>
          </div>
          {filters.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {filters.map((f) => (
                <span key={f} className="rounded-full border border-[var(--eh-border)] bg-[var(--surface-base)] px-2 py-0.5 text-[11px] font-medium text-[var(--eh-text-3)]">
                  {f}
                </span>
              ))}
              <span className="rounded-full border border-[var(--eh-border)] bg-[var(--surface-base)] px-2 py-0.5 text-[11px] font-medium text-[var(--eh-text-3)]">
                {freqLabel}
              </span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Toggle ON/OFF */}
          <button
            onClick={() => onToggle(alert)}
            className={`relative h-5 w-9 rounded-full transition-colors ${alert.isActive ? 'bg-[var(--eh-primary-600)]' : 'bg-[var(--eh-border)]'}`}
            aria-label={alert.isActive ? 'Pause alert' : 'Activate alert'}
          >
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${alert.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
          <button onClick={() => onEdit(alert)} className="rounded-lg border border-[var(--eh-border)] p-1.5 text-[var(--eh-text-4)] hover:bg-[var(--surface-base)]">
            <Edit2 size={13} />
          </button>
          <button onClick={() => onDelete(alert.id)} className="rounded-lg border border-[var(--eh-border)] p-1.5 text-[var(--eh-text-4)] hover:border-red-200 hover:text-red-500">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </Panel>
  );
}
