import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const userRoleValidator = v.union(
  v.literal("OPERATOR"),
  v.literal("USER"),
);

const operatorLicenseStatusValidator = v.union(
  v.literal("ACTIVE"),
  v.literal("UNDER_REVIEW"),
  v.literal("SUSPENDED"),
  v.literal("EXPIRED"),
);

const operatorRiskLevelValidator = v.union(
  v.literal("LOW"),
  v.literal("MEDIUM"),
  v.literal("HIGH"),
);

const complaintCategoryValidator = v.union(
  v.literal("NETWORK_OUTAGE"),
  v.literal("BILLING_DISPUTE"),
  v.literal("POOR_CALL_QUALITY"),
  v.literal("SERVICE_ACTIVATION_DELAY"),
);

const complaintStatusValidator = v.union(
  v.literal("SUBMITTED_TO_OPERATOR"),
  v.literal("IN_PROGRESS"),
  v.literal("RESOLVED"),
  v.literal("ESCALATION_REQUESTED"),
  v.literal("ESCALATED_TO_BOCRA"),
  v.literal("UNDER_INVESTIGATION"),
  v.literal("CLOSED"),
);

const submitterTypeValidator = v.union(
  v.literal("PUBLIC"),
  v.literal("AUTHENTICATED"),
);

const documentTypeValidator = v.union(
  v.literal("COMPLAINT_DOC"),
  v.literal("EVIDENCE_DOC"),
);

const legacyComplaintDocumentKindValidator = v.union(
  v.literal("complaint"),
  v.literal("evidence"),
);

const uploadedByTypeValidator = v.union(
  v.literal("PUBLIC"),
  v.literal("AUTHENTICATED"),
  v.literal("OPERATOR"),
  v.literal("ADMIN"),
  v.literal("SYSTEM"),
);

const messageSenderTypeValidator = v.union(
  v.literal("PUBLIC"),
  v.literal("AUTHENTICATED"),
  v.literal("OPERATOR"),
  v.literal("ADMIN"),
  v.literal("SYSTEM"),
);

const messageVisibilityValidator = v.union(
  v.literal("INTERNAL"),
  v.literal("TRACKING_VISIBLE"),
);

const escalationTriggerTypeValidator = v.union(
  v.literal("USER_REQUEST"),
  v.literal("AUTO_SLA_BREACH"),
  v.literal("SYSTEM_POLICY"),
);

const escalationEvaluationStatusValidator = v.union(
  v.literal("MISSING_POLICY"),
  v.literal("POLICY_OPERATOR_MISMATCH"),
  v.literal("POLICY_CATEGORY_MISMATCH"),
  v.literal("POLICY_NOT_ESCALATABLE"),
  v.literal("STATUS_NOT_ELIGIBLE"),
  v.literal("AUTO_ESCALATION_ALLOWED"),
  v.literal("USER_REQUEST_ALLOWED"),
  v.literal("SYSTEM_POLICY_ALLOWED"),
  v.literal("CRITERIA_NOT_MET"),
);

const regulatoryActionTypeValidator = v.union(
  v.literal("WARNING"),
  v.literal("NOTICE"),
  v.literal("AUDIT"),
  v.literal("PENALTY"),
  v.literal("LICENSE_REVIEW"),
);

const notificationChannelValidator = v.union(
  v.literal("EMAIL"),
  v.literal("SMS"),
  v.literal("IN_APP"),
  v.literal("SYSTEM"),
);

const notificationStatusValidator = v.union(
  v.literal("PENDING"),
  v.literal("SENT"),
  v.literal("FAILED"),
  v.literal("SKIPPED"),
);

export default defineSchema({
  admins: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  users: defineTable({
    clerkId: v.optional(v.string()),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    nationalIdNumber: v.optional(v.string()),
    role: userRoleValidator,
    operatorId: v.optional(v.id("operators")),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_operatorId", ["operatorId"]),

  operators: defineTable({
    name: v.string(),
    email: v.string(),
    contactPhone: v.optional(v.string()),
    licenseType: v.string(),
    licenseStatus: operatorLicenseStatusValidator,
    expiryDate: v.optional(v.number()),
    complianceScore: v.optional(v.number()),
    riskLevel: operatorRiskLevelValidator,
    regionCoverage: v.array(v.string()),
    slaPolicyConfigured: v.boolean(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_licenseStatus", ["licenseStatus"])
    .index("by_riskLevel", ["riskLevel"]),

  operatorComplaintPolicies: defineTable({
    operatorId: v.id("operators"),
    complaintCategory: complaintCategoryValidator,
    slaHours: v.number(),
    isEscalatable: v.boolean(),
    autoEscalateOnSlaBreach: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_operatorId", ["operatorId"])
    .index("by_operatorId_and_complaintCategory", [
      "operatorId",
      "complaintCategory",
    ]),

  complaints: defineTable({
    referenceNumber: v.optional(v.string()),
    trackingToken: v.optional(v.string()),
    submitterType: v.optional(submitterTypeValidator),
    submittedByUserId: v.optional(v.id("users")),
    consumerFirstName: v.optional(v.string()),
    consumerLastName: v.optional(v.string()),
    consumerEmail: v.optional(v.string()),
    consumerPhone: v.optional(v.string()),
    operatorId: v.id("operators"),
    category: complaintCategoryValidator,
    description: v.optional(v.string()),
    complaintDocument: v.optional(v.id("complaintDocuments")),
    complaintDocumentId: v.optional(v.id("complaintDocuments")),
    maxAllowedAttachmentSizeBytes: v.optional(v.number()),
    status: v.optional(complaintStatusValidator),
    hasBeenEscalated: v.optional(v.boolean()),
    submittedAt: v.optional(v.number()),
    slaDeadline: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
    escalatedAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_referenceNumber", ["referenceNumber"])
    .index("by_trackingToken", ["trackingToken"])
    .index("by_submittedByUserId", ["submittedByUserId"])
    .index("by_operatorId_and_submittedAt", ["operatorId", "submittedAt"])
    .index("by_operatorId_and_status", ["operatorId", "status"])
    .index("by_status", ["status"])
    .index("by_status_and_hasBeenEscalated", ["status", "hasBeenEscalated"])
    .index("by_category_and_status", ["category", "status"]),

  complaintDocuments: defineTable({
    complaintId: v.optional(v.id("complaints")),
    documentType: v.optional(documentTypeValidator),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    uploadedByType: v.optional(uploadedByTypeValidator),
    uploadedByUserId: v.optional(v.id("users")),
    uploadedAt: v.optional(v.number()),
    contentType: v.optional(v.string()),
    kind: v.optional(legacyComplaintDocumentKindValidator),
    size: v.optional(v.number()),
  })
    .index("by_complaintId", ["complaintId"])
    .index("by_complaintId_and_documentType", ["complaintId", "documentType"]),

  complaintMessages: defineTable({
    complaintId: v.id("complaints"),
    senderType: messageSenderTypeValidator,
    senderAdminId: v.optional(v.id("admins")),
    senderUserId: v.optional(v.id("users")),
    visibility: messageVisibilityValidator,
    message: v.string(),
    createdAt: v.number(),
  })
    .index("by_complaintId", ["complaintId"])
    .index("by_complaintId_and_visibility", ["complaintId", "visibility"]),

  escalations: defineTable({
    complaintId: v.id("complaints"),
    operatorId: v.id("operators"),
    triggerType: escalationTriggerTypeValidator,
    triggeredByAdminId: v.optional(v.id("admins")),
    triggeredByUserId: v.optional(v.id("users")),
    validationPassed: v.boolean(),
    policySnapshot: v.object({
      operatorId: v.id("operators"),
      complaintCategory: complaintCategoryValidator,
      slaHours: v.number(),
      isEscalatable: v.boolean(),
      autoEscalateOnSlaBreach: v.boolean(),
    }),
    criteriaSnapshot: v.object({
      complaintStatus: complaintStatusValidator,
      slaBreached: v.boolean(),
      userRequested: v.boolean(),
      systemPolicyTriggered: v.boolean(),
      autoEscalateEligible: v.boolean(),
      policyAllowsEscalation: v.boolean(),
      evaluationStatus: escalationEvaluationStatusValidator,
      recommendedNextStatus: v.optional(v.literal("ESCALATION_REQUESTED")),
    }),
    triggeredAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_complaintId", ["complaintId"])
    .index("by_operatorId", ["operatorId"])
    .index("by_triggerType", ["triggerType"]),

  regulatoryActions: defineTable({
    complaintId: v.optional(v.id("complaints")),
    operatorId: v.id("operators"),
    actionType: regulatoryActionTypeValidator,
    notes: v.string(),
    createdByAdminId: v.id("admins"),
    createdAt: v.number(),
  })
    .index("by_complaintId", ["complaintId"])
    .index("by_operatorId", ["operatorId"])
    .index("by_actionType", ["actionType"]),

  notificationLogs: defineTable({
    complaintId: v.optional(v.id("complaints")),
    channel: notificationChannelValidator,
    recipient: v.string(),
    subject: v.optional(v.string()),
    message: v.string(),
    status: notificationStatusValidator,
    createdAt: v.number(),
  })
    .index("by_complaintId", ["complaintId"])
    .index("by_status", ["status"])
    .index("by_channel_and_status", ["channel", "status"]),
});
