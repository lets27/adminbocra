import type { Id } from "../_generated/dataModel";
import type { ComplaintCategory, ComplaintStatus } from "./complaints";

export const ESCALATION_TRIGGER_TYPES = [
  "USER_REQUEST",
  "AUTO_SLA_BREACH",
  "SYSTEM_POLICY",
] as const;

export type EscalationTriggerType = (typeof ESCALATION_TRIGGER_TYPES)[number];

export const ESCALATION_EVALUATION_STATUSES = [
  "MISSING_POLICY",
  "POLICY_OPERATOR_MISMATCH",
  "POLICY_CATEGORY_MISMATCH",
  "POLICY_NOT_ESCALATABLE",
  "STATUS_NOT_ELIGIBLE",
  "AUTO_ESCALATION_ALLOWED",
  "USER_REQUEST_ALLOWED",
  "SYSTEM_POLICY_ALLOWED",
  "CRITERIA_NOT_MET",
] as const;

export type EscalationEvaluationStatus =
  (typeof ESCALATION_EVALUATION_STATUSES)[number];

export type EscalationPolicySnapshot = {
  operatorId: Id<"operators">;
  complaintCategory: ComplaintCategory;
  slaHours: number;
  isEscalatable: boolean;
  autoEscalateOnSlaBreach: boolean;
};

export type EscalationCriteriaSnapshot = {
  complaintStatus: ComplaintStatus;
  slaBreached: boolean;
  userRequested: boolean;
  systemPolicyTriggered: boolean;
  autoEscalateEligible: boolean;
  policyAllowsEscalation: boolean;
  evaluationStatus: EscalationEvaluationStatus;
  recommendedNextStatus: "ESCALATION_REQUESTED" | null;
};

export type EscalationEligibilityInput = {
  operatorId: Id<"operators">;
  complaintCategory: ComplaintCategory;
  complaintStatus: ComplaintStatus;
  policy: EscalationPolicySnapshot | null;
  slaBreached: boolean;
  userRequested: boolean;
  systemPolicyTriggered?: boolean;
};

export type EscalationEligibilityResult = {
  isEligible: boolean;
  validationPassed: boolean;
  triggerType: EscalationTriggerType | null;
  evaluationStatus: EscalationEvaluationStatus;
  policySnapshot: EscalationPolicySnapshot | null;
  criteriaSnapshot: EscalationCriteriaSnapshot;
};

export function buildEscalationPolicySnapshot(
  input: EscalationPolicySnapshot,
): EscalationPolicySnapshot {
  return {
    operatorId: input.operatorId,
    complaintCategory: input.complaintCategory,
    slaHours: input.slaHours,
    isEscalatable: input.isEscalatable,
    autoEscalateOnSlaBreach: input.autoEscalateOnSlaBreach,
  };
}

export function buildEscalationCriteriaSnapshot(
  input: EscalationEligibilityInput,
  evaluationStatus: EscalationEvaluationStatus,
  recommendedNextStatus: "ESCALATION_REQUESTED" | null,
): EscalationCriteriaSnapshot {
  const systemPolicyTriggered = input.systemPolicyTriggered ?? false;

  return {
    complaintStatus: input.complaintStatus,
    slaBreached: input.slaBreached,
    userRequested: input.userRequested,
    systemPolicyTriggered,
    autoEscalateEligible: input.policy?.autoEscalateOnSlaBreach ?? false,
    policyAllowsEscalation: input.policy?.isEscalatable ?? false,
    evaluationStatus,
    recommendedNextStatus,
  };
}

export function evaluateEscalationEligibility(
  input: EscalationEligibilityInput,
): EscalationEligibilityResult {
  if (!input.policy) {
    return {
      isEligible: false,
      validationPassed: false,
      triggerType: null,
      evaluationStatus: "MISSING_POLICY",
      policySnapshot: input.policy,
      criteriaSnapshot: buildEscalationCriteriaSnapshot(
        input,
        "MISSING_POLICY",
        null,
      ),
    };
  }

  if (input.policy.operatorId !== input.operatorId) {
    return {
      isEligible: false,
      validationPassed: false,
      triggerType: null,
      evaluationStatus: "POLICY_OPERATOR_MISMATCH",
      policySnapshot: buildEscalationPolicySnapshot(input.policy),
      criteriaSnapshot: buildEscalationCriteriaSnapshot(
        input,
        "POLICY_OPERATOR_MISMATCH",
        null,
      ),
    };
  }

  if (input.policy.complaintCategory !== input.complaintCategory) {
    return {
      isEligible: false,
      validationPassed: false,
      triggerType: null,
      evaluationStatus: "POLICY_CATEGORY_MISMATCH",
      policySnapshot: buildEscalationPolicySnapshot(input.policy),
      criteriaSnapshot: buildEscalationCriteriaSnapshot(
        input,
        "POLICY_CATEGORY_MISMATCH",
        null,
      ),
    };
  }

  if (!input.policy.isEscalatable) {
    return {
      isEligible: false,
      validationPassed: true,
      triggerType: null,
      evaluationStatus: "POLICY_NOT_ESCALATABLE",
      policySnapshot: buildEscalationPolicySnapshot(input.policy),
      criteriaSnapshot: buildEscalationCriteriaSnapshot(
        input,
        "POLICY_NOT_ESCALATABLE",
        null,
      ),
    };
  }

  if (input.complaintStatus !== "IN_PROGRESS") {
    return {
      isEligible: false,
      validationPassed: true,
      triggerType: null,
      evaluationStatus: "STATUS_NOT_ELIGIBLE",
      policySnapshot: buildEscalationPolicySnapshot(input.policy),
      criteriaSnapshot: buildEscalationCriteriaSnapshot(
        input,
        "STATUS_NOT_ELIGIBLE",
        null,
      ),
    };
  }

  if (input.slaBreached && input.policy.autoEscalateOnSlaBreach) {
    return {
      isEligible: true,
      validationPassed: true,
      triggerType: "AUTO_SLA_BREACH",
      evaluationStatus: "AUTO_ESCALATION_ALLOWED",
      policySnapshot: buildEscalationPolicySnapshot(input.policy),
      criteriaSnapshot: buildEscalationCriteriaSnapshot(
        input,
        "AUTO_ESCALATION_ALLOWED",
        "ESCALATION_REQUESTED",
      ),
    };
  }

  if (input.userRequested) {
    return {
      isEligible: true,
      validationPassed: true,
      triggerType: "USER_REQUEST",
      evaluationStatus: "USER_REQUEST_ALLOWED",
      policySnapshot: buildEscalationPolicySnapshot(input.policy),
      criteriaSnapshot: buildEscalationCriteriaSnapshot(
        input,
        "USER_REQUEST_ALLOWED",
        "ESCALATION_REQUESTED",
      ),
    };
  }

  if (input.systemPolicyTriggered ?? false) {
    return {
      isEligible: true,
      validationPassed: true,
      triggerType: "SYSTEM_POLICY",
      evaluationStatus: "SYSTEM_POLICY_ALLOWED",
      policySnapshot: buildEscalationPolicySnapshot(input.policy),
      criteriaSnapshot: buildEscalationCriteriaSnapshot(
        input,
        "SYSTEM_POLICY_ALLOWED",
        "ESCALATION_REQUESTED",
      ),
    };
  }

  return {
    isEligible: false,
    validationPassed: true,
    triggerType: null,
    evaluationStatus: "CRITERIA_NOT_MET",
    policySnapshot: buildEscalationPolicySnapshot(input.policy),
    criteriaSnapshot: buildEscalationCriteriaSnapshot(
      input,
      "CRITERIA_NOT_MET",
      null,
    ),
  };
}
