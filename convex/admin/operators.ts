import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireCurrentAdmin } from "../shared/auth";
import {
  getComplaintHasBeenEscalated,
  getComplaintStatus,
  isAdminDefaultQueueCandidate,
} from "../shared/complaints";
import { clamp } from "../shared/utils";

const operatorLicenseStatusValidator = v.union(
  v.literal("ACTIVE"),
  v.literal("UNDER_REVIEW"),
  v.literal("SUSPENDED"),
  v.literal("EXPIRED"),
);

async function countQueryRows<T>(queryResult: AsyncIterable<T>): Promise<number> {
  let count = 0;

  for await (const _row of queryResult) {
    count += 1;
  }

  return count;
}

function isEscalatedComplaint(complaint: Doc<"complaints">): boolean {
  return isAdminDefaultQueueCandidate(
    getComplaintStatus(complaint),
    getComplaintHasBeenEscalated(complaint),
  );
}

async function countOperatorComplaints(
  ctx: QueryCtx | MutationCtx,
  operatorId: Id<"operators">,
): Promise<number> {
  return countQueryRows(
    ctx.db
      .query("complaints")
      .withIndex("by_operatorId_and_submittedAt", (q) => q.eq("operatorId", operatorId)),
  );
}

async function countOperatorEscalations(
  ctx: QueryCtx | MutationCtx,
  operatorId: Id<"operators">,
): Promise<number> {
  return countQueryRows(
    ctx.db
      .query("escalations")
      .withIndex("by_operatorId", (q) => q.eq("operatorId", operatorId)),
  );
}

async function countOperatorOpenAdminComplaints(
  ctx: QueryCtx | MutationCtx,
  operatorId: Id<"operators">,
): Promise<number> {
  const adminStatuses = [
    "ESCALATION_REQUESTED",
    "ESCALATED_TO_BOCRA",
    "UNDER_INVESTIGATION",
  ] as const;

  const counts = await Promise.all(
    adminStatuses.map((status) =>
        countQueryRows(
          ctx.db
            .query("complaints")
            .withIndex("by_operatorId_and_status", (q) =>
              q.eq("operatorId", operatorId).eq("status", status),
            ),
        ),
    ),
  );

  return counts.reduce((total, count) => total + count, 0);
}

async function countOperatorPolicies(
  ctx: QueryCtx | MutationCtx,
  operatorId: Id<"operators">,
): Promise<number> {
  return countQueryRows(
    ctx.db
      .query("operatorComplaintPolicies")
      .withIndex("by_operatorId", (q) => q.eq("operatorId", operatorId)),
  );
}

async function buildOperatorSummary(
  ctx: QueryCtx,
  operator: Doc<"operators">,
) {
  const [complaintCount, escalationCount, activeEscalationCount, policyCount] =
    await Promise.all([
      countOperatorComplaints(ctx, operator._id),
      countOperatorEscalations(ctx, operator._id),
      countOperatorOpenAdminComplaints(ctx, operator._id),
      countOperatorPolicies(ctx, operator._id),
    ]);

  return {
    ...operator,
    complaintCount,
    escalationCount,
    activeEscalationCount,
    policyCount,
  };
}

export const getOperators = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireCurrentAdmin(ctx);

    const limit = clamp(Math.floor(args.limit ?? 20), 1, 50);
    const operators = await ctx.db.query("operators").order("desc").take(limit);

    return Promise.all(operators.map((operator) => buildOperatorSummary(ctx, operator)));
  },
});

export const getOperatorById = query({
  args: {
    operatorId: v.id("operators"),
  },
  handler: async (ctx, args) => {
    await requireCurrentAdmin(ctx);

    const operator = await ctx.db.get(args.operatorId);

    if (!operator) {
      return null;
    }

    const [policies, recentComplaints, assignedUsers, regulatoryActions] =
      await Promise.all([
        ctx.db
          .query("operatorComplaintPolicies")
          .withIndex("by_operatorId", (q) => q.eq("operatorId", args.operatorId))
          .take(20),
        ctx.db
          .query("complaints")
          .withIndex("by_operatorId_and_submittedAt", (q) =>
            q.eq("operatorId", args.operatorId),
          )
          .order("desc")
          .take(10),
        ctx.db
          .query("users")
          .withIndex("by_operatorId", (q) => q.eq("operatorId", args.operatorId))
          .take(10),
        ctx.db
          .query("regulatoryActions")
          .withIndex("by_operatorId", (q) => q.eq("operatorId", args.operatorId))
          .take(20),
      ]);

    const [complaintCount, escalationCount, activeEscalationCount] =
      await Promise.all([
        countOperatorComplaints(ctx, args.operatorId),
        countOperatorEscalations(ctx, args.operatorId),
        countOperatorOpenAdminComplaints(ctx, args.operatorId),
      ]);

    return {
      operator,
      policies,
      assignedUsers,
      recentComplaints: recentComplaints.map((complaint) => ({
        ...complaint,
        isEscalated: isEscalatedComplaint(complaint),
      })),
      regulatoryActions: regulatoryActions.sort(
        (left, right) => right.createdAt - left.createdAt,
      ),
      summary: {
        complaintCount,
        escalationCount,
        activeEscalationCount,
      },
    };
  },
});

export const updateOperatorLicenseStatus = mutation({
  args: {
    operatorId: v.id("operators"),
    licenseStatus: operatorLicenseStatusValidator,
  },
  handler: async (ctx, args) => {
    await requireCurrentAdmin(ctx);

    const operator = await ctx.db.get(args.operatorId);

    if (!operator) {
      return { ok: false, reason: "NOT_FOUND" as const };
    }

    const updatedAt = Date.now();
    await ctx.db.patch(args.operatorId, {
      licenseStatus: args.licenseStatus,
      updatedAt,
    });

    return {
      ok: true,
      operator: await ctx.db.get(args.operatorId),
    };
  },
});
