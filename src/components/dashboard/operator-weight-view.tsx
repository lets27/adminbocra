"use client";

import { useQuery } from "convex/react";
import { Activity, BarChart3, Building2, ShieldAlert } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatLabel, getRiskVariant } from "@/lib/admin-dashboard";

function OperatorWeightContent() {
  const operatorAnalytics = useQuery(api.admin.analytics.getAnalyticsByOperator, {});

  if (operatorAnalytics === undefined) {
    return <div className="panel-shell h-[32rem] animate-pulse" />;
  }

  const operators = operatorAnalytics.results;
  const maxComplaintCount = Math.max(
    1,
    ...operators.map((operator) => operator.complaintCount),
  );
  const totalComplaints = operators.reduce(
    (sum, operator) => sum + operator.complaintCount,
    0,
  );
  const totalEscalated = operators.reduce(
    (sum, operator) => sum + operator.escalatedComplaintCount,
    0,
  );
  const totalUnderInvestigation = operators.reduce(
    (sum, operator) => sum + operator.underInvestigationCount,
    0,
  );
  const highestLoadOperator = operators[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-4">
        {[
          {
            label: "Operators ranked",
            value: operators.length,
            detail: "Operators currently represented in the analytics rollup.",
            icon: Building2,
          },
          {
            label: "Total complaints",
            value: totalComplaints,
            detail: "Complaint volume across the ranked operator set.",
            icon: BarChart3,
          },
          {
            label: "Escalated",
            value: totalEscalated,
            detail: "Escalated complaints carried by those operators.",
            icon: ShieldAlert,
          },
          {
            label: "Under investigation",
            value: totalUnderInvestigation,
            detail: "Active investigation load reflected in operator analytics.",
            icon: Activity,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.label}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-kicker">{item.label}</p>
                  <div className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-white">
                    <Icon size={18} />
                  </div>
                </div>
                <CardTitle className="text-4xl">{item.value}</CardTitle>
                <CardDescription>{item.detail}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <Card>
          <CardHeader>
            <p className="text-kicker">Operator analytics</p>
            <CardTitle className="mt-2 text-2xl">
              Complaint weight by operator
            </CardTitle>
            <CardDescription className="mt-2">
              This ranking comes directly from the operator analytics query, so
              the relative bar lengths reflect live complaint distribution
              rather than placeholder scoring.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {operators.map((operator) => (
              <div
                className="rounded-[1.3rem] border border-slate-200/70 bg-white/88 p-4"
                key={operator.operatorId}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {operator.operatorName}
                    </p>
                    <p className="text-sm text-slate-500">
                      {operator.complaintCount} complaints •{" "}
                      {operator.escalatedComplaintCount} escalated •{" "}
                      {operator.underInvestigationCount} under investigation
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {formatLabel(operator.licenseStatus)}
                    </Badge>
                    <Badge variant={getRiskVariant(operator.riskLevel)}>
                      {formatLabel(operator.riskLevel)}
                    </Badge>
                  </div>
                </div>
                <Progress
                  className="mt-3"
                  value={(operator.complaintCount / maxComplaintCount) * 100}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-[linear-gradient(135deg,#081325_0%,#102443_58%,#0d6b69_100%)] text-white">
          <CardHeader className="border-b border-white/10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Load signal
            </p>
            <CardTitle className="mt-2 text-2xl text-white">
              What the operator ranking is saying
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {highestLoadOperator ? (
              <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.06] p-4">
                <p className="text-sm font-semibold text-white">
                  Highest current complaint load
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                  {highestLoadOperator.operatorName}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {highestLoadOperator.complaintCount} complaints with{" "}
                  {highestLoadOperator.escalatedComplaintCount} escalated and{" "}
                  {highestLoadOperator.underInvestigationCount} already under
                  investigation.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge className="bg-white/10 text-slate-100 ring-1 ring-inset ring-white/10">
                    {formatLabel(highestLoadOperator.licenseStatus)}
                  </Badge>
                  <Badge variant={getRiskVariant(highestLoadOperator.riskLevel)}>
                    {formatLabel(highestLoadOperator.riskLevel)}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.06] p-4 text-sm text-slate-300">
                No operator analytics rows are available right now.
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.06] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Operators
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {operators.length}
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.06] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Escalated
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {totalEscalated}
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.06] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Investigations
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {totalUnderInvestigation}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function OperatorWeightView() {
  return (
    <AdminShell
      actions={<Badge variant="outline">Operator ranking</Badge>}
      description="Dedicated operator analytics view for comparing complaint load, escalations, and active investigations across operators."
      kicker="Admin layer / operator analytics"
      title="Operator Complaint Weight"
    >
      {() => <OperatorWeightContent />}
    </AdminShell>
  );
}
