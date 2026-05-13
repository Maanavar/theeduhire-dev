"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { Loader2, Save, Upload } from "lucide-react";
import { ChipGroup } from "@/components/profile/chip-group";
import {
  SUBJECTS,
  BOARDS,
  LOCATIONS,
  GRADE_LEVELS,
  EXPERIENCE_LEVELS,
} from "@/config/constants";
import type { TeacherProfileInput } from "@/lib/validators/profile";

type TeacherProfileDocuments = {
  demoVideoUrl?: string | null;
  lessonPlanUrl?: string | null;
};

type SaveButtonProps = {
  label: string;
  saving: boolean;
  onSave: () => void | Promise<void>;
};

type TeacherSectionProps = {
  form: UseFormReturn<TeacherProfileInput>;
  saving: boolean;
  onSave: () => void | Promise<void>;
};

type TeacherBasicInfoSectionProps = TeacherSectionProps & {
  phoneValidationError: string;
  onPhoneBlur: (value: string) => void;
};

type TeacherCredentialsSectionProps = TeacherSectionProps & {
  profileData: TeacherProfileDocuments | null;
  uploadingDemoVideo: boolean;
  uploadingLessonPlan: boolean;
  onDemoVideoSelect: (file: File) => Promise<void>;
  onLessonPlanSelect: (file: File) => Promise<void>;
};

function TeacherSectionSaveButton({
  label,
  saving,
  onSave,
}: SaveButtonProps) {
  return (
    <div className="flex justify-end pt-2">
      <button
        type="button"
        onClick={() => void onSave()}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-brand transition-colors hover:bg-brand-600 disabled:opacity-60"
      >
        {saving ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Save size={14} />
        )}
        {label}
      </button>
    </div>
  );
}

export function TeacherBasicInfoSection({
  form,
  saving,
  onSave,
  phoneValidationError,
  onPhoneBlur,
}: TeacherBasicInfoSectionProps) {
  return (
    <div id="basic-info" className="card p-6">
      <div className="mb-4 flex items-center gap-2 border-b border-black/[0.05] pb-3">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
        <h2 className="text-xs font-bold uppercase tracking-[0.07em] text-gray-500">
          Basic Information
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Full name
          </label>
          <input
            type="text"
            {...form.register("name")}
            placeholder="e.g. Kavitha Rajan"
            className="input-base"
          />
          {form.formState.errors.name && (
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.name.message as string}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Qualification
          </label>
          <input
            type="text"
            {...form.register("qualification")}
            placeholder="e.g. M.Sc Mathematics with B.Ed"
            className="input-base"
          />
          {form.formState.errors.qualification && (
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.qualification.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Experience
            </label>
            <select
              {...form.register("experience")}
              className="input-base appearance-none"
            >
              <option value="">Select level</option>
              {EXPERIENCE_LEVELS.map((experience) => (
                <option key={experience} value={experience}>
                  {experience}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              City
            </label>
            <select
              {...form.register("city")}
              className="input-base appearance-none"
            >
              <option value="">Select city</option>
              {LOCATIONS.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Current / Previous School
          </label>
          <input
            type="text"
            {...form.register("currentSchool")}
            placeholder="Where do you teach/taught?"
            className="input-base"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              {...form.register("phone", {
                onBlur: (event) => onPhoneBlur(event.target.value),
              })}
              placeholder="+91 XXXXX XXXXX"
              className="input-base"
            />
            {phoneValidationError ? (
              <p className="mt-1 text-xs text-red-600">
                {phoneValidationError}
              </p>
            ) : form.formState.errors.phone ? (
              <p className="mt-1 text-xs text-red-600">
                {form.formState.errors.phone.message}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Expected Salary (Rs/month)
            </label>
            <input
              type="number"
              {...form.register("expectedSalary")}
              placeholder="e.g. 45000"
              className="input-base"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Availability
          </label>
          <select
            {...form.register("availabilityStatus")}
            className="input-base appearance-none"
          >
            <option value="ACTIVELY_LOOKING">Actively looking</option>
            <option value="OPEN_TO_OFFERS">Open to offers</option>
            <option value="NOT_LOOKING">Not looking</option>
            <option value="IMMEDIATE_JOINER">Available immediately</option>
            <option value="PART_TIME_ONLY">Part-time only</option>
            <option value="ONLINE_ONLY">Online classes only</option>
            <option value="EXAM_SEASON">Exam season / revision</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Bio
          </label>
          <textarea
            {...form.register("bio")}
            placeholder="Tell schools about yourself..."
            className="input-base min-h-[100px] resize-vertical"
          />
          {form.formState.errors.bio && (
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.bio.message}
            </p>
          )}
        </div>

        <TeacherSectionSaveButton
          label="Save Basic Info"
          saving={saving}
          onSave={onSave}
        />
      </div>
    </div>
  );
}

export function TeacherSpecialisationsSection({
  form,
  saving,
  onSave,
}: TeacherSectionProps) {
  return (
    <div id="specialisations" className="card p-6">
      <div className="mb-4 flex items-center gap-2 border-b border-black/[0.05] pb-3">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
        <h2 className="text-xs font-bold uppercase tracking-[0.07em] text-gray-500">
          Teaching Specialisations
        </h2>
      </div>

      <div className="space-y-5">
        <Controller
          control={form.control}
          name="subjects"
          render={({ field }) => (
            <ChipGroup
              label="Subjects you teach"
              options={SUBJECTS}
              selected={field.value || []}
              onChange={field.onChange}
            />
          )}
        />

        <Controller
          control={form.control}
          name="preferredBoards"
          render={({ field }) => (
            <ChipGroup
              label="Preferred boards"
              options={BOARDS}
              selected={field.value || []}
              onChange={field.onChange}
            />
          )}
        />

        <Controller
          control={form.control}
          name="preferredGrades"
          render={({ field }) => (
            <ChipGroup
              label="Preferred grade levels"
              options={GRADE_LEVELS}
              selected={field.value || []}
              onChange={field.onChange}
            />
          )}
        />

        <Controller
          control={form.control}
          name="preferredJobTypes"
          render={({ field }) => (
            <ChipGroup
              label="Preferred job types"
              options={
                [
                  "Full-time",
                  "Part-time",
                  "Substitute",
                  "Online",
                  "Hybrid",
                ] as const
              }
              selected={field.value || []}
              onChange={field.onChange}
            />
          )}
        />

        <TeacherSectionSaveButton
          label="Save Specialisations"
          saving={saving}
          onSave={onSave}
        />
      </div>
    </div>
  );
}

export function TeacherCredentialsSection({
  form,
  saving,
  onSave,
  profileData,
  uploadingDemoVideo,
  uploadingLessonPlan,
  onDemoVideoSelect,
  onLessonPlanSelect,
}: TeacherCredentialsSectionProps) {
  return (
    <div id="teaching-credentials" className="card p-6">
      <div className="mb-4 flex items-center gap-2 border-b border-black/[0.05] pb-3">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
        <h2 className="text-xs font-bold uppercase tracking-[0.07em] text-gray-500">
          Teaching Credentials
        </h2>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              TET / CTET Status
            </label>
            <select
              {...form.register("tetStatus")}
              className="input-base appearance-none"
            >
              <option value="NONE">None</option>
              <option value="TET">TET cleared</option>
              <option value="CTET">CTET cleared</option>
              <option value="BOTH">Both cleared</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Notice period (days)
            </label>
            <input
              type="number"
              {...form.register("noticePeriodDays")}
              className="input-base"
              placeholder="e.g. 30"
            />
          </div>
        </div>

        <Controller
          control={form.control}
          name="teachingMediums"
          render={({ field }) => (
            <ChipGroup
              label="Teaching Medium"
              options={["Tamil", "English", "Hindi", "Other"] as const}
              selected={field.value || []}
              onChange={field.onChange}
            />
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-800">
              Demo Class Video
            </p>
            <p className="mt-1 text-xs text-gray-500">
              MP4, MOV, or WebM. Max 100MB.
            </p>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
              <Upload size={13} />
              {uploadingDemoVideo
                ? "Uploading..."
                : profileData?.demoVideoUrl
                  ? "Replace video"
                  : "Upload video"}
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;

                  try {
                    await onDemoVideoSelect(file);
                  } finally {
                    event.target.value = "";
                  }
                }}
              />
            </label>
            {profileData?.demoVideoUrl ? (
              <video
                className="mt-3 w-full rounded-xl"
                controls
                src={profileData.demoVideoUrl}
                preload="metadata"
              />
            ) : null}
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-800">Lesson Plan</p>
            <p className="mt-1 text-xs text-gray-500">
              PDF, DOC, or DOCX. Max 10MB.
            </p>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
              <Upload size={13} />
              {uploadingLessonPlan
                ? "Uploading..."
                : profileData?.lessonPlanUrl
                  ? "Replace lesson plan"
                  : "Upload lesson plan"}
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;

                  try {
                    await onLessonPlanSelect(file);
                  } finally {
                    event.target.value = "";
                  }
                }}
              />
            </label>
            {profileData?.lessonPlanUrl ? (
              <a
                href={profileData.lessonPlanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Open current lesson plan
              </a>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[12px] font-semibold text-amber-800">
            Child Safety Declarations
          </p>
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              {...form.register("pocsoAcknowledged")}
              className="mt-0.5"
            />
            <span className="text-[13px] text-[var(--eh-text-2)]">
              I have read the POCSO Act guidelines and commit to child-safe
              conduct in all school interactions.
            </span>
          </label>
          <details className="rounded-lg bg-white/70 px-3 py-2 text-[12px] text-amber-900">
            <summary className="cursor-pointer font-semibold">
              Read POCSO summary
            </summary>
            <p className="mt-2">
              Keep all teacher-student interactions age-appropriate,
              documented, and aligned with school child-protection policy. Any
              concern must be reported through the school's safeguarding
              channel immediately.
            </p>
          </details>
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              {...form.register("referenceCheckDone")}
              className="mt-0.5"
            />
            <span className="text-[13px] text-[var(--eh-text-2)]">
              I consent to reference checks from my previous employer(s) upon
              shortlisting.
            </span>
          </label>
          <details className="rounded-lg bg-white/70 px-3 py-2 text-[12px] text-amber-900">
            <summary className="cursor-pointer font-semibold">
              Read reference check summary
            </summary>
            <p className="mt-2">
              Schools may verify your role, tenure, conduct, and child-safety
              history with previous institutions before final selection.
            </p>
          </details>
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              {...form.register("codeOfConductSigned")}
              className="mt-0.5"
            />
            <span className="text-[13px] text-[var(--eh-text-2)]">
              I accept the EduHire Code of Conduct for educators.
            </span>
          </label>
          <details className="rounded-lg bg-white/70 px-3 py-2 text-[12px] text-amber-900">
            <summary className="cursor-pointer font-semibold">
              Read educator conduct summary
            </summary>
            <p className="mt-2">
              Maintain professional communication, truthful credentials,
              respectful classroom behaviour, and compliance with school and
              platform policies.
            </p>
          </details>
        </div>

        <TeacherSectionSaveButton
          label="Save Credentials"
          saving={saving}
          onSave={onSave}
        />
      </div>
    </div>
  );
}
