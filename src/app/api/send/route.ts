import nodemailer from "nodemailer";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildComplaintEmailText,
  EmailTemplate,
  type EmailTemplateProps,
} from "@/components/email-template";

export const runtime = "nodejs";

const gmailUser = process.env.GMAIL_USER;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
const complaintNotificationEmail = process.env.COMPLAINT_NOTIFICATION_EMAIL;

type ComplaintEmailPayload = EmailTemplateProps;

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

  const body = await request.json();

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

  const html = renderToStaticMarkup(
    EmailTemplate({
      referenceNumber: body.referenceNumber,
      trackingToken: body.trackingToken,
      operatorName: body.operatorName,
      category: body.category,
      description: body.description,
      consumerFirstName: body.consumerFirstName,
      consumerLastName: body.consumerLastName,
      consumerEmail: body.consumerEmail,
      consumerPhone: body.consumerPhone,
    }),
  );

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
      html: `<!DOCTYPE html>${html}`,
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
