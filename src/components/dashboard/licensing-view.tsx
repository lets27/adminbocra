"use client";

import { useQuery } from "convex/react";
import { FileWarning, ShieldAlert, TriangleAlert } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { OperatorLicenseStatusControl } from "@/components/dashboard/operator-license-status-control";
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
  getRecommendedActionVariant,
  getRiskVariant,
} from "@/lib/admin-dashboard";

function LicensingContent() {
  const overview = useQuery(api.admin.licensing.getLicensingOverview, {
    limit: 12,
  });

  if (overview === undefined) {
    return <div className="panel-shell h-[32rem] animate-pulse" />;
  }

  const statusCards = [
    {
      label: "Active",
      value: overview.statusCounts.active,
      detail: "Operators with active license status.",
    },
    {
      label: "Under review",
      value: overview.statusCounts.underReview,
      detail: "Operators already in review motion.",
    },
    {
      label: "Suspended",
      value: overview.statusCounts.suspended,
      detail: "Operators under suspension.",
    },
    {
      label: "Expired",
      value: overview.statusCounts.expired,
      detail: "Operators requiring expiry follow-up.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-4">
        {statusCards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <p className="text-kicker">{card.label}</p>
              <CardTitle className="text-4xl">{card.value}</CardTitle>
              <CardDescription>{card.detail}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <p className="text-kicker">High-risk operators</p>
            <CardTitle className="mt-2 text-2xl">
              Licensing watchlist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.highRiskOperators.map((operator) => (
              <div
                className="rounded-[1.35rem] border border-slate-200/70 bg-white/88 p-4"
                key={operator.operatorId}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
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
                    <p className="text-kicker text-slate-300">Compliance</p>
                    <p className="mt-2 text-xl font-semibold">
                      {formatPercent(operator.complianceScore)}
                    </p>
                  </div>
                  <div className="rounded-[1rem] bg-slate-50 px-3 py-3">
                    <p className="text-kicker">Complaints</p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">
                      {operator.complaintCount}
                    </p>
                  </div>
                  <div className="rounded-[1rem] bg-slate-50 px-3 py-3">
                    <p className="text-kicker">Escalated</p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">
                      {operator.escalatedComplaintCount}
                    </p>
                  </div>
                </div>
                <OperatorLicenseStatusControl
                  className="mt-4"
                  currentStatus={operator.licenseStatus}
                  description="Update the live licensing posture for this watchlist operator without leaving the panel."
                  operatorId={operator.operatorId}
                  title="Regulatory status control"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-[linear-gradient(135deg,#081325_0%,#102443_58%,#0d6b69_100%)] text-white">
          <CardHeader className="border-b border-white/10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Recommended actions
            </p>
            <CardTitle className="mt-2 text-2xl text-white">
              What the licensing query is signaling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {overview.recommendedActions.length === 0 ? (
              <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.06] p-4 text-sm text-slate-300">
                No active review recommendations are being returned right now.
              </div>
            ) : (
              overview.recommendedActions.map((operator) => (
                <div
                  className="rounded-[1.2rem] border border-white/10 bg-white/[0.06] p-4"
                  key={operator.operatorId}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {operator.operatorName}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {operator.escalatedComplaintCount} escalated complaints •{" "}
                        {formatPercent(operator.complianceScore)}
                      </p>
                    </div>
                    <Badge variant={getRecommendedActionVariant(operator.recommendedAction)}>
                      {formatLabel(operator.recommendedAction)}
                    </Badge>
                  </div>
                </div>
              ))
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.06] p-4">
                <FileWarning className="text-teal-200" size={18} />
                <p className="mt-3 text-sm text-slate-300">
                  `getLicensingOverview` is now driving the watchlist and
                  summary counts directly.
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.06] p-4">
                <ShieldAlert className="text-teal-200" size={18} />
                <p className="mt-3 text-sm text-slate-300">
                  Risk level and complaint pressure are surfaced without mock
                  calculations.
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.06] p-4">
                <TriangleAlert className="text-teal-200" size={18} />
                <p className="mt-3 text-sm text-slate-300">
                  Future status-changing controls can hang directly off the
                  existing licensing mutation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function LicensingView() {
  return (
    <AdminShell
      actions={<Badge variant="warning">Licensing posture</Badge>}
      description="Live licensing overview of operator status counts, high-risk entities, and recommended regulatory follow-up."
      kicker="Admin layer / licensing"
      title="Licensing Intelligence Panel"
    >
      {() => <LicensingContent />}
    </AdminShell>
  );
}
