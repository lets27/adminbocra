import {
  adminAnalyticsCards,
  escalationQueue,
  executiveSummary,
  licensingWatchlist,
  operatorPerformance,
  regionPressure,
  workflowChecklist,
} from "@/lib/dashboard-reference-data";

type TrendDirection = "up" | "down" | "steady";

function formatDate(dateLabel: string): string {
  return new Intl.DateTimeFormat("en-BW", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateLabel));
}

function formatDateTime(dateLabel: string): string {
  return new Intl.DateTimeFormat("en-BW", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateLabel));
}

function formatPercent(value: number): string {
  return `${value}%`;
}

function getTrendTone(direction: TrendDirection): string {
  if (direction === "up") {
    return "text-amber-300";
  }

  if (direction === "down") {
    return "text-emerald-300";
  }

  return "text-sky-200";
}

function getStatusTone(status: string): string {
  if (status === "UNDER_INVESTIGATION") {
    return "bg-rose-500/15 text-rose-200 ring-1 ring-inset ring-rose-300/30";
  }

  if (status === "ESCALATED_TO_BOCRA") {
    return "bg-amber-500/15 text-amber-100 ring-1 ring-inset ring-amber-300/30";
  }

  if (status === "ESCALATION_REQUESTED") {
    return "bg-sky-500/15 text-sky-100 ring-1 ring-inset ring-sky-300/30";
  }

  if (status === "CLOSED") {
    return "bg-emerald-500/15 text-emerald-100 ring-1 ring-inset ring-emerald-300/30";
  }

  return "bg-slate-500/15 text-slate-100 ring-1 ring-inset ring-slate-300/30";
}

function getActionTone(action: string): string {
  if (action === "REVIEW_RECOMMENDED") {
    return "bg-amber-300/20 text-amber-100";
  }

  if (action === "REVIEW_IN_PROGRESS") {
    return "bg-sky-300/20 text-sky-100";
  }

  if (action === "SUSPENSION_IN_EFFECT") {
    return "bg-rose-300/20 text-rose-100";
  }

  if (action === "EXPIRY_FOLLOW_UP") {
    return "bg-orange-300/20 text-orange-100";
  }

  return "bg-emerald-300/20 text-emerald-100";
}

const categoryAnalytics = [
  {
    category: "NETWORK OUTAGE",
    complaintCount: 48,
    escalatedComplaintCount: 11,
    underInvestigationCount: 4,
    operatorCount: 6,
    width: 92,
  },
  {
    category: "BILLING DISPUTE",
    complaintCount: 31,
    escalatedComplaintCount: 8,
    underInvestigationCount: 2,
    operatorCount: 5,
    width: 68,
  },
  {
    category: "POOR CALL QUALITY",
    complaintCount: 26,
    escalatedComplaintCount: 6,
    underInvestigationCount: 1,
    operatorCount: 4,
    width: 56,
  },
  {
    category: "SERVICE ACTIVATION DELAY",
    complaintCount: 19,
    escalatedComplaintCount: 4,
    underInvestigationCount: 1,
    operatorCount: 3,
    width: 42,
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-8 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/45 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_rgba(218,234,255,0.82)_33%,_rgba(17,24,39,0.94)_34%,_rgba(8,15,31,0.98)_100%)] shadow-[0_32px_100px_rgba(15,23,42,0.18)]">
        <div className="grid gap-8 px-6 py-7 lg:grid-cols-[1.3fr_0.9fr] lg:px-8 lg:py-8">
          <div className="space-y-6 text-white">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-100">
                Reference Dashboard
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-slate-200">
                Dummy data for layout validation
              </span>
            </div>

            <div className="max-w-3xl space-y-4">
              <p className="text-sm uppercase tracking-[0.22em] text-sky-100/80">
                BOCRA regulatory intelligence workspace
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-5xl">
                Escalation-led oversight for licensing, compliance, and admin action.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                This first pass mirrors the backend workflow you already have:
                escalations first, operator risk second, analytics as supporting
                context. We can swap the placeholders with Convex queries once
                the layout feels right.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {executiveSummary.map((item) => (
                <article
                  key={item.label}
                  className="rounded-[1.6rem] border border-white/12 bg-white/8 p-4 backdrop-blur"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                    {item.label}
                  </p>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <p className="text-3xl font-semibold tracking-[-0.05em] text-white">
                      {item.value}
                    </p>
                    <p className={`text-sm font-medium ${getTrendTone(item.trendDirection)}`}>
                      {item.trend}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {item.context}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <aside className="rounded-[1.8rem] border border-slate-800/80 bg-slate-950/80 p-5 text-slate-100 shadow-[0_20px_60px_rgba(2,8,23,0.4)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Current pulse
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                  Admin workflow focus
                </h2>
              </div>
              <div className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                Live layout mock
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {workflowChecklist.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{item.subtitle}</p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[1.4rem] border border-sky-300/10 bg-sky-300/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-sky-100/80">
                Snapshot timestamp
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {formatDateTime("2026-03-26T09:30:00.000Z")}
              </p>
              <p className="mt-2 text-sm leading-6 text-sky-50/80">
                Once we connect Convex, this corner can surface `generatedAt`
                from the dashboard summary query.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminAnalyticsCards.map((card) => (
          <article
            key={card.title}
            className="rounded-[1.6rem] border border-slate-200/70 bg-white/80 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.title}</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                  {card.value}
                </p>
              </div>
              <span
                className={`rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold ${getTrendTone(
                  card.trendDirection,
                )}`}
              >
                {card.delta}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">{card.note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <section className="rounded-[1.8rem] border border-slate-200/70 bg-white/82 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Escalations queue
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                Complaints requiring BOCRA action
              </h2>
            </div>
            <div className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white">
              {escalationQueue.length} priority cases
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {escalationQueue.map((complaint) => (
              <article
                key={complaint.referenceNumber}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50/85 p-4 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
                        {complaint.referenceNumber}
                      </p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(
                          complaint.status,
                        )}`}
                      >
                        {complaint.status.replaceAll("_", " ")}
                      </span>
                      <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                        {complaint.category.replaceAll("_", " ")}
                      </span>
                    </div>

                    <p className="max-w-3xl text-sm leading-6 text-slate-600">
                      {complaint.summary}
                    </p>

                    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Operator
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900">
                          {complaint.operatorName}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Submitted
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900">
                          {formatDate(complaint.submittedAt)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Escalated
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900">
                          {formatDate(complaint.escalatedAt)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          SLA deadline
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900">
                          {formatDate(complaint.slaDeadline)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="grid min-w-[220px] gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    <div className="rounded-[1.2rem] bg-white p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Messages
                      </p>
                      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                        {complaint.messageCount}
                      </p>
                    </div>
                    <div className="rounded-[1.2rem] bg-white p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Documents
                      </p>
                      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                        {complaint.documentCount}
                      </p>
                    </div>
                    <div className="rounded-[1.2rem] bg-white p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Suggested next step
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-5 text-slate-950">
                        {complaint.nextStep}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[1.8rem] border border-slate-200/70 bg-white/82 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Licensing watch
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              Recommended regulatory interventions
            </h2>

            <div className="mt-6 space-y-4">
              {licensingWatchlist.map((operator) => (
                <article
                  key={operator.operatorName}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50/85 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
                        {operator.operatorName}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {operator.riskLevel} risk • {operator.licenseStatus.replaceAll("_", " ")}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.14em] ${getActionTone(
                        operator.recommendedAction,
                      )}`}
                    >
                      {operator.recommendedAction.replaceAll("_", " ")}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1rem] bg-white p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Compliance
                      </p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">
                        {formatPercent(operator.complianceScore)}
                      </p>
                    </div>
                    <div className="rounded-[1rem] bg-white p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Complaints
                      </p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">
                        {operator.complaintCount}
                      </p>
                    </div>
                    <div className="rounded-[1rem] bg-white p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Escalated
                      </p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">
                        {operator.escalatedComplaintCount}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    Regions: {operator.regionCoverage.join(", ")}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-slate-200/70 bg-white/82 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Region pressure
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              Complaint concentration by coverage area
            </h2>
            <div className="mt-6 space-y-4">
              {regionPressure.map((region) => (
                <article key={region.region} className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{region.region}</p>
                      <p className="text-sm text-slate-500">
                        {region.complaintCount} complaints • {region.escalatedComplaintCount} escalated
                      </p>
                    </div>
                    <p className="text-sm font-medium text-slate-600">
                      {region.highRiskOperatorCount} high-risk operators
                    </p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#0f172a_0%,#2563eb_60%,#f59e0b_100%)]"
                      style={{ width: `${region.intensity}%` }}
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-[1.8rem] border border-slate-200/70 bg-white/82 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Operator oversight
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            Oversight list for admin follow-up
          </h2>

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
            <div className="grid grid-cols-[1fr_1fr_0.6fr_0.7fr_0.7fr] gap-3 bg-slate-950 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
              <span>Name</span>
              <span>Status</span>
              <span>Compliance</span>
              <span>Escalations</span>
              <span>Admin queue</span>
            </div>
            <div className="divide-y divide-slate-200 bg-white">
              {operatorPerformance.map((operator) => (
                <div
                  key={operator.operatorName}
                  className="grid grid-cols-[1fr_1fr_0.6fr_0.7fr_0.7fr] gap-3 px-4 py-4 text-sm text-slate-700"
                >
                  <div>
                    <p className="font-semibold text-slate-950">{operator.operatorName}</p>
                    <p className="hidden mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                      {operator.licenseStatus.replaceAll("_", " ")} • {operator.riskLevel} risk
                    </p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.14em] text-slate-500">
                    {operator.licenseStatus.replaceAll("_", " ")} • {operator.riskLevel} risk
                  </span>
                  <span className="font-medium text-slate-900">
                    {formatPercent(operator.complianceScore)}
                  </span>
                  <span className="font-medium text-slate-900">{operator.escalationCount}</span>
                  <span className="font-medium text-slate-900">
                    {operator.activeEscalationCount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-slate-200/70 bg-white/82 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Category analytics
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            Which complaint types are driving escalations
          </h2>

          <div className="mt-6 space-y-4">
            {categoryAnalytics.map((item) => (
              <article
                key={item.category}
                className="rounded-[1.4rem] border border-slate-200 bg-slate-50/80 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">{item.category}</p>
                  <p className="text-sm text-slate-600">
                    {item.escalatedComplaintCount} escalated • {item.underInvestigationCount} under investigation
                  </p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#1d4ed8_0%,#0f172a_100%)]"
                    style={{ width: `${item.width}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                  <span>{item.complaintCount} total complaints</span>
                  <span>{item.operatorCount} operators affected</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
