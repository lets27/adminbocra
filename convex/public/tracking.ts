import { v } from "convex/values";
import { query } from "../_generated/server";
import {
  getComplaintReferenceNumber,
  getComplaintStatus,
  getComplaintSubmittedAt,
  getComplaintTrackingToken,
} from "../shared/complaints";

export const trackComplaintByToken = query({
  args: {
    trackingToken: v.string(),
  },
  handler: async (ctx, args) => {
    const complaint = await ctx.db
      .query("complaints")
      .withIndex("by_trackingToken", (q) =>
        q.eq("trackingToken", args.trackingToken),
      )
      .unique();

    if (!complaint) {
      return null;
    }

    return {
      referenceNumber: getComplaintReferenceNumber(complaint),
      trackingToken: getComplaintTrackingToken(complaint),
      category: complaint.category,
      status: getComplaintStatus(complaint),
      submittedAt: getComplaintSubmittedAt(complaint),
      resolvedAt: complaint.resolvedAt ?? null,
      escalatedAt: complaint.escalatedAt ?? null,
      closedAt: complaint.closedAt ?? null,
    };
  },
});
