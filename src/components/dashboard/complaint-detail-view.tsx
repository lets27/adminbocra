"use client";

import { useState, useTransition } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { ArrowUpRight, MessageSquarePlus, Scale, ShieldCheck } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { RegulatoryActionComposer } from "@/components/dashboard/regulatory-action-composer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  formatLabel,
  formatTimestamp,
  getComplaintStatusVariant,
  getLicenseStatusVariant,
  getRiskVariant,
} from "@/lib/admin-dashboard";

export function ComplaintDetailView({ complaintId }: { complaintId: string }) {
  const convexComplaintId = complaintId as Id<"complaints">;
  const detail = useQuery(api.admin.complaints.getComplaintById, {
    complaintId: convexComplaintId,
  });
  const startInvestigation = useMutation(api.admin.complaints.startInvestigation);
  const closeComplaint = useMutation(api.admin.complaints.closeComplaint);
  const addComplaintMessage = useMutation(api.admin.complaints.addComplaintMessage);

  const [draftMessage, setDraftMessage] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleStartInvestigation = () => {
    startTransition(() => {
      void startInvestigation({ complaintId: convexComplaintId }).then((result) => {
        setFeedback(result.ok ? "Investigation started." : result.reason);
      });
    });
  };

  const handleCloseComplaint = () => {
    startTransition(() => {
      void closeComplaint({ complaintId: convexComplaintId }).then((result) => {
        setFeedback(result.ok ? "Complaint closed." : result.reason);
      });
    });
  };

  const handleAddMessage = () => {
    if (!draftMessage.trim()) {
      setFeedback("Write a message before sending.");
      return;
    }

    startTransition(() => {
      void addComplaintMessage({
        complaintId: convexComplaintId,
        message: draftMessage,
      }).then((result) => {
        setFeedback(result.ok ? "Internal message added." : result.reason);
        if (result.ok) {
          setDraftMessage("");
        }
      });
    });
  };

  return (
    <AdminShell
      actions={<Badge variant="outline">Investigation workspace</Badge>}
      description="Full complaint dossier for BOCRA staff, including evidence, escalation history, policy context, and admin actions."
      kicker="Admin layer / complaint detail"
      title="Complaint Investigation Detail"
    >
      {() => {
        if (detail === undefined) {
          return <div className="panel-shell h-[36rem] animate-pulse" />;
        }

        if (detail === null) {
          return (
            <Card>
              <CardHeader>
                <p className="text-kicker">Complaint not found</p>
                <CardTitle>This complaint is not in the admin-visible queue.</CardTitle>
              </CardHeader>
            </Card>
          );
        }

        const canStartInvestigation = detail.complaint.status === "ESCALATED_TO_BOCRA";
        const canCloseComplaint = detail.complaint.status === "UNDER_INVESTIGATION";

        return (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-kicker">Case reference</p>
                      <CardTitle className="mt-2 text-3xl">
                        {detail.complaint.referenceNumber}
                      </CardTitle>
                      <CardDescription className="mt-2 max-w-2xl">
                        {detail.complaint.description ??
                          "No free-text description was submitted with this complaint."}
                      </CardDescription>
                    </div>
                    <Badge variant={getComplaintStatusVariant(detail.complaint.status ?? "")}>
                      {formatLabel(detail.complaint.status ?? "SUBMITTED_TO_OPERATOR")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4">
                    <p className="text-kicker">Category</p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {formatLabel(detail.complaint.category)}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4">
                    <p className="text-kicker">Submitted</p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {formatTimestamp(detail.complaint.submittedAt)}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4">
                    <p className="text-kicker">Escalated</p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {formatTimestamp(detail.complaint.escalatedAt)}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4">
                    <p className="text-kicker">SLA deadline</p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {formatTimestamp(detail.complaint.slaDeadline)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden bg-[linear-gradient(135deg,#081325_0%,#102443_58%,#0d6b69_100%)] text-white">
                <CardHeader className="border-b border-white/10">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Admin actions
                  </p>
                  <CardTitle className="mt-2 text-2xl text-white">
                    Move the complaint forward
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <Button
                    className="w-full justify-between"
                    disabled={!canStartInvestigation || isPending}
                    onClick={handleStartInvestigation}
                  >
                    Start investigation
                    <ShieldCheck size={16} />
                  </Button>
                  <Button
                    className="w-full justify-between"
                    disabled={!canCloseComplaint || isPending}
                    onClick={handleCloseComplaint}
                    variant="secondary"
                  >
                    Close complaint
                    <Scale size={16} />
                  </Button>
                  <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.06] p-4 text-sm text-slate-300">
                    `ESCALATION_REQUESTED` complaints still need the acceptance
                    step that promotes them to `ESCALATED_TO_BOCRA` before the
                    investigation mutation applies.
                  </div>
                  {feedback ? (
                    <div className="rounded-[1.2rem] border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                      {feedback}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <Card>
                <CardHeader>
                  <p className="text-kicker">Operator context</p>
                  <CardTitle className="mt-2 text-2xl">
                    {detail.operator?.name ?? "Unknown operator"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {detail.operator ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={getLicenseStatusVariant(detail.operator.licenseStatus)}>
                          {formatLabel(detail.operator.licenseStatus)}
                        </Badge>
                        <Badge variant={getRiskVariant(detail.operator.riskLevel)}>
                          {formatLabel(detail.operator.riskLevel)} risk
                        </Badge>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4">
                          <p className="text-kicker">Compliance score</p>
                          <p className="mt-2 text-base font-semibold text-slate-950">
                            {detail.operator.complianceScore ?? "n/a"}
                          </p>
                        </div>
                        <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4">
                          <p className="text-kicker">Policy match</p>
                          <p className="mt-2 text-base font-semibold text-slate-950">
                            {detail.applicablePolicy
                              ? `${detail.applicablePolicy.slaHours} hour SLA`
                              : "No category policy found"}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <p className="text-kicker">Documents</p>
                  <CardTitle className="mt-2 text-2xl">
                    Evidence and complaint uploads
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {detail.documents.length === 0 ? (
                    <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4 text-sm text-slate-500">
                      No documents are attached to this complaint.
                    </div>
                  ) : (
                    detail.documents.map((document) => (
                      <a
                        className="flex items-center justify-between rounded-[1.2rem] border border-slate-200/70 bg-slate-50 px-4 py-4 transition hover:border-teal-200 hover:bg-white"
                        href={document.fileUrl ?? "#"}
                        key={document._id}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <div>
                          <p className="font-semibold text-slate-950">
                            {document.fileName}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatLabel(document.documentType)} •{" "}
                            {formatTimestamp(document.uploadedAt)}
                          </p>
                        </div>
                        <ArrowUpRight size={16} />
                      </a>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <Card>
                <CardHeader>
                  <p className="text-kicker">Internal messages</p>
                  <CardTitle className="mt-2 text-2xl">
                    Admin and stakeholder notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {detail.messages.map((message) => (
                      <div
                        className="rounded-[1.2rem] border border-slate-200/70 bg-slate-50 px-4 py-4"
                        key={message._id}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-slate-950">
                            {message.senderName ?? message.senderType}
                          </p>
                          <Badge variant="outline">
                            {formatLabel(message.visibility)}
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {message.message}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-[1.2rem] border border-slate-200/70 bg-white px-4 py-4">
                    <p className="mb-3 text-sm font-semibold text-slate-950">
                      Add internal message
                    </p>
                    <Textarea
                      onChange={(event) => setDraftMessage(event.target.value)}
                      placeholder="Capture investigation notes, operator follow-up, or next steps..."
                      value={draftMessage}
                    />
                    <Button className="mt-3" disabled={isPending} onClick={handleAddMessage}>
                      Add message
                      <MessageSquarePlus size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <p className="text-kicker">Escalation history</p>
                  <CardTitle className="mt-2 text-2xl">
                    Regulatory and escalation trail
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RegulatoryActionComposer complaintId={convexComplaintId} />
                  {detail.escalations.map((escalation) => (
                    <div
                      className="rounded-[1.2rem] border border-slate-200/70 bg-slate-50 px-4 py-4"
                      key={escalation._id}
                    >
                      <p className="font-semibold text-slate-950">
                        {formatLabel(escalation.triggerType)}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Triggered {formatTimestamp(escalation.triggeredAt)}
                      </p>
                    </div>
                  ))}
                  {detail.regulatoryActions.map((action) => (
                    <div
                      className="rounded-[1.2rem] border border-slate-200/70 bg-white px-4 py-4"
                      key={action._id}
                    >
                      <p className="font-semibold text-slate-950">
                        {formatLabel(action.actionType)}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {action.notes}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        );
      }}
    </AdminShell>
  );
}
