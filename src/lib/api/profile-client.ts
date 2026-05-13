import type {
  Certification,
  Experience,
  Resume,
  SchoolProfile,
  SchoolVerificationStatus,
  TeacherProfile,
  User,
} from "@prisma/client";
import type {
  CertificationInput,
  ExperienceInput,
  TeacherProfileInput,
} from "@/lib/validators/profile";
import { apiRequest } from "@/lib/api/client";

type ProfileIdentity = Pick<
  User,
  "name" | "email" | "phone" | "avatarUrl" | "whatsappNumber" | "whatsappOptin"
>;

export type ProfileExperience = Experience;
export type ProfileCertification = Certification;
export type ProfileResume = Resume & {
  fileUrl: string;
};

export type ProfilePageData = Partial<TeacherProfile & SchoolProfile> &
  ProfileIdentity & {
    experiences?: ProfileExperience[];
    certifications?: ProfileCertification[];
    resumes?: ProfileResume[];
    demoVideoUrl?: string | null;
    lessonPlanUrl?: string | null;
  };

export type ResumeUploadResult = {
  resumeId: string;
  fileUrl: string;
  fileName: string;
};

export type AvatarUploadResult = {
  avatarUrl: string;
};

export type SchoolLogoUploadResult = {
  logoUrl: string;
};

export type SchoolVerificationResult = {
  verificationStatus: SchoolVerificationStatus;
  verified: boolean;
};

type TeacherDocumentUploadResult = {
  fileName: string;
  demoVideoUrl?: string;
  lessonPlanUrl?: string;
};

async function uploadFormData<TData>(
  path: string,
  fieldName: string,
  file: File,
  fallbackMessage: string
) {
  const formData = new FormData();
  formData.append(fieldName, file);

  return apiRequest<TData>(path, { method: "POST", body: formData }, fallbackMessage);
}

export function getProfile() {
  return apiRequest<ProfilePageData>(
    "/api/profile",
    undefined,
    "Failed to fetch profile"
  );
}

export function updateProfile(patch: Record<string, unknown>) {
  return apiRequest<ProfilePageData>(
    "/api/profile",
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    },
    "Failed to update profile"
  );
}

export function createExperience(input: ExperienceInput) {
  return apiRequest<{ experience: ProfileExperience }>(
    "/api/profile/experience",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Failed to create experience"
  );
}

export function updateExperience(id: string, input: ExperienceInput) {
  return apiRequest<{ experience: ProfileExperience }>(
    `/api/profile/experience/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Failed to update experience"
  );
}

export function deleteExperience(id: string) {
  return apiRequest<{}>(
    `/api/profile/experience/${id}`,
    { method: "DELETE" },
    "Failed to delete experience"
  );
}

export function createCertification(input: CertificationInput) {
  return apiRequest<{ certification: ProfileCertification }>(
    "/api/profile/certifications",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Failed to create certification"
  );
}

export function updateCertification(id: string, input: CertificationInput) {
  return apiRequest<{ certification: ProfileCertification }>(
    `/api/profile/certifications/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Failed to update certification"
  );
}

export function deleteCertification(id: string) {
  return apiRequest<{}>(
    `/api/profile/certifications/${id}`,
    { method: "DELETE" },
    "Failed to delete certification"
  );
}

export function deleteResume(id: string) {
  return apiRequest<{}>(
    `/api/resumes/${id}`,
    { method: "DELETE" },
    "Failed to delete resume"
  );
}

export function uploadResume(file: File) {
  return uploadFormData<ResumeUploadResult>(
    "/api/upload/resume",
    "file",
    file,
    "Failed to upload resume"
  );
}

export function uploadAvatar(file: File) {
  return uploadFormData<AvatarUploadResult>(
    "/api/profile/avatar",
    "avatar",
    file,
    "Failed to update avatar"
  );
}

export function uploadSchoolLogo(file: File) {
  return uploadFormData<SchoolLogoUploadResult>(
    "/api/profile/logo",
    "logo",
    file,
    "Failed to upload school logo"
  );
}

export function uploadTeacherDocument(
  kind: "demoVideo" | "lessonPlan",
  file: File
) {
  if (kind === "demoVideo") {
    return uploadFormData<TeacherDocumentUploadResult>(
      "/api/upload/demo-video",
      "file",
      file,
      "Failed to upload demo video"
    );
  }

  return uploadFormData<TeacherDocumentUploadResult>(
    "/api/upload/lesson-plan",
    "file",
    file,
    "Failed to upload lesson plan"
  );
}

export function requestSchoolVerification() {
  return apiRequest<SchoolVerificationResult>(
    "/api/profile/verify",
    { method: "POST" },
    "Failed to submit verification request"
  );
}

export type ProfileUpdateInput = Partial<TeacherProfileInput> &
  Record<string, unknown>;
