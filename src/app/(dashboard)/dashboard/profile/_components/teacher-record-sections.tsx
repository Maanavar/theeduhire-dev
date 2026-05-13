"use client";

import { Edit2, Plus, Trash2 } from "lucide-react";
import FileUpload from "@/components/ui/file-upload";

type ExperienceEntry = {
  id: string;
  role: string;
  schoolName: string;
  startDate: string | Date;
  endDate?: string | Date | null;
  isCurrent?: boolean;
};

type CertificationEntry = {
  id: string;
  name: string;
  issuedBy: string;
  expiresAt?: string | Date | null;
};

type ResumeEntry = {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string | Date;
};

type TeacherExperienceSectionProps = {
  experiences?: ExperienceEntry[];
  onAdd: () => void;
  onEdit: (experience: ExperienceEntry) => void;
  onDelete: (experienceId: string) => Promise<void>;
};

type TeacherCertificationsSectionProps = {
  certifications?: CertificationEntry[];
  onAdd: () => void;
  onEdit: (certification: CertificationEntry) => void;
  onDelete: (certificationId: string) => Promise<void>;
};

type TeacherResumeSectionProps = {
  resumes?: ResumeEntry[];
  onUploadComplete: () => Promise<void>;
  onDeleteResume: (resumeId: string) => Promise<boolean>;
};

export function TeacherExperienceSection({
  experiences,
  onAdd,
  onEdit,
  onDelete,
}: TeacherExperienceSectionProps) {
  return (
    <div id="experience" className="card p-6">
      <div className="mb-4 flex items-center justify-between gap-2 border-b border-black/[0.05] pb-3">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          <h2 className="text-xs font-bold uppercase tracking-[0.07em] text-gray-500">
            Work Experience
          </h2>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-100"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      {experiences && experiences.length > 0 ? (
        <div className="space-y-3">
          {experiences.map((experience) => (
            <div
              key={experience.id}
              className="rounded-xl border border-gray-100 bg-gray-50 p-4"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {experience.role}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {experience.schoolName}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(experience)}
                    aria-label="Edit experience"
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-gray-600"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDelete(experience.id)}
                    aria-label="Delete experience"
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {new Date(experience.startDate).toLocaleDateString("en-IN", {
                  month: "short",
                  year: "numeric",
                })}{" "}
                -{" "}
                {experience.isCurrent
                  ? "Present"
                  : new Date(experience.endDate || "").toLocaleDateString(
                      "en-IN",
                      {
                        month: "short",
                        year: "numeric",
                      }
                    )}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-4 text-sm italic text-gray-500">
          No work experience added yet
        </p>
      )}

      <div className="mt-4 rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] px-4 py-3 text-sm text-[var(--eh-text-3)]">
        Experience entries save immediately when you add or edit them.
      </div>
    </div>
  );
}

export function TeacherCertificationsSection({
  certifications,
  onAdd,
  onEdit,
  onDelete,
}: TeacherCertificationsSectionProps) {
  return (
    <div id="certifications" className="card p-6">
      <div className="mb-4 flex items-center justify-between gap-2 border-b border-black/[0.05] pb-3">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          <h2 className="text-xs font-bold uppercase tracking-[0.07em] text-gray-500">
            Certifications
          </h2>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-100"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      {certifications && certifications.length > 0 ? (
        <div className="space-y-2">
          {certifications.map((certification) => (
            <div
              key={certification.id}
              className="group flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {certification.name}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">
                    {certification.issuedBy}
                  </p>
                  {certification.expiresAt &&
                  new Date(certification.expiresAt).getTime() < Date.now() ? (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                      Expired
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => onEdit(certification)}
                  aria-label="Edit certification"
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-gray-600"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => void onDelete(certification.id)}
                  aria-label="Delete certification"
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-4 text-sm italic text-gray-500">
          No certifications added yet
        </p>
      )}

      <div className="mt-4 rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] px-4 py-3 text-sm text-[var(--eh-text-3)]">
        Certifications save immediately when you add or edit them.
      </div>
    </div>
  );
}

export function TeacherResumeSection({
  resumes,
  onUploadComplete,
  onDeleteResume,
}: TeacherResumeSectionProps) {
  return (
    <div id="resume" className="card p-6">
      <div className="mb-4 flex items-center gap-2 border-b border-black/[0.05] pb-3">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
        <h2 className="text-xs font-bold uppercase tracking-[0.07em] text-gray-500">
          Resume
        </h2>
      </div>

      <div className="mb-4">
        <FileUpload
          onUpload={async () => {
            if (resumes && resumes.length > 0) {
              const oldest = resumes.reduce((previous, current) =>
                new Date(previous.uploadedAt) < new Date(current.uploadedAt)
                  ? previous
                  : current
              );

              const confirmDelete = window.confirm(
                `This will remove "${oldest.fileName}" (uploaded ${new Date(
                  oldest.uploadedAt
                ).toLocaleDateString("en-IN")}). Continue?`
              );

              if (confirmDelete) {
                await onDeleteResume(oldest.id);
              }
            }

            await onUploadComplete();
          }}
          onClear={() => {
            // No active resume preview state to clear here.
          }}
        />
      </div>

      {resumes && resumes.length > 0 ? (
        <div className="space-y-2">
          {resumes.length > 1 ? (
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
              <p className="text-xs font-medium text-amber-700">
                You have {resumes.length} resumes. On next upload, we will ask
                before removing the oldest file.
              </p>
            </div>
          ) : null}
          {resumes.map((resume) => (
            <div
              key={resume.id}
              className="group flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {resume.fileName}
                </p>
                <p className="text-xs text-gray-500">
                  Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <a
                  href={resume.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50"
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={async () => {
                    await onDeleteResume(resume.id);
                  }}
                  aria-label="Delete resume"
                  className="rounded-lg p-1.5 text-gray-400 opacity-0 transition-colors group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] px-4 py-3 text-sm text-[var(--eh-text-3)]">
        Resume updates save immediately when you upload or delete files.
      </div>
    </div>
  );
}
