import nodemailer from "nodemailer";

export const runtime = "nodejs";

const gmailUser = process.env.GMAIL_USER;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
const complaintNotificationEmail = process.env.COMPLAINT_NOTIFICATION_EMAIL;

type ComplaintEmailPayload = {
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validatePayload(payload: unknown): payload is ComplaintEmailPayload {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const record = payload as Record<string, unknown>;
  return (
    isNonEmptyString(record.referenceNumber) &&
    isNonEmptyString(record.trackingToken) &&
    isNonEmptyString(record.operatorName) &&
    isNonEmptyString(record.category)
  );
}

function buildFromAddress(user: string): string {
  return `BOCRA <${user}>`;
}

function normalizeOptionalString(value: unknown): string | null {
  if (!isNonEmptyString(value)) {
    return null;
  }

  return value.trim();
}

function formatCategoryLabel(category: string): string {
  return category
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildComplaintEmailText(payload: ComplaintEmailPayload): string {
  const consumerName = [
    normalizeOptionalString(payload.consumerFirstName),
    normalizeOptionalString(payload.consumerLastName),
  ]
    .filter(Boolean)
    .join(" ");

  const lines = [
    "New BOCRA complaint received",
    "",
    `Reference Number: ${payload.referenceNumber}`,
    `Tracking Token: ${payload.trackingToken}`,
    `Operator: ${payload.operatorName}`,
    `Category: ${formatCategoryLabel(payload.category)}`,
  ];

  if (consumerName) {
    lines.push(`Consumer: ${consumerName}`);
  }

  const consumerEmail = normalizeOptionalString(payload.consumerEmail);
  if (consumerEmail) {
    lines.push(`Consumer Email: ${consumerEmail}`);
  }

  const consumerPhone = normalizeOptionalString(payload.consumerPhone);
  if (consumerPhone) {
    lines.push(`Consumer Phone: ${consumerPhone}`);
  }

  const description = normalizeOptionalString(payload.description);
  if (description) {
    lines.push("", "Description:", description);
  }

  return lines.join("\n");
}

function buildComplaintEmailHtml(payload: ComplaintEmailPayload): string {
  const consumerName = [
    normalizeOptionalString(payload.consumerFirstName),
    normalizeOptionalString(payload.consumerLastName),
  ]
    .filter(Boolean)
    .join(" ");

  const rows = [
    ["Reference Number", payload.referenceNumber],
    ["Tracking Token", payload.trackingToken],
    ["Operator", payload.operatorName],
    ["Category", formatCategoryLabel(payload.category)],
    ["Consumer", consumerName],
    ["Consumer Email", normalizeOptionalString(payload.consumerEmail)],
    ["Consumer Phone", normalizeOptionalString(payload.consumerPhone)],
  ]
    .flatMap(([label, value]) =>
      value ? ([[label, value]] as const) : [],
    )
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 12px;font-weight:600;color:#0f172a;border-bottom:1px solid #e2e8f0;">${escapeHtml(label)}</td>
          <td style="padding:10px 12px;color:#334155;border-bottom:1px solid #e2e8f0;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

  const description = normalizeOptionalString(payload.description);
  const descriptionBlock = description
    ? `
      <div style="margin-top:24px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Description</p>
        <div style="padding:16px;border-radius:16px;background:#f8fafc;color:#334155;line-height:1.6;">
          ${escapeHtml(description).replaceAll("\n", "<br />")}
        </div>
      </div>`
    : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
      <body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:720px;margin:0 auto;padding:32px 16px;">
          <div style="border-radius:24px;background:#ffffff;padding:32px;box-shadow:0 24px 60px rgba(15,23,42,0.08);">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#0f766e;">BOCRA complaint intake</p>
            <h1 style="margin:0;font-size:28px;line-height:1.2;">New complaint received</h1>
            <p style="margin:16px 0 0;color:#475569;line-height:1.7;">
              A new complaint has been submitted and routed to the BOCRA notification mailbox.
            </p>
            <table style="width:100%;margin-top:24px;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;">
              <tbody>${rows}</tbody>
            </table>
            ${descriptionBlock}
          </div>
        </div>
      </body>
    </html>`;
}

export async function POST(request: Request) {
  if (!gmailUser) {
    return Response.json(
      { error: "Missing GMAIL_USER." },
      { status: 500 },
    );
  }

  if (!gmailAppPassword) {
    return Response.json(
      { error: "Missing GMAIL_APP_PASSWORD." },
      { status: 500 },
    );
  }

  if (!complaintNotificationEmail) {
    return Response.json(
      { error: "Missing COMPLAINT_NOTIFICATION_EMAIL." },
      { status: 500 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  if (!validatePayload(body)) {
    return Response.json(
      {
        error:
          "Invalid payload. referenceNumber, trackingToken, operatorName, and category are required.",
      },
      { status: 400 },
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  const html = buildComplaintEmailHtml(body);
  const text = buildComplaintEmailText(body);

  try {
    // Nodemailer recommends verify() to catch configuration issues before sendMail().
    await transporter.verify();

    const result = await transporter.sendMail({
      from: buildFromAddress(gmailUser),
      to: complaintNotificationEmail,
      replyTo: isNonEmptyString(body.consumerEmail) ? body.consumerEmail : undefined,
      subject: `New BOCRA complaint: ${body.referenceNumber}`,
      text,
      html,
    });

    return Response.json({
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
      response: result.response,
    });
  } catch (error) {
    console.error("Failed to send complaint notification email.", error);

    return Response.json(
      { error: "Failed to send complaint notification email." },
      { status: 500 },
    );
  }
}
