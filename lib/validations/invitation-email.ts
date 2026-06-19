import { render } from "@react-email/render";
import { sendEmail } from "@/lib/email";
import InvitationEmail from "@/components/emails/invitation-email";

export async function sendInvitationEmail(email: string, url: string) {
  const { host } = new URL(url);

  const html = await render(
    InvitationEmail({ userEmail: email, inviteUrl: url, host, url })
  );

  return sendEmail({
    to: email,
    subject: "Bienvenido a Dinero Libre",
    text: `Termina de registrarte en Dinero Libre\n${url}\n\n`,
    html,
  });
}
