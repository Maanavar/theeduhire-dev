import type { TeacherProfileInput } from "@/lib/validators/profile";

export type ProfileSectionStatus = {
  id: string;
  label: string;
  description: string;
  done: boolean;
};

export type SchoolProfileFormState = {
  schoolName: string;
  city: string;
  board: string;
  udiseCode: string;
  paymentTrackRecord: string;
  workingHours: string;
  hasPfEsi: boolean;
};

type TeacherProfileDataState = {
  experiences?: unknown[];
  certifications?: unknown[];
  resumes?: unknown[];
  demoVideoUrl?: string | null;
  lessonPlanUrl?: string | null;
};

export function getSchoolProfileSections(
  schoolForm: SchoolProfileFormState
): ProfileSectionStatus[] {
  return [
    {
      id: "school-information",
      label: "School Information",
      description: "Identity, board, city, about, and school logo.",
      done: Boolean(
        schoolForm.schoolName?.trim() &&
          schoolForm.city?.trim() &&
          schoolForm.board?.trim()
      ),
    },
    {
      id: "trust-compliance",
      label: "Trust & Compliance",
      description: "UDISE, payment history, working hours, and PF/ESI support.",
      done: Boolean(
        schoolForm.udiseCode?.trim() ||
          schoolForm.paymentTrackRecord ||
          schoolForm.workingHours?.trim() ||
          schoolForm.hasPfEsi
      ),
    },
  ];
}

export function getTeacherProfileSections(
  watchedProfile: TeacherProfileInput,
  profileData: TeacherProfileDataState | null
): ProfileSectionStatus[] {
  return [
    {
      id: "basic-info",
      label: "Basic Info",
      description: "Identity, location, availability, and your teaching summary.",
      done: Boolean(
        watchedProfile.name?.trim() &&
          watchedProfile.qualification?.trim() &&
          watchedProfile.experience &&
          watchedProfile.city &&
          watchedProfile.bio?.trim()
      ),
    },
    {
      id: "specialisations",
      label: "Specialisations",
      description: "Subjects, boards, and class levels you want to teach.",
      done: Boolean(
        watchedProfile.subjects?.length &&
          watchedProfile.preferredBoards?.length &&
          watchedProfile.preferredGrades?.length
      ),
    },
    {
      id: "experience",
      label: "Experience",
      description: "Past schools and roles that build credibility.",
      done: Boolean(profileData?.experiences?.length),
    },
    {
      id: "certifications",
      label: "Certifications",
      description: "Licenses, credentials, and continuing education.",
      done: Boolean(profileData?.certifications?.length),
    },
    {
      id: "teaching-credentials",
      label: "Teaching Credentials",
      description: "Passport proof, safety declarations, and teaching mediums.",
      done: Boolean(
        watchedProfile.tetStatus ||
          watchedProfile.teachingMediums?.length ||
          profileData?.demoVideoUrl ||
          profileData?.lessonPlanUrl
      ),
    },
    {
      id: "resume",
      label: "Resume",
      description: "A ready-to-share document for school reviewers.",
      done: Boolean(profileData?.resumes?.length),
    },
  ];
}
