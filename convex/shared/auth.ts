import type { Doc, Id } from "../_generated/dataModel";
import type { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";
import { mutation, query } from "../_generated/server";
import { requireOperator, type ResolvedAppUser } from "./roles";

export type FutureAuthCtx = QueryCtx | MutationCtx | ActionCtx;
export type AuthDbCtx = QueryCtx | MutationCtx;

export type ClerkIdentity = {
  clerkId: string;
  email: string | null;
  issuer: string;
  name: string | null;
  tokenIdentifier: string;
};

export type ResolvedAdmin = {
  _id: Id<"admins">;
  clerkId: string;
  email: string | null;
  name: string | null;
  isActive: boolean;
};

export type AdminResolutionResult = {
  isAuthenticated: boolean;
  identity: ClerkIdentity | null;
  admin: ResolvedAdmin | null;
  status: "authenticated" | "unauthenticated" | "unmapped_admin";
};

export type AuthResolutionResult = {
  isAuthenticated: boolean;
  identity: ClerkIdentity | null;
  user: ResolvedAppUser | null;
  status: "authenticated" | "unauthenticated" | "unmapped_user";
};

function toResolvedAdmin(admin: Doc<"admins">): ResolvedAdmin {
  return {
    _id: admin._id,
    clerkId: admin.clerkId,
    email: admin.email ?? null,
    name: admin.name ?? null,
    isActive: admin.isActive,
  };
}

function toResolvedAppUser(user: Doc<"users">): ResolvedAppUser {
  return {
    _id: user._id,
    clerkId: user.clerkId ?? null,
    email: user.email ?? null,
    name: user.name ?? null,
    address: user.address ?? null,
    nationalIdNumber: user.nationalIdNumber ?? null,
    role: user.role,
    operatorId: user.operatorId ?? null,
    isActive: user.isActive,
  };
}

function normalizeIdentityName(identity: {
  name?: string | null;
  givenName?: string | null;
  familyName?: string | null;
  nickname?: string | null;
}): string | null {
  if (identity.name && identity.name.trim().length > 0) {
    return identity.name.trim();
  }

  const fullName = [identity.givenName, identity.familyName]
    .filter((value): value is string => Boolean(value && value.trim().length > 0))
    .join(" ")
    .trim();

  if (fullName.length > 0) {
    return fullName;
  }

  if (identity.nickname && identity.nickname.trim().length > 0) {
    return identity.nickname.trim();
  }

  return null;
}

export async function getCurrentClerkIdentity(
  ctx: FutureAuthCtx,
): Promise<ClerkIdentity | null> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity?.subject) {
    console.log("[auth] No Clerk identity found in Convex context.");
    return null;
  }

  console.log("[auth] Clerk identity resolved in Convex context.", {
    clerkId: identity.subject,
    email: identity.email ?? null,
    issuer: identity.issuer,
  });

  return {
    clerkId: identity.subject,
    email: identity.email ?? null,
    issuer: identity.issuer,
    name: normalizeIdentityName({
      name: identity.name ?? null,
      givenName: identity.givenName ?? null,
      familyName: identity.familyName ?? null,
      nickname: identity.nickname ?? null,
    }),
    tokenIdentifier: identity.tokenIdentifier,
  };
}

export async function getCurrentAdmin(
  ctx: AuthDbCtx,
): Promise<ResolvedAdmin | null> {
  const identity = await getCurrentClerkIdentity(ctx);

  if (!identity) {
    return null;
  }

  const admin = await ctx.db
    .query("admins")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.clerkId))
    .unique();

  return admin ? toResolvedAdmin(admin) : null;
}

export const getCurrentAdminProfile = query({
  args: {},
  handler: async (ctx) => {
    const resolution = await getAdminResolutionResult(ctx);

    return {
      isAuthenticated: resolution.isAuthenticated,
      status: resolution.status,
      identity: resolution.identity
        ? {
            clerkId: resolution.identity.clerkId,
            email: resolution.identity.email,
            name: resolution.identity.name,
          }
        : null,
      admin: resolution.admin,
    };
  },
});

export async function getAdminResolutionResult(
  ctx: AuthDbCtx,
): Promise<AdminResolutionResult> {
  const identity = await getCurrentClerkIdentity(ctx);

  if (!identity) {
    return {
      isAuthenticated: false,
      identity: null,
      admin: null,
      status: "unauthenticated",
    };
  }

  const admin = await getCurrentAdmin(ctx);

  return {
    isAuthenticated: true,
    identity,
    admin,
    status: admin ? "authenticated" : "unmapped_admin",
  };
}

export async function requireCurrentAdmin(
  ctx: AuthDbCtx,
): Promise<ResolvedAdmin> {
  const resolution = await getAdminResolutionResult(ctx);

  if (resolution.status === "unauthenticated") {
    throw new Error("Not authenticated.");
  }

  if (!resolution.admin) {
    throw new Error(
      "Authenticated Clerk admin is missing a matching local admins record.",
    );
  }

  if (!resolution.admin.isActive) {
    throw new Error("The admin account is inactive.");
  }

  return resolution.admin;
}

async function patchAdminFromClerkIdentity(
  ctx: MutationCtx,
  admin: Doc<"admins">,
  identity: ClerkIdentity,
): Promise<Doc<"admins">> {
  const patch: {
    clerkId?: string;
    email?: string;
    name?: string;
    updatedAt?: number;
  } = {};

  if (admin.clerkId !== identity.clerkId) {
    patch.clerkId = identity.clerkId;
  }

  if (identity.email && admin.email !== identity.email) {
    patch.email = identity.email;
  }

  if (identity.name && admin.name !== identity.name) {
    patch.name = identity.name;
  }

  if (Object.keys(patch).length === 0) {
    return admin;
  }

  patch.updatedAt = Date.now();
  await ctx.db.patch(admin._id, patch);

  return (await ctx.db.get(admin._id)) ?? admin;
}

export async function ensureCurrentAdminRecord(
  ctx: MutationCtx,
): Promise<ResolvedAdmin | null> {
  const identity = await getCurrentClerkIdentity(ctx);

  if (!identity) {
    console.log("[auth] Admin sync skipped because no Clerk identity was available.");
    return null;
  }

  const existingAdmin = await ctx.db
    .query("admins")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.clerkId))
    .unique();

  if (existingAdmin) {
    console.log("[auth] Existing admin found. Updating local admin record.", {
      adminId: existingAdmin._id,
      clerkId: identity.clerkId,
    });
    const updatedAdmin = await patchAdminFromClerkIdentity(
      ctx,
      existingAdmin,
      identity,
    );

    return toResolvedAdmin(updatedAdmin);
  }

  const now = Date.now();
  console.log("[auth] Creating new local admin record.", {
    clerkId: identity.clerkId,
    email: identity.email,
    name: identity.name,
  });
  const adminId = await ctx.db.insert("admins", {
    clerkId: identity.clerkId,
    ...(identity.email ? { email: identity.email } : {}),
    ...(identity.name ? { name: identity.name } : {}),
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  const createdAdmin = await ctx.db.get(adminId);

  if (!createdAdmin) {
    throw new Error("Failed to create local admin record.");
  }

  return toResolvedAdmin(createdAdmin);
}

export const syncCurrentAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("[auth] syncCurrentAdmin invoked.");
    const admin = await ensureCurrentAdminRecord(ctx);

    console.log("[auth] syncCurrentAdmin completed.", {
      isAuthenticated: admin !== null,
      adminId: admin?._id ?? null,
      clerkId: admin?.clerkId ?? null,
    });

    return {
      isAuthenticated: admin !== null,
      admin,
    };
  },
});

export async function getCurrentUser(
  ctx: AuthDbCtx,
): Promise<ResolvedAppUser | null> {
  const identity = await getCurrentClerkIdentity(ctx);

  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.clerkId))
    .unique();

  return user ? toResolvedAppUser(user) : null;
}

export async function getAuthResolutionResult(
  ctx: AuthDbCtx,
): Promise<AuthResolutionResult> {
  const identity = await getCurrentClerkIdentity(ctx);

  if (!identity) {
    return {
      isAuthenticated: false,
      identity: null,
      user: null,
      status: "unauthenticated",
    };
  }

  const user = await getCurrentUser(ctx);

  return {
    isAuthenticated: true,
    identity,
    user,
    status: user ? "authenticated" : "unmapped_user",
  };
}

export async function requireCurrentUser(
  ctx: AuthDbCtx,
): Promise<ResolvedAppUser> {
  const resolution = await getAuthResolutionResult(ctx);

  if (resolution.status === "unauthenticated") {
    throw new Error("Not authenticated.");
  }

  if (!resolution.user) {
    throw new Error(
      "Authenticated Clerk user is missing a matching local users record.",
    );
  }

  return resolution.user;
}

export async function requireCurrentOperator(
  ctx: AuthDbCtx,
): Promise<ResolvedAppUser> {
  const user = await requireCurrentUser(ctx);
  const guard = requireOperator(user);

  if (!guard.ok) {
    throw new Error(guard.message ?? "Unauthorized.");
  }

  return user;
}

async function patchUserFromClerkIdentity(
  ctx: MutationCtx,
  user: Doc<"users">,
  identity: ClerkIdentity,
): Promise<Doc<"users">> {
  const patch: {
    clerkId?: string;
    email?: string;
    name?: string;
    updatedAt?: number;
  } = {};

  if (user.clerkId !== identity.clerkId) {
    patch.clerkId = identity.clerkId;
  }

  if (identity.email && user.email !== identity.email) {
    patch.email = identity.email;
  }

  if (identity.name && user.name !== identity.name) {
    patch.name = identity.name;
  }

  if (Object.keys(patch).length === 0) {
    return user;
  }

  patch.updatedAt = Date.now();
  await ctx.db.patch(user._id, patch);

  return (await ctx.db.get(user._id)) ?? user;
}

export async function ensureCurrentUserRecord(
  ctx: MutationCtx,
): Promise<ResolvedAppUser | null> {
  const identity = await getCurrentClerkIdentity(ctx);

  if (!identity) {
    return null;
  }

  const existingUser = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.clerkId))
    .unique();

  if (existingUser) {
    const updatedUser = await patchUserFromClerkIdentity(
      ctx,
      existingUser,
      identity,
    );

    return toResolvedAppUser(updatedUser);
  }

  const now = Date.now();
  const userId = await ctx.db.insert("users", {
    clerkId: identity.clerkId,
    ...(identity.email ? { email: identity.email } : {}),
    ...(identity.name ? { name: identity.name } : {}),
    role: "USER",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  const createdUser = await ctx.db.get(userId);

  if (!createdUser) {
    throw new Error("Failed to create local user record.");
  }

  return toResolvedAppUser(createdUser);
}

export async function getAuthenticatedComplaintSubmitterContext(
  ctx: MutationCtx,
): Promise<
  | {
      submitterType: "AUTHENTICATED";
      submittedByUserId: Id<"users">;
    }
  | {
      submitterType: "PUBLIC";
      submittedByUserId?: undefined;
    }
> {
  const user = await ensureCurrentUserRecord(ctx);

  if (!user) {
    return {
      submitterType: "PUBLIC",
    };
  }

  return {
    submitterType: "AUTHENTICATED",
    submittedByUserId: user._id,
  };
}

export const syncCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ensureCurrentUserRecord(ctx);

    return {
      isAuthenticated: user !== null,
      user,
    };
  },
});
