// Profile completion calculator — pure utility, no side effects

export type ProfileCompletionInput = {
  avatarUrl?: string | null;
  bio?: string | null;
  qualification?: string | null;
  city?: string | null;
  subjects?: string[];
  preferredBoards?: string[];
  preferredGrades?: string[];
  experiences?: { id: string }[];
  certifications?: { id: string }[];
  resumes?: { id: string }[];
};

export type CompletionItem = {
  field: string;
  weight: number;
  completed: boolean;
  label: string;
};

const COMPLETION_WEIGHTS: CompletionItem[] = [
  { field: "avatarUrl", weight: 10, label: "Profile photo", completed: false },
  { field: "bio", weight: 15, label: "Bio", completed: false },
  { field: "qualification", weight: 10, label: "Qualification", completed: false },
  { field: "city", weight: 5, label: "City", completed: false },
  { field: "subjects", weight: 15, label: "Subjects (at least 1)", completed: false },
  { field: "preferredBoards", weight: 5, label: "Preferred boards (at least 1)", completed: false },
  { field: "preferredGrades", weight: 5, label: "Preferred grades (at least 1)", completed: false },
  { field: "experiences", weight: 20, label: "Work experience (at least 1 entry)", completed: false },
  { field: "certifications", weight: 10, label: "Certifications (at least 1)", completed: false },
  { field: "resumes", weight: 5, label: "Resume uploaded", completed: false },
];

export function calculateProfileCompletion(
  profile: ProfileCompletionInput
): {
  percentage: number;
  details: CompletionItem[];
  incomplete: string[];
} {
  const details = COMPLETION_WEIGHTS.map((item) => {
    const value = profile[item.field as keyof ProfileCompletionInput];
    const completed = Array.isArray(value)
      ? (value as unknown[]).length > 0
      : !!value;
    return { ...item, completed };
  });

  const percentage = details.reduce(
    (sum, item) => sum + (item.completed ? item.weight : 0),
    0
  );

  const incomplete = details.filter((item) => !item.completed).map((item) => item.label);

  return { percentage, details, incomplete };
}
