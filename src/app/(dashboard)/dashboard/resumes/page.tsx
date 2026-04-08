'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import Spinner from '@/components/ui/spinner';

interface Resume {
  id: string;
  fileName: string;
  fileUrl: string;
  isGenerated: boolean;
  template?: string;
  uploadedAt: string;
}

const TEMPLATES = [
  {
    id: 'ats-friendly',
    name: 'ATS-Friendly',
    description: 'Simple, no-frills format optimized for applicant tracking systems',
    icon: '📄',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with colors and sections',
    icon: '✨',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean monospace style, print-friendly',
    icon: '⌨️',
  },
];

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingTemplate, setGeneratingTemplate] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState('generate');

  // Fetch resumes
  useEffect(() => {
    async function fetchResumes() {
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();
        if (data.success && data.data.resumes) {
          setResumes(data.data.resumes);
        }
      } catch (error) {
        console.error('Failed to fetch resumes:', error);
      }
    }
    fetchResumes();
  }, []);

  // Generate resume with real progress tracking
  async function generateResume(template: string) {
    setGeneratingTemplate(template);
    setProgress(0);

    try {
      const res = await fetch('/api/resumes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template }),
      });

      if (!res.ok || !res.body) {
        alert('Failed to generate resume');
        return;
      }

      // Read Server-Sent Events stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let resumeData: any = null;
      let streamEnded = false;

      while (!streamEnded) {
        const { done, value } = await reader.read();
        if (done) {
          streamEnded = true;
          break;
        }

        const chunk = decoder.decode(value, { stream: !done });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim().startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim();
              if (jsonStr) {
                const data = JSON.parse(jsonStr);
                setProgress(data.progress);
                if (data.message) {
                  setProgressMessage(data.message);
                }

                if (data.success && data.result) {
                  resumeData = data.result;
                }
              }
            } catch (e) {
              console.error('Failed to parse progress:', e);
            }
          }
        }
      }

      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 200));

      if (resumeData) {
        setResumes([resumeData, ...resumes]);
        alert(`✓ ${template} resume generated!`);
        setActiveTab('library');
      } else {
        alert('Failed to generate resume');
      }
    } catch (error) {
      alert('Failed to generate resume');
      console.error(error);
    } finally {
      setTimeout(() => {
        setGeneratingTemplate(null);
        setProgress(0);
      }, 500);
    }
  }

  // Delete resume
  async function deleteResume(id: string, fileName: string) {
    // Warn if this is the only resume
    if (resumes.length === 1) {
      const confirmDelete = confirm(
        `⚠️ This is your only resume!\n\nDeleting it means you won't have a resume to apply with. Are you sure you want to delete "${fileName}"?\n\nThis action cannot be undone.`
      );
      if (!confirmDelete) {
        return;
      }
    } else {
      const confirmDelete = confirm(`Delete "${fileName}"? This action cannot be undone.`);
      if (!confirmDelete) {
        return;
      }
    }

    try {
      const res = await fetch(`/api/resumes/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (data.success) {
        setResumes(resumes.filter((r) => r.id !== id));
        alert('✓ Resume deleted');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to delete resume');
      console.error(error);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Resume Manager</h1>
        <p className="text-gray-600">Generate or upload your resumes</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b">
        <button
          onClick={() => setActiveTab('generate')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'generate'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Generate
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'library'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Resumes
        </button>
      </div>

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-6">Generate Resume from Profile</h2>
            <p className="text-gray-600 mb-8">
              Choose a template to auto-generate your resume from your profile data
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              {TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  className={`border border-gray-200 rounded-lg p-6 transition-all ${
                    generatingTemplate === template.id
                      ? 'shadow-md bg-blue-50/50 border-blue-200'
                      : 'hover:shadow-md'
                  }`}
                >
                  <div className="text-3xl mb-3">{template.icon}</div>
                  <h3 className="font-semibold mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                  <Button
                    onClick={() => generateResume(template.id)}
                    disabled={generatingTemplate === template.id}
                    className="w-full"
                    size="sm"
                  >
                    {generatingTemplate === template.id ? (
                      <>
                        <Spinner size="sm" />
                        <span className="ml-2">Generating...</span>
                      </>
                    ) : (
                      'Generate'
                    )}
                  </Button>
                  {generatingTemplate === template.id && (
                    <div className="mt-3">
                      <div className="mb-2 flex justify-between items-center">
                        <p className="text-xs text-blue-600">{progressMessage || 'Creating your resume...'}</p>
                        <span className="text-xs font-semibold text-blue-600">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${Math.round(progress)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Library Tab */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          {resumes.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-600 mb-4">No resumes yet</p>
              <p className="text-sm text-gray-500">Generate or upload a resume to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {resume.isGenerated ? '⚡' : '📥'}
                      </span>
                      <div>
                        <h3 className="font-medium">{resume.fileName}</h3>
                        <p className="text-sm text-gray-600">
                          {resume.isGenerated && `Template: ${resume.template} • `}
                          {new Date(resume.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={resume.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded"
                    >
                      View
                    </a>
                    <a
                      href={resume.fileUrl}
                      download={resume.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => deleteResume(resume.id, resume.fileName)}
                      className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition"
                      title="Delete resume"
                    >
                      <Trash2 size={16} className="inline mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Section */}
      <div className="mt-8 p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
        <p className="text-gray-600 mb-2">Upload your own resume</p>
        <p className="text-sm text-gray-500">Coming soon: Upload existing PDF/DOCX files</p>
      </div>
    </div>
  );
}
