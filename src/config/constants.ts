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
  "Fresher", "1-3 years", "2-4 years", "2-5 years",
  "3-5 years", "5+ years", "10+ years",
] as const;

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
export const JOBS_PER_PAGE = 20;
