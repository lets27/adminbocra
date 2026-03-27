"use client";

import Link from "next/link";
import type { Id } from "../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  ClipboardList,
  FileWarning,
  ShieldAlert,
  Users,
  Waves,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { OperatorLicenseStatusControl } from "@/components/dashboard/operator-license-status-control";
import { RegulatoryActionComposer } from "@/components/dashboard/regulatory-action-composer";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  getRiskVariant,
} from "@/lib/admin-dashboard";

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Building2;
}) {
  return (
    <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.08] px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">
          {label}
        </p>
        <Icon className="text-teal-300" size={16} />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-300">{detail}</p>
    </div>
  );
}

export function OperatorDetailView({ operatorId }: { operatorId: string }) {
  const profile = useQuery(api.shared.auth.getCurrentAdminProfile, {});
  const convexOperatorId = operatorId as Id<"operators">;
  const detail = useQuery(
    api.admin.operators.getOperatorById,
    profile?.admin ? { operatorId: convexOperatorId } : "skip",
  );
  const analytics = useQuery(
    api.admin.analytics.getAnalyticsByOperator,
    profile?.admin ? { operatorId: convexOperatorId } : "skip",
  );

  return (
    <AdminShell
      actions={<Badge variant="success">Operator detail</Badge>}
      description="Live operator performance page for BOCRA staff, combining licensing posture, complaint pressure, policies, assigned users, and regulatory history."
      kicker="Admin layer / operator detail"
      title="Operator Performance Detail"
    >
      {() => {
        if (detail === undefined || analytics === undefined) {
          return <div className="panel-shell h-[40rem] animate-pulse" />;
        }

        if (detail === null) {
          return (
            <Card>
              <CardHeader>
                <p className="text-kicker">Operator not found</p>
                <CardTitle>This operator record is not available anymore.</CardTitle>
                <CardDescription>
                  The map link may be pointing at an operator that was removed or is
                  no longer admin-visible.
                </CardDescription>
              </CardHeader>
            </Card>
          );
        }

        const operator = detail.operator;
        const metrics = analytics.results[0] ?? null;

        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white px-4 text-sm font-semibold text-slate-700 shadow-[0_12px_28px_rgba(148,163,184,0.14)] transition hover:bg-slate-50 hover:text-slate-950"
                href="/map"
              >
                <ArrowLeft size={16} />
                Back to map
              </Link>
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white px-4 text-sm font-semibold text-slate-700 shadow-[0_12px_28px_rgba(148,163,184,0.14)] transition hover:bg-slate-50 hover:text-slate-950"
                href="/operators"
              >
                Operator list
                <ArrowUpRight size={16} />
              </Link>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-kicker">Operator profile</p>
                      <CardTitle className="mt-2 text-3xl">{operator.name}</CardTitle>
                      <CardDescription className="mt-2 max-w-2xl">
                        {operator.locationLabel ??
                          operator.physicalAddress ??
                          operator.city ??
                          "No address details captured yet."}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={getLicenseStatusVariant(operator.licenseStatus)}>
                        {formatLabel(operator.licenseStatus)}
                      </Badge>
                      <Badge variant={getRiskVariant(operator.riskLevel)}>
                        {formatLabel(operator.riskLevel)} risk
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4">
                    <p className="text-kicker">License type</p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {operator.licenseType}
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4">
                    <p className="text-kicker">Expiry date</p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {formatShortDate(operator.expiryDate)}
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4">
                    <p className="text-kicker">Compliance score</p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {formatPercent(operator.complianceScore)}
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4">
                    <p className="text-kicker">Email</p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {operator.email}
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4">
                    <p className="text-kicker">Phone</p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {operator.contactPhone ?? "Not provided"}
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4">
                    <p className="text-kicker">Policy coverage</p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {detail.policies.length} complaint policies
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden bg-[linear-gradient(135deg,#081325_0%,#102443_58%,#0d6b69_100%)] text-white">
                <CardHeader className="border-b border-white/10">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Performance signal
                  </p>
                  <CardTitle className="mt-2 text-2xl text-white">
                    Complaint and licensing pressure
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                  <MetricCard
                    detail="All complaints currently associated with this operator."
                    icon={ClipboardList}
                    label="Complaints"
                    value={detail.summary.complaintCount}
                  />
                  <MetricCard
                    detail="Escalation records raised against this operator."
                    icon={ShieldAlert}
                    label="Escalations"
                    value={detail.summary.escalationCount}
                  />
                  <MetricCard
                    detail="Cases still active in the BOCRA queue."
                    icon={FileWarning}
                    label="Active queue"
                    value={detail.summary.activeEscalationCount}
                  />
                  <MetricCard
                    detail="Closed and under-investigation counts from analytics."
                    icon={Waves}
                    label="Closed / active"
                    value={`${metrics?.closedComplaintCount ?? 0} / ${metrics?.underInvestigationCount ?? 0}`}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <Card>
                <CardHeader>
                  <p className="text-kicker">Licensing posture</p>
                  <CardTitle className="mt-2 text-2xl">
                    Operating and coverage details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.2rem] border border-slate-200/70 bg-slate-50 px-4 py-4">
                      <p className="text-kicker">Status</p>
                      <p className="mt-2 text-base font-semibold text-slate-950">
                        {formatLabel(operator.licenseStatus)}
                      </p>
                    </div>
                    <div className="rounded-[1.2rem] border border-slate-200/70 bg-slate-50 px-4 py-4">
                      <p className="text-kicker">Risk level</p>
                      <p className="mt-2 text-base font-semibold text-slate-950">
                        {formatLabel(operator.riskLevel)}
                      </p>
                    </div>
                    <div className="rounded-[1.2rem] border border-slate-200/70 bg-slate-50 px-4 py-4">
                      <p className="text-kicker">SLA configured</p>
                      <p className="mt-2 text-base font-semibold text-slate-950">
                        {operator.slaPolicyConfigured ? "Yes" : "No"}
                      </p>
                    </div>
                    <div className="rounded-[1.2rem] border border-slate-200/70 bg-slate-50 px-4 py-4">
                      <p className="text-kicker">Last updated</p>
                      <p className="mt-2 text-base font-semibold text-slate-950">
                        {formatTimestamp(operator.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <OperatorLicenseStatusControl
                    currentStatus={operator.licenseStatus}
                    description="Use the operator detail workspace for a direct licensing decision when the watchlist view is not enough."
                    operatorId={convexOperatorId}
                  />

                  <div>
                    <p className="mb-2 text-kicker">Region coverage</p>
                    <div className="flex flex-wrap gap-2">
                      {operator.regionCoverage.length > 0 ? (
                        operator.regionCoverage.map((region) => (
                          <Badge key={region} variant="secondary">
                            {region}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline">No regions listed</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <p className="text-kicker">Assigned users</p>
                  <CardTitle className="mt-2 text-2xl">
                    Operator-side accounts mapped in Convex
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {detail.assignedUsers.length === 0 ? (
                    <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4 text-sm text-slate-500">
                      No operator-side user accounts are currently mapped to this operator.
                    </div>
                  ) : (
                    detail.assignedUsers.map((user) => (
                      <div
                        className="flex items-center justify-between rounded-[1.2rem] border border-slate-200/70 bg-slate-50 px-4 py-4"
                        key={user._id}
                      >
                        <div>
                          <p className="font-semibold text-slate-950">
                            {user.name ?? "Unnamed user"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {user.email ?? "No email on file"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Users size={16} />
                          <Badge variant="outline">{formatLabel(user.role)}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <Card>
                <CardHeader>
                  <p className="text-kicker">Complaint policies</p>
                  <CardTitle className="mt-2 text-2xl">
                    SLA and escalation configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {detail.policies.length === 0 ? (
                    <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4 text-sm text-slate-500">
                      No complaint policies are configured for this operator yet.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead>SLA</TableHead>
                          <TableHead>Escalatable</TableHead>
                          <TableHead>Auto escalate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.policies.map((policy) => (
                          <TableRow key={policy._id}>
                            <TableCell className="font-semibold text-slate-950">
                              {formatLabel(policy.complaintCategory)}
                            </TableCell>
                            <TableCell>{policy.slaHours} hours</TableCell>
                            <TableCell>
                              <Badge variant={policy.isEscalatable ? "warning" : "outline"}>
                                {policy.isEscalatable ? "Allowed" : "Blocked"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  policy.autoEscalateOnSlaBreach ? "danger" : "secondary"
                                }
                              >
                                {policy.autoEscalateOnSlaBreach ? "Enabled" : "Manual"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <p className="text-kicker">Regulatory actions</p>
                  <CardTitle className="mt-2 text-2xl">
                    BOCRA intervention history
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <RegulatoryActionComposer
                    description="Log an operator-level intervention even when it is not tied to a single complaint."
                    operatorId={convexOperatorId}
                  />
                  {detail.regulatoryActions.length === 0 ? (
                    <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4 text-sm text-slate-500">
                      No regulatory actions have been recorded for this operator yet.
                    </div>
                  ) : (
                    detail.regulatoryActions.map((action) => (
                      <div
                        className="rounded-[1.2rem] border border-slate-200/70 bg-slate-50 px-4 py-4"
                        key={action._id}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-semibold text-slate-950">
                            {formatLabel(action.actionType)}
                          </p>
                          <Badge variant="outline">
                            {formatTimestamp(action.createdAt)}
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {action.notes}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <p className="text-kicker">Recent complaints</p>
                <CardTitle className="mt-2 text-2xl">
                  Latest complaint traffic for this operator
                </CardTitle>
              </CardHeader>
              <CardContent>
                {detail.recentComplaints.length === 0 ? (
                  <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4 text-sm text-slate-500">
                    There are no complaint records attached to this operator yet.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Route</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.recentComplaints.map((complaint) => (
                        <TableRow key={complaint._id}>
                          <TableCell className="font-semibold text-slate-950">
                            {complaint.referenceNumber ?? "Pending ref"}
                          </TableCell>
                          <TableCell>{formatLabel(complaint.category)}</TableCell>
                          <TableCell>
                            <Badge variant={getComplaintStatusVariant(complaint.status ?? "")}>
                              {formatLabel(complaint.status ?? "SUBMITTED_TO_OPERATOR")}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatTimestamp(complaint.submittedAt)}</TableCell>
                          <TableCell>
                            <Link
                              className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-800"
                              href={`/complaints/${complaint._id}`}
                            >
                              Open complaint
                              <ArrowUpRight size={15} />
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        );
      }}
    </AdminShell>
  );
}
