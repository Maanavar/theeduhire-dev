'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, Eye, FileText, HardDrive, Plus, TrendingUp, Trash2, Upload } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import { PageHeader, PageShell, Panel, PanelHeader, StatusBadge } from '@/components/layout/page-shell';
import { EmptyState } from '@/components/system/system-states';
import { getApiErrorMessage } from '@/lib/api/client';
import { deleteResume as apiDeleteResume } from '@/lib/api/teacher-client';
import { getProfile, uploadResume } from '@/lib/api/profile-client';
import { toast } from 'sonner';

interface Resume {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  isGenerated: boolean;
  template?: string;
  uploadedAt: string;
}

const ALLOWED_UPLOAD_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const TEMPLATES = [
  { id: 'ats-friendly', name: 'ATS-Friendly', description: 'Simple, no-frills format optimized for applicant tracking systems' },
  { id: 'modern', name: 'Modern', description: 'Contemporary design with colors and sections' },
  { id: 'minimal', name: 'Minimal', description: 'Clean monospace style, print-friendly' },
];

const DOC_TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF', doc: 'DOC', docx: 'DOCX', jpg: 'Image', png: 'Image', pptx: 'PPT', mp4: 'Video',
};

function getFileType(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return DOC_TYPE_LABELS[ext] ?? ext.toUpperCase();
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [generatingTemplate, setGeneratingTemplate] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'my-resumes' | 'generate'>('my-resumes');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function loadResumes() {
    getProfile()
      .then((data) => {
        if (data.resumes) setResumes(data.resumes as unknown as Resume[]);
      })
      .catch(() => {});
  }

  useEffect(() => {
    loadResumes();
  }, []);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
      toast.error('Only PDF, DOC, and DOCX files are allowed');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error('File must be under 5MB');
      return;
    }
    setUploading(true);
    try {
      await uploadResume(file);
      toast.success('Resume uploaded');
      setActiveTab('my-resumes');
      loadResumes();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to upload resume'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function generateResume(template: string) {
    setGeneratingTemplate(template);
    setProgress(0);
    try {
      const res = await fetch('/api/resumes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template }),
      });
      if (!res.ok || !res.body) { toast.error('Failed to generate resume'); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let resumeData: Resume | null = null;
      let streamEnded = false;
      while (!streamEnded) {
        const { done, value } = await reader.read();
        if (done) { streamEnded = true; break; }
        const chunk = decoder.decode(value, { stream: !done });
        for (const line of chunk.split('\n')) {
          if (line.trim().startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6).trim());
              setProgress(data.progress);
              if (data.message) setProgressMessage(data.message);
              if (data.success && data.result) resumeData = data.result as Resume;
            } catch { /* ignore */ }
          }
        }
      }
      await new Promise((r) => setTimeout(r, 200));
      if (resumeData) {
        setResumes((c) => [resumeData!, ...c]);
        toast.success(`${template} resume generated!`);
        setActiveTab('my-resumes');
      } else {
        toast.error('Failed to generate resume');
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to generate resume'));
    } finally {
      setTimeout(() => { setGeneratingTemplate(null); setProgress(0); }, 500);
    }
  }

  async function deleteResume(id: string, fileName: string) {
    const warn = resumes.length === 1
      ? `This is your only resume!\n\nDeleting it means you won't have a resume to apply with. Delete "${fileName}"?`
      : `Delete "${fileName}"? This action cannot be undone.`;
    if (!window.confirm(warn)) return;
    try { await apiDeleteResume(id); setResumes((r) => r.filter((x) => x.id !== id)); toast.success('Resume deleted'); }
    catch (err) { toast.error(getApiErrorMessage(err, 'Failed to delete resume')); }
  }

  const primaryResume = resumes[0] ?? null;

  return (
    <PageShell>
      <PageHeader
        title="Resume & Documents"
        subtitle="Manage your resume and other documents to apply with confidence."
        actions={
          <button
            onClick={openFilePicker}
            disabled={uploading}
            className="eh-btn eh-btn-primary"
          >
            {uploading ? <Spinner size="sm" /> : <Plus size={14} />} Upload New Document
          </button>
        }
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
        {/* Main content */}
        <div className="min-w-0 space-y-4">
          {/* Tabs */}
          <Panel>
            <div className="flex items-center gap-1 px-4 pt-4 pb-0">
              {([
                { key: 'my-resumes' as const, label: 'My Resumes' },
                { key: 'generate' as const, label: 'Generate Resume' },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={[
                    "flex shrink-0 items-center border-b-2 px-3 pb-3 text-[13px] font-medium transition-colors",
                    activeTab === key
                      ? "border-[var(--eh-primary-600)] text-[var(--eh-primary-700)]"
                      : "border-transparent text-[var(--eh-text-3)] hover:text-[var(--eh-text)]",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          </Panel>

          {/* My Resumes tab */}
          {activeTab === 'my-resumes' && (
            <div className="space-y-3">
              {resumes.length === 0 ? (
                <EmptyState
                  title="No resumes yet"
                  message="Generate or upload a resume to start applying to jobs."
                  actions={
                    <button onClick={() => setActiveTab('generate')} className="eh-btn eh-btn-primary">
                      <Plus size={14} /> Generate Resume
                    </button>
                  }
                />
              ) : (
                <>
                  {/* Primary resume featured */}
                  {primaryResume && (
                    <Panel className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--eh-primary-50)]">
                          <FileText size={18} className="text-[var(--eh-primary-600)]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] font-semibold text-[var(--eh-text)]">{primaryResume.fileName}</p>
                            <StatusBadge tone="success">Prime Resume</StatusBadge>
                          </div>
                          <p className="mt-0.5 text-[12px] text-[var(--eh-text-4)]">
                            {primaryResume.isGenerated ? `Generated · ${primaryResume.template}` : 'Uploaded'}
                            {' · '}
                            {new Date(primaryResume.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <a href={primaryResume.fileUrl} target="_blank" rel="noopener noreferrer" className="eh-btn eh-btn-secondary eh-btn-sm">
                            <Eye size={13} /> View Resume
                          </a>
                          <a href={primaryResume.fileUrl} download={primaryResume.fileName} target="_blank" rel="noopener noreferrer" className="eh-btn eh-btn-secondary eh-btn-sm">
                            <Download size={13} />
                          </a>
                          <button onClick={() => deleteResume(primaryResume.id, primaryResume.fileName)} className="rounded-lg border border-[var(--eh-border)] p-1.5 text-[var(--eh-text-4)] hover:border-red-200 hover:text-red-500">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                        Make your profile 90% complete by adding more details.{' '}
                        <Link href="/dashboard/profile" className="font-semibold underline underline-offset-2">Improve Now →</Link>
                      </div>
                    </Panel>
                  )}

                  {/* All Documents table */}
                  <Panel>
                    <div className="border-b border-[var(--eh-border)] px-5 py-4">
                      <p className="text-[13px] font-semibold text-[var(--eh-text)]">All Documents</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[500px]">
                        <thead>
                          <tr className="border-b border-[var(--eh-border)] bg-[var(--surface-base)]">
                            {['Document Name', 'Type', 'Last Updated On', 'Size', 'Actions'].map((h) => (
                              <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--eh-border)]">
                          {resumes.map((r) => (
                            <tr key={r.id} className="hover:bg-[var(--surface-base)]">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <FileText size={14} className="shrink-0 text-[var(--eh-text-4)]" />
                                  <span className="text-[13px] font-medium text-[var(--eh-text)]">{r.fileName}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <StatusBadge tone="neutral">{getFileType(r.fileName)}</StatusBadge>
                              </td>
                              <td className="px-4 py-3 text-[12px] text-[var(--eh-text-3)]">
                                {new Date(r.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="px-4 py-3 text-[12px] text-[var(--eh-text-3)]">{r.fileSize ? formatBytes(r.fileSize) : '—'}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                  <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="rounded p-1 text-[var(--eh-text-3)] hover:text-[var(--eh-text)]" title="View">
                                    <Eye size={14} />
                                  </a>
                                  <a href={r.fileUrl} download={r.fileName} target="_blank" rel="noopener noreferrer" className="rounded p-1 text-[var(--eh-text-3)] hover:text-[var(--eh-text)]" title="Download">
                                    <Download size={14} />
                                  </a>
                                  <button onClick={() => deleteResume(r.id, r.fileName)} className="rounded p-1 text-[var(--eh-text-4)] hover:text-red-500">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {resumes.length > 5 && (
                      <div className="border-t border-[var(--eh-border)] px-4 py-3 text-center">
                        <button className="text-[12px] font-semibold text-[var(--eh-primary-600)] hover:underline">
                          View All Annual Documents →
                        </button>
                      </div>
                    )}
                  </Panel>
                </>
              )}
            </div>
          )}

          {/* Generate tab */}
          {activeTab === 'generate' && (
            <Panel className="p-5">
              <PanelHeader
                title="Generate Resume from Profile"
                subtitle="Choose a template to auto-generate your resume from your profile data."
              />
              <div className="grid gap-4 md:grid-cols-3">
                {TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    className={`rounded-xl border p-5 transition-all ${
                      generatingTemplate === template.id
                        ? 'border-[var(--eh-primary-300)] bg-[var(--eh-primary-50)]'
                        : 'border-[var(--eh-border)] hover:border-[var(--eh-border-strong)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.07)]'
                    }`}
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--eh-primary-50)]">
                      <FileText size={18} className="text-[var(--eh-primary-600)]" />
                    </div>
                    <p className="text-[14px] font-semibold text-[var(--eh-text)]">{template.name}</p>
                    <p className="mt-1 text-[12px] leading-[1.4] text-[var(--eh-text-3)]">{template.description}</p>
                    <Button
                      onClick={() => generateResume(template.id)}
                      disabled={generatingTemplate !== null}
                      className="mt-4 w-full"
                      size="sm"
                    >
                      {generatingTemplate === template.id ? (
                        <><Spinner size="sm" /><span className="ml-2">Generating…</span></>
                      ) : ('Generate')}
                    </Button>
                    {generatingTemplate === template.id && (
                      <div className="mt-3">
                        <div className="mb-1.5 flex items-center justify-between">
                          <p className="text-[11px] text-[var(--eh-primary-600)]">{progressMessage || 'Creating your resume…'}</p>
                          <span className="text-[11px] font-semibold text-[var(--eh-primary-600)]">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--eh-border)]">
                          <div className="h-full rounded-full bg-[var(--eh-primary-600)] transition-all duration-300" style={{ width: `${Math.round(progress)}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>

        {/* Right sidebar */}
        <div className="hidden xl:flex xl:flex-col xl:gap-4">
          {/* Resume Tips */}
          <Panel className="p-5">
            <PanelHeader title="Resume Tips" compact actions={<button className="text-[11px] text-[var(--eh-primary-600)] hover:underline">View all tips</button>} />
            <div className="space-y-2">
              {[
                "Keep your resume updated with your latest experience.",
                "Highlight your top skills relevant to each role.",
                "Use a clear and concise format.",
              ].map((tip, i) => (
                <div key={i} className="flex gap-2 rounded-lg bg-[var(--surface-base)] px-3 py-2">
                  <TrendingUp size={12} className="mt-0.5 shrink-0 text-[var(--eh-primary-600)]" />
                  <p className="text-[12px] leading-[1.4] text-[var(--eh-text-3)]">{tip}</p>
                </div>
              ))}
            </div>
          </Panel>

          {/* Storage Usage */}
          <Panel className="p-5">
            <PanelHeader title="Storage Usage" compact />
            {(() => {
              const usedBytes = resumes.reduce((sum, r) => sum + (r.fileSize ?? 0), 0);
              const quotaBytes = 50 * 1024 * 1024;
              return (
                <>
                  <div className="mb-2 flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-1.5 text-[var(--eh-text-3)]">
                      <HardDrive size={12} />
                      <span>{resumes.length} file{resumes.length !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-[var(--eh-text-4)]">{formatBytes(usedBytes)} of 50 MB used</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-base)]">
                    <div className="h-full rounded-full bg-[var(--eh-primary-500)]" style={{ width: `${Math.min((usedBytes / quotaBytes) * 100, 100)}%` }} />
                  </div>
                </>
              );
            })()}
          </Panel>

          {/* Upload drop zone */}
          <Panel className="p-5">
            <PanelHeader title="Upload New Document" compact />
            <div
              onClick={openFilePicker}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files?.[0]); }}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                dragActive ? 'border-[var(--eh-primary-400)] bg-[var(--eh-primary-50)]' : 'border-[var(--eh-border)] hover:border-[var(--eh-border-strong)]'
              }`}
            >
              {uploading ? <Spinner size="sm" /> : <Upload size={20} className="mb-2 text-[var(--eh-text-4)]" />}
              <p className="text-[13px] font-medium text-[var(--eh-text-2)]">Drag & drop file here</p>
              <p className="mt-1 text-[11px] text-[var(--eh-text-4)]">Supported: PDF, DOC, DOCX</p>
              <p className="mt-0.5 text-[11px] text-[var(--eh-text-4)]">Max 5 MB</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); openFilePicker(); }}
                disabled={uploading}
                className="mt-3 rounded-lg border border-[var(--eh-border)] px-3 py-1.5 text-[12px] font-semibold text-[var(--eh-text-2)] hover:bg-[var(--surface-base)] disabled:opacity-50"
              >
                Choose File
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
