import type { ComplaintCategory, ComplaintStatus, ComplaintSubmitterType } from "../shared/complaints";
import { COMPLAINT_CATEGORIES } from "../shared/complaints";
import type { EscalationEvaluationStatus, EscalationTriggerType } from "../shared/escalation";

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export const FULL_DEMO_COMPLAINT_COUNT = 50;
export const FULL_DEMO_ESCALATED_COUNT = 20;
export const SEED_REFERENCE_PREFIX = "SEED-CMP-";
export const SEED_TRACKING_PREFIX = "SEEDTK-";
export const SEED_TAG = "[SEED:BOCRA_DEMO]";
export const SEED_ADMIN_CLERK_ID = "seed-admin::bocra-demo";
export const SEED_ADMIN_EMAIL = "seed.admin@demo.bocra.local";
export const SEED_ADMIN_NAME = "BOCRA Demo Seed Admin";

export type SeedOperatorKey = "BTC" | "MASCOM" | "ORANGE" | "NASHUA";

type SeedOperatorPolicy = {
  complaintCategory: ComplaintCategory;
  slaHours: number;
  isEscalatable: boolean;
  autoEscalateOnSlaBreach: boolean;
};

export type SeedOperatorConfig = {
  key: SeedOperatorKey;
  name: string;
  email: string;
  contactPhone: string;
  physicalAddress: string;
  city: string;
  locationLabel: string;
  latitude: number;
  longitude: number;
  licenseType: string;
  licenseStatus: "ACTIVE" | "UNDER_REVIEW" | "SUSPENDED" | "EXPIRED";
  expiryDate: number;
  complianceScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  regionCoverage: string[];
  policies: SeedOperatorPolicy[];
};

export type SeedUserConfig = {
  email: string;
  name: string;
  role: "OPERATOR" | "USER";
  operatorKey?: SeedOperatorKey;
  address: string;
  nationalIdNumber: string;
};

export type SeedStoredFileDraft = {
  storageKey: string;
  fileName: string;
  contentType: string;
  lines: string[];
};

export type SeedMessageDraft = {
  senderType: "PUBLIC" | "AUTHENTICATED" | "OPERATOR" | "ADMIN" | "SYSTEM";
  senderKey: "submitter" | "primaryOperator" | "admin" | "system";
  visibility: "INTERNAL" | "TRACKING_VISIBLE";
  body: string;
  createdAt: number;
};

export type SeedNotificationDraft = {
  channel: "EMAIL" | "SMS" | "IN_APP" | "SYSTEM";
  recipientRole: "consumer" | "operator" | "admin";
  subject?: string;
  message: string;
  status: "PENDING" | "SENT" | "FAILED" | "SKIPPED";
  createdAt: number;
};

export type SeedRegulatoryActionDraft = {
  actionType: "WARNING" | "NOTICE" | "AUDIT" | "PENALTY" | "LICENSE_REVIEW";
  notes: string;
  createdAt: number;
};

export type SeedEscalationDraft = {
  triggerType: EscalationTriggerType;
  evaluationStatus: EscalationEvaluationStatus;
  triggeredByRole: "submitter" | "admin" | "system";
  triggeredAt: number;
  slaBreached: boolean;
  userRequested: boolean;
  systemPolicyTriggered: boolean;
};

export type SeedComplaintDraft = {
  sequence: number;
  referenceNumber: string;
  trackingToken: string;
  operatorKey: SeedOperatorKey;
  category: ComplaintCategory;
  description: string;
  submitterType: ComplaintSubmitterType;
  submittedByUserEmail: string | null;
  consumerFirstName: string;
  consumerLastName: string;
  consumerEmail: string;
  consumerPhone: string;
  status: ComplaintStatus;
  hasBeenEscalated: boolean;
  submittedAt: number;
  escalatedAt: number | null;
  resolvedAt: number | null;
  closedAt: number | null;
  createdAt: number;
  updatedAt: number;
  complaintDocument: SeedStoredFileDraft;
  evidenceDocument: SeedStoredFileDraft | null;
  messages: SeedMessageDraft[];
  notifications: SeedNotificationDraft[];
  regulatoryActions: SeedRegulatoryActionDraft[];
  escalation: SeedEscalationDraft | null;
};

export const SEED_OPERATOR_CONFIGS: SeedOperatorConfig[] = [
  {
    key: "BTC",
    name: "BTC",
    email: "consumer.support@btc.bw",
    contactPhone: "+267 395 8000",
    physicalAddress: "Khama Crescent, Plot 50350, Megaleng, Gaborone, Botswana",
    city: "Gaborone",
    locationLabel: "Megaleng House, Khama Crescent",
    latitude: -24.6506,
    longitude: 25.9116,
    licenseType: "Public Telecommunications Operator (PTO)",
    licenseStatus: "ACTIVE",
    expiryDate: Date.UTC(2028, 11, 31),
    complianceScore: 86,
    riskLevel: "LOW",
    regionCoverage: ["Gaborone", "Francistown", "Maun", "Kasane"],
    policies: [
      {
        complaintCategory: "NETWORK_OUTAGE",
        slaHours: 12,
        isEscalatable: true,
        autoEscalateOnSlaBreach: true,
      },
      {
        complaintCategory: "BILLING_DISPUTE",
        slaHours: 48,
        isEscalatable: true,
        autoEscalateOnSlaBreach: false,
      },
      {
        complaintCategory: "POOR_CALL_QUALITY",
        slaHours: 24,
        isEscalatable: true,
        autoEscalateOnSlaBreach: true,
      },
      {
        complaintCategory: "SERVICE_ACTIVATION_DELAY",
        slaHours: 72,
        isEscalatable: true,
        autoEscalateOnSlaBreach: false,
      },
    ],
  },
  {
    key: "MASCOM",
    name: "Mascom Botswana",
    email: "customer.care@mascom.bw",
    contactPhone: "+267 71 000 000",
    physicalAddress: "Tsholetsa House, Plot 4705/6, Botswana Road Main Mall, Gaborone, Botswana",
    city: "Gaborone",
    locationLabel: "Tsholetsa House, Main Mall",
    latitude: -24.6584,
    longitude: 25.9088,
    licenseType: "Public Telecommunications Operator (PTO)",
    licenseStatus: "ACTIVE",
    expiryDate: Date.UTC(2028, 11, 31),
    complianceScore: 82,
    riskLevel: "MEDIUM",
    regionCoverage: ["Gaborone", "Lobatse", "Serowe", "Selebi-Phikwe"],
    policies: [
      {
        complaintCategory: "NETWORK_OUTAGE",
        slaHours: 10,
        isEscalatable: true,
        autoEscalateOnSlaBreach: true,
      },
      {
        complaintCategory: "BILLING_DISPUTE",
        slaHours: 36,
        isEscalatable: true,
        autoEscalateOnSlaBreach: false,
      },
      {
        complaintCategory: "POOR_CALL_QUALITY",
        slaHours: 20,
        isEscalatable: true,
        autoEscalateOnSlaBreach: true,
      },
      {
        complaintCategory: "SERVICE_ACTIVATION_DELAY",
        slaHours: 48,
        isEscalatable: true,
        autoEscalateOnSlaBreach: false,
      },
    ],
  },
  {
    key: "ORANGE",
    name: "Orange Botswana",
    email: "customer.service@orange.co.bw",
    contactPhone: "+267 72 000 000",
    physicalAddress: "Head Office CBD, Gaborone, Botswana",
    city: "Gaborone",
    locationLabel: "Orange Head Office CBD",
    latitude: -24.6548,
    longitude: 25.9115,
    licenseType: "Public Telecommunications Operator (PTO)",
    licenseStatus: "ACTIVE",
    expiryDate: Date.UTC(2028, 11, 31),
    complianceScore: 79,
    riskLevel: "MEDIUM",
    regionCoverage: ["Gaborone", "Molepolole", "Francistown", "Maun"],
    policies: [
      {
        complaintCategory: "NETWORK_OUTAGE",
        slaHours: 12,
        isEscalatable: true,
        autoEscalateOnSlaBreach: true,
      },
      {
        complaintCategory: "BILLING_DISPUTE",
        slaHours: 48,
        isEscalatable: true,
        autoEscalateOnSlaBreach: false,
      },
      {
        complaintCategory: "POOR_CALL_QUALITY",
        slaHours: 24,
        isEscalatable: true,
        autoEscalateOnSlaBreach: true,
      },
      {
        complaintCategory: "SERVICE_ACTIVATION_DELAY",
        slaHours: 60,
        isEscalatable: true,
        autoEscalateOnSlaBreach: false,
      },
    ],
  },
  {
    key: "NASHUA",
    name: "Nashua Botswana",
    email: "info@nashua.co.bw",
    contactPhone: "+267 390 7700",
    physicalAddress: "Plot 1266, Luthuli Rd, Madirelo Ext 6, Gaborone, Botswana",
    city: "Gaborone",
    locationLabel: "Madirelo Ext 6, Luthuli Road",
    latitude: -24.6769,
    longitude: 25.8858,
    licenseType: "Services and Applications Provider (SAP)",
    licenseStatus: "ACTIVE",
    expiryDate: Date.UTC(2028, 11, 31),
    complianceScore: 77,
    riskLevel: "MEDIUM",
    regionCoverage: ["Gaborone", "Francistown", "Palapye", "Mahalapye"],
    policies: [
      {
        complaintCategory: "NETWORK_OUTAGE",
        slaHours: 8,
        isEscalatable: true,
        autoEscalateOnSlaBreach: true,
      },
      {
        complaintCategory: "BILLING_DISPUTE",
        slaHours: 24,
        isEscalatable: true,
        autoEscalateOnSlaBreach: false,
      },
      {
        complaintCategory: "POOR_CALL_QUALITY",
        slaHours: 18,
        isEscalatable: true,
        autoEscalateOnSlaBreach: true,
      },
      {
        complaintCategory: "SERVICE_ACTIVATION_DELAY",
        slaHours: 36,
        isEscalatable: true,
        autoEscalateOnSlaBreach: false,
      },
    ],
  },
];

export const SEED_OPERATOR_USERS: SeedUserConfig[] = [
  {
    email: "kagiso.molefe@ops.demo.bocra.local",
    name: "Kagiso Molefe",
    role: "OPERATOR",
    operatorKey: "BTC",
    address: "BTC House, Gaborone",
    nationalIdNumber: "SEED-OP-BTC-001",
  },
  {
    email: "naledi.ramotswe@ops.demo.bocra.local",
    name: "Naledi Ramotswe",
    role: "OPERATOR",
    operatorKey: "BTC",
    address: "BTC House, Gaborone",
    nationalIdNumber: "SEED-OP-BTC-002",
  },
  {
    email: "tapiwa.moatshe@ops.demo.bocra.local",
    name: "Tapiwa Moatshe",
    role: "OPERATOR",
    operatorKey: "MASCOM",
    address: "Mascom Campus, Gaborone",
    nationalIdNumber: "SEED-OP-MAS-001",
  },
  {
    email: "lerato.dube@ops.demo.bocra.local",
    name: "Lerato Dube",
    role: "OPERATOR",
    operatorKey: "MASCOM",
    address: "Mascom Campus, Gaborone",
    nationalIdNumber: "SEED-OP-MAS-002",
  },
  {
    email: "thato.ntimane@ops.demo.bocra.local",
    name: "Thato Ntimane",
    role: "OPERATOR",
    operatorKey: "ORANGE",
    address: "Orange Campus, Gaborone",
    nationalIdNumber: "SEED-OP-ORG-001",
  },
  {
    email: "lesego.sedimo@ops.demo.bocra.local",
    name: "Lesego Sedimo",
    role: "OPERATOR",
    operatorKey: "ORANGE",
    address: "Orange Campus, Gaborone",
    nationalIdNumber: "SEED-OP-ORG-002",
  },
  {
    email: "tshepo.modise@ops.demo.bocra.local",
    name: "Tshepo Modise",
    role: "OPERATOR",
    operatorKey: "NASHUA",
    address: "Nashua House, Gaborone",
    nationalIdNumber: "SEED-OP-NAS-001",
  },
  {
    email: "rebaone.kgafela@ops.demo.bocra.local",
    name: "Rebaone Kgafela",
    role: "OPERATOR",
    operatorKey: "NASHUA",
    address: "Nashua House, Gaborone",
    nationalIdNumber: "SEED-OP-NAS-002",
  },
];

export const SEED_CONSUMER_USERS: SeedUserConfig[] = [
  {
    email: "amogelang.sechele@users.demo.bocra.local",
    name: "Amogelang Sechele",
    role: "USER",
    address: "Broadhurst, Gaborone",
    nationalIdNumber: "SEED-USR-001",
  },
  {
    email: "boitumelo.sebego@users.demo.bocra.local",
    name: "Boitumelo Sebego",
    role: "USER",
    address: "Phase 2, Gaborone",
    nationalIdNumber: "SEED-USR-002",
  },
  {
    email: "clementina.gareth@users.demo.bocra.local",
    name: "Clementina Gareth",
    role: "USER",
    address: "Tlokweng",
    nationalIdNumber: "SEED-USR-003",
  },
  {
    email: "dineo.nthaga@users.demo.bocra.local",
    name: "Dineo Nthaga",
    role: "USER",
    address: "Mochudi",
    nationalIdNumber: "SEED-USR-004",
  },
  {
    email: "edward.molapisi@users.demo.bocra.local",
    name: "Edward Molapisi",
    role: "USER",
    address: "Francistown",
    nationalIdNumber: "SEED-USR-005",
  },
  {
    email: "gofaone.ramabu@users.demo.bocra.local",
    name: "Gofaone Ramabu",
    role: "USER",
    address: "Maun",
    nationalIdNumber: "SEED-USR-006",
  },
  {
    email: "itumeleng.moremi@users.demo.bocra.local",
    name: "Itumeleng Moremi",
    role: "USER",
    address: "Serowe",
    nationalIdNumber: "SEED-USR-007",
  },
  {
    email: "keabetswe.phanuel@users.demo.bocra.local",
    name: "Keabetswe Phanuel",
    role: "USER",
    address: "Molepolole",
    nationalIdNumber: "SEED-USR-008",
  },
  {
    email: "lerato.gaborone@users.demo.bocra.local",
    name: "Lerato Gaborone",
    role: "USER",
    address: "Lobatse",
    nationalIdNumber: "SEED-USR-009",
  },
  {
    email: "masego.moloi@users.demo.bocra.local",
    name: "Masego Moloi",
    role: "USER",
    address: "Palapye",
    nationalIdNumber: "SEED-USR-010",
  },
  {
    email: "oratile.seakgosing@users.demo.bocra.local",
    name: "Oratile Seakgosing",
    role: "USER",
    address: "Jwaneng",
    nationalIdNumber: "SEED-USR-011",
  },
  {
    email: "tumelo.rakgare@users.demo.bocra.local",
    name: "Tumelo Rakgare",
    role: "USER",
    address: "Kasane",
    nationalIdNumber: "SEED-USR-012",
  },
];

function buildReferenceNumber(sequence: number): string {
  return `${SEED_REFERENCE_PREFIX}${String(sequence).padStart(4, "0")}`;
}

function buildTrackingToken(sequence: number): string {
  return `${SEED_TRACKING_PREFIX}${String(sequence).padStart(4, "0")}`;
}

function getComplaintStatusForIndex(index: number): {
  status: ComplaintStatus;
  hasBeenEscalated: boolean;
} {
  if (index < 5) {
    return { status: "ESCALATION_REQUESTED", hasBeenEscalated: true };
  }

  if (index < 10) {
    return { status: "ESCALATED_TO_BOCRA", hasBeenEscalated: true };
  }

  if (index < 15) {
    return { status: "UNDER_INVESTIGATION", hasBeenEscalated: true };
  }

  if (index < 20) {
    return { status: "CLOSED", hasBeenEscalated: true };
  }

  if (index < 27) {
    return { status: "SUBMITTED_TO_OPERATOR", hasBeenEscalated: false };
  }

  if (index < 35) {
    return { status: "IN_PROGRESS", hasBeenEscalated: false };
  }

  if (index < 42) {
    return { status: "RESOLVED", hasBeenEscalated: false };
  }

  return { status: "CLOSED", hasBeenEscalated: false };
}

function getOperatorKeyForIndex(index: number): SeedOperatorKey {
  const bucket = index % 10;

  if (bucket <= 2) {
    return "ORANGE";
  }

  if (bucket <= 5) {
    return "MASCOM";
  }

  if (bucket <= 7) {
    return "BTC";
  }

  return "NASHUA";
}

function getCategoryForIndex(index: number): ComplaintCategory {
  return COMPLAINT_CATEGORIES[(index * 3 + 1) % COMPLAINT_CATEGORIES.length];
}

function getConsumerProfile(index: number): SeedUserConfig {
  return SEED_CONSUMER_USERS[index % SEED_CONSUMER_USERS.length];
}

function getPrimaryOperatorUser(operatorKey: SeedOperatorKey): SeedUserConfig {
  const operatorUser = SEED_OPERATOR_USERS.find(
    (candidate) => candidate.operatorKey === operatorKey,
  );

  if (!operatorUser) {
    throw new Error(`Missing operator user seed for ${operatorKey}.`);
  }

  return operatorUser;
}

export function getSeedOperatorConfig(
  operatorKey: SeedOperatorKey,
): SeedOperatorConfig {
  const operator = SEED_OPERATOR_CONFIGS.find(
    (candidate) => candidate.key === operatorKey,
  );

  if (!operator) {
    throw new Error(`Missing operator config for ${operatorKey}.`);
  }

  return operator;
}

export function getSeedOperatorPolicy(
  operatorKey: SeedOperatorKey,
  category: ComplaintCategory,
): SeedOperatorPolicy {
  const policy = getSeedOperatorConfig(operatorKey).policies.find(
    (candidate) => candidate.complaintCategory === category,
  );

  if (!policy) {
    throw new Error(`Missing ${category} policy for ${operatorKey}.`);
  }

  return policy;
}

function formatCategoryLabel(category: ComplaintCategory): string {
  return category
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildComplaintDescription(
  sequence: number,
  operatorName: string,
  category: ComplaintCategory,
  firstName: string,
): string {
  switch (category) {
    case "NETWORK_OUTAGE":
      return `${firstName} reported repeated loss of service affecting home connectivity and mobile usage with ${operatorName}. The outage has recurred over two days and requires service restoration plus a clear incident explanation.`;
    case "BILLING_DISPUTE":
      return `${firstName} disputes recurring charges that appeared on the latest ${operatorName} bill without prior notice. The complaint requests itemized billing verification and reversal of unsupported charges.`;
    case "POOR_CALL_QUALITY":
      return `${firstName} reported persistent voice distortion, dropped calls, and poor call quality while using ${operatorName} services. The complaint asks for network quality review in the affected coverage area.`;
    case "SERVICE_ACTIVATION_DELAY":
      return `${firstName} says ${operatorName} has delayed service activation beyond the communicated installation window. The complaint requests immediate activation and a written explanation for the missed SLA.`;
    default:
      return `Complaint ${sequence} requires review.`;
  }
}

function buildEscalationDraft(
  index: number,
  submittedAt: number,
  operatorKey: SeedOperatorKey,
  category: ComplaintCategory,
  hasBeenEscalated: boolean,
): SeedEscalationDraft | null {
  if (!hasBeenEscalated) {
    return null;
  }

  const policy = getSeedOperatorPolicy(operatorKey, category);
  const cycle = index % 5;

  if (cycle === 0 || cycle === 3) {
    return {
      triggerType: "USER_REQUEST",
      evaluationStatus: "USER_REQUEST_ALLOWED",
      triggeredByRole: "submitter",
      triggeredAt: submittedAt + Math.max(6, Math.floor(policy.slaHours / 2)) * HOUR_MS,
      slaBreached: cycle === 3,
      userRequested: true,
      systemPolicyTriggered: false,
    };
  }

  if (cycle === 1 || cycle === 4) {
    return {
      triggerType: "AUTO_SLA_BREACH",
      evaluationStatus: "AUTO_ESCALATION_ALLOWED",
      triggeredByRole: "system",
      triggeredAt: submittedAt + (policy.slaHours + 3) * HOUR_MS,
      slaBreached: true,
      userRequested: false,
      systemPolicyTriggered: false,
    };
  }

  return {
    triggerType: "SYSTEM_POLICY",
    evaluationStatus: "SYSTEM_POLICY_ALLOWED",
    triggeredByRole: "admin",
    triggeredAt: submittedAt + Math.max(4, Math.floor(policy.slaHours / 3)) * HOUR_MS,
    slaBreached: false,
    userRequested: false,
    systemPolicyTriggered: true,
  };
}

function buildComplaintDocuments(
  sequence: number,
  referenceNumber: string,
  trackingToken: string,
  operatorName: string,
  category: ComplaintCategory,
  description: string,
  consumerName: string,
  consumerEmail: string,
): {
  complaintDocument: SeedStoredFileDraft;
  evidenceDocument: SeedStoredFileDraft | null;
} {
  const complaintStorageKey = `complaint-${sequence}-primary`;
  const evidenceStorageKey = `complaint-${sequence}-evidence`;

  const complaintDocument: SeedStoredFileDraft = {
    storageKey: complaintStorageKey,
    fileName: `seed-complaint-${String(sequence).padStart(3, "0")}.pdf`,
    contentType: "application/pdf",
    lines: [
      "BOCRA Demo Complaint Submission",
      `Reference: ${referenceNumber}`,
      `Tracking Token: ${trackingToken}`,
      `Operator: ${operatorName}`,
      `Category: ${formatCategoryLabel(category)}`,
      `Consumer: ${consumerName}`,
      `Consumer Email: ${consumerEmail}`,
      "",
      description,
      "",
      "This document is part of the BOCRA demo seed dataset.",
    ],
  };

  const includeEvidence = sequence % 3 === 0 || sequence % 10 === 1;

  const evidenceDocument = includeEvidence
    ? {
        storageKey: evidenceStorageKey,
        fileName: `seed-evidence-${String(sequence).padStart(3, "0")}.pdf`,
        contentType: "application/pdf",
        lines: [
          "BOCRA Demo Evidence Attachment",
          `Reference: ${referenceNumber}`,
          `Tracking Token: ${trackingToken}`,
          `Operator: ${operatorName}`,
          "",
          "Attached evidence summary:",
          "- Customer timeline log",
          "- Screenshot summary captured by demo seed process",
          "- Follow-up notes prepared for review",
        ],
      }
    : null;

  return {
    complaintDocument,
    evidenceDocument,
  };
}

function buildComplaintMessages(input: {
  submitterType: ComplaintSubmitterType;
  operatorName: string;
  category: ComplaintCategory;
  description: string;
  status: ComplaintStatus;
  submittedAt: number;
  escalatedAt: number | null;
  resolvedAt: number | null;
  closedAt: number | null;
  escalation: SeedEscalationDraft | null;
}): SeedMessageDraft[] {
  const messages: SeedMessageDraft[] = [
    {
      senderType: input.submitterType === "AUTHENTICATED" ? "AUTHENTICATED" : "PUBLIC",
      senderKey: "submitter",
      visibility: "TRACKING_VISIBLE",
      body: `Complaint lodged against ${input.operatorName}. ${input.description}`,
      createdAt: input.submittedAt + 15 * MINUTE_MS,
    },
  ];

  if (input.status !== "SUBMITTED_TO_OPERATOR") {
    messages.push({
      senderType: "OPERATOR",
      senderKey: "primaryOperator",
      visibility: "TRACKING_VISIBLE",
      body: `${input.operatorName} acknowledged the ${formatCategoryLabel(
        input.category,
      ).toLowerCase()} complaint and opened a handling case.`,
      createdAt: input.submittedAt + 3 * HOUR_MS,
    });
  }

  if (input.escalation && input.escalatedAt) {
    messages.push({
      senderType: "SYSTEM",
      senderKey: "system",
      visibility: "INTERNAL",
      body: `Escalation criteria satisfied through ${input.escalation.triggerType}. The complaint is now visible in the BOCRA admin queue.`,
      createdAt: input.escalatedAt + 20 * MINUTE_MS,
    });
  }

  if (input.status === "ESCALATED_TO_BOCRA" || input.status === "UNDER_INVESTIGATION") {
    messages.push({
      senderType: "ADMIN",
      senderKey: "admin",
      visibility: "INTERNAL",
      body: "BOCRA admin review opened and supporting operator records requested.",
      createdAt: (input.escalatedAt ?? input.submittedAt) + 6 * HOUR_MS,
    });
  }

  if (input.status === "RESOLVED") {
    messages.push({
      senderType: "OPERATOR",
      senderKey: "primaryOperator",
      visibility: "TRACKING_VISIBLE",
      body: `${input.operatorName} reported a proposed resolution and is awaiting customer confirmation.`,
      createdAt: (input.resolvedAt ?? input.submittedAt) - 45 * MINUTE_MS,
    });
  }

  if (input.status === "CLOSED" && input.closedAt) {
    messages.push({
      senderType:
        input.escalation === null ? "OPERATOR" : "ADMIN",
      senderKey:
        input.escalation === null ? "primaryOperator" : "admin",
      visibility: "TRACKING_VISIBLE",
      body:
        input.escalation === null
          ? `${input.operatorName} closed the complaint after confirming the issue had been addressed.`
          : "BOCRA closed the escalated complaint after investigation and final communication to the complainant.",
      createdAt: input.closedAt - 30 * MINUTE_MS,
    });
  }

  return messages.sort((left, right) => left.createdAt - right.createdAt);
}

function buildComplaintNotifications(input: {
  referenceNumber: string;
  trackingToken: string;
  operatorEmail: string;
  consumerEmail: string;
  submitterType: ComplaintSubmitterType;
  status: ComplaintStatus;
  submittedAt: number;
  escalatedAt: number | null;
}): SeedNotificationDraft[] {
  const notifications: SeedNotificationDraft[] = [
    {
      channel: "EMAIL",
      recipientRole: "consumer",
      subject: `Complaint received: ${input.referenceNumber}`,
      message: `Your complaint has been recorded under ${input.referenceNumber}. Keep tracking token ${input.trackingToken} for future follow-up.`,
      status: "SENT",
      createdAt: input.submittedAt + 10 * MINUTE_MS,
    },
    {
      channel: "IN_APP",
      recipientRole: "operator",
      subject: `New operator complaint: ${input.referenceNumber}`,
      message: `A ${input.submitterType.toLowerCase()} complaint has been assigned for operator review.`,
      status: "SENT",
      createdAt: input.submittedAt + 25 * MINUTE_MS,
    },
  ];

  if (input.escalatedAt) {
    notifications.push({
      channel: "SYSTEM",
      recipientRole: "admin",
      subject: `Escalated complaint: ${input.referenceNumber}`,
      message: `Complaint ${input.referenceNumber} moved into the BOCRA escalation workflow.`,
      status: "SENT",
      createdAt: input.escalatedAt + 10 * MINUTE_MS,
    });
  }

  if (input.status === "CLOSED") {
    notifications.push({
      channel: "EMAIL",
      recipientRole: "consumer",
      subject: `Complaint update: ${input.referenceNumber}`,
      message: `Complaint ${input.referenceNumber} has been closed. Please retain this notice for your records.`,
      status: "SENT",
      createdAt: input.submittedAt + 2 * HOUR_MS,
    });
  }

  void input.operatorEmail;
  void input.consumerEmail;

  return notifications;
}

function buildRegulatoryActions(input: {
  index: number;
  status: ComplaintStatus;
  operatorName: string;
  category: ComplaintCategory;
  escalatedAt: number | null;
  hasBeenEscalated: boolean;
}): SeedRegulatoryActionDraft[] {
  if (!input.hasBeenEscalated || !input.escalatedAt) {
    return [];
  }

  if (input.status === "ESCALATION_REQUESTED") {
    return [];
  }

  const actionTypeCycle: SeedRegulatoryActionDraft["actionType"][] = [
    "WARNING",
    "NOTICE",
    "AUDIT",
    "PENALTY",
    "LICENSE_REVIEW",
  ];

  const notes = `${input.operatorName} requires follow-up on ${formatCategoryLabel(
    input.category,
  ).toLowerCase()} handling controls after escalation review.`;

  const actions: SeedRegulatoryActionDraft[] = [
    {
      actionType: actionTypeCycle[input.index % actionTypeCycle.length],
      notes,
      createdAt: input.escalatedAt + 8 * HOUR_MS,
    },
  ];

  if (input.status === "CLOSED" && input.index % 2 === 0) {
    actions.push({
      actionType: "LICENSE_REVIEW",
      notes: `${input.operatorName} was flagged for licensing oversight after repeated escalated complaint activity.`,
      createdAt: input.escalatedAt + 20 * HOUR_MS,
    });
  }

  return actions;
}

export function buildSeedComplaintDrafts(seededAt: number): SeedComplaintDraft[] {
  return Array.from({ length: FULL_DEMO_COMPLAINT_COUNT }, (_, index) => {
    const sequence = index + 1;
    const referenceNumber = buildReferenceNumber(sequence);
    const trackingToken = buildTrackingToken(sequence);
    const operatorKey = getOperatorKeyForIndex(index);
    const operator = getSeedOperatorConfig(operatorKey);
    const category = getCategoryForIndex(index);
    const submitterType: ComplaintSubmitterType =
      index % 5 <= 1 ? "AUTHENTICATED" : "PUBLIC";
    const consumer = getConsumerProfile(index);
    const consumerNames = consumer.name.split(" ");
    const consumerFirstName = consumerNames[0] ?? consumer.name;
    const consumerLastName = consumerNames.slice(1).join(" ") || "Seed";
    const description = buildComplaintDescription(
      sequence,
      operator.name,
      category,
      consumerFirstName,
    );
    const { status, hasBeenEscalated } = getComplaintStatusForIndex(index);
    const submittedAt =
      seededAt - (FULL_DEMO_COMPLAINT_COUNT - index + 6) * 8 * HOUR_MS;
    const escalation = buildEscalationDraft(
      index,
      submittedAt,
      operatorKey,
      category,
      hasBeenEscalated,
    );
    const escalatedAt = escalation?.triggeredAt ?? null;
    const resolvedAt =
      status === "RESOLVED" || (status === "CLOSED" && !hasBeenEscalated)
        ? submittedAt + 30 * HOUR_MS
        : null;
    const closedAt =
      status === "CLOSED"
        ? hasBeenEscalated
          ? (escalatedAt ?? submittedAt) + 42 * HOUR_MS
          : (resolvedAt ?? submittedAt) + 12 * HOUR_MS
        : null;
    const createdAt = submittedAt - 20 * MINUTE_MS;
    const updatedAt =
      closedAt ??
      resolvedAt ??
      (status === "UNDER_INVESTIGATION"
        ? (escalatedAt ?? submittedAt) + 10 * HOUR_MS
        : status === "ESCALATED_TO_BOCRA"
          ? (escalatedAt ?? submittedAt) + 4 * HOUR_MS
          : status === "ESCALATION_REQUESTED"
            ? escalatedAt ?? submittedAt
            : status === "IN_PROGRESS"
              ? submittedAt + 6 * HOUR_MS
              : submittedAt + 45 * MINUTE_MS);
    const documents = buildComplaintDocuments(
      sequence,
      referenceNumber,
      trackingToken,
      operator.name,
      category,
      description,
      consumer.name,
      consumer.email,
    );

    return {
      sequence,
      referenceNumber,
      trackingToken,
      operatorKey,
      category,
      description,
      submitterType,
      submittedByUserEmail:
        submitterType === "AUTHENTICATED" ? consumer.email : null,
      consumerFirstName,
      consumerLastName,
      consumerEmail: consumer.email,
      consumerPhone: `+267 7${String(4100000 + sequence).padStart(7, "0")}`,
      status,
      hasBeenEscalated,
      submittedAt,
      escalatedAt,
      resolvedAt,
      closedAt,
      createdAt,
      updatedAt,
      complaintDocument: documents.complaintDocument,
      evidenceDocument: documents.evidenceDocument,
      messages: buildComplaintMessages({
        submitterType,
        operatorName: operator.name,
        category,
        description,
        status,
        submittedAt,
        escalatedAt,
        resolvedAt,
        closedAt,
        escalation,
      }),
      notifications: buildComplaintNotifications({
        referenceNumber,
        trackingToken,
        operatorEmail: operator.email,
        consumerEmail: consumer.email,
        submitterType,
        status,
        submittedAt,
        escalatedAt,
      }),
      regulatoryActions: buildRegulatoryActions({
        index,
        status,
        operatorName: operator.name,
        category,
        escalatedAt,
        hasBeenEscalated,
      }),
      escalation,
    };
  });
}

export function getAllSeedUserEmails(): string[] {
  return [...SEED_OPERATOR_USERS, ...SEED_CONSUMER_USERS].map(
    (user) => user.email,
  );
}

export function getOperatorPrimaryUserEmail(operatorKey: SeedOperatorKey): string {
  return getPrimaryOperatorUser(operatorKey).email;
}
