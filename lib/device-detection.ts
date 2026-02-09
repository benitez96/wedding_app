/**
 * Device detection utilities
 *
 * Extracts device/browser information from User-Agent strings
 */

export const DeviceTypes = {
  UNKNOWN: "unknown",
  CHROME: "chrome",
  FIREFOX: "firefox",
  SAFARI: "safari",
  EDGE: "edge",
  MOBILE: "mobile",
  DESKTOP: "desktop",
} as const;

export type DeviceType = (typeof DeviceTypes)[keyof typeof DeviceTypes];

/**
 * Extract device/browser information from User-Agent string
 *
 * @param userAgent - User-Agent string from request headers
 * @returns Device type identifier
 *
 * @example
 * ```typescript
 * const device = getDeviceInfo("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
 * // Returns: "chrome"
 *
 * const device = getDeviceInfo("Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)");
 * // Returns: "mobile"
 *
 * const device = getDeviceInfo(null);
 * // Returns: "unknown"
 * ```
 */
export function getDeviceInfo(userAgent: string | null): DeviceType {
  if (!userAgent || userAgent === "Unknown") {
    return DeviceTypes.UNKNOWN;
  }

  // Check browser first (more specific)
  // IMPORTANT: Edge must be checked before Chrome since Edge UA contains "Chrome"
  // Modern Edge uses "Edg/" while legacy uses "Edge"
  if (userAgent.includes("Edg/") || userAgent.includes("Edge/")) {
    return DeviceTypes.EDGE;
  }
  if (userAgent.includes("Chrome")) {
    return DeviceTypes.CHROME;
  }
  if (userAgent.includes("Firefox")) {
    return DeviceTypes.FIREFOX;
  }
  if (userAgent.includes("Safari")) {
    return DeviceTypes.SAFARI;
  }

  // Check device type (mobile vs desktop)
  if (
    userAgent.includes("Mobile") ||
    userAgent.includes("Android") ||
    userAgent.includes("iPhone")
  ) {
    return DeviceTypes.MOBILE;
  }

  return DeviceTypes.DESKTOP;
}

/**
 * Get human-readable device label for UI display
 *
 * TODO i18n: Device labels need translation support
 */
export function getDeviceLabel(deviceType: DeviceType): string {
  const labels: Record<DeviceType, string> = {
    [DeviceTypes.UNKNOWN]: "Unknown",
    [DeviceTypes.CHROME]: "Chrome",
    [DeviceTypes.FIREFOX]: "Firefox",
    [DeviceTypes.SAFARI]: "Safari",
    [DeviceTypes.EDGE]: "Edge",
    [DeviceTypes.MOBILE]: "Mobile",
    [DeviceTypes.DESKTOP]: "Desktop",
  };

  return labels[deviceType];
}
