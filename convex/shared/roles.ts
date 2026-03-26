import type { Id } from "../_generated/dataModel";

export const APP_ROLES = ["OPERATOR", "USER"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export type ResolvedAppUser = {
  _id: Id<"users">;
  clerkId: string | null;
  email: string | null;
  name: string | null;
  address: string | null;
  nationalIdNumber: string | null;
  role: AppRole;
  operatorId: Id<"operators"> | null;
  isActive: boolean;
};

export type RoleGuardResult = {
  ok: boolean;
  code:
    | "ALLOWED"
    | "UNRESOLVED_USER"
    | "USER_INACTIVE"
    | "ROLE_MISMATCH";
  requiredRole: AppRole;
  message: string | null;
  user: ResolvedAppUser | null;
};

export function isAppRole(value: string): value is AppRole {
  return APP_ROLES.includes(value as AppRole);
}

export function ensureRole(
  user: ResolvedAppUser | null,
  requiredRole: AppRole,
): RoleGuardResult {
  if (!user) {
    return {
      ok: false,
      code: "UNRESOLVED_USER",
      requiredRole,
      message: "Current authenticated user could not be resolved to a local users record.",
      user,
    };
  }

  if (!user.isActive) {
    return {
      ok: false,
      code: "USER_INACTIVE",
      requiredRole,
      message: "The user account is inactive.",
      user,
    };
  }

  if (user.role !== requiredRole) {
    return {
      ok: false,
      code: "ROLE_MISMATCH",
      requiredRole,
      message: `Expected ${requiredRole} role but received ${user.role}.`,
      user,
    };
  }

  return {
    ok: true,
    code: "ALLOWED",
    requiredRole,
    message: null,
    user,
  };
}

export function hasRole(
  user: ResolvedAppUser | null,
  requiredRole: AppRole,
): boolean {
  return ensureRole(user, requiredRole).ok;
}

export function requireOperator(user: ResolvedAppUser | null): RoleGuardResult {
  return ensureRole(user, "OPERATOR");
}

export function requireUser(user: ResolvedAppUser | null): RoleGuardResult {
  return ensureRole(user, "USER");
}
