import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import {
  ACTIVE_ADMIN_ESCALATION_STATUSES,
  assertValidComplaintTransition,
  getComplaintHasBeenEscalated,
  getComplaintReferenceNumber,
  getComplaintStatus,
  getComplaintSubmittedAt,
  isAdminDefaultQueueCandidate,
  type ComplaintStatus,
} from "../shared/complaints";
import { listComplaintDocumentsWithUrls } from "../shared/complaintDocuments";
import { requireCurrentAdmin } from "../shared/auth";
import { clamp, normalizeOptionalText } from "../shared/utils";

const complaintMessageVisibilityValidator = v.union(
  v.literal("INTERNAL"),
  v.literal("TRACKING_VISIBLE"),
);

const regulatoryActionTypeValidator = v.union(
  v.literal("WARNING"),
  v.literal("NOTICE"),
  v.literal("AUDIT"),
  v.literal("PENALTY"),
  v.literal("LICENSE_REVIEW"),
);

type EscalatedComplaintQueueItem = {
  _id: Id<"complaints">;
  referenceNumber: string;
  status: ComplaintStatus;
  category: Doc<"complaints">["category"];
  operatorId: Id<"operators">;
  operatorName: string;
  submittedAt: number;
  escalatedAt: number | null;
  slaDeadline: number | null;
  hasBeenEscalated: boolean;
  hasDocuments: boolean;
  messageCount: number;
};

async function countQueryRows<T>(queryResult: AsyncIterable<T>): Promise<number> {
  let count = 0;

  for await (const _row of queryResult) {
    count += 1;
  }

  return count;
}

async function buildQueueItem(
  ctx: QueryCtx,
  complaint: Doc<"complaints">,
): Promise<EscalatedComplaintQueueItem> {
  const operator = await ctx.db.get(complaint.operatorId);
  const documents = await listComplaintDocumentsWithUrls(ctx, complaint);
  const messageCount = await countQueryRows(
    ctx.db
      .query("complaintMessages")
      .withIndex("by_complaintId", (q) => q.eq("complaintId", complaint._id)),
  );

  return {
    _id: complaint._id,
    referenceNumber: getComplaintReferenceNumber(complaint),
    status: getComplaintStatus(complaint),
    category: complaint.category,
    operatorId: complaint.operatorId,
    operatorName: operator?.name ?? "Unknown Operator",
    submittedAt: getComplaintSubmittedAt(complaint),
    escalatedAt: complaint.escalatedAt ?? null,
    slaDeadline: complaint.slaDeadline ?? null,
    hasBeenEscalated: getComplaintHasBeenEscalated(complaint),
    hasDocuments: documents.length > 0,
    messageCount,
  };
}

function isComplaintInAdminScope(complaint: Doc<"complaints">): boolean {
  return isAdminDefaultQueueCandidate(
    getComplaintStatus(complaint),
    getComplaintHasBeenEscalated(complaint),
  );
}

export const getEscalatedComplaints = query({
  args: {
    limit: v.optional(v.number()),
    includeClosed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireCurrentAdmin(ctx);

    const limit = clamp(Math.floor(args.limit ?? 20), 1, 50);
    const includeClosed = args.includeClosed ?? true;

    const openEscalations = await Promise.all(
      ACTIVE_ADMIN_ESCALATION_STATUSES.map((status) =>
        ctx.db
          .query("complaints")
          .withIndex("by_status", (q) => q.eq("status", status))
          .order("desc")
          .take(limit),
      ),
    );

    const closedEscalations = includeClosed
      ? await ctx.db
          .query("complaints")
          .withIndex("by_status_and_hasBeenEscalated", (q) =>
            q.eq("status", "CLOSED").eq("hasBeenEscalated", true),
          )
          .order("desc")
          .take(limit)
      : [];

    const complaintMap = new Map<Id<"complaints">, Doc<"complaints">>();

    for (const complaint of [...openEscalations.flat(), ...closedEscalations]) {
      if (isComplaintInAdminScope(complaint)) {
        complaintMap.set(complaint._id, complaint);
      }
    }

    const queueItems = await Promise.all(
      [...complaintMap.values()]
        .sort((left, right) => {
          const leftPriority = left.escalatedAt ?? getComplaintSubmittedAt(left);
          const rightPriority = right.escalatedAt ?? getComplaintSubmittedAt(right);
          return rightPriority - leftPriority;
        })
        .slice(0, limit)
        .map((complaint) => buildQueueItem(ctx, complaint)),
    );

    return queueItems;
  },
});

export const getComplaintById = query({
  args: {
    complaintId: v.id("complaints"),
  },
  handler: async (ctx, args) => {
    await requireCurrentAdmin(ctx);

    const complaint = await ctx.db.get(args.complaintId);

    if (!complaint || !isComplaintInAdminScope(complaint)) {
      return null;
    }

    const operator = await ctx.db.get(complaint.operatorId);
    const [documents, messageDocs] = await Promise.all([
      listComplaintDocumentsWithUrls(ctx, complaint),
      ctx.db
        .query("complaintMessages")
        .withIndex("by_complaintId", (q) => q.eq("complaintId", args.complaintId))
        .take(100),
    ]);

    const messages = await Promise.all(
      messageDocs
        .sort((left, right) => left.createdAt - right.createdAt)
        .map(async (message) => {
          const [senderAdmin, senderUser] = await Promise.all([
            message.senderAdminId !== undefined
              ? ctx.db.get(message.senderAdminId)
              : Promise.resolve(null),
            message.senderUserId !== undefined
              ? ctx.db.get(message.senderUserId)
              : Promise.resolve(null),
          ]);
          const sender = senderAdmin ?? senderUser;

          return {
            ...message,
            senderName: sender?.name ?? null,
            senderEmail: sender?.email ?? null,
          };
        }),
    );

    const escalationDocs = await ctx.db
      .query("escalations")
      .withIndex("by_complaintId", (q) => q.eq("complaintId", args.complaintId))
      .take(20);

    const escalations = await Promise.all(
      escalationDocs
        .sort((left, right) => right.triggeredAt - left.triggeredAt)
        .map(async (escalation) => {
          const [triggeredByAdmin, triggeredByUser] = await Promise.all([
            escalation.triggeredByAdminId !== undefined
              ? ctx.db.get(escalation.triggeredByAdminId)
              : Promise.resolve(null),
            escalation.triggeredByUserId !== undefined
              ? ctx.db.get(escalation.triggeredByUserId)
              : Promise.resolve(null),
          ]);
          const triggeredBy = triggeredByAdmin ?? triggeredByUser;

          return {
            ...escalation,
            triggeredByName: triggeredBy?.name ?? null,
            triggeredByEmail: triggeredBy?.email ?? null,
          };
        }),
    );

    const regulatoryActionDocs = await ctx.db
      .query("regulatoryActions")
      .withIndex("by_complaintId", (q) => q.eq("complaintId", args.complaintId))
      .take(50);

    const regulatoryActions = await Promise.all(
      regulatoryActionDocs
        .sort((left, right) => right.createdAt - left.createdAt)
        .map(async (action) => {
          const createdBy = await ctx.db.get(action.createdByAdminId);

          return {
            ...action,
            createdByName: createdBy?.name ?? null,
            createdByEmail: createdBy?.email ?? null,
          };
        }),
    );

    const operatorPolicies = operator
      ? await ctx.db
          .query("operatorComplaintPolicies")
          .withIndex("by_operatorId", (q) => q.eq("operatorId", operator._id))
          .take(20)
      : [];

    const applicablePolicy =
      operator === null
        ? null
        : (
            await ctx.db
              .query("operatorComplaintPolicies")
              .withIndex("by_operatorId_and_complaintCategory", (q) =>
                q
                  .eq("operatorId", operator._id)
                  .eq("complaintCategory", complaint.category),
              )
              .unique()
          ) ?? null;

    return {
      complaint,
      operator,
      documents,
      messages,
      escalations,
      regulatoryActions,
      applicablePolicy,
      operatorPolicies,
      summary: {
        documentCount: documents.length,
        messageCount: messages.length,
        escalationCount: escalations.length,
        regulatoryActionCount: regulatoryActions.length,
      },
    };
  },
});

export const startInvestigation = mutation({
  args: {
    complaintId: v.id("complaints"),
  },
  handler: async (ctx, args) => {
    await requireCurrentAdmin(ctx);

    const complaint = await ctx.db.get(args.complaintId);

    if (!complaint) {
      return { ok: false, reason: "NOT_FOUND" as const };
    }

    if (!isComplaintInAdminScope(complaint)) {
      return { ok: false, reason: "NOT_IN_ADMIN_QUEUE" as const };
    }

    try {
      assertValidComplaintTransition(
        getComplaintStatus(complaint),
        "UNDER_INVESTIGATION",
      );
    } catch (error) {
      return {
        ok: false,
        reason: "INVALID_TRANSITION" as const,
        detail: error instanceof Error ? error.message : "Unknown error",
      };
    }

    const updatedAt = Date.now();
    await ctx.db.patch(args.complaintId, {
      status: "UNDER_INVESTIGATION",
      updatedAt,
      hasBeenEscalated: true,
      escalatedAt: complaint.escalatedAt ?? updatedAt,
    });

    const updatedComplaint = await ctx.db.get(args.complaintId);

    return {
      ok: true,
      complaint: updatedComplaint,
    };
  },
});

export const closeComplaint = mutation({
  args: {
    complaintId: v.id("complaints"),
  },
  handler: async (ctx, args) => {
    await requireCurrentAdmin(ctx);

    const complaint = await ctx.db.get(args.complaintId);

    if (!complaint) {
      return { ok: false, reason: "NOT_FOUND" as const };
    }

    if (!isComplaintInAdminScope(complaint)) {
      return { ok: false, reason: "NOT_IN_ADMIN_QUEUE" as const };
    }

    try {
      assertValidComplaintTransition(getComplaintStatus(complaint), "CLOSED");
    } catch (error) {
      return {
        ok: false,
        reason: "INVALID_TRANSITION" as const,
        detail: error instanceof Error ? error.message : "Unknown error",
      };
    }

    const updatedAt = Date.now();
    await ctx.db.patch(args.complaintId, {
      status: "CLOSED",
      updatedAt,
      closedAt: updatedAt,
      hasBeenEscalated:
        getComplaintHasBeenEscalated(complaint) ||
        getComplaintStatus(complaint) !== "RESOLVED",
    });

    const updatedComplaint = await ctx.db.get(args.complaintId);

    return {
      ok: true,
      complaint: updatedComplaint,
    };
  },
});

export const addComplaintMessage = mutation({
  args: {
    complaintId: v.id("complaints"),
    message: v.string(),
    visibility: v.optional(complaintMessageVisibilityValidator),
  },
  handler: async (ctx, args) => {
    const currentAdmin = await requireCurrentAdmin(ctx);
    const complaint = await ctx.db.get(args.complaintId);

    if (!complaint) {
      return { ok: false, reason: "NOT_FOUND" as const };
    }

    if (!isComplaintInAdminScope(complaint)) {
      return { ok: false, reason: "NOT_IN_ADMIN_QUEUE" as const };
    }

    const message = normalizeOptionalText(args.message);

    if (!message) {
      return { ok: false, reason: "EMPTY_MESSAGE" as const };
    }

    const messageId = await ctx.db.insert("complaintMessages", {
      complaintId: args.complaintId,
      senderType: "ADMIN",
      senderAdminId: currentAdmin._id,
      visibility: args.visibility ?? "INTERNAL",
      message,
      createdAt: Date.now(),
    });

    return {
      ok: true,
      message: await ctx.db.get(messageId),
    };
  },
});

export const createRegulatoryAction = mutation({
  args: {
    complaintId: v.optional(v.id("complaints")),
    operatorId: v.optional(v.id("operators")),
    actionType: regulatoryActionTypeValidator,
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const currentAdmin = await requireCurrentAdmin(ctx);
    const notes = normalizeOptionalText(args.notes);

    if (!notes) {
      return { ok: false, reason: "EMPTY_NOTES" as const };
    }

    const complaint =
      args.complaintId !== undefined ? await ctx.db.get(args.complaintId) : null;

    if (args.complaintId !== undefined && !complaint) {
      return { ok: false, reason: "COMPLAINT_NOT_FOUND" as const };
    }

    if (complaint && !isComplaintInAdminScope(complaint)) {
      return { ok: false, reason: "NOT_IN_ADMIN_QUEUE" as const };
    }

    const operatorId = args.operatorId ?? complaint?.operatorId;
    if (operatorId === undefined) {
      return { ok: false, reason: "OPERATOR_REQUIRED" as const };
    }

    if (complaint && args.operatorId !== undefined && complaint.operatorId !== args.operatorId) {
      return { ok: false, reason: "OPERATOR_MISMATCH" as const };
    }

    const operator = await ctx.db.get(operatorId);
    if (!operator) {
      return { ok: false, reason: "OPERATOR_NOT_FOUND" as const };
    }

    const regulatoryActionId = await ctx.db.insert("regulatoryActions", {
      complaintId: complaint?._id,
      operatorId,
      actionType: args.actionType,
      notes,
      createdByAdminId: currentAdmin._id,
      createdAt: Date.now(),
    });

    return {
      ok: true,
      regulatoryAction: await ctx.db.get(regulatoryActionId),
      operatorName: operator.name,
    };
  },
});
