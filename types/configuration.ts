export const CONFIGURATION_KEYS = {
  PHOTO_UPLOAD_URL: "PHOTO_UPLOAD_URL",
  WEDDING_DATE: "WEDDING_DATE",
  REMIND_RESTING_DAYS: "REMIND_RESTING_DAYS",
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
