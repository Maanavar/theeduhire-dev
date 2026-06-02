// App-wide constants
// Single source of truth for dropdowns, filters, and options

export const SUBJECTS = [
  "Mathematics", "English", "Physics", "Chemistry", "Biology",
  "Computer Science", "Social Science", "Hindi", "Tamil",
  "Early Childhood", "Physical Education", "Art & Craft",
  "Music", "All Subjects", "Other",
] as const;

export const BOARDS = [
  { value: "CBSE", label: "CBSE" },
  { value: "ICSE", label: "ICSE" },
  { value: "STATE_BOARD", label: "State Board" },
  { value: "IB", label: "IB" },
  { value: "CAMBRIDGE", label: "Cambridge" },
  { value: "OTHER", label: "Other" },
] as const;

export const LOCATIONS = [
  "Madurai", "Chennai", "Coimbatore", "Trichy", "Salem",
  "Tirunelveli", "Erode", "Vellore", "Thanjavur", "Dindigul", "Other",
] as const;

export const GRADE_LEVELS = [
  "Pre-K", "1-5", "6-8", "9-10", "9-12", "11-12",
] as const;

export const JOB_TYPES = [
  { value: "FULL_TIME", label: "Full-Time" },
  { value: "PART_TIME", label: "Part-Time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "VISITING_FACULTY", label: "Visiting Faculty" },
] as const;

export const EXPERIENCE_LEVELS = [
  "Fresher",
  "1-3 years",
  "3-6 years",
  "6-10 years",
  "10+ years",
] as const;

export const JOB_EXPERIENCE_LEVELS = [
  { value: "FRESHER", label: "Fresher" },
  { value: "ONE_TO_TWO_YEARS", label: "1-3 years" },
  { value: "TWO_TO_FIVE_YEARS", label: "3-6 years" },
  { value: "FIVE_TO_TEN_YEARS", label: "6-10 years" },
  { value: "TEN_PLUS_YEARS", label: "10+ years" },
] as const;

// Maps experienceLevel enum to the string range used by the AI matcher
export const EXPERIENCE_LEVEL_TO_RANGE: Record<string, string> = {
  FRESHER: "Fresher",
  ONE_TO_TWO_YEARS: "1-3 years",
  TWO_TO_FIVE_YEARS: "3-6 years",
  FIVE_TO_TEN_YEARS: "6-10 years",
  TEN_PLUS_YEARS: "10+ years",
};

export const APPLICATION_STATUSES = [
  { value: "PENDING", label: "Pending", color: "gray" },
  { value: "REVIEWED", label: "Reviewed", color: "blue" },
  { value: "SHORTLISTED", label: "Shortlisted", color: "amber" },
  { value: "REJECTED", label: "Rejected", color: "red" },
  { value: "HIRED", label: "Hired", color: "green" },
] as const;

export const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export const RESUME_BUCKET = "Resumes";
export const AVATAR_BUCKET = "avatar";
export const SCHOOL_LOGO_BUCKET = "school-logos";
export const TEACHER_DEMO_VIDEO_BUCKET = "TeacherDemoVideos";
export const TEACHER_LESSON_PLAN_BUCKET = "TeacherLessonPlans";
export const MAX_DEMO_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_LESSON_PLAN_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_DEMO_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
export const ALLOWED_DEMO_VIDEO_EXTENSIONS = ["mp4", "mov", "webm"];
export const ALLOWED_LESSON_PLAN_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export const ALLOWED_LESSON_PLAN_EXTENSIONS = ["pdf", "doc", "docx"];
export const PRIVATE_ASSET_URL_TTL_SECONDS = 60 * 5;
export const PASSWORD_HASH_ROUNDS = 12;
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
export const PASSWORD_RESET_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
export const PASSWORD_RESET_IP_LIMIT = 5;
export const PASSWORD_RESET_EMAIL_LIMIT = 3;
export const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const AUTH_REGISTER_IP_LIMIT = 8;
export const CONTACT_FORM_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
export const CONTACT_FORM_IP_LIMIT = 5;
export const MESSAGE_CREATE_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const MESSAGE_CREATE_RATE_LIMIT = 20;
export const JOBS_PER_PAGE = 20;
export const JOB_POST_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
export const JOB_POST_USER_LIMIT = 10;
export const AI_IMPROVE_JOB_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
export const AI_IMPROVE_JOB_USER_LIMIT = 20;

export const MANAGED_RECRUITMENT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
export const MANAGED_RECRUITMENT_IP_LIMIT = 3;
