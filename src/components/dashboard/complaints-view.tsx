"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { FileClock, ShieldAlert, TimerReset } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { ComplaintDetailModal } from "@/components/dashboard/complaint-detail-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  formatShortDate,
  getComplaintStatusVariant,
} from "@/lib/admin-dashboard";

function ComplaintsContent() {
  const [activeComplaintId, setActiveComplaintId] = useState<string | null>(null);
  const summary = useQuery(api.admin.analytics.getDashboardSummary, {});
  const queue = useQuery(api.admin.complaints.getEscalatedComplaints, {
    limit: 25,
    includeClosed: true,
  });

  if (summary === undefined || queue === undefined) {
    return <div className="panel-shell h-[32rem] animate-pulse" />;
  }

  const cards = [
    {
      label: "Open queue",
      value: summary.escalatedComplaintCount,
      detail: "All non-closed complaints in BOCRA scope.",
      icon: ShieldAlert,
    },
    {
      label: "Under investigation",
      value: summary.underInvestigationCount,
      detail: "Complaints already in formal admin handling.",
      icon: FileClock,
    },
    {
      label: "Closed escalated",
      value: summary.closedEscalatedCount,
      detail: "Escalated cases already completed.",
      icon: TimerReset,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.label}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-kicker">{card.label}</p>
                  <div className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-white">
                    <Icon size={18} />
                  </div>
                </div>
                <CardTitle className="text-4xl">{card.value}</CardTitle>
                <CardDescription>{card.detail}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <div>
        <Card>
          <CardHeader className="border-b border-slate-200/70">
            <p className="text-kicker">Escalated queue</p>
            <CardTitle className="mt-2 text-2xl">
              Active and historical escalations
            </CardTitle>
            <CardDescription className="mt-2">
              This list is driven directly by the admin complaints query and is
              already scoped to the BOCRA-visible lifecycle.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Escalated</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.map((complaint) => (
                  <TableRow key={complaint._id}>
                    <TableCell>
                      <div className="space-y-1">
                        <button
                          className="font-semibold text-slate-950 transition hover:text-teal-700"
                          onClick={() => setActiveComplaintId(complaint._id)}
                          type="button"
                        >
                          {complaint.referenceNumber}
                        </button>
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
                    <TableCell>{complaint.operatorName}</TableCell>
                    <TableCell>{formatShortDate(complaint.escalatedAt)}</TableCell>
                    <TableCell>{formatShortDate(complaint.slaDeadline)}</TableCell>
                    <TableCell>{complaint.messageCount}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => setActiveComplaintId(complaint._id)}
                        size="sm"
                        variant="outline"
                      >
                        Open modal
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {activeComplaintId ? (
        <ComplaintDetailModal
          complaintId={activeComplaintId}
          onClose={() => setActiveComplaintId(null)}
        />
      ) : null}
    </div>
  );
}

export function ComplaintsView() {
  return (
    <AdminShell
      actions={<Badge variant="warning">Queue view</Badge>}
      description="Escalated complaints visible to BOCRA, with direct paths into the investigation detail workspace."
      kicker="Admin layer / complaints"
      title="Escalated Complaints Queue"
    >
      {() => <ComplaintsContent />}
    </AdminShell>
  );
}
