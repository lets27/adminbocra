import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { query } from "../_generated/server";
import { v } from "convex/values";
import {
  COMPLAINT_CATEGORIES,
  getComplaintHasBeenEscalated,
  getComplaintReferenceNumber,
  getComplaintStatus,
  getComplaintSubmittedAt,
  isAdminDefaultQueueCandidate,
} from "../shared/complaints";
import { requireCurrentAdmin } from "../shared/auth";

type RegionAnalyticsRow = {
  region: string;
  operatorCount: number;
  complaintCount: number;
  escalatedComplaintCount: number;
  underInvestigationCount: number;
  highRiskOperatorCount: number;
  underReviewOperatorCount: number;
};

type CategoryAnalyticsRow = {
  category: Doc<"complaints">["category"];
  complaintCount: number;
  escalatedComplaintCount: number;
  closedCount: number;
  underInvestigationCount: number;
  operatorCount: number;
};

type OperatorAnalyticsRow = {
  operatorId: Id<"operators">;
  operatorName: string;
  licenseStatus: Doc<"operators">["licenseStatus"];
  riskLevel: Doc<"operators">["riskLevel"];
  complianceScore: number | null;
  complaintCount: number;
  escalatedComplaintCount: number;
  underInvestigationCount: number;
  closedComplaintCount: number;
};

async function countQueryRows<T>(queryResult: AsyncIterable<T>): Promise<number> {
  let count = 0;

  for await (const _row of queryResult) {
    count += 1;
  }

  return count;
}

async function listAllOperators(ctx: QueryCtx): Promise<Doc<"operators">[]> {
  const operators: Doc<"operators">[] = [];

  for await (const operator of ctx.db.query("operators")) {
    operators.push(operator);
  }

  return operators;
}

async function listAllComplaints(ctx: QueryCtx): Promise<Doc<"complaints">[]> {
  const complaints: Doc<"complaints">[] = [];

  for await (const complaint of ctx.db.query("complaints")) {
    complaints.push(complaint);
  }

  return complaints;
}

function isEscalatedComplaint(complaint: Doc<"complaints">): boolean {
  return isAdminDefaultQueueCandidate(
    getComplaintStatus(complaint),
    getComplaintHasBeenEscalated(complaint),
  );
}

function initializeRegionRow(region: string): RegionAnalyticsRow {
  return {
    region,
    operatorCount: 0,
    complaintCount: 0,
    escalatedComplaintCount: 0,
    underInvestigationCount: 0,
    highRiskOperatorCount: 0,
    underReviewOperatorCount: 0,
  };
}

function initializeCategoryRow(
  category: Doc<"complaints">["category"],
): CategoryAnalyticsRow {
  return {
    category,
    complaintCount: 0,
    escalatedComplaintCount: 0,
    closedCount: 0,
    underInvestigationCount: 0,
    operatorCount: 0,
  };
}

export const getDashboardSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireCurrentAdmin(ctx);

    const [
      escalationRequestedCount,
      escalatedToBocraCount,
      underInvestigationCount,
      closedEscalatedCount,
      totalOperators,
      highRiskOperatorCount,
      underReviewOperatorCount,
      suspendedOperatorCount,
    ] = await Promise.all([
      countQueryRows(
        ctx.db
          .query("complaints")
          .withIndex("by_status", (q) => q.eq("status", "ESCALATION_REQUESTED")),
      ),
      countQueryRows(
        ctx.db
          .query("complaints")
          .withIndex("by_status", (q) => q.eq("status", "ESCALATED_TO_BOCRA")),
      ),
      countQueryRows(
        ctx.db
          .query("complaints")
          .withIndex("by_status", (q) => q.eq("status", "UNDER_INVESTIGATION")),
      ),
      countQueryRows(
        ctx.db
          .query("complaints")
          .withIndex("by_status_and_hasBeenEscalated", (q) =>
            q.eq("status", "CLOSED").eq("hasBeenEscalated", true),
          ),
      ),
      listAllOperators(ctx),
      countQueryRows(
        ctx.db
          .query("operators")
          .withIndex("by_riskLevel", (q) => q.eq("riskLevel", "HIGH")),
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
    ]);

    const recentEscalatedComplaints = (
      await Promise.all(
        ([
          "ESCALATION_REQUESTED",
          "ESCALATED_TO_BOCRA",
          "UNDER_INVESTIGATION",
        ] as const).map(
          (status) =>
            ctx.db
              .query("complaints")
              .withIndex("by_status", (q) => q.eq("status", status))
              .order("desc")
              .take(5),
        ),
      )
    )
      .flat()
      .sort((left, right) => {
        const leftPriority = left.escalatedAt ?? getComplaintSubmittedAt(left);
        const rightPriority = right.escalatedAt ?? getComplaintSubmittedAt(right);
        return rightPriority - leftPriority;
      })
      .slice(0, 5)
      .map((complaint) => ({
        complaintId: complaint._id,
        referenceNumber: getComplaintReferenceNumber(complaint),
        status: getComplaintStatus(complaint),
        category: complaint.category,
        operatorId: complaint.operatorId,
        submittedAt: getComplaintSubmittedAt(complaint),
        escalatedAt: complaint.escalatedAt ?? null,
      }));

    return {
      escalatedComplaintCount:
        escalationRequestedCount +
        escalatedToBocraCount +
        underInvestigationCount,
      escalationRequestedCount,
      escalatedToBocraCount,
      underInvestigationCount,
      closedEscalatedCount,
      totalOperators: totalOperators.length,
      highRiskOperatorCount,
      underReviewOperatorCount,
      suspendedOperatorCount,
      recentEscalatedComplaints,
      generatedAt: Date.now(),
    };
  },
});

export const getAnalyticsByRegion = query({
  args: {
    region: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireCurrentAdmin(ctx);

    const [operators, complaints] = await Promise.all([
      listAllOperators(ctx),
      listAllComplaints(ctx),
    ]);

    const analyticsMap = new Map<string, RegionAnalyticsRow>();
    const operatorToRegions = new Map<Id<"operators">, string[]>();

    for (const operator of operators) {
      const regions =
        operator.regionCoverage.length > 0 ? operator.regionCoverage : ["UNASSIGNED"];

      operatorToRegions.set(operator._id, regions);

      for (const region of regions) {
        const row = analyticsMap.get(region) ?? initializeRegionRow(region);
        row.operatorCount += 1;
        if (operator.riskLevel === "HIGH") {
          row.highRiskOperatorCount += 1;
        }
        if (operator.licenseStatus === "UNDER_REVIEW") {
          row.underReviewOperatorCount += 1;
        }
        analyticsMap.set(region, row);
      }
    }

    for (const complaint of complaints) {
      const regions = operatorToRegions.get(complaint.operatorId) ?? ["UNASSIGNED"];

      for (const region of regions) {
        const row = analyticsMap.get(region) ?? initializeRegionRow(region);
        row.complaintCount += 1;
        if (isEscalatedComplaint(complaint)) {
          row.escalatedComplaintCount += 1;
        }
        if (getComplaintStatus(complaint) === "UNDER_INVESTIGATION") {
          row.underInvestigationCount += 1;
        }
        analyticsMap.set(region, row);
      }
    }

    const results = [...analyticsMap.values()]
      .filter((row) => (args.region ? row.region === args.region : true))
      .sort((left, right) => right.complaintCount - left.complaintCount);

    return {
      region: args.region ?? null,
      results,
      generatedAt: Date.now(),
    };
  },
});

export const getAnalyticsByCategory = query({
  args: {
    category: v.optional(
      v.union(
        v.literal("NETWORK_OUTAGE"),
        v.literal("BILLING_DISPUTE"),
        v.literal("POOR_CALL_QUALITY"),
        v.literal("SERVICE_ACTIVATION_DELAY"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await requireCurrentAdmin(ctx);

    const complaints = await listAllComplaints(ctx);
    const analyticsMap = new Map<
      Doc<"complaints">["category"],
      CategoryAnalyticsRow
    >();
    const operatorSets = new Map<
      Doc<"complaints">["category"],
      Set<Id<"operators">>
    >();

    for (const category of COMPLAINT_CATEGORIES) {
      analyticsMap.set(category, initializeCategoryRow(category));
      operatorSets.set(category, new Set<Id<"operators">>());
    }

    for (const complaint of complaints) {
      const row =
        analyticsMap.get(complaint.category) ??
        initializeCategoryRow(complaint.category);
      row.complaintCount += 1;
      if (isEscalatedComplaint(complaint)) {
        row.escalatedComplaintCount += 1;
      }
      if (getComplaintStatus(complaint) === "UNDER_INVESTIGATION") {
        row.underInvestigationCount += 1;
      }
      if (getComplaintStatus(complaint) === "CLOSED") {
        row.closedCount += 1;
      }

      const operators = operatorSets.get(complaint.category) ?? new Set<Id<"operators">>();
      operators.add(complaint.operatorId);
      row.operatorCount = operators.size;

      operatorSets.set(complaint.category, operators);
      analyticsMap.set(complaint.category, row);
    }

    const results = [...analyticsMap.values()]
      .filter((row) => (args.category ? row.category === args.category : true))
      .sort((left, right) => right.complaintCount - left.complaintCount);

    return {
      category: args.category ?? null,
      results,
      generatedAt: Date.now(),
    };
  },
});

export const getAnalyticsByOperator = query({
  args: {
    operatorId: v.optional(v.id("operators")),
  },
  handler: async (ctx, args) => {
    await requireCurrentAdmin(ctx);

    const [operators, complaints] = await Promise.all([
      listAllOperators(ctx),
      listAllComplaints(ctx),
    ]);

    const complaintBuckets = new Map<Id<"operators">, Doc<"complaints">[]>();
    for (const complaint of complaints) {
      const bucket = complaintBuckets.get(complaint.operatorId) ?? [];
      bucket.push(complaint);
      complaintBuckets.set(complaint.operatorId, bucket);
    }

    const results: OperatorAnalyticsRow[] = operators
      .filter((operator) => (args.operatorId ? operator._id === args.operatorId : true))
      .map((operator) => {
        const operatorComplaints = complaintBuckets.get(operator._id) ?? [];

        return {
          operatorId: operator._id,
          operatorName: operator.name,
          licenseStatus: operator.licenseStatus,
          riskLevel: operator.riskLevel,
          complianceScore: operator.complianceScore ?? null,
          complaintCount: operatorComplaints.length,
          escalatedComplaintCount: operatorComplaints.filter((complaint) =>
            isEscalatedComplaint(complaint),
          ).length,
          underInvestigationCount: operatorComplaints.filter(
            (complaint) => getComplaintStatus(complaint) === "UNDER_INVESTIGATION",
          ).length,
          closedComplaintCount: operatorComplaints.filter(
            (complaint) => getComplaintStatus(complaint) === "CLOSED",
          ).length,
        };
      })
      .sort((left, right) => right.complaintCount - left.complaintCount);

    return {
      operatorId: args.operatorId ?? null,
      results,
      generatedAt: Date.now(),
    };
  },
});
