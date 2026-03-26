import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireCurrentAdmin } from "../shared/auth";
import {
  getComplaintHasBeenEscalated,
  getComplaintStatus,
  isAdminDefaultQueueCandidate,
} from "../shared/complaints";
import { clamp } from "../shared/utils";

type RecommendedActionIndicator =
  | "MONITOR"
  | "REVIEW_RECOMMENDED"
  | "REVIEW_IN_PROGRESS"
  | "SUSPENSION_IN_EFFECT"
  | "EXPIRY_FOLLOW_UP";

async function countQueryRows<T>(queryResult: AsyncIterable<T>): Promise<number> {
  let count = 0;

  for await (const _row of queryResult) {
    count += 1;
  }

  return count;
}

async function countOperatorComplaints(
  ctx: QueryCtx,
  operatorId: Id<"operators">,
): Promise<number> {
  return countQueryRows(
    ctx.db
      .query("complaints")
      .withIndex("by_operatorId_and_submittedAt", (q) => q.eq("operatorId", operatorId)),
  );
}

async function countOperatorEscalatedComplaints(
  ctx: QueryCtx,
  operatorId: Id<"operators">,
): Promise<number> {
  let count = 0;

  for await (const complaint of ctx.db
    .query("complaints")
    .withIndex("by_operatorId_and_submittedAt", (q) => q.eq("operatorId", operatorId))) {
    if (
      isAdminDefaultQueueCandidate(
        getComplaintStatus(complaint),
        getComplaintHasBeenEscalated(complaint),
      )
    ) {
      count += 1;
    }
  }

  return count;
}

function getRecommendedActionIndicator(
  operator: Doc<"operators">,
  complaintCount: number,
  escalatedComplaintCount: number,
): RecommendedActionIndicator {
  if (operator.licenseStatus === "SUSPENDED") {
    return "SUSPENSION_IN_EFFECT";
  }

  if (operator.licenseStatus === "EXPIRED") {
    return "EXPIRY_FOLLOW_UP";
  }

  if (operator.licenseStatus === "UNDER_REVIEW") {
    return "REVIEW_IN_PROGRESS";
  }

  if (
    operator.riskLevel === "HIGH" ||
    escalatedComplaintCount >= 2 ||
    complaintCount >= 5 ||
    (operator.complianceScore ?? 100) < 50
  ) {
    return "REVIEW_RECOMMENDED";
  }

  return "MONITOR";
}

async function buildHighRiskOperatorItem(
  ctx: QueryCtx,
  operator: Doc<"operators">,
) {
  const [complaintCount, escalatedComplaintCount] = await Promise.all([
    countOperatorComplaints(ctx, operator._id),
    countOperatorEscalatedComplaints(ctx, operator._id),
  ]);

  return {
    operatorId: operator._id,
    operatorName: operator.name,
    riskLevel: operator.riskLevel,
    licenseStatus: operator.licenseStatus,
    complianceScore: operator.complianceScore ?? null,
    regionCoverage: operator.regionCoverage,
    complaintCount,
    escalatedComplaintCount,
    recommendedAction: getRecommendedActionIndicator(
      operator,
      complaintCount,
      escalatedComplaintCount,
    ),
  };
}

export const getLicensingOverview = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireCurrentAdmin(ctx);

    const limit = clamp(Math.floor(args.limit ?? 10), 1, 25);

    const [
      activeCount,
      underReviewCount,
      suspendedCount,
      expiredCount,
      highRiskOperators,
    ] = await Promise.all([
      countQueryRows(
        ctx.db
          .query("operators")
          .withIndex("by_licenseStatus", (q) => q.eq("licenseStatus", "ACTIVE")),
      ),
      countQueryRows(
        ctx.db
          .query("operators")
          .withIndex("by_licenseStatus", (q) =>
            q.eq("licenseStatus", "UNDER_REVIEW"),
          ),
      ),
      countQueryRows(
        ctx.db
          .query("operators")
          .withIndex("by_licenseStatus", (q) => q.eq("licenseStatus", "SUSPENDED")),
      ),
      countQueryRows(
        ctx.db
          .query("operators")
          .withIndex("by_licenseStatus", (q) => q.eq("licenseStatus", "EXPIRED")),
      ),
      ctx.db
        .query("operators")
        .withIndex("by_riskLevel", (q) => q.eq("riskLevel", "HIGH"))
        .take(limit),
    ]);

    const highRiskOperatorSummaries = await Promise.all(
      highRiskOperators.map((operator) => buildHighRiskOperatorItem(ctx, operator)),
    );

    const recommendedActions = highRiskOperatorSummaries.filter(
      (operator) => operator.recommendedAction !== "MONITOR",
    );

    return {
      statusCounts: {
        active: activeCount,
        underReview: underReviewCount,
        suspended: suspendedCount,
        expired: expiredCount,
      },
      highRiskOperators: highRiskOperatorSummaries,
      recommendedActions,
      generatedAt: Date.now(),
    };
  },
});
