'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Modal from '@/components/ui/modal';
import { PageHeader } from '@/components/layout/page-shell';
import { EmptyState, LoadingState } from '@/components/system/system-states';
import { getApiErrorMessage } from '@/lib/api/client';
import { getAlerts, createAlert, updateAlert, deleteAlert as apiDeleteAlert } from '@/lib/api/alerts-client';
import { getProfile, updateProfile } from '@/lib/api/profile-client';

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
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    city: '',
    board: '',
    gradeLevel: '',
    jobType: '',
    salaryMin: '',
    salaryMax: '',
    frequency: 'DAILY_DIGEST',
  });

  useEffect(() => {
    fetchAlerts();
    getProfile()
      .then((data) => {
        setWhatsappNumber(data.whatsappNumber || '');
        setWhatsappOptin(!!data.whatsappOptin);
      })
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
    setFormData({
      name: '',
      subject: '',
      city: '',
      board: '',
      gradeLevel: '',
      jobType: '',
      salaryMin: '',
      salaryMax: '',
      frequency: 'DAILY_DIGEST',
    });
    setEditingId(null);
  }

  async function saveAlert() {
    if (!formData.name.trim()) {
      toast.error('Alert name is required');
      return;
    }

    const payload: Record<string, unknown> = {
      name: formData.name,
      frequency: formData.frequency,
    };

    if (formData.subject) payload.subject = formData.subject;
    if (formData.city) payload.city = formData.city;
    if (formData.board) payload.board = formData.board;
    if (formData.gradeLevel) payload.gradeLevel = formData.gradeLevel;
    if (formData.jobType) payload.jobType = formData.jobType;
    if (formData.salaryMin) payload.salaryMin = Number(formData.salaryMin);
    if (formData.salaryMax) payload.salaryMax = Number(formData.salaryMax);

    try {
      if (editingId) {
        await updateAlert(editingId, payload);
      } else {
        await createAlert(payload as Parameters<typeof createAlert>[0]);
      }
      toast.success(`Alert ${editingId ? 'updated' : 'created'}`);
      setIsOpen(false);
      resetForm();
      await fetchAlerts();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save alert'));
    }
  }

  async function deleteAlert(id: string) {
    const confirmed = window.confirm('Delete this alert?');
    if (!confirmed) return;

    try {
      await apiDeleteAlert(id);
      toast.success('Alert deleted');
      await fetchAlerts();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete alert'));
    }
  }

  async function toggleAlert(alert: JobAlert) {
    try {
      await updateAlert(alert.id, { isActive: !alert.isActive });
      toast.success(alert.isActive ? 'Alert paused' : 'Alert activated');
      await fetchAlerts();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update alert'));
    }
  }

  function editAlert(alert: JobAlert) {
    setFormData({
      name: alert.name,
      subject: alert.subject || '',
      city: alert.city || '',
      board: alert.board || '',
      gradeLevel: alert.gradeLevel || '',
      jobType: alert.jobType || '',
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

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <PageHeader title="Job Alerts" subtitle="Get notified when matching jobs are posted" />
        <Button onClick={() => { resetForm(); setIsOpen(true); }}>
          <Bell className="w-4 h-4 mr-2" />
          New Alert
        </Button>
      </div>

      <section className="mb-6 rounded-2xl border border-[var(--eh-border)] bg-white p-5">
        <p className="font-semibold text-[14px]">WhatsApp Alerts</p>
        <p className="text-[13px] text-[var(--eh-text-3)] mt-1">
          Receive job alerts and interview reminders on WhatsApp.
        </p>
        <div className="mt-4 space-y-3">
          <Input
            type="tel"
            placeholder="+91 98765 43210"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={whatsappOptin} onChange={(e) => setWhatsappOptin(e.target.checked)} />
            <span className="text-[13px]">Send me job alerts on WhatsApp</span>
          </label>
          <Button onClick={saveWhatsAppSettings} disabled={savingWhatsApp}>
            {savingWhatsApp ? 'Saving...' : 'Save WhatsApp settings'}
          </Button>
        </div>
      </section>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingId ? 'Edit Alert' : 'Create Job Alert'}
        footer={(
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={saveAlert}>{editingId ? 'Update' : 'Create'} Alert</Button>
          </div>
        )}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Alert Name *</label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="e.g., Math jobs in Bangalore" />
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <Input id="subject" value={formData.subject} onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))} placeholder="e.g., Mathematics" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <Input id="city" value={formData.city} onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="board" className="block text-sm font-medium text-gray-700 mb-1">Board</label>
              <select id="board" value={formData.board} onChange={(e) => setFormData((p) => ({ ...p, board: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="">Any</option>
                {BOARDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
              <Input id="gradeLevel" value={formData.gradeLevel} onChange={(e) => setFormData((p) => ({ ...p, gradeLevel: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
              <select id="jobType" value={formData.jobType} onChange={(e) => setFormData((p) => ({ ...p, jobType: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="">Any</option>
                {JOB_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="salaryMin" className="block text-sm font-medium text-gray-700 mb-1">Min Salary (INR)</label>
              <Input id="salaryMin" type="number" value={formData.salaryMin} onChange={(e) => setFormData((p) => ({ ...p, salaryMin: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="salaryMax" className="block text-sm font-medium text-gray-700 mb-1">Max Salary (INR)</label>
              <Input id="salaryMax" type="number" value={formData.salaryMax} onChange={(e) => setFormData((p) => ({ ...p, salaryMax: e.target.value }))} />
            </div>
          </div>
          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">Notification Frequency *</label>
            <select id="frequency" value={formData.frequency} onChange={(e) => setFormData((p) => ({ ...p, frequency: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
              {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      {loading ? (
        <LoadingState title="Loading alerts" message="Fetching your alert subscriptions." />
      ) : alerts.length === 0 ? (
        <EmptyState title="No alerts yet" message="Create your first job alert to start getting notified." />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between hover:bg-gray-50 transition">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Button size="sm" variant={alert.isActive ? 'primary' : 'secondary'} onClick={() => toggleAlert(alert)}>
                    {alert.isActive ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  </Button>
                  <div>
                    <h3 className="font-medium">{alert.name}</h3>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {alert.subject && <Badge className="text-xs">{alert.subject}</Badge>}
                      {alert.city && <Badge className="text-xs">{alert.city}</Badge>}
                      {alert.board && <Badge className="text-xs">{alert.board}</Badge>}
                      {typeof alert.salaryMin === 'number' && (
                        <Badge className="text-xs">INR {alert.salaryMin}-{alert.salaryMax || alert.salaryMin}</Badge>
                      )}
                      <Badge className="text-xs">
                        {FREQUENCIES.find((f) => f.value === alert.frequency)?.label || alert.frequency}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => editAlert(alert)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="secondary" onClick={() => deleteAlert(alert.id)}>
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">How job alerts work</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>- Alerts are checked at 8 AM daily (or immediately when posted for real-time alerts)</li>
          <li>- You receive an email with matching jobs</li>
          <li>- Create multiple alerts for different roles or locations</li>
          <li>- Pause or delete alerts anytime</li>
        </ul>
      </div>
    </div>
  );
}
