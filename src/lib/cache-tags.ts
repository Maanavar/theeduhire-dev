export const cacheTags = {
  homepageStats: "homepage-stats",
  schoolAnalytics: (scopeKey: string) => `school-analytics:${scopeKey}`,
} as const;
