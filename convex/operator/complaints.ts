import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import {
  assertValidComplaintTransition,
  getComplaintStatus,
  type ComplaintStatus,
} from "../shared/complaints";
import { listComplaintDocumentsWithUrls } from "../shared/complaintDocuments";
import { clamp } from "../shared/utils";

export const getAssignedComplaints = query({
  args: {
    operatorId: v.id("operators"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = clamp(Math.floor(args.limit ?? 20), 1, 50);

    return ctx.db
      .query("complaints")
      .withIndex("by_operatorId_and_submittedAt", (q) =>
        q.eq("operatorId", args.operatorId),
      )
      .order("desc")
      .take(limit);
  },
});

export const getComplaintById = query({
  args: {
    operatorId: v.id("operators"),
    complaintId: v.id("complaints"),
  },
  handler: async (ctx, args) => {
    const complaint = await ctx.db.get(args.complaintId);

    if (!complaint || complaint.operatorId !== args.operatorId) {
      return null;
    }

    const documents = await listComplaintDocumentsWithUrls(ctx, complaint);

    return {
      complaint,
      documents,
    };
  },
});

export const getSlaQueue = query({
  args: {
    operatorId: v.id("operators"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = clamp(Math.floor(args.limit ?? 20), 1, 50);
    const statuses: ComplaintStatus[] = ["SUBMITTED_TO_OPERATOR", "IN_PROGRESS"];

    const complaintGroups = await Promise.all(
      statuses.map((status) =>
        ctx.db
          .query("complaints")
          .withIndex("by_operatorId_and_status", (q) =>
            q.eq("operatorId", args.operatorId).eq("status", status),
          )
          .take(limit),
      ),
    );

    return complaintGroups
      .flat()
      .sort((left, right) => {
        const leftDeadline = left.slaDeadline ?? Number.MAX_SAFE_INTEGER;
        const rightDeadline = right.slaDeadline ?? Number.MAX_SAFE_INTEGER;
        return leftDeadline - rightDeadline;
      })
      .slice(0, limit);
  },
});

export const startComplaint = mutation({
  args: {
    complaintId: v.id("complaints"),
  },
  handler: async (ctx, args) => {
    const complaint = await ctx.db.get(args.complaintId);

    if (!complaint) {
      return { ok: false, reason: "NOT_FOUND" as const };
    }

    try {
      assertValidComplaintTransition(getComplaintStatus(complaint), "IN_PROGRESS");
    } catch (error) {
      return {
        ok: false,
        reason: "INVALID_TRANSITION" as const,
        detail: error instanceof Error ? error.message : "Unknown error",
      };
    }

    return {
      ok: false,
      reason: "NOT_IMPLEMENTED" as const,
      nextStatus: "IN_PROGRESS" as const,
    };
  },
});

export const resolveComplaint = mutation({
  args: {
    complaintId: v.id("complaints"),
  },
  handler: async (ctx, args) => {
    const complaint = await ctx.db.get(args.complaintId);

    if (!complaint) {
      return { ok: false, reason: "NOT_FOUND" as const };
    }

    try {
      assertValidComplaintTransition(getComplaintStatus(complaint), "RESOLVED");
    } catch (error) {
      return {
        ok: false,
        reason: "INVALID_TRANSITION" as const,
        detail: error instanceof Error ? error.message : "Unknown error",
      };
    }

    return {
      ok: false,
      reason: "NOT_IMPLEMENTED" as const,
      nextStatus: "RESOLVED" as const,
    };
  },
});

export const addMessage = mutation({
  args: {
    complaintId: v.id("complaints"),
    message: v.string(),
  },
  handler: async (_ctx, args) => {
    return {
      ok: false,
      reason: "NOT_IMPLEMENTED" as const,
      complaintId: args.complaintId,
      messagePreview: args.message.slice(0, 80),
    };
  },
});
