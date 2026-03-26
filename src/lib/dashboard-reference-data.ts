export const executiveSummary = [
  {
    label: "Open escalations",
    value: "18",
    trend: "+4 this week",
    trendDirection: "up" as const,
    context:
      "Combined view of escalation requested, escalated to BOCRA, and under investigation complaints.",
  },
  {
    label: "Operators under watch",
    value: "7",
    trend: "2 urgent reviews",
    trendDirection: "up" as const,
    context:
      "Operators showing elevated complaint pressure, low compliance scores, or licensing flags.",
  },
  {
    label: "Closed escalated cases",
    value: "29",
    trend: "8 closed on time",
    trendDirection: "down" as const,
    context:
      "Historical escalated complaints closed after regulatory handling or investigation.",
  },
];

export const workflowChecklist = [
  {
    title: "Escalation intake",
    subtitle: "New complaints entering the BOCRA queue",
    count: "06 pending",
  },
  {
    title: "Active investigations",
    subtitle: "Complaints already accepted for formal review",
    count: "04 open",
  },
  {
    title: "Licensing actions",
    subtitle: "Operators needing audit, review, or suspension follow-up",
    count: "05 active",
  },
];

export const adminAnalyticsCards = [
  {
    title: "Escalation requested",
    value: "6",
    delta: "+2 today",
    trendDirection: "up" as const,
    note: "Fresh cases waiting for BOCRA triage and acknowledgment.",
  },
  {
    title: "Escalated to BOCRA",
    value: "8",
    delta: "+1 today",
    trendDirection: "up" as const,
    note: "Operator-side escalation accepted and now visible in the admin queue.",
  },
  {
    title: "Under investigation",
    value: "4",
    delta: "steady",
    trendDirection: "steady" as const,
    note: "Cases being actively worked by admin with evidence and policy review.",
  },
  {
    title: "Suspended operators",
    value: "2",
    delta: "-1 this month",
    trendDirection: "down" as const,
    note: "Licensing pressure has eased slightly, but two operators still require active oversight.",
  },
];

export const escalationQueue = [
  {
    referenceNumber: "BOCRA-CMP-2026-0042",
    status: "UNDER_INVESTIGATION",
    category: "NETWORK_OUTAGE",
    operatorName: "Kalahari Connect",
    submittedAt: "2026-03-18T08:00:00.000Z",
    escalatedAt: "2026-03-21T10:30:00.000Z",
    slaDeadline: "2026-03-20T16:00:00.000Z",
    messageCount: 9,
    documentCount: 3,
    nextStep: "Review outage logs and issue formal operator notice",
    summary:
      "Recurring regional outage complaint escalated after SLA breach and repeated consumer follow-up.",
  },
  {
    referenceNumber: "BOCRA-CMP-2026-0047",
    status: "ESCALATED_TO_BOCRA",
    category: "BILLING_DISPUTE",
    operatorName: "Savanna Mobile",
    submittedAt: "2026-03-20T09:45:00.000Z",
    escalatedAt: "2026-03-24T07:15:00.000Z",
    slaDeadline: "2026-03-23T16:00:00.000Z",
    messageCount: 5,
    documentCount: 2,
    nextStep: "Validate billing policy against operator complaint category rules",
    summary:
      "Consumer alleges repeated airtime deductions despite prior operator resolution attempts.",
  },
  {
    referenceNumber: "BOCRA-CMP-2026-0049",
    status: "ESCALATION_REQUESTED",
    category: "SERVICE_ACTIVATION_DELAY",
    operatorName: "Delta Fibre Botswana",
    submittedAt: "2026-03-22T11:10:00.000Z",
    escalatedAt: "2026-03-25T09:00:00.000Z",
    slaDeadline: "2026-03-25T14:00:00.000Z",
    messageCount: 4,
    documentCount: 1,
    nextStep: "Confirm policy eligibility before accepting into investigation",
    summary:
      "Service activation missed contractual timeframe and the operator has not completed installation.",
  },
];

export const licensingWatchlist = [
  {
    operatorName: "Kalahari Connect",
    riskLevel: "HIGH",
    licenseStatus: "UNDER_REVIEW",
    complianceScore: 46,
    complaintCount: 17,
    escalatedComplaintCount: 5,
    recommendedAction: "REVIEW_IN_PROGRESS",
    regionCoverage: ["Gaborone", "Kanye", "Lobatse"],
  },
  {
    operatorName: "Savanna Mobile",
    riskLevel: "HIGH",
    licenseStatus: "ACTIVE",
    complianceScore: 51,
    complaintCount: 13,
    escalatedComplaintCount: 4,
    recommendedAction: "REVIEW_RECOMMENDED",
    regionCoverage: ["Francistown", "Selebi-Phikwe"],
  },
  {
    operatorName: "NorthGrid Telecom",
    riskLevel: "MEDIUM",
    licenseStatus: "EXPIRED",
    complianceScore: 62,
    complaintCount: 7,
    escalatedComplaintCount: 2,
    recommendedAction: "EXPIRY_FOLLOW_UP",
    regionCoverage: ["Maun", "Kasane"],
  },
];

export const regionPressure = [
  {
    region: "Gaborone corridor",
    complaintCount: 34,
    escalatedComplaintCount: 9,
    highRiskOperatorCount: 3,
    intensity: 88,
  },
  {
    region: "Northern cluster",
    complaintCount: 27,
    escalatedComplaintCount: 6,
    highRiskOperatorCount: 2,
    intensity: 70,
  },
  {
    region: "Southern corridor",
    complaintCount: 18,
    escalatedComplaintCount: 4,
    highRiskOperatorCount: 1,
    intensity: 46,
  },
];

export const operatorPerformance = [
  {
    operatorName: "Kalahari Connect",
    licenseStatus: "UNDER_REVIEW",
    riskLevel: "HIGH",
    complianceScore: 46,
    escalationCount: 8,
    activeEscalationCount: 5,
  },
  {
    operatorName: "Savanna Mobile",
    licenseStatus: "ACTIVE",
    riskLevel: "HIGH",
    complianceScore: 51,
    escalationCount: 6,
    activeEscalationCount: 4,
  },
  {
    operatorName: "Delta Fibre Botswana",
    licenseStatus: "ACTIVE",
    riskLevel: "MEDIUM",
    complianceScore: 68,
    escalationCount: 3,
    activeEscalationCount: 2,
  },
  {
    operatorName: "NorthGrid Telecom",
    licenseStatus: "EXPIRED",
    riskLevel: "MEDIUM",
    complianceScore: 62,
    escalationCount: 2,
    activeEscalationCount: 1,
  },
];
