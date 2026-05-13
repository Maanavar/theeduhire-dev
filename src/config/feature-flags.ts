const readBooleanFlag = (value: string | undefined, fallback = false): boolean => {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
};

export const featureFlags = {
  pipelineBoard: readBooleanFlag(process.env.NEXT_PUBLIC_FF_PIPELINE_BOARD),
  messaging: readBooleanFlag(process.env.NEXT_PUBLIC_FF_MESSAGING),
  notificationsCenter: readBooleanFlag(process.env.NEXT_PUBLIC_FF_NOTIFICATIONS_CENTER),
  settingsSecurity: readBooleanFlag(process.env.NEXT_PUBLIC_FF_SETTINGS_SECURITY),
  twoFactorAuth: readBooleanFlag(process.env.NEXT_PUBLIC_FF_2FA),
  schoolLiveUpdates: readBooleanFlag(
    process.env.NEXT_PUBLIC_FF_SCHOOL_LIVE_UPDATES,
    true
  ),
} as const;

export type FeatureFlagName = keyof typeof featureFlags;

export const isFeatureEnabled = (flag: FeatureFlagName): boolean => featureFlags[flag];
