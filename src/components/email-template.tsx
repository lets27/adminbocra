import * as React from "react";

export type EmailTemplateProps = {
  referenceNumber: string;
  trackingToken: string;
  operatorName: string;
  category: string;
  description?: string | null;
  consumerFirstName?: string | null;
  consumerLastName?: string | null;
  consumerEmail?: string | null;
  consumerPhone?: string | null;
};

function formatLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildComplaintEmailText({
  referenceNumber,
  trackingToken,
  operatorName,
  category,
  description,
  consumerFirstName,
  consumerLastName,
  consumerEmail,
  consumerPhone,
}: EmailTemplateProps): string {
  const fullName = [consumerFirstName, consumerLastName].filter(Boolean).join(" ").trim();

  return [
    "BOCRA Complaint Notification",
    "",
    "A new consumer complaint has been recorded and is ready for follow-up.",
    "",
    `Reference Number: ${referenceNumber}`,
    `Tracking Token: ${trackingToken}`,
    `Operator: ${operatorName}`,
    `Category: ${formatLabel(category)}`,
    `Description: ${description || "Not provided"}`,
    "",
    "Consumer Details",
    `Name: ${fullName || "Not provided"}`,
    `Email: ${consumerEmail || "Not provided"}`,
    `Phone: ${consumerPhone || "Not provided"}`,
  ].join("\n");
}

export function EmailTemplate({
  referenceNumber,
  trackingToken,
  operatorName,
  category,
  description,
  consumerFirstName,
  consumerLastName,
  consumerEmail,
  consumerPhone,
}: EmailTemplateProps) {
  const fullName = [consumerFirstName, consumerLastName].filter(Boolean).join(" ").trim();

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f8fafc",
        padding: "24px",
        color: "#0f172a",
      }}
    >
      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "32px",
          border: "1px solid #e2e8f0",
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            fontSize: "12px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#475569",
          }}
        >
          BOCRA Complaint Notification
        </p>
        <h1 style={{ margin: "0 0 16px", fontSize: "28px", lineHeight: 1.2 }}>
          New complaint submitted
        </h1>
        <p style={{ margin: "0 0 24px", fontSize: "15px", lineHeight: 1.7, color: "#334155" }}>
          A new consumer complaint has been recorded and is ready for follow-up.
        </p>

        <div
          style={{
            borderRadius: "12px",
            backgroundColor: "#f8fafc",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          <p style={{ margin: "0 0 8px", fontSize: "14px" }}>
            <strong>Reference Number:</strong> {referenceNumber}
          </p>
          <p style={{ margin: "0 0 8px", fontSize: "14px" }}>
            <strong>Tracking Token:</strong> {trackingToken}
          </p>
          <p style={{ margin: "0 0 8px", fontSize: "14px" }}>
            <strong>Operator:</strong> {operatorName}
          </p>
          <p style={{ margin: 0, fontSize: "14px" }}>
            <strong>Category:</strong> {formatLabel(category)}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "14px" }}>
            <strong>Description:</strong> {description || "Not provided"}
          </p>
        </div>

        <h2 style={{ margin: "0 0 12px", fontSize: "18px" }}>Consumer Details</h2>
        <div
          style={{
            borderRadius: "12px",
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            padding: "20px",
          }}
        >
          <p style={{ margin: "0 0 8px", fontSize: "14px" }}>
            <strong>Name:</strong> {fullName || "Not provided"}
          </p>
          <p style={{ margin: "0 0 8px", fontSize: "14px" }}>
            <strong>Email:</strong> {consumerEmail || "Not provided"}
          </p>
          <p style={{ margin: 0, fontSize: "14px" }}>
            <strong>Phone:</strong> {consumerPhone || "Not provided"}
          </p>
        </div>
      </div>
    </div>
  );
}
