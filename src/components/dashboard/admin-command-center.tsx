"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import {
  Activity,
  ArrowUpRight,
  Building2,
  CircleAlert,
  FileClock,
  FileWarning,
  ShieldAlert,
  Sparkles,
  Waves,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { BentoCard, BentoGrid } from "@/components/ui/aceternity/bento-grid";
import { BackgroundLines } from "@/components/ui/aceternity/background-lines";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatLabel,
  formatPercent,
  formatShortDate,
  formatTimestamp,
  getComplaintStatusVariant,
  getLicenseStatusVariant,
  getRecommendedActionVariant,
  getRiskVariant,
} from "@/lib/admin-dashboard";
import { cn } from "@/lib/utils";

type StatusDatum = {
  label: string;
  value: number;
  toneClass: string;
};

function StatusDistributionChart({ items }: { items: StatusDatum[] }) {
  const maxValue = Math.max(1, ...items.map((item) => item.value));

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Queue state
          </p>
          <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
            Live distribution of the BOCRA queue
          </p>
        </div>
        <Badge className="bg-white/10 text-slate-100 ring-1 ring-inset ring-white/10">
          Current snapshot
        </Badge>
      </div>

      <div className="mt-6 flex h-52 items-end gap-4">
        {items.map((item) => (
          <div className="flex min-w-0 flex-1 flex-col items-center gap-3" key={item.label}>
            <div className="flex h-40 w-full items-end rounded-[1.2rem] bg-white/[0.05] px-3 py-3">
              <div
                className={cn("w-full rounded-[0.9rem]", item.toneClass)}
                style={{ height: `${Math.max(10, (item.value / maxValue) * 100)}%` }}
              />
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold tracking-[-0.04em] text-white">
                {item.value}
              </p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                {item.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardLoadingState() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="panel-shell h-[24rem] animate-pulse" />
        <div className="panel-shell h-[24rem] animate-pulse" />
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="panel-shell h-48 animate-pulse" key={index} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="panel-shell h-[26rem] animate-pulse" />
        <div className="panel-shell h-[26rem] animate-pulse" />
      </div>
    </div>
  );
}

function DashboardContent() {
  const summary = useQuery(api.admin.analytics.getDashboardSummary, {});
  const queue = useQuery(api.admin.complaints.getEscalatedComplaints, {
    limit: 8,
    includeClosed: true,
  });
  const licensing = useQuery(api.admin.licensing.getLicensingOverview, {
    limit: 4,
  });
  const operators = useQuery(api.admin.operators.getOperators, {
    limit: 50,
  });
  const regionAnalytics = useQuery(api.admin.analytics.getAnalyticsByRegion, {});
  const categoryAnalytics = useQuery(api.admin.analytics.getAnalyticsByCategory, {});

  if (
    summary === undefined ||
    queue === undefined ||
    licensing === undefined ||
    operators === undefined ||
    regionAnalytics === undefined ||
    categoryAnalytics === undefined
  ) {
    return <DashboardLoadingState />;
  }

  const queueWithEvidence = queue.filter((complaint) => complaint.hasDocuments).length;
  const queueBeyondIntake = queue.filter(
    (complaint) =>
      complaint.status === "ESCALATED_TO_BOCRA" ||
      complaint.status === "UNDER_INVESTIGATION" ||
      complaint.status === "CLOSED",
  ).length;
  const operatorCoverage = summary.totalOperators
    ? Math.round(
        (operators.filter((operator) => operator.policyCount > 0).length /
          summary.totalOperators) *
          100,
      )
    : 0;
  const evidenceCoverage = queue.length
    ? Math.round((queueWithEvidence / queue.length) * 100)
    : 0;
  const investigationReadiness = queue.length
    ? Math.round((queueBeyondIntake / queue.length) * 100)
    : 0;

  const executiveSummary = [
    {
      label: "Open escalations",
      value: summary.escalatedComplaintCount,
      context: "Combined queue of requested, accepted, and active investigations.",
      delta: `${summary.recentEscalatedComplaints.length} recent escalations`,
    },
    {
      label: "Operators under watch",
      value: licensing.recommendedActions.length,
      context: "High-risk or license-sensitive operators requiring a BOCRA decision.",
      delta: `${summary.highRiskOperatorCount} marked high risk`,
    },
    {
      label: "Closed escalated cases",
      value: summary.closedEscalatedCount,
      context: "Escalated complaints already resolved and closed in the admin lifecycle.",
      delta: `${summary.underInvestigationCount} active investigations`,
    },
  ];

  const analyticsCards = [
    {
      title: "Escalation requested",
      value: summary.escalationRequestedCount,
      note: "Complaints waiting for BOCRA triage or acceptance.",
      eyebrow: "Intake",
      icon: ShieldAlert,
    },
    {
      title: "Escalated to BOCRA",
      value: summary.escalatedToBocraCount,
      note: "Cases already accepted into the regulatory queue.",
      eyebrow: "Accepted",
      icon: FileClock,
    },
    {
      title: "Under investigation",
      value: summary.underInvestigationCount,
      note: "Active casework with evidence, operator policy, and admin follow-up.",
      eyebrow: "Active",
      icon: Activity,
    },
    {
      title: "Suspended operators",
      value: summary.suspendedOperatorCount,
      note: "Licensing pressure points already under the strongest administrative state.",
      eyebrow: "Licensing",
      icon: FileWarning,
    },
  ];

  const queueSignals = [
    {
      label: "Policy coverage",
      value: operatorCoverage,
      context: "Operators in the visible admin set with at least one complaint policy configured.",
    },
    {
      label: "Investigation readiness",
      value: investigationReadiness,
      context: "Queue items already beyond intake and in accepted or active regulatory handling.",
    },
    {
      label: "Evidence coverage",
      value: evidenceCoverage,
      context: "Escalated complaints that already carry at least one uploaded complaint document.",
    },
  ];

  const statusChartItems: StatusDatum[] = [
    {
      label: "Requested",
      value: summary.escalationRequestedCount,
      toneClass: "bg-[linear-gradient(180deg,#38bdf8_0%,#0f172a_100%)]",
    },
    {
      label: "Accepted",
      value: summary.escalatedToBocraCount,
      toneClass: "bg-[linear-gradient(180deg,#f59e0b_0%,#0f172a_100%)]",
    },
    {
      label: "Investigating",
      value: summary.underInvestigationCount,
      toneClass: "bg-[linear-gradient(180deg,#14b8a6_0%,#0f172a_100%)]",
    },
  ];

  const topOperators = [...operators]
    .sort((left, right) => right.activeEscalationCount - left.activeEscalationCount)
    .slice(0, 5);
  const topRegions = regionAnalytics.results.slice(0, 4);
  const topCategories = categoryAnalytics.results.slice(0, 4);
  const maxCategoryCount = Math.max(1, ...topCategories.map((item) => item.complaintCount));
  const maxRegionalCount = Math.max(1, ...topRegions.map((item) => item.complaintCount));

  return (
    <div className="space-y-6">
      <BackgroundLines className="px-6 py-7 sm:px-8 lg:px-10 lg:py-9">
        <div className="grid gap-8 xl:grid-cols-[1.18fr_0.82fr]">
          <div className="space-y-7">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-white/10 text-white ring-1 ring-inset ring-white/10">
                Convex subscriptions
              </Badge>
              <Badge className="bg-emerald-400/14 text-emerald-100 ring-1 ring-inset ring-emerald-300/20">
                No dummy data
              </Badge>
              <Badge className="bg-sky-300/14 text-sky-100 ring-1 ring-inset ring-sky-200/20">
                Dashboard routing live
              </Badge>
            </div>

            <div className="max-w-3xl space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-100/80">
                Escalations first, licensing second, analytics always on
              </p>
              <h2 className="max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-5xl lg:text-[3.6rem]">
                A live BOCRA command center wired directly to the admin Convex
                query surface.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                Every summary card, queue row, chart, and watchlist below is now
                derived from the existing admin queries for escalations,
                licensing, operators, and analytics.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[1.15rem] bg-[linear-gradient(135deg,#ffffff_0%,#dff8f2_100%)] px-6 text-sm font-semibold text-slate-950 shadow-[0_18px_44px_rgba(15,23,42,0.22)] transition hover:brightness-105"
                href="/complaints"
              >
                Open escalated queue
                <ArrowUpRight size={16} />
              </Link>
              {summary.recentEscalatedComplaints[0] ? (
                <Link
                  className="inline-flex h-12 items-center justify-center rounded-[1.15rem] border border-white/20 bg-white/10 px-6 text-sm font-semibold text-white transition hover:bg-white/16"
                  href={`/complaints/${summary.recentEscalatedComplaints[0].complaintId}`}
                >
                  Review latest case
                </Link>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {executiveSummary.map((item) => (
                <div
                  className="rounded-[1.4rem] border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm"
                  key={item.label}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">
                    {item.label}
                  </p>
                  <div className="mt-4 flex items-end justify-between gap-4">
                    <p className="text-3xl font-semibold tracking-[-0.05em] text-white">
                      {item.value}
                    </p>
                    <p className="text-sm font-medium text-emerald-200">
                      {item.delta}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {item.context}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.06] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Recent escalations
                    </p>
                    <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">
                      Cases that just entered admin scope
                    </p>
                  </div>
                  <Badge className="bg-white/10 text-slate-100 ring-1 ring-inset ring-white/10">
                    {summary.recentEscalatedComplaints.length} visible
                  </Badge>
                </div>
                <div className="mt-5 space-y-3">
                  {summary.recentEscalatedComplaints.length === 0 ? (
                    <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-slate-300">
                      No recent escalations have been recorded yet.
                    </div>
                  ) : (
                    summary.recentEscalatedComplaints.map((complaint) => (
                      <Link
                        className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm transition hover:bg-white/[0.08]"
                        href={`/complaints/${complaint.complaintId}`}
                        key={complaint.complaintId}
                      >
                        <div>
                          <p className="font-semibold text-white">
                            {complaint.referenceNumber}
                          </p>
                          <p className="mt-1 text-slate-400">
                            {formatLabel(complaint.category)} •{" "}
                            {formatLabel(complaint.status)}
                          </p>
                        </div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                          {formatShortDate(complaint.escalatedAt ?? complaint.submittedAt)}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <StatusDistributionChart items={statusChartItems} />
            </div>
          </div>

          <div className="space-y-4 rounded-[1.8rem] border border-white/12 bg-slate-950/34 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Investigation posture
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">
                  Signals staff should see first
                </h3>
              </div>
              <div className="grid size-11 place-items-center rounded-2xl bg-white/10 text-amber-300">
                <Sparkles size={18} />
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-5">
              <div
                className="relative grid size-44 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(#38bdf8 0 ${
                    summary.escalatedComplaintCount === 0
                      ? 0
                      : (summary.escalationRequestedCount / summary.escalatedComplaintCount) * 100
                  }%, #f59e0b 0 ${
                    summary.escalatedComplaintCount === 0
                      ? 0
                      : ((summary.escalationRequestedCount + summary.escalatedToBocraCount) /
                          summary.escalatedComplaintCount) *
                        100
                  }%, #14b8a6 0 100%)`,
                }}
              >
                <div className="grid size-32 place-items-center rounded-full bg-[#0b1832] text-center">
                  <div>
                    <p className="text-3xl font-semibold tracking-[-0.05em] text-white">
                      {summary.escalatedComplaintCount}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      live cases
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid w-full gap-3 text-sm">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Queue intake</span>
                  <span className="font-semibold text-white">
                    {summary.escalationRequestedCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Accepted into BOCRA</span>
                  <span className="font-semibold text-white">
                    {summary.escalatedToBocraCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Under investigation</span>
                  <span className="font-semibold text-white">
                    {summary.underInvestigationCount}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {queueSignals.map((signal) => (
                <div
                  className="rounded-[1.25rem] border border-white/10 bg-white/[0.05] p-4"
                  key={signal.label}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {signal.label}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {signal.context}
                      </p>
                    </div>
                    <Badge className="bg-white/10 text-slate-100 ring-1 ring-inset ring-white/10">
                      {signal.value}%
                    </Badge>
                  </div>
                  <Progress className="mt-4 bg-white/10" value={signal.value} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </BackgroundLines>

      <BentoGrid>
        {analyticsCards.map((card) => {
          const Icon = card.icon;

          return (
            <BentoCard
              description={card.note}
              eyebrow={card.eyebrow}
              icon={<Icon size={18} />}
              key={card.title}
              title={card.title}
            >
              <div className="flex items-end justify-between gap-5">
                <div>
                  <p className="text-4xl font-semibold tracking-[-0.05em] text-slate-950">
                    {card.value}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    Live admin count from Convex
                  </p>
                </div>
                <div className="grid size-14 place-items-center rounded-[1.2rem] bg-slate-950 text-white">
                  <Icon size={18} />
                </div>
              </div>
            </BentoCard>
          );
        })}
      </BentoGrid>

      <div className="grid gap-6 xl:grid-cols-[1.28fr_0.72fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-slate-200/70">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-kicker">Escalated complaints queue</p>
                <CardTitle className="mt-2 text-2xl">
                  Complaints requiring BOCRA action
                </CardTitle>
                <CardDescription className="mt-2 max-w-2xl">
                  Powered by `getEscalatedComplaints`, with document and
                  message activity coming from the live queue items.
                </CardDescription>
              </div>
              <Link
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-white/80 px-5 text-sm font-semibold text-slate-900 ring-1 ring-inset ring-white/80 shadow-[0_12px_30px_rgba(148,163,184,0.16)] transition hover:bg-white"
                href="/complaints"
              >
                View full queue
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Case</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.map((complaint) => (
                  <TableRow key={complaint._id}>
                    <TableCell>
                      <div className="space-y-1">
                        <Link
                          className="font-semibold text-slate-950 hover:text-teal-700"
                          href={`/complaints/${complaint._id}`}
                        >
                          {complaint.referenceNumber}
                        </Link>
                        <p className="text-sm text-slate-500">
                          {formatLabel(complaint.category)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getComplaintStatusVariant(complaint.status)}>
                        {formatLabel(complaint.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {complaint.operatorName}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm text-slate-500">
                        <p>Escalated {formatShortDate(complaint.escalatedAt)}</p>
                        <p>SLA {formatShortDate(complaint.slaDeadline)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">
                            {complaint.messageCount}
                          </p>
                          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                            msgs
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-950">
                            {complaint.hasDocuments ? "Yes" : "No"}
                          </p>
                          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                            evidence
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-[linear-gradient(135deg,#081325_0%,#0f1f39_58%,#0d6b69_100%)] text-white">
          <CardHeader className="border-b border-white/10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Category load
            </p>
            <CardTitle className="mt-2 text-2xl text-white">
              What is driving the queue
            </CardTitle>
            <CardDescription className="text-slate-300">
              Derived from the category analytics query so the dashboard can
              show complaint pressure without making up trend lines.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {topCategories.map((category) => (
              <div
                className="rounded-[1.3rem] border border-white/10 bg-white/[0.06] p-4"
                key={category.category}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {formatLabel(category.category)}
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      {category.complaintCount} complaints •{" "}
                      {category.escalatedComplaintCount} escalated
                    </p>
                  </div>
                  <Badge className="bg-white/10 text-slate-100 ring-1 ring-inset ring-white/10">
                    {category.underInvestigationCount} active
                  </Badge>
                </div>
                <Progress
                  className="mt-4 bg-white/10"
                  value={(category.complaintCount / maxCategoryCount) * 100}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <p className="text-kicker">Licensing intelligence panel</p>
            <CardTitle className="mt-2 text-2xl">
              Operators under watch or review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {licensing.highRiskOperators.length === 0 ? (
              <div className="rounded-[1.35rem] border border-slate-200/70 bg-slate-50/80 p-4 text-sm text-slate-500">
                No high-risk operators are currently returned by the licensing
                overview query.
              </div>
            ) : (
              licensing.highRiskOperators.map((operator) => (
                <div
                  className="rounded-[1.35rem] border border-slate-200/70 bg-slate-50/80 p-4"
                  key={operator.operatorId}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-slate-950">
                        {operator.operatorName}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant={getLicenseStatusVariant(operator.licenseStatus)}>
                          {formatLabel(operator.licenseStatus)}
                        </Badge>
                        <Badge variant={getRiskVariant(operator.riskLevel)}>
                          {formatLabel(operator.riskLevel)} risk
                        </Badge>
                      </div>
                    </div>
                    <Badge variant={getRecommendedActionVariant(operator.recommendedAction)}>
                      {formatLabel(operator.recommendedAction)}
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1rem] bg-slate-950 px-3 py-3 text-white">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                        Compliance
                      </p>
                      <p className="mt-2 text-xl font-semibold">
                        {formatPercent(operator.complianceScore)}
                      </p>
                    </div>
                    <div className="rounded-[1rem] bg-white px-3 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Complaints
                      </p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">
                        {operator.complaintCount}
                      </p>
                    </div>
                    <div className="rounded-[1rem] bg-white px-3 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Escalated
                      </p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">
                        {operator.escalatedComplaintCount}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-kicker">Operator oversight</p>
            <CardTitle className="mt-2 text-2xl">
              Queue pressure across operators
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topOperators.map((operator) => (
              <div
                className="rounded-[1.35rem] border border-slate-200/70 bg-white/88 p-4"
                key={operator._id}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {operator.name}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant={getLicenseStatusVariant(operator.licenseStatus)}>
                        {formatLabel(operator.licenseStatus)}
                      </Badge>
                      <Badge variant={getRiskVariant(operator.riskLevel)}>
                        {formatLabel(operator.riskLevel)} risk
                      </Badge>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {operator.activeEscalationCount} active in queue
                  </Badge>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Compliance score</span>
                    <span className="font-semibold text-slate-950">
                      {formatPercent(operator.complianceScore)}
                    </span>
                  </div>
                  <Progress value={operator.complianceScore ?? 0} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <p className="text-kicker">Regional pressure</p>
            <CardTitle className="mt-2 text-2xl">
              Complaint concentration by area
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topRegions.map((region) => (
              <div key={region.region}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {region.region}
                    </p>
                    <p className="text-sm text-slate-500">
                      {region.complaintCount} complaints •{" "}
                      {region.escalatedComplaintCount} escalated
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {region.highRiskOperatorCount} high-risk operators
                  </p>
                </div>
                <Progress
                  className="mt-3"
                  value={(region.complaintCount / maxRegionalCount) * 100}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-[linear-gradient(135deg,#081325_0%,#102443_52%,#17345c_100%)] text-white">
          <CardHeader className="border-b border-white/10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              What changed
            </p>
            <CardTitle className="mt-2 text-2xl text-white">
              The admin shell is now backed by real views
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {[
              {
                label: "Dashboard",
                detail: `Updated ${formatTimestamp(summary.generatedAt)}`,
                icon: ShieldAlert,
              },
              {
                label: "Licensing",
                detail: `${licensing.statusCounts.underReview} under review`,
                icon: FileWarning,
              },
              {
                label: "Operators",
                detail: `${summary.totalOperators} total operators`,
                icon: Building2,
              },
              {
                label: "Analytics",
                detail: `${topCategories.length} category panels live`,
                icon: Waves,
              },
              {
                label: "Actions via detail",
                detail: "Complaint detail now becomes the investigation workspace",
                icon: CircleAlert,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  className="flex items-center justify-between rounded-[1.2rem] border border-white/10 bg-white/[0.06] px-4 py-3"
                  key={item.label}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="text-teal-200" size={16} />
                    <div>
                      <span className="block text-sm font-medium text-white">
                        {item.label}
                      </span>
                      <span className="block text-sm text-slate-400">
                        {item.detail}
                      </span>
                    </div>
                  </div>
                  <ArrowUpRight size={14} className="text-slate-400" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AdminCommandCenter() {
  return (
    <AdminShell
      actions={<Badge variant="success">Convex wired</Badge>}
      description="Live overview of escalated complaints, operator pressure, licensing posture, and complaint analytics for BOCRA staff."
      kicker="Admin layer / dashboard"
      title="BOCRA Regulatory Command Center"
    >
      {() => <DashboardContent />}
    </AdminShell>
  );
}
