import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

export type NormalizedComplaintDocument = {
  _id: Id<"complaintDocuments">;
  complaintId: Id<"complaints"> | null;
  documentType: "COMPLAINT_DOC" | "EVIDENCE_DOC";
  storageId: Id<"_storage">;
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  uploadedAt: number;
  uploadedByType:
    | "PUBLIC"
    | "AUTHENTICATED"
    | "OPERATOR"
    | "ADMIN"
    | "SYSTEM"
    | null;
  uploadedByUserId: Id<"users"> | null;
  source: "relational" | "legacy";
};

export type ComplaintDocumentWithUrl = NormalizedComplaintDocument & {
  fileUrl: string | null;
};

function toLegacyDocumentType(
  kind: Doc<"complaintDocuments">["kind"],
): "COMPLAINT_DOC" | "EVIDENCE_DOC" {
  return kind === "evidence" ? "EVIDENCE_DOC" : "COMPLAINT_DOC";
}

function normalizeComplaintDocument(
  document: Doc<"complaintDocuments">,
): NormalizedComplaintDocument {
  return {
    _id: document._id,
    complaintId: document.complaintId ?? null,
    documentType:
      document.documentType ?? toLegacyDocumentType(document.kind),
    storageId: document.storageId,
    fileName: document.fileName,
    fileType: document.fileType ?? document.contentType ?? null,
    fileSize: document.fileSize ?? document.size ?? null,
    uploadedAt: document.uploadedAt ?? document._creationTime,
    uploadedByType: document.uploadedByType ?? null,
    uploadedByUserId: document.uploadedByUserId ?? null,
    source:
      document.complaintId !== undefined || document.documentType !== undefined
        ? "relational"
        : "legacy",
  };
}

function getLegacyDocumentIds(
  complaint: Doc<"complaints">,
): Id<"complaintDocuments">[] {
  const ids = new Set<Id<"complaintDocuments">>();

  if (complaint.complaintDocument !== undefined) {
    ids.add(complaint.complaintDocument);
  }

  if (complaint.complaintDocumentId !== undefined) {
    ids.add(complaint.complaintDocumentId);
  }

  return [...ids];
}

export async function listComplaintDocuments(
  ctx: QueryCtx,
  complaint: Doc<"complaints">,
): Promise<NormalizedComplaintDocument[]> {
  const [relationalDocuments, legacyDocuments] = await Promise.all([
    ctx.db
      .query("complaintDocuments")
      .withIndex("by_complaintId", (q) => q.eq("complaintId", complaint._id))
      .take(10),
    Promise.all(
      getLegacyDocumentIds(complaint).map(async (documentId) =>
        ctx.db.get(documentId),
      ),
    ),
  ]);

  const normalizedById = new Map<
    Id<"complaintDocuments">,
    NormalizedComplaintDocument
  >();

  for (const document of [...relationalDocuments, ...legacyDocuments]) {
    if (!document) {
      continue;
    }

    normalizedById.set(document._id, normalizeComplaintDocument(document));
  }

  return [...normalizedById.values()].sort(
    (left, right) => right.uploadedAt - left.uploadedAt,
  );
}

export async function listComplaintDocumentsWithUrls(
  ctx: QueryCtx,
  complaint: Doc<"complaints">,
): Promise<ComplaintDocumentWithUrl[]> {
  const documents = await listComplaintDocuments(ctx, complaint);

  return Promise.all(
    documents.map(async (document) => ({
      ...document,
      fileUrl: await ctx.storage.getUrl(document.storageId),
    })),
  );
}
