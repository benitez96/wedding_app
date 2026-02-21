export const CONFIGURATION_KEYS = {
  PHOTO_UPLOAD_URL: "PHOTO_UPLOAD_URL",
  WEDDING_DATE: "WEDDING_DATE",
  REMIND_RESTING_DAYS: "REMIND_RESTING_DAYS",

  // Check-in strategy configuration (per-event)
  CHECKIN_STRATEGY: "checkin.strategy", // "IDB_FIRST" | "SERVER_FIRST" | "HYBRID_SMART"
} as const;

export type ConfigurationKey =
  (typeof CONFIGURATION_KEYS)[keyof typeof CONFIGURATION_KEYS];

export interface ConfigurationItem {
  id: string;
  key: ConfigurationKey;
  value: string;
  description: string | null;
}

export interface ConfigurationValueMap
  extends Record<ConfigurationKey, string | null> {}
