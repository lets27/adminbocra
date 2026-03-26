export const MAX_COMPLAINT_DOCUMENTS = 1;
export const MAX_EVIDENCE_DOCUMENTS = 1;
export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

export const ALLOWED_UPLOAD_CONTENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
] as const;

export const DOCUMENT_TYPES = ["COMPLAINT_DOC", "EVIDENCE_DOC"] as const;

export type ComplaintDocumentType = (typeof DOCUMENT_TYPES)[number];

export type ComplaintUploadDraft = {
  documentType: ComplaintDocumentType;
  fileName: string;
  contentType: string;
  size: number;
};

export type ComplaintFileValidationResult = {
  isValid: boolean;
  hasComplaintDocument: boolean;
  complaintDocumentCount: number;
  evidenceDocumentCount: number;
  errors: string[];
};

export function isComplaintDocumentType(
  value: string,
): value is ComplaintDocumentType {
  return DOCUMENT_TYPES.includes(value as ComplaintDocumentType);
}

export function validateComplaintFiles(
  files: ComplaintUploadDraft[],
): ComplaintFileValidationResult {
  let complaintDocumentCount = 0;
  let evidenceDocumentCount = 0;
  const errors: string[] = [];

  for (const file of files) {
    const normalizedContentType = file.contentType.toLowerCase();

    if (file.documentType === "COMPLAINT_DOC") {
      complaintDocumentCount += 1;
    } else if (file.documentType === "EVIDENCE_DOC") {
      evidenceDocumentCount += 1;
    } else {
      errors.push(`Unsupported document type: ${file.documentType}`);
    }

    if (file.fileName.trim().length === 0) {
      errors.push("Uploaded files must include a file name.");
    }

    if (file.size <= 0) {
      errors.push(`${file.fileName || "Uploaded file"} must have a size greater than zero.`);
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      errors.push(`${file.fileName} exceeds the 2 MB file size limit.`);
    }

    if (
      !ALLOWED_UPLOAD_CONTENT_TYPES.includes(
        normalizedContentType as (typeof ALLOWED_UPLOAD_CONTENT_TYPES)[number],
      )
    ) {
      errors.push(`${file.fileName} has an unsupported file type.`);
    }
  }

  if (complaintDocumentCount > MAX_COMPLAINT_DOCUMENTS) {
    errors.push("Only one complaint document may be uploaded.");
  }

  if (evidenceDocumentCount > MAX_EVIDENCE_DOCUMENTS) {
    errors.push("Only one evidence document may be uploaded.");
  }

  return {
    isValid: errors.length === 0,
    hasComplaintDocument: complaintDocumentCount > 0,
    complaintDocumentCount,
    evidenceDocumentCount,
    errors,
  };
}

export function assertValidComplaintFiles(files: ComplaintUploadDraft[]): void {
  const result = validateComplaintFiles(files);
  if (!result.isValid) {
    throw new Error(result.errors.join(" "));
  }
}
