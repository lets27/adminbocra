import { v } from "convex/values";
import { query } from "../_generated/server";

export const getOperatorScorecards = query({
  args: {
    region: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    return {
      region: args.region ?? null,
      operators: [],
    };
  },
});

export const getRegionalInsights = query({
  args: {
    region: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    return {
      region: args.region ?? null,
      insights: [],
    };
  },
});

export const getCategoryTrends = query({
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
  handler: async (_ctx, args) => {
    return {
      category: args.category ?? null,
      trends: [],
    };
  },
});
