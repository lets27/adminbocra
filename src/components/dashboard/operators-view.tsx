"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { Activity, ArrowUpRight, Building2, ShieldAlert, Waves } from "lucide-react";
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
import {
  formatLabel,
  formatPercent,
  getLicenseStatusVariant,
  getRiskVariant,
} from "@/lib/admin-dashboard";

function OperatorsContent() {
  const operators = useQuery(api.admin.operators.getOperators, { limit: 50 });
  const operatorAnalytics = useQuery(api.admin.analytics.getAnalyticsByOperator, {});

  if (operators === undefined || operatorAnalytics === undefined) {
    return <div className="panel-shell h-[32rem] animate-pulse" />;
  }

  const totalOperators = operators.length;
  const highRiskCount = operators.filter((operator) => operator.riskLevel === "HIGH").length;
  const totalActiveEscalations = operators.reduce(
    (sum, operator) => sum + operator.activeEscalationCount,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-4">
        {[
          {
            label: "Operators",
            value: totalOperators,
            detail: "Operators currently visible to the admin app.",
            icon: Building2,
          },
          {
            label: "High risk",
            value: highRiskCount,
            detail: "Operators flagged as high risk in licensing posture.",
            icon: ShieldAlert,
          },
          {
            label: "Active escalations",
            value: totalActiveEscalations,
            detail: "Current BOCRA queue load across operators.",
            icon: Activity,
          },
          {
            label: "Analytics rows",
            value: operatorAnalytics.results.length,
            detail: "Operators represented in the complaint analytics rollup.",
            icon: Waves,
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

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-kicker">Operator cards</p>
                <CardTitle className="mt-2 text-2xl">
                  Oversight and queue load
                </CardTitle>
                <CardDescription className="mt-2">
                  Operator queue pressure stays here, while the full complaint
                  weight ranking now lives in its own dedicated analytics view.
                </CardDescription>
              </div>
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white px-4 text-sm font-semibold text-slate-700 shadow-[0_12px_28px_rgba(148,163,184,0.14)] transition hover:bg-slate-50 hover:text-slate-950"
                href="/operator-analytics"
              >
                Open operator analytics
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...operators]
              .sort((left, right) => right.activeEscalationCount - left.activeEscalationCount)
              .map((operator) => (
                <div
                  className="rounded-[1.3rem] border border-slate-200/70 bg-white/88 p-4"
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
                      {operator.activeEscalationCount} active queue items
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1rem] bg-slate-50 px-3 py-3">
                      <p className="text-kicker">Complaints</p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">
                        {operator.complaintCount}
                      </p>
                    </div>
                    <div className="rounded-[1rem] bg-slate-50 px-3 py-3">
                      <p className="text-kicker">Escalations</p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">
                        {operator.escalationCount}
                      </p>
                    </div>
                    <div className="rounded-[1rem] bg-slate-950 px-3 py-3 text-white">
                      <p className="text-kicker text-slate-300">Compliance</p>
                      <p className="mt-2 text-xl font-semibold">
                        {formatPercent(operator.complianceScore)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function OperatorsView() {
  return (
    <AdminShell
      actions={<Badge variant="success">Operator oversight</Badge>}
      description="Live operator oversight using the admin operator summary query and the analytics rollups."
      kicker="Admin layer / operators"
      title="Operator Oversight"
    >
      {() => <OperatorsContent />}
    </AdminShell>
  );
}
