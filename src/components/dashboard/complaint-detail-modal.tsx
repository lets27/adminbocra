"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowUpRight,
  MessageSquarePlus,
  Scale,
  ShieldCheck,
  X,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { RegulatoryActionComposer } from "@/components/dashboard/regulatory-action-composer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  formatLabel,
  formatTimestamp,
  getComplaintStatusVariant,
  getLicenseStatusVariant,
  getRiskVariant,
} from "@/lib/admin-dashboard";

type ComplaintDetailModalProps = {
  complaintId: string;
  onClose: () => void;
};

export function ComplaintDetailModal({
  complaintId,
  onClose,
}: ComplaintDetailModalProps) {
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

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleStartInvestigation = () => {
    startTransition(() => {
      void startInvestigation({ complaintId: convexComplaintId }).then((result) => {
        setFeedback(
          result.ok
            ? "Investigation started."
            : result.reason ?? "Unable to start the investigation.",
        );
      });
    });
  };

  const handleCloseComplaint = () => {
    startTransition(() => {
      void closeComplaint({ complaintId: convexComplaintId }).then((result) => {
        setFeedback(
          result.ok
            ? "Complaint closed."
            : result.reason ?? "Unable to close the complaint.",
        );
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
        setFeedback(
          result.ok
            ? "Internal message added."
            : result.reason ?? "Unable to add the internal message.",
        );
        if (result.ok) {
          setDraftMessage("");
        }
      });
    });
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/75 bg-white shadow-[0_36px_100px_rgba(15,23,42,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/70 px-6 py-5">
          <div>
            <p className="text-kicker">Investigation workspace</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
              Complaint detail modal
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Review the case, start or close investigations, and add internal
              notes without leaving the queue.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white px-4 text-sm font-semibold text-slate-700 shadow-[0_12px_28px_rgba(148,163,184,0.14)] transition hover:bg-slate-50 hover:text-slate-950"
              href={`/complaints/${complaintId}`}
            >
              Open full page
              <ArrowUpRight size={16} />
            </Link>
            <button
              className="grid size-11 place-items-center rounded-2xl border border-slate-200/70 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
              onClick={onClose}
              type="button"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto px-6 py-6">
          {detail === undefined ? (
            <div className="panel-shell h-[34rem] animate-pulse" />
          ) : detail === null ? (
            <div className="rounded-[1.5rem] border border-slate-200/70 bg-slate-50 px-5 py-5">
              <p className="text-kicker">Complaint not found</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                This complaint is not currently available in the admin queue.
              </p>
            </div>
          ) : (
            (() => {
              const canStartInvestigation =
                detail.complaint.status === "ESCALATED_TO_BOCRA";
              const canCloseComplaint =
                detail.complaint.status === "UNDER_INVESTIGATION";

              return (
                <div className="space-y-6">
                  <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-[1.6rem] border border-slate-200/70 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-kicker">Case reference</p>
                          <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                            {detail.complaint.referenceNumber}
                          </h3>
                          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                            {detail.complaint.description ??
                              "No free-text description was submitted with this complaint."}
                          </p>
                        </div>
                        <Badge
                          variant={getComplaintStatusVariant(detail.complaint.status ?? "")}
                        >
                          {formatLabel(
                            detail.complaint.status ?? "SUBMITTED_TO_OPERATOR",
                          )}
                        </Badge>
                      </div>

                      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4">
                          <p className="text-kicker">Category</p>
                          <p className="mt-2 font-semibold text-slate-950">
                            {formatLabel(detail.complaint.category)}
                          </p>
                        </div>
                        <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4">
                          <p className="text-kicker">Submitted</p>
                          <p className="mt-2 font-semibold text-slate-950">
                            {formatTimestamp(detail.complaint.submittedAt)}
                          </p>
                        </div>
                        <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4">
                          <p className="text-kicker">Escalated</p>
                          <p className="mt-2 font-semibold text-slate-950">
                            {formatTimestamp(detail.complaint.escalatedAt)}
                          </p>
                        </div>
                        <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4">
                          <p className="text-kicker">SLA deadline</p>
                          <p className="mt-2 font-semibold text-slate-950">
                            {formatTimestamp(detail.complaint.slaDeadline)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.6rem] bg-[linear-gradient(135deg,#081325_0%,#102443_58%,#0d6b69_100%)] p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Admin actions
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">
                        Move the complaint forward
                      </h3>
                      <div className="mt-5 space-y-4">
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
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                    <div className="rounded-[1.5rem] border border-slate-200/70 bg-white p-5">
                      <p className="text-kicker">Operator context</p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                        {detail.operator?.name ?? "Unknown operator"}
                      </h3>
                      {detail.operator ? (
                        <div className="mt-4 space-y-4">
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              variant={getLicenseStatusVariant(detail.operator.licenseStatus)}
                            >
                              {formatLabel(detail.operator.licenseStatus)}
                            </Badge>
                            <Badge variant={getRiskVariant(detail.operator.riskLevel)}>
                              {formatLabel(detail.operator.riskLevel)} risk
                            </Badge>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4">
                              <p className="text-kicker">Compliance score</p>
                              <p className="mt-2 font-semibold text-slate-950">
                                {detail.operator.complianceScore ?? "n/a"}
                              </p>
                            </div>
                            <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4">
                              <p className="text-kicker">Policy match</p>
                              <p className="mt-2 font-semibold text-slate-950">
                                {detail.applicablePolicy
                                  ? `${detail.applicablePolicy.slaHours} hour SLA`
                                  : "No category policy found"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200/70 bg-white p-5">
                      <p className="text-kicker">Documents</p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                        Evidence and complaint uploads
                      </h3>
                      <div className="mt-4 space-y-3">
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
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                    <div className="rounded-[1.5rem] border border-slate-200/70 bg-white p-5">
                      <p className="text-kicker">Internal messages</p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                        Admin and stakeholder notes
                      </h3>
                      <div className="mt-4 space-y-4">
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
                          <Button
                            className="mt-3"
                            disabled={isPending}
                            onClick={handleAddMessage}
                          >
                            Add message
                            <MessageSquarePlus size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200/70 bg-white p-5">
                      <p className="text-kicker">Escalation history</p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                        Regulatory and escalation trail
                      </h3>
                      <div className="mt-4 space-y-4">
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
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}
