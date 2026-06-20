import { NextResponse } from "next/server";
import { z } from "zod";

import { sendEmail } from "@/lib/email";

/** Where contact form submissions are delivered. Overridable via env. */
const CONTACT_RECIPIENT = process.env.CONTACT_EMAIL || "soporte@guatelibre.org";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
  message: z.string().trim().min(1).max(5000),
});

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export async function POST(req: Request) {
  if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
    console.error("[CONTACT] Email configuration missing");
    return NextResponse.json(
      { error: "Email configuration missing" },
      { status: 500 }
    );
  }

  const parsed = contactSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const { name, email, message } = parsed.data;

  try {
    await sendEmail({
      to: CONTACT_RECIPIENT,
      replyTo: email,
      subject: `Nuevo mensaje de contacto — ${name}`,
      text: `Nombre: ${name}\nCorreo: ${email}\n\n${message}`,
      html: `
        <div style="font-family: system-ui, sans-serif; line-height: 1.6; color: #1a1a1a;">
          <h2 style="margin: 0 0 16px;">Nuevo mensaje de contacto</h2>
          <p style="margin: 0 0 4px;"><strong>Nombre:</strong> ${escapeHtml(name)}</p>
          <p style="margin: 0 0 16px;"><strong>Correo:</strong> ${escapeHtml(email)}</p>
          <p style="margin: 0 0 4px;"><strong>Mensaje:</strong></p>
          <p style="white-space: pre-wrap; margin: 0;">${escapeHtml(message)}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CONTACT]", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
