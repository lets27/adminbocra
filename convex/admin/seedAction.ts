"use node";

import { Buffer } from "node:buffer";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { action } from "../_generated/server";
import { buildSeedComplaintDrafts, FULL_DEMO_COMPLAINT_COUNT } from "./seedFixtures";

type SeedActionResponse = {
  ok: boolean;
  reason?: "CONFIRMATION_REQUIRED";
  message?: string;
  seededAt?: number;
  cleanup?: {
    deletedComplaints: number;
    deletedComplaintDocuments: number;
    deletedMessages: number;
    deletedEscalations: number;
    deletedRegulatoryActions: number;
    deletedNotificationLogs: number;
    deletedUsers: number;
  };
  operatorsSeeded?: number;
  operatorUsersSeeded?: number;
  consumerUsersSeeded?: number;
  complaintsSeeded?: number;
  escalatedComplaintsSeeded?: number;
  complaintDocumentsSeeded?: number;
  complaintMessagesSeeded?: number;
  regulatoryActionsSeeded?: number;
  notificationLogsSeeded?: number;
  expectedComplaintCount?: number;
  expectedEscalationCount?: number;
  storedFileCount?: number;
};

function escapePdfText(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function buildPdfContent(lines: string[]): string {
  const commands = [
    "BT",
    "/F1 11 Tf",
    "50 760 Td",
    ...lines.flatMap((line, index) =>
      index === 0
        ? [`(${escapePdfText(line)}) Tj`]
        : ["0 -16 Td", `(${escapePdfText(line)}) Tj`],
    ),
    "ET",
  ];

  return commands.join("\n");
}

function buildSimplePdfBlob(lines: string[]): Blob {
  const pageContent = buildPdfContent(lines);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(pageContent, "utf8")} >>\nstream\n${pageContent}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

export const seedFullDemoData = action({
  args: {
    confirm: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<SeedActionResponse> => {
    if (!args.confirm) {
      return {
        ok: false,
        reason: "CONFIRMATION_REQUIRED" as const,
        message: "Pass { confirm: true } to create the full BOCRA demo seed dataset.",
      };
    }

    const seededAt = Date.now();
    const complaintDrafts = buildSeedComplaintDrafts(seededAt);

    if (complaintDrafts.length !== FULL_DEMO_COMPLAINT_COUNT) {
      throw new Error("Seed complaint generator returned an unexpected complaint count.");
    }

    const storedFiles: Array<{
      storageKey: string;
      storageId: Id<"_storage">;
      fileName: string;
      contentType: string;
      size: number;
    }> = [];
    const storedStorageIds: Id<"_storage">[] = [];

    try {
      for (const complaint of complaintDrafts) {
        for (const document of [
          complaint.complaintDocument,
          complaint.evidenceDocument,
        ]) {
          if (!document) {
            continue;
          }

          const blob = buildSimplePdfBlob(document.lines);
          const storageId = await ctx.storage.store(blob);

          storedStorageIds.push(storageId);
          storedFiles.push({
            storageKey: document.storageKey,
            storageId,
            fileName: document.fileName,
            contentType: document.contentType,
            size: blob.size,
          });
        }
      }

      const result: SeedActionResponse = await ctx.runMutation(
        internal.admin.seed.replaceFullDemoDataset,
        {
          confirm: true,
          seededAt,
          storedFiles,
        },
      );

      return {
        ...result,
        storedFileCount: storedFiles.length,
      };
    } catch (error) {
      await Promise.allSettled(
        storedStorageIds.map((storageId) => ctx.storage.delete(storageId)),
      );

      throw error;
    }
  },
});
