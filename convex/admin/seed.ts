import type { Doc, Id } from "../_generated/dataModel";
import { internalMutation, mutation, type MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { COMPLAINT_STATUSES } from "../shared/complaints";
import {
  buildSeedComplaintDrafts,
  FULL_DEMO_COMPLAINT_COUNT,
  FULL_DEMO_ESCALATED_COUNT,
  getAllSeedUserEmails,
  getOperatorPrimaryUserEmail,
  SEED_ADMIN_CLERK_ID,
  SEED_ADMIN_EMAIL,
  SEED_ADMIN_NAME,
  SEED_OPERATOR_CONFIGS,
  SEED_OPERATOR_USERS,
  SEED_CONSUMER_USERS,
  SEED_REFERENCE_PREFIX,
  type SeedOperatorConfig,
  type SeedOperatorKey,
} from "./seedFixtures";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

const storedFileValidator = v.object({
  storageKey: v.string(),
  storageId: v.id("_storage"),
  fileName: v.string(),
  contentType: v.string(),
  size: v.number(),
});

type StoredSeedFile = {
  storageKey: string;
  storageId: Id<"_storage">;
  fileName: string;
  contentType: string;
  size: number;
};

type SeedPolicyRecord = {
  complaintCategory: Doc<"operatorComplaintPolicies">["complaintCategory"];
  slaHours: number;
  isEscalatable: boolean;
  autoEscalateOnSlaBreach: boolean;
};

type SeededOperatorRecord = {
  operatorId: Id<"operators">;
  key: SeedOperatorKey;
  name: string;
  email: string;
  policies: SeedPolicyRecord[];
};

type SeedAdminRecord = {
  adminId: Id<"admins">;
  email: string;
};

function buildPolicyRecord(
  policy: SeedOperatorConfig["policies"][number],
): SeedPolicyRecord {
  return {
    complaintCategory: policy.complaintCategory,
    slaHours: policy.slaHours,
    isEscalatable: policy.isEscalatable,
    autoEscalateOnSlaBreach: policy.autoEscalateOnSlaBreach,
  };
}

async function upsertSeedOperatorsAndPolicies(
  ctx: MutationCtx,
): Promise<Record<SeedOperatorKey, SeededOperatorRecord>> {
  const now = Date.now();
  const operatorRecords = {} as Record<SeedOperatorKey, SeededOperatorRecord>;
  const existingOperators = await ctx.db.query("operators").take(100);

  async function cleanupDuplicateOperator(
    operatorId: Id<"operators">,
  ): Promise<void> {
    const [linkedComplaints, linkedUsers] = await Promise.all([
      ctx.db
        .query("complaints")
        .withIndex("by_operatorId_and_submittedAt", (q) => q.eq("operatorId", operatorId))
        .take(1),
      ctx.db.query("users").withIndex("by_operatorId", (q) => q.eq("operatorId", operatorId)).take(1),
    ]);

    if (linkedComplaints.length === 0 && linkedUsers.length === 0) {
      const policies = await ctx.db
        .query("operatorComplaintPolicies")
        .withIndex("by_operatorId", (q) => q.eq("operatorId", operatorId))
        .take(20);

      for (const policy of policies) {
        await ctx.db.delete(policy._id);
      }

      await ctx.db.delete(operatorId);
      return;
    }

    await ctx.db.patch(operatorId, {
      isActive: false,
      updatedAt: now,
    });
  }

  for (const operatorInput of SEED_OPERATOR_CONFIGS) {
    const matchingOperators = existingOperators.filter(
      (operator) =>
        operator.email === operatorInput.email || operator.name === operatorInput.name,
    );
    const existingOperator =
      matchingOperators.find((operator) => operator.email === operatorInput.email) ??
      matchingOperators[0];

    let operatorId: Id<"operators">;

    if (existingOperator) {
      operatorId = existingOperator._id;
      await ctx.db.patch(operatorId, {
        name: operatorInput.name,
        email: operatorInput.email,
        contactPhone: operatorInput.contactPhone,
        licenseType: operatorInput.licenseType,
        licenseStatus: operatorInput.licenseStatus,
        expiryDate: operatorInput.expiryDate,
        complianceScore: operatorInput.complianceScore,
        riskLevel: operatorInput.riskLevel,
        regionCoverage: operatorInput.regionCoverage,
        slaPolicyConfigured: true,
        isActive: true,
        updatedAt: now,
      });
    } else {
      operatorId = await ctx.db.insert("operators", {
        name: operatorInput.name,
        email: operatorInput.email,
        contactPhone: operatorInput.contactPhone,
        licenseType: operatorInput.licenseType,
        licenseStatus: operatorInput.licenseStatus,
        expiryDate: operatorInput.expiryDate,
        complianceScore: operatorInput.complianceScore,
        riskLevel: operatorInput.riskLevel,
        regionCoverage: operatorInput.regionCoverage,
        slaPolicyConfigured: true,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    for (const policy of operatorInput.policies) {
      const existingPolicy = await ctx.db
        .query("operatorComplaintPolicies")
        .withIndex("by_operatorId_and_complaintCategory", (q) =>
          q
            .eq("operatorId", operatorId)
            .eq("complaintCategory", policy.complaintCategory),
        )
        .unique();

      if (existingPolicy) {
        await ctx.db.patch(existingPolicy._id, {
          slaHours: policy.slaHours,
          isEscalatable: policy.isEscalatable,
          autoEscalateOnSlaBreach: policy.autoEscalateOnSlaBreach,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("operatorComplaintPolicies", {
          operatorId,
          complaintCategory: policy.complaintCategory,
          slaHours: policy.slaHours,
          isEscalatable: policy.isEscalatable,
          autoEscalateOnSlaBreach: policy.autoEscalateOnSlaBreach,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    operatorRecords[operatorInput.key] = {
      operatorId,
      key: operatorInput.key,
      name: operatorInput.name,
      email: operatorInput.email,
      policies: operatorInput.policies.map(buildPolicyRecord),
    };

    for (const duplicateOperator of matchingOperators) {
      if (duplicateOperator._id === operatorId) {
        continue;
      }

      await cleanupDuplicateOperator(duplicateOperator._id);
    }
  }

  return operatorRecords;
}

function getOperatorPolicy(
  operator: SeededOperatorRecord,
  category: Doc<"complaints">["category"],
): SeedPolicyRecord {
  const policy = operator.policies.find(
    (candidate) => candidate.complaintCategory === category,
  );

  if (!policy) {
    throw new Error(`Missing complaint policy for ${operator.name} and ${category}.`);
  }

  return policy;
}

async function upsertSeedAdmin(ctx: MutationCtx): Promise<SeedAdminRecord> {
  const now = Date.now();
  const existingAdmin =
    (await ctx.db
      .query("admins")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", SEED_ADMIN_CLERK_ID))
      .unique()) ??
    (await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", SEED_ADMIN_EMAIL))
      .unique());

  let adminId: Id<"admins">;

  if (existingAdmin) {
    adminId = existingAdmin._id;
    await ctx.db.patch(adminId, {
      clerkId: SEED_ADMIN_CLERK_ID,
      email: SEED_ADMIN_EMAIL,
      name: SEED_ADMIN_NAME,
      isActive: true,
      updatedAt: now,
    });
  } else {
    adminId = await ctx.db.insert("admins", {
      clerkId: SEED_ADMIN_CLERK_ID,
      email: SEED_ADMIN_EMAIL,
      name: SEED_ADMIN_NAME,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  return {
    adminId,
    email: SEED_ADMIN_EMAIL,
  };
}

async function upsertSeedUsers(
  ctx: MutationCtx,
  operatorsByKey: Record<SeedOperatorKey, SeededOperatorRecord>,
): Promise<Map<string, Id<"users">>> {
  const now = Date.now();
  const userIdByEmail = new Map<string, Id<"users">>();

  for (const userInput of [...SEED_OPERATOR_USERS, ...SEED_CONSUMER_USERS]) {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userInput.email))
      .unique();

    const operatorId =
      userInput.operatorKey !== undefined
        ? operatorsByKey[userInput.operatorKey].operatorId
        : undefined;

    let userId: Id<"users">;

    if (existingUser) {
      userId = existingUser._id;
      await ctx.db.patch(userId, {
        email: userInput.email,
        name: userInput.name,
        address: userInput.address,
        nationalIdNumber: userInput.nationalIdNumber,
        role: userInput.role,
        ...(operatorId ? { operatorId } : {}),
        isActive: true,
        updatedAt: now,
      });
    } else {
      userId = await ctx.db.insert("users", {
        email: userInput.email,
        name: userInput.name,
        address: userInput.address,
        nationalIdNumber: userInput.nationalIdNumber,
        role: userInput.role,
        ...(operatorId ? { operatorId } : {}),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    userIdByEmail.set(userInput.email, userId);
  }

  return userIdByEmail;
}

function isSeedComplaint(complaint: Doc<"complaints">): boolean {
  return complaint.referenceNumber?.startsWith(SEED_REFERENCE_PREFIX) ?? false;
}

async function listSeedComplaints(ctx: MutationCtx): Promise<Doc<"complaints">[]> {
  const complaintsById = new Map<Id<"complaints">, Doc<"complaints">>();

  for (const status of COMPLAINT_STATUSES) {
    const complaints = await ctx.db
      .query("complaints")
      .withIndex("by_status", (q) => q.eq("status", status))
      .take(250);

    for (const complaint of complaints) {
      if (isSeedComplaint(complaint)) {
        complaintsById.set(complaint._id, complaint);
      }
    }
  }

  return [...complaintsById.values()];
}

async function deleteSeedData(ctx: MutationCtx): Promise<{
  deletedComplaints: number;
  deletedComplaintDocuments: number;
  deletedMessages: number;
  deletedEscalations: number;
  deletedRegulatoryActions: number;
  deletedNotificationLogs: number;
  deletedUsers: number;
}> {
  const complaints = await listSeedComplaints(ctx);

  let deletedComplaintDocuments = 0;
  let deletedMessages = 0;
  let deletedEscalations = 0;
  let deletedRegulatoryActions = 0;
  let deletedNotificationLogs = 0;

  for (const complaint of complaints) {
    const complaintDocuments = await ctx.db
      .query("complaintDocuments")
      .withIndex("by_complaintId", (q) => q.eq("complaintId", complaint._id))
      .take(20);

    for (const document of complaintDocuments) {
      await ctx.storage.delete(document.storageId);
      await ctx.db.delete(document._id);
      deletedComplaintDocuments += 1;
    }

    const messages = await ctx.db
      .query("complaintMessages")
      .withIndex("by_complaintId", (q) => q.eq("complaintId", complaint._id))
      .take(100);

    for (const message of messages) {
      await ctx.db.delete(message._id);
      deletedMessages += 1;
    }

    const escalations = await ctx.db
      .query("escalations")
      .withIndex("by_complaintId", (q) => q.eq("complaintId", complaint._id))
      .take(20);

    for (const escalation of escalations) {
      await ctx.db.delete(escalation._id);
      deletedEscalations += 1;
    }

    const regulatoryActions = await ctx.db
      .query("regulatoryActions")
      .withIndex("by_complaintId", (q) => q.eq("complaintId", complaint._id))
      .take(20);

    for (const action of regulatoryActions) {
      await ctx.db.delete(action._id);
      deletedRegulatoryActions += 1;
    }

    const notificationLogs = await ctx.db
      .query("notificationLogs")
      .withIndex("by_complaintId", (q) => q.eq("complaintId", complaint._id))
      .take(20);

    for (const notification of notificationLogs) {
      await ctx.db.delete(notification._id);
      deletedNotificationLogs += 1;
    }

    await ctx.db.delete(complaint._id);
  }

  let deletedUsers = 0;
  for (const email of getAllSeedUserEmails()) {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existingUser) {
      await ctx.db.delete(existingUser._id);
      deletedUsers += 1;
    }
  }

  return {
    deletedComplaints: complaints.length,
    deletedComplaintDocuments,
    deletedMessages,
    deletedEscalations,
    deletedRegulatoryActions,
    deletedNotificationLogs,
    deletedUsers,
  };
}

function requireStoredFile(
  storedFileByKey: Map<string, StoredSeedFile>,
  storageKey: string,
): StoredSeedFile {
  const storedFile = storedFileByKey.get(storageKey);

  if (!storedFile) {
    throw new Error(`Missing stored seed file for key ${storageKey}.`);
  }

  return storedFile;
}

export const seedOperatorsAndPolicies = mutation({
  args: {
    confirm: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (!args.confirm) {
      return {
        ok: false,
        reason: "CONFIRMATION_REQUIRED" as const,
        message:
          "Pass { confirm: true } to seed the Botswana operators and complaint policies.",
      };
    }

    const operatorsByKey = await upsertSeedOperatorsAndPolicies(ctx);

    return {
      ok: true,
      seededAt: Date.now(),
      operators: Object.values(operatorsByKey).map((operator) => ({
        operatorId: operator.operatorId,
        name: operator.name,
        email: operator.email,
        policyCount: operator.policies.length,
      })),
    };
  },
});

export const replaceFullDemoDataset = internalMutation({
  args: {
    confirm: v.boolean(),
    seededAt: v.number(),
    storedFiles: v.array(storedFileValidator),
  },
  handler: async (ctx, args) => {
    if (!args.confirm) {
      return {
        ok: false,
        reason: "CONFIRMATION_REQUIRED" as const,
        message: "Pass { confirm: true } to replace the full BOCRA demo dataset.",
      };
    }

    const storedFileByKey = new Map<string, StoredSeedFile>();
    for (const storedFile of args.storedFiles) {
      storedFileByKey.set(storedFile.storageKey, storedFile);
    }

    const complaintDrafts = buildSeedComplaintDrafts(args.seededAt);
    if (complaintDrafts.length !== FULL_DEMO_COMPLAINT_COUNT) {
      throw new Error("Seed complaint generator returned an unexpected complaint count.");
    }

    for (const complaint of complaintDrafts) {
      requireStoredFile(storedFileByKey, complaint.complaintDocument.storageKey);
      if (complaint.evidenceDocument) {
        requireStoredFile(storedFileByKey, complaint.evidenceDocument.storageKey);
      }
    }

    const cleanup = await deleteSeedData(ctx);
    const operatorsByKey = await upsertSeedOperatorsAndPolicies(ctx);
    const seedAdmin = await upsertSeedAdmin(ctx);
    const userIdByEmail = await upsertSeedUsers(ctx, operatorsByKey);

    let complaintCount = 0;
    let complaintDocumentCount = 0;
    let complaintMessageCount = 0;
    let escalationCount = 0;
    let regulatoryActionCount = 0;
    let notificationLogCount = 0;

    for (const complaint of complaintDrafts) {
      const operator = operatorsByKey[complaint.operatorKey];
      const policy = getOperatorPolicy(operator, complaint.category);
      const submittedByUserId =
        complaint.submittedByUserEmail !== null
          ? userIdByEmail.get(complaint.submittedByUserEmail)
          : undefined;
      const primaryOperatorUserId = userIdByEmail.get(
        getOperatorPrimaryUserEmail(complaint.operatorKey),
      );

      const complaintId = await ctx.db.insert("complaints", {
        referenceNumber: complaint.referenceNumber,
        trackingToken: complaint.trackingToken,
        submitterType: complaint.submitterType,
        ...(submittedByUserId ? { submittedByUserId } : {}),
        consumerFirstName: complaint.consumerFirstName,
        consumerLastName: complaint.consumerLastName,
        consumerEmail: complaint.consumerEmail,
        consumerPhone: complaint.consumerPhone,
        description: complaint.description,
        operatorId: operator.operatorId,
        category: complaint.category,
        status: complaint.status,
        hasBeenEscalated: complaint.hasBeenEscalated,
        submittedAt: complaint.submittedAt,
        slaDeadline: complaint.submittedAt + policy.slaHours * 60 * 60 * 1000,
        ...(complaint.resolvedAt ? { resolvedAt: complaint.resolvedAt } : {}),
        ...(complaint.escalatedAt ? { escalatedAt: complaint.escalatedAt } : {}),
        ...(complaint.closedAt ? { closedAt: complaint.closedAt } : {}),
        maxAllowedAttachmentSizeBytes: MAX_FILE_SIZE_BYTES,
        createdAt: complaint.createdAt,
        updatedAt: complaint.updatedAt,
      });
      complaintCount += 1;

      const uploadedByType =
        complaint.submitterType === "AUTHENTICATED" ? "AUTHENTICATED" : "PUBLIC";
      const complaintFile = requireStoredFile(
        storedFileByKey,
        complaint.complaintDocument.storageKey,
      );
      const complaintDocumentId = await ctx.db.insert("complaintDocuments", {
        complaintId,
        documentType: "COMPLAINT_DOC",
        storageId: complaintFile.storageId,
        fileName: complaintFile.fileName,
        fileType: complaintFile.contentType,
        fileSize: complaintFile.size,
        uploadedByType,
        ...(submittedByUserId ? { uploadedByUserId: submittedByUserId } : {}),
        uploadedAt: complaint.submittedAt,
        contentType: complaintFile.contentType,
        kind: "complaint",
        size: complaintFile.size,
      });
      complaintDocumentCount += 1;

      await ctx.db.patch(complaintId, {
        complaintDocument: complaintDocumentId,
        complaintDocumentId,
      });

      if (complaint.evidenceDocument) {
        const evidenceFile = requireStoredFile(
          storedFileByKey,
          complaint.evidenceDocument.storageKey,
        );

        await ctx.db.insert("complaintDocuments", {
          complaintId,
          documentType: "EVIDENCE_DOC",
          storageId: evidenceFile.storageId,
          fileName: evidenceFile.fileName,
          fileType: evidenceFile.contentType,
          fileSize: evidenceFile.size,
          uploadedByType,
          ...(submittedByUserId ? { uploadedByUserId: submittedByUserId } : {}),
          uploadedAt: complaint.submittedAt + 5 * 60 * 1000,
          contentType: evidenceFile.contentType,
          kind: "evidence",
          size: evidenceFile.size,
        });
        complaintDocumentCount += 1;
      }

      for (const message of complaint.messages) {
        await ctx.db.insert("complaintMessages", {
          complaintId,
          senderType: message.senderType,
          ...(message.senderKey === "admin"
            ? { senderAdminId: seedAdmin.adminId }
            : {}),
          ...(message.senderKey === "submitter" && submittedByUserId
            ? { senderUserId: submittedByUserId }
            : {}),
          ...(message.senderKey === "primaryOperator" && primaryOperatorUserId
            ? { senderUserId: primaryOperatorUserId }
            : {}),
          visibility: message.visibility,
          message: message.body,
          createdAt: message.createdAt,
        });
        complaintMessageCount += 1;
      }

      if (complaint.escalation) {
        await ctx.db.insert("escalations", {
          complaintId,
          operatorId: operator.operatorId,
          triggerType: complaint.escalation.triggerType,
          ...(complaint.escalation.triggeredByRole === "admin"
            ? { triggeredByAdminId: seedAdmin.adminId }
            : {}),
          ...(complaint.escalation.triggeredByRole === "submitter" && submittedByUserId
            ? { triggeredByUserId: submittedByUserId }
            : {}),
          validationPassed: true,
          policySnapshot: {
            operatorId: operator.operatorId,
            complaintCategory: complaint.category,
            slaHours: policy.slaHours,
            isEscalatable: policy.isEscalatable,
            autoEscalateOnSlaBreach: policy.autoEscalateOnSlaBreach,
          },
          criteriaSnapshot: {
            complaintStatus: "IN_PROGRESS",
            slaBreached: complaint.escalation.slaBreached,
            userRequested: complaint.escalation.userRequested,
            systemPolicyTriggered: complaint.escalation.systemPolicyTriggered,
            autoEscalateEligible: policy.autoEscalateOnSlaBreach,
            policyAllowsEscalation: policy.isEscalatable,
            evaluationStatus: complaint.escalation.evaluationStatus,
            recommendedNextStatus: "ESCALATION_REQUESTED",
          },
          triggeredAt: complaint.escalation.triggeredAt,
          createdAt: complaint.escalation.triggeredAt,
        });
        escalationCount += 1;
      }

      for (const action of complaint.regulatoryActions) {
        await ctx.db.insert("regulatoryActions", {
          complaintId,
          operatorId: operator.operatorId,
          actionType: action.actionType,
          notes: action.notes,
          createdByAdminId: seedAdmin.adminId,
          createdAt: action.createdAt,
        });
        regulatoryActionCount += 1;
      }

      for (const notification of complaint.notifications) {
        const recipient =
          notification.recipientRole === "consumer"
            ? complaint.consumerEmail
            : notification.recipientRole === "operator"
              ? operator.email
              : seedAdmin.email;

        await ctx.db.insert("notificationLogs", {
          complaintId,
          channel: notification.channel,
          recipient,
          ...(notification.subject ? { subject: notification.subject } : {}),
          message: notification.message,
          status: notification.status,
          createdAt: notification.createdAt,
        });
        notificationLogCount += 1;
      }
    }

    return {
      ok: true,
      seededAt: args.seededAt,
      cleanup,
      operatorsSeeded: SEED_OPERATOR_CONFIGS.length,
      operatorUsersSeeded: SEED_OPERATOR_USERS.length,
      consumerUsersSeeded: SEED_CONSUMER_USERS.length,
      complaintsSeeded: complaintCount,
      escalatedComplaintsSeeded: escalationCount,
      complaintDocumentsSeeded: complaintDocumentCount,
      complaintMessagesSeeded: complaintMessageCount,
      regulatoryActionsSeeded: regulatoryActionCount,
      notificationLogsSeeded: notificationLogCount,
      expectedComplaintCount: FULL_DEMO_COMPLAINT_COUNT,
      expectedEscalationCount: FULL_DEMO_ESCALATED_COUNT,
    };
  },
});
