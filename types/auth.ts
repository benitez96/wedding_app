/**
 * Auth types and constants
 */

// User roles
export const UserRole = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

// Type guard para verificar si un usuario es admin
export function isAdmin(role?: string | null): boolean {
  return role === UserRole.ADMIN;
}

// Type guard para verificar si un usuario es user
export function isUser(role?: string | null): boolean {
  return role === UserRole.USER;
}
