'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Modal from '@/components/ui/modal';
import { AlertCircle, Trash2, Edit2, Bell } from 'lucide-react';

interface JobAlert {
  id: string;
  name: string;
  subject?: string;
  city?: string;
  board?: string;
  gradeLevel?: string;
  jobType?: string;
  salaryMin?: number;
  salaryMax?: number;
  frequency: string;
  isActive: boolean;
  createdAt: string;
}

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

  // Fetch alerts
  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    try {
      setLoading(true);
      const res = await fetch('/api/alerts');
      const data = await res.json();
      if (data.success) {
        setAlerts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  }

  // Save alert (create or update)
  async function saveAlert() {
    if (!formData.name.trim()) {
      alert('Alert name is required');
      return;
    }

    try {
      const payload: any = {
        name: formData.name,
        frequency: formData.frequency,
      };

      // Only include optional fields if set
      if (formData.subject) payload.subject = formData.subject;
      if (formData.city) payload.city = formData.city;
      if (formData.board) payload.board = formData.board;
      if (formData.gradeLevel) payload.gradeLevel = formData.gradeLevel;
      if (formData.jobType) payload.jobType = formData.jobType;
      if (formData.salaryMin) payload.salaryMin = parseInt(formData.salaryMin);
      if (formData.salaryMax) payload.salaryMax = parseInt(formData.salaryMax);

      const url = editingId ? `/api/alerts/${editingId}` : '/api/alerts';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsOpen(false);
        resetForm();
        fetchAlerts();
        alert(`✓ Alert ${editingId ? 'updated' : 'created'}!`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to save alert');
      console.error(error);
    }
  }

  // Delete alert
  async function deleteAlert(id: string) {
    if (!confirm('Delete this alert?')) return;

    try {
      const res = await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchAlerts();
        alert('Alert deleted');
      }
    } catch (error) {
      alert('Failed to delete alert');
      console.error(error);
    }
  }

  // Toggle alert active status
  async function toggleAlert(alert: JobAlert) {
    try {
      const res = await fetch(`/api/alerts/${alert.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !alert.isActive }),
      });

      const data = await res.json();
      if (data.success) {
        fetchAlerts();
      }
    } catch (error) {
      console.error('Failed to toggle alert:', error);
    }
  }

  // Edit alert
  function editAlert(alert: JobAlert) {
    setFormData({
      name: alert.name,
      subject: alert.subject || '',
      city: alert.city || '',
      board: alert.board || '',
      gradeLevel: alert.gradeLevel || '',
      jobType: alert.jobType || '',
      salaryMin: alert.salaryMin ? alert.salaryMin.toString() : '',
      salaryMax: alert.salaryMax ? alert.salaryMax.toString() : '',
      frequency: alert.frequency,
    });
    setEditingId(alert.id);
    setIsOpen(true);
  }

  // Reset form
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

  const formContent = (
    <div className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Alert Name *
        </label>
        <Input
          id="name"
          placeholder="e.g., Math jobs in Bangalore"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
          Subject
        </label>
        <Input
          id="subject"
          placeholder="e.g., Mathematics, English"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <Input
            id="city"
            placeholder="e.g., Bangalore"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="board" className="block text-sm font-medium text-gray-700 mb-1">
            Board
          </label>
          <select
            id="board"
            value={formData.board}
            onChange={(e) => setFormData({ ...formData, board: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Any</option>
            {BOARDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700 mb-1">
            Grade Level
          </label>
          <Input
            id="gradeLevel"
            placeholder="e.g., 9-12"
            value={formData.gradeLevel}
            onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 mb-1">
            Job Type
          </label>
          <select
            id="jobType"
            value={formData.jobType}
            onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Any</option>
            {JOB_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="salaryMin" className="block text-sm font-medium text-gray-700 mb-1">
            Min Salary (₹)
          </label>
          <Input
            id="salaryMin"
            type="number"
            placeholder="e.g., 30000"
            value={formData.salaryMin}
            onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="salaryMax" className="block text-sm font-medium text-gray-700 mb-1">
            Max Salary (₹)
          </label>
          <Input
            id="salaryMax"
            type="number"
            placeholder="e.g., 50000"
            value={formData.salaryMax}
            onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
          Notification Frequency *
        </label>
        <select
          id="frequency"
          value={formData.frequency}
          onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          {FREQUENCIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Job Alerts</h1>
          <p className="text-gray-600">Get notified when matching jobs are posted</p>
        </div>
        <Button onClick={() => { resetForm(); setIsOpen(true); }}>
          <Bell className="w-4 h-4 mr-2" />
          New Alert
        </Button>
      </div>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingId ? 'Edit Alert' : 'Create Job Alert'}
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveAlert}>{editingId ? 'Update' : 'Create'} Alert</Button>
          </div>
        }
      >
        {formContent}
      </Modal>

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-600">Loading alerts...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No alerts yet</p>
          <p className="text-sm text-gray-500">Create your first job alert to start getting notified</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant={alert.isActive ? 'primary' : 'secondary'}
                    onClick={() => toggleAlert(alert)}
                  >
                    {alert.isActive ? '🔔' : '🔕'}
                  </Button>
                  <div>
                    <h3 className="font-medium">{alert.name}</h3>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {alert.subject && <Badge className="text-xs">{alert.subject}</Badge>}
                      {alert.city && <Badge className="text-xs">{alert.city}</Badge>}
                      {alert.board && <Badge className="text-xs">{alert.board}</Badge>}
                      {alert.salaryMin && (
                        <Badge className="text-xs">
                          ₹{alert.salaryMin}-{alert.salaryMax || alert.salaryMin}
                        </Badge>
                      )}
                      <Badge className="text-xs">
                        {FREQUENCIES.find((f) => f.value === alert.frequency)?.label}
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

      {/* Info section */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">How job alerts work</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Alerts are checked at 8 AM daily (or immediately when posted if you choose real-time)</li>
          <li>• You'll receive an email with matching jobs</li>
          <li>• Create multiple alerts for different roles or locations</li>
          <li>• Pause or delete alerts anytime</li>
        </ul>
      </div>
    </div>
  );
}
