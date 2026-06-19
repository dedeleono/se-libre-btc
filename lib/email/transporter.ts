/**
 * Dinero Libre Email Transporter
 * ==============================
 *
 * Single Nodemailer transport for the whole app. Every email path
 * (auth links, invitations, admin broadcasts) goes through `sendEmail` /
 * `sendEmails` so there is exactly one place that talks to SMTP.
 *
 * Configured via environment variables (EMAIL_SERVER_HOST / _PORT / _USER /
 * _PASSWORD, EMAIL_FROM).
 */

import { createTransport } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

const port = parseInt(process.env.EMAIL_SERVER_PORT || "465", 10);

const transportConfig: SMTPTransport.Options = {
  host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
  port,
  secure: port === 465,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  tls: {
    rejectUnauthorized: true,
    minVersion: "TLSv1.2",
  },
};

export const transporter = createTransport(transportConfig);

const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || "";

/** Branded sender, e.g. `Dinero Libre <hola@example.com>`. */
export const emailFrom = `Dinero Libre <${fromAddress}>`;

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/** Send a single email through the shared transport. */
export async function sendEmail({ to, subject, html, text, replyTo }: SendEmailOptions) {
  return transporter.sendMail({
    from: emailFrom,
    to,
    subject,
    html,
    text,
    replyTo,
  });
}

/**
 * Send many emails resiliently — one failure does not abort the rest.
 * Returns the settled results so callers can report per-recipient outcomes.
 */
export async function sendEmails(emails: SendEmailOptions[]) {
  return Promise.allSettled(emails.map(sendEmail));
}
