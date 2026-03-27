"use client";

import { useQuery } from "convex/react";
import { BarChart3, Building2, MapPinned, Tags } from "lucide-react";
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

function AnalyticsContent() {
  const regions = useQuery(api.admin.analytics.getAnalyticsByRegion, {});
  const categories = useQuery(api.admin.analytics.getAnalyticsByCategory, {});
  const operators = useQuery(api.admin.analytics.getAnalyticsByOperator, {});

  if (regions === undefined || categories === undefined || operators === undefined) {
    return <div className="panel-shell h-[32rem] animate-pulse" />;
  }

  const topRegions = regions.results.slice(0, 6);
  const topCategories = categories.results.slice(0, 6);
  const topOperators = operators.results.slice(0, 6);

  const maxRegionalCount = Math.max(1, ...topRegions.map((item) => item.complaintCount));
  const maxCategoryCount = Math.max(1, ...topCategories.map((item) => item.complaintCount));
  const maxOperatorCount = Math.max(1, ...topOperators.map((item) => item.complaintCount));

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-3">
        {[
          {
            label: "Regions",
            value: regions.results.length,
            detail: "Regional rows returned by the analytics query.",
            icon: MapPinned,
          },
          {
            label: "Categories",
            value: categories.results.length,
            detail: "Complaint categories represented in the dataset.",
            icon: Tags,
          },
          {
            label: "Operators",
            value: operators.results.length,
            detail: "Operator analytics rows for comparison.",
            icon: Building2,
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

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <p className="text-kicker">Region analytics</p>
            <CardTitle className="mt-2 text-2xl">
              Geographic complaint pressure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topRegions.map((region) => (
              <div key={region.region}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {region.region}
                    </p>
                    <p className="text-sm text-slate-500">
                      {region.escalatedComplaintCount} escalated •{" "}
                      {region.highRiskOperatorCount} high risk
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {region.complaintCount}
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

        <Card>
          <CardHeader>
            <p className="text-kicker">Category analytics</p>
            <CardTitle className="mt-2 text-2xl">
              Complaint categories driving the queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topCategories.map((category) => (
              <div key={category.category}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {formatLabel(category.category)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {category.escalatedComplaintCount} escalated •{" "}
                      {category.underInvestigationCount} under investigation
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {category.complaintCount}
                  </p>
                </div>
                <Progress
                  className="mt-3"
                  value={(category.complaintCount / maxCategoryCount) * 100}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden bg-[linear-gradient(135deg,#081325_0%,#102443_58%,#0d6b69_100%)] text-white">
        <CardHeader className="border-b border-white/10">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Operator analytics
              </p>
              <CardTitle className="mt-2 text-2xl text-white">
                Cross-operator complaint comparison
              </CardTitle>
            </div>
            <BarChart3 className="text-teal-200" size={18} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {topOperators.map((operator) => (
            <div
              className="rounded-[1.2rem] border border-white/10 bg-white/[0.06] p-4"
              key={operator.operatorId}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {operator.operatorName}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {operator.complaintCount} complaints •{" "}
                    {operator.underInvestigationCount} under investigation
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{formatLabel(operator.licenseStatus)}</Badge>
                  <Badge variant={getRiskVariant(operator.riskLevel)}>
                    {formatLabel(operator.riskLevel)}
                  </Badge>
                </div>
              </div>
              <Progress
                className="mt-3 bg-white/10"
                value={(operator.complaintCount / maxOperatorCount) * 100}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function AnalyticsView() {
  return (
    <AdminShell
      actions={<Badge variant="outline">Analytics live</Badge>}
      description="Region, category, and operator analytics driven directly by the current Convex admin rollups."
      kicker="Admin layer / analytics"
      title="Operational Analytics"
    >
      {() => <AnalyticsContent />}
    </AdminShell>
  );
}
