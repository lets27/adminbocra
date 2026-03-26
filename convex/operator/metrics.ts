import { v } from "convex/values";
import { query } from "../_generated/server";

export const getMetrics = query({
  args: {
    operatorId: v.id("operators"),
  },
  handler: async (_ctx, args) => {
    return {
      operatorId: args.operatorId,
      assignedComplaintCount: 0,
      inProgressComplaintCount: 0,
      note: "Metrics scaffolding only. Final operator metrics are not implemented yet.",
    };
  },
});
