"use client";

import { useState, useTransition } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { RefreshCcw } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const operatorLicenseStatuses = [
  "ACTIVE",
  "UNDER_REVIEW",
  "SUSPENDED",
  "EXPIRED",
] as const;

type OperatorLicenseStatusControlProps = {
  className?: string;
  currentStatus: (typeof operatorLicenseStatuses)[number];
  description?: string;
  operatorId: Id<"operators">;
  title?: string;
};

export function OperatorLicenseStatusControl({
  className,
  currentStatus,
  description = "Change the recorded license status for this operator from the live admin dashboard.",
  operatorId,
  title = "Update license status",
}: OperatorLicenseStatusControlProps) {
  const updateOperatorLicenseStatus = useMutation(
    api.admin.operators.updateOperatorLicenseStatus,
  );
  const [pendingSelection, setPendingSelection] = useState<
    (typeof operatorLicenseStatuses)[number] | null
  >(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const selectedStatus = pendingSelection ?? currentStatus;

  const handleSave = () => {
    if (selectedStatus === currentStatus) {
      setFeedback("No status change to save.");
      return;
    }

    startTransition(() => {
      void updateOperatorLicenseStatus({
        operatorId,
        licenseStatus: selectedStatus,
      }).then((result) => {
        if (result.ok) {
          setPendingSelection(null);
          setFeedback("License status updated.");
          return;
        }

        setFeedback(result.reason ?? "Unable to update the license status.");
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
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          className="flex h-11 min-w-[220px] rounded-2xl border border-white/75 bg-white/75 px-4 py-2 text-sm font-medium text-slate-950 shadow-[0_12px_24px_rgba(15,23,42,0.05)] outline-none focus:border-teal-500/50 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
          disabled={isPending}
          onChange={(event) => {
            setFeedback(null);
            setPendingSelection(
              event.target.value as (typeof operatorLicenseStatuses)[number],
            );
          }}
          value={selectedStatus}
        >
          {operatorLicenseStatuses.map((status) => (
            <option key={status} value={status}>
              {status
                .toLowerCase()
                .split("_")
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(" ")}
            </option>
          ))}
        </select>
        <Button disabled={isPending} onClick={handleSave} variant="secondary">
          Save status
          <RefreshCcw size={16} />
        </Button>
      </div>

      {feedback ? <p className="mt-3 text-sm text-slate-500">{feedback}</p> : null}
    </div>
  );
}
