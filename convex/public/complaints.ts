import type { Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import {
  assertValidComplaintSubmission,
  generateComplaintIdentifiers,
} from "../shared/complaints";
import { getAuthenticatedComplaintSubmitterContext } from "../shared/auth";
import {
  MAX_FILE_SIZE_BYTES,
  type ComplaintUploadDraft,
  type ComplaintDocumentType,
} from "../shared/uploads";
import { normalizeOptionalText } from "../shared/utils";

const complaintCategoryValidator = v.union(
  v.literal("NETWORK_OUTAGE"),
  v.literal("BILLING_DISPUTE"),
  v.literal("POOR_CALL_QUALITY"),
  v.literal("SERVICE_ACTIVATION_DELAY"),
);

const uploadDescriptorValidator = v.object({
  storageId: v.id("_storage"),
  fileName: v.string(),
});

type UploadDescriptor = {
  storageId: Id<"_storage">;
  fileName: string;
};

function toUploadDraft(
  documentType: ComplaintDocumentType,
  descriptor: UploadDescriptor,
  storageMetadata: {
    contentType?: string;
    size: number;
  } | null,
): ComplaintUploadDraft {
  return {
    documentType,
    fileName: descriptor.fileName,
    contentType: storageMetadata?.contentType ?? "",
    size: storageMetadata?.size ?? 0,
  };
}

export const listComplaintOperators = query({
  args: {},
  handler: async (ctx) => {
    const operators = await ctx.db
      .query("operators")
      .withIndex("by_licenseStatus", (q) => q.eq("licenseStatus", "ACTIVE"))
      .take(50);

    return operators
      .filter((operator) => operator.isActive)
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((operator) => ({
        operatorId: operator._id,
        name: operator.name,
        licenseStatus: operator.licenseStatus,
        riskLevel: operator.riskLevel,
        regionCoverage: operator.regionCoverage,
      }));
  },
});

export const generateComplaintUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const createComplaint = mutation({
  args: {
    consumerFirstName: v.optional(v.string()),
    consumerLastName: v.optional(v.string()),
    consumerEmail: v.optional(v.string()),
    consumerPhone: v.optional(v.string()),
    description: v.optional(v.string()),
    operatorId: v.id("operators"),
    category: complaintCategoryValidator,
    complaintDocument: uploadDescriptorValidator,
    evidenceDocument: v.optional(uploadDescriptorValidator),
  },
  handler: async (ctx, args) => {
    const submitterContext = await getAuthenticatedComplaintSubmitterContext(ctx);
    const consumerFirstName = normalizeOptionalText(args.consumerFirstName);
    const consumerLastName = normalizeOptionalText(args.consumerLastName);
    const consumerEmail = normalizeOptionalText(args.consumerEmail);
    const consumerPhone = normalizeOptionalText(args.consumerPhone);
    const description = normalizeOptionalText(args.description);

    const operator = await ctx.db.get(args.operatorId);
    if (!operator || !operator.isActive) {
      throw new Error("Selected operator is unavailable.");
    }

    const [complaintDocMetadata, evidenceDocMetadata] = await Promise.all([
      ctx.db.system.get("_storage", args.complaintDocument.storageId),
      args.evidenceDocument
        ? ctx.db.system.get("_storage", args.evidenceDocument.storageId)
        : Promise.resolve(null),
    ]);

    const fileDrafts: ComplaintUploadDraft[] = [
      toUploadDraft("COMPLAINT_DOC", args.complaintDocument, complaintDocMetadata),
    ];

    if (args.evidenceDocument) {
      fileDrafts.push(
        toUploadDraft("EVIDENCE_DOC", args.evidenceDocument, evidenceDocMetadata),
      );
    }

    assertValidComplaintSubmission({
      submitterType: submitterContext.submitterType,
      submittedByUserId: submitterContext.submittedByUserId ?? null,
      files: fileDrafts,
    });

    const policy = await ctx.db
      .query("operatorComplaintPolicies")
      .withIndex("by_operatorId_and_complaintCategory", (q) =>
        q.eq("operatorId", args.operatorId).eq("complaintCategory", args.category),
      )
      .unique();

    if (!policy) {
      throw new Error("Selected operator does not have a complaint policy for this category.");
    }

    const now = Date.now();
    const { referenceNumber, trackingToken } = generateComplaintIdentifiers(new Date(now));
    const slaDeadline = now + policy.slaHours * 60 * 60 * 1000;

    const complaintId = await ctx.db.insert("complaints", {
      referenceNumber,
      trackingToken,
      submitterType: submitterContext.submitterType,
      ...(submitterContext.submittedByUserId
        ? { submittedByUserId: submitterContext.submittedByUserId }
        : {}),
      ...(consumerFirstName ? { consumerFirstName } : {}),
      ...(consumerLastName ? { consumerLastName } : {}),
      ...(consumerEmail ? { consumerEmail } : {}),
      ...(consumerPhone ? { consumerPhone } : {}),
      ...(description ? { description } : {}),
      operatorId: args.operatorId,
      category: args.category,
      status: "SUBMITTED_TO_OPERATOR",
      hasBeenEscalated: false,
      submittedAt: now,
      slaDeadline,
      maxAllowedAttachmentSizeBytes: MAX_FILE_SIZE_BYTES,
      createdAt: now,
      updatedAt: now,
    });

    const uploadedByType =
      submitterContext.submitterType === "AUTHENTICATED" ? "AUTHENTICATED" : "PUBLIC";

    const complaintDocumentId = await ctx.db.insert("complaintDocuments", {
      complaintId,
      documentType: "COMPLAINT_DOC",
      storageId: args.complaintDocument.storageId,
      fileName: args.complaintDocument.fileName.trim(),
      fileType: complaintDocMetadata?.contentType ?? "application/octet-stream",
      fileSize: complaintDocMetadata?.size ?? 0,
      contentType: complaintDocMetadata?.contentType ?? "application/octet-stream",
      kind: "complaint",
      size: complaintDocMetadata?.size ?? 0,
      uploadedByType,
      ...(submitterContext.submittedByUserId
        ? { uploadedByUserId: submitterContext.submittedByUserId }
        : {}),
      uploadedAt: now,
    });

    await ctx.db.patch(complaintId, {
      complaintDocument: complaintDocumentId,
      complaintDocumentId,
    });

    if (args.evidenceDocument) {
      await ctx.db.insert("complaintDocuments", {
        complaintId,
        documentType: "EVIDENCE_DOC",
        storageId: args.evidenceDocument.storageId,
        fileName: args.evidenceDocument.fileName.trim(),
        fileType: evidenceDocMetadata?.contentType ?? "application/octet-stream",
        fileSize: evidenceDocMetadata?.size ?? 0,
        contentType: evidenceDocMetadata?.contentType ?? "application/octet-stream",
        kind: "evidence",
        size: evidenceDocMetadata?.size ?? 0,
        uploadedByType,
        ...(submitterContext.submittedByUserId
          ? { uploadedByUserId: submitterContext.submittedByUserId }
          : {}),
        uploadedAt: now,
      });
    }

    return {
      complaintId,
      referenceNumber,
      trackingToken,
      operatorId: args.operatorId,
      operatorName: operator.name,
      category: args.category,
      policy: {
        complaintCategory: policy.complaintCategory,
        slaHours: policy.slaHours,
        isEscalatable: policy.isEscalatable,
        autoEscalateOnSlaBreach: policy.autoEscalateOnSlaBreach,
      },
    };
  },
});
