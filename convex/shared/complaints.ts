import type { Doc, Id } from "../_generated/dataModel";
import {
  type ComplaintUploadDraft,
  validateComplaintFiles,
} from "./uploads";
import {
  generateReferenceNumber as generateBaseReferenceNumber,
  generateTrackingToken,
} from "./utils";

export const COMPLAINT_CATEGORIES = [
  "NETWORK_OUTAGE",
  "BILLING_DISPUTE",
  "POOR_CALL_QUALITY",
  "SERVICE_ACTIVATION_DELAY",
] as const;

export const COMPLAINT_STATUSES = [
  "SUBMITTED_TO_OPERATOR",
  "IN_PROGRESS",
  "RESOLVED",
  "ESCALATION_REQUESTED",
  "ESCALATED_TO_BOCRA",
  "UNDER_INVESTIGATION",
  "CLOSED",
] as const;

export const COMPLAINT_SUBMITTER_TYPES = [
  "PUBLIC",
  "AUTHENTICATED",
] as const;

export const ACTIVE_ADMIN_ESCALATION_STATUSES = [
  "ESCALATION_REQUESTED",
  "ESCALATED_TO_BOCRA",
  "UNDER_INVESTIGATION",
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];
export type ComplaintSubmitterType = (typeof COMPLAINT_SUBMITTER_TYPES)[number];

export type ComplaintSubmissionDraft = {
  submitterType: ComplaintSubmitterType;
  submittedByUserId?: Id<"users"> | null;
  files: ComplaintUploadDraft[];
};

export type ComplaintSubmissionValidationResult = {
  isValid: boolean;
  errors: string[];
  hasComplaintDocument: boolean;
  complaintDocumentCount: number;
  evidenceDocumentCount: number;
};

export type ComplaintTransitionValidationResult = {
  isValid: boolean;
  allowedNextStatuses: ComplaintStatus[];
  message: string | null;
};

export function getComplaintStatus(
  complaint: Doc<"complaints">,
): ComplaintStatus {
  return complaint.status ?? "SUBMITTED_TO_OPERATOR";
}

export function getComplaintHasBeenEscalated(
  complaint: Doc<"complaints">,
): boolean {
  return complaint.hasBeenEscalated ?? false;
}

export function getComplaintSubmittedAt(
  complaint: Doc<"complaints">,
): number {
  return complaint.submittedAt ?? complaint.createdAt ?? complaint._creationTime;
}

export function getComplaintReferenceNumber(
  complaint: Doc<"complaints">,
): string {
  return complaint.referenceNumber ?? `LEGACY-${complaint._id}`;
}

export function getComplaintTrackingToken(
  complaint: Doc<"complaints">,
): string | null {
  return complaint.trackingToken ?? null;
}

export function isComplaintStatus(value: string): value is ComplaintStatus {
  return COMPLAINT_STATUSES.includes(value as ComplaintStatus);
}

export function isComplaintSubmitterType(
  value: string,
): value is ComplaintSubmitterType {
  return COMPLAINT_SUBMITTER_TYPES.includes(value as ComplaintSubmitterType);
}

export const ALLOWED_COMPLAINT_TRANSITIONS: Record<
  ComplaintStatus,
  ComplaintStatus[]
> = {
  SUBMITTED_TO_OPERATOR: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED", "ESCALATION_REQUESTED"],
  RESOLVED: ["CLOSED"],
  ESCALATION_REQUESTED: ["ESCALATED_TO_BOCRA"],
  ESCALATED_TO_BOCRA: ["UNDER_INVESTIGATION"],
  UNDER_INVESTIGATION: ["CLOSED"],
  CLOSED: [],
};

export function canTransitionComplaint(
  currentStatus: ComplaintStatus,
  nextStatus: ComplaintStatus,
): boolean {
  return ALLOWED_COMPLAINT_TRANSITIONS[currentStatus].includes(nextStatus);
}

export function validateComplaintTransition(
  currentStatus: ComplaintStatus,
  nextStatus: ComplaintStatus,
): ComplaintTransitionValidationResult {
  const allowedNextStatuses = ALLOWED_COMPLAINT_TRANSITIONS[currentStatus];
  const isValid = allowedNextStatuses.includes(nextStatus);

  return {
    isValid,
    allowedNextStatuses,
    message: isValid
      ? null
      : `Invalid complaint status transition from ${currentStatus} to ${nextStatus}.`,
  };
}

export function assertValidComplaintTransition(
  currentStatus: ComplaintStatus,
  nextStatus: ComplaintStatus,
): void {
  const result = validateComplaintTransition(currentStatus, nextStatus);

  if (!result.isValid) {
    throw new Error(result.message ?? "Invalid complaint status transition.");
  }
}

export function isAdminDefaultQueueCandidate(
  status: ComplaintStatus,
  hasBeenEscalated: boolean,
): boolean {
  if (
    ACTIVE_ADMIN_ESCALATION_STATUSES.includes(
      status as (typeof ACTIVE_ADMIN_ESCALATION_STATUSES)[number],
    )
  ) {
    return true;
  }

  return status === "CLOSED" && hasBeenEscalated;
}

export function generateReferenceNumber(date = new Date()): string {
  return generateBaseReferenceNumber("BOCRA-CMP", date);
}

export function generateComplaintTrackingToken(): string {
  return generateTrackingToken("BOCRA");
}

export function generateComplaintIdentifiers(date = new Date()): {
  referenceNumber: string;
  trackingToken: string;
} {
  return {
    referenceNumber: generateReferenceNumber(date),
    trackingToken: generateComplaintTrackingToken(),
  };
}

export function validateComplaintSubmission(
  input: ComplaintSubmissionDraft,
): ComplaintSubmissionValidationResult {
  const fileValidation = validateComplaintFiles(input.files);
  const errors = [...fileValidation.errors];

  if (!fileValidation.hasComplaintDocument) {
    errors.push("A complaint document is required.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    hasComplaintDocument: fileValidation.hasComplaintDocument,
    complaintDocumentCount: fileValidation.complaintDocumentCount,
    evidenceDocumentCount: fileValidation.evidenceDocumentCount,
  };
}

export function assertValidComplaintSubmission(
  input: ComplaintSubmissionDraft,
): void {
  const result = validateComplaintSubmission(input);

  if (!result.isValid) {
    throw new Error(result.errors.join(" "));
  }
}
