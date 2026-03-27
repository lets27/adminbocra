"use client";

import { useState, useTransition } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Scale } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const regulatoryActionOptions = [
  "WARNING",
  "NOTICE",
  "AUDIT",
  "PENALTY",
  "LICENSE_REVIEW",
] as const;

type RegulatoryActionComposerProps = {
  complaintId?: Id<"complaints">;
  operatorId?: Id<"operators">;
  className?: string;
  description?: string;
  title?: string;
};

export function RegulatoryActionComposer({
  complaintId,
  operatorId,
  className,
  description = "Log a formal BOCRA action with notes so the regulatory trail stays current.",
  title = "Record regulatory action",
}: RegulatoryActionComposerProps) {
  const createRegulatoryAction = useMutation(
    api.admin.complaints.createRegulatoryAction,
  );
  const [actionType, setActionType] =
    useState<(typeof regulatoryActionOptions)[number]>("WARNING");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!notes.trim()) {
      setFeedback("Write notes before recording an action.");
      return;
    }

    startTransition(() => {
      void createRegulatoryAction({
        ...(complaintId ? { complaintId } : {}),
        ...(operatorId ? { operatorId } : {}),
        actionType,
        notes,
      }).then((result) => {
        if (result.ok) {
          setFeedback("Regulatory action recorded.");
          setNotes("");
          return;
        }

        setFeedback(result.reason ?? "Unable to record the regulatory action.");
      });
    });
  };

  return (
    <div
      className={cn(
        "rounded-[1.2rem] border border-slate-200/70 bg-white px-4 py-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[220px_1fr]">
        <div>
          <label
            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
            htmlFor={`regulatory-action-type-${complaintId ?? operatorId ?? "generic"}`}
          >
            Action type
          </label>
          <select
            className="flex h-11 w-full rounded-2xl border border-white/75 bg-white/75 px-4 py-2 text-sm font-medium text-slate-950 shadow-[0_12px_24px_rgba(15,23,42,0.05)] outline-none focus:border-teal-500/50 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
            disabled={isPending}
            id={`regulatory-action-type-${complaintId ?? operatorId ?? "generic"}`}
            onChange={(event) => {
              setFeedback(null);
              setActionType(
                event.target.value as (typeof regulatoryActionOptions)[number],
              );
            }}
            value={actionType}
          >
            {regulatoryActionOptions.map((option) => (
              <option key={option} value={option}>
                {option
                  .toLowerCase()
                  .split("_")
                  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(" ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
            htmlFor={`regulatory-action-notes-${complaintId ?? operatorId ?? "generic"}`}
          >
            Notes
          </label>
          <Textarea
            className="min-h-24"
            disabled={isPending}
            id={`regulatory-action-notes-${complaintId ?? operatorId ?? "generic"}`}
            onChange={(event) => {
              setFeedback(null);
              setNotes(event.target.value);
            }}
            placeholder="Capture the regulatory decision, rationale, and next steps..."
            value={notes}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button disabled={isPending} onClick={handleSubmit}>
          Record action
          <Scale size={16} />
        </Button>
        {feedback ? (
          <p className="text-sm text-slate-500">{feedback}</p>
        ) : null}
      </div>
    </div>
  );
}
