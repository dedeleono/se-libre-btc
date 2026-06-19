import { render } from "@react-email/render";
import { sendEmail } from "@/lib/email";
import AuthEmail from "@/components/emails/auth-email";

export async function sendAuthEmail(email: string, url: string) {
  // Throws on a malformed URL; also gives the template its host.
  const { host } = new URL(url);

  const html = await render(AuthEmail({ host, url }));

  return sendEmail({
    to: email,
    subject: "Iniciar sesión en Dinero Libre",
    html,
  });
}
