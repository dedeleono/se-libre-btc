import { Button } from "@react-email/components";
import {
  EmailLayout,
  Heading,
  Text,
  eyebrow,
  h1,
  paragraph,
  muted,
  libreTag,
  primaryButton,
  buttonContainer,
  calloutBox,
} from "./brand";

interface InvitationEmailProps {
  inviteUrl: string;
  userEmail: string;
  host: string;
  url: string;
}

export default function InvitationEmail({
  inviteUrl,
  userEmail,
}: InvitationEmailProps) {
  return (
    <EmailLayout
      preview="Has sido invitado a unirte a Dinero Libre"
      footnote="Este enlace de invitación expirará en 24 horas."
    >
      <Text style={eyebrow}>Invitación · #DineroLibre</Text>
      <Heading style={h1}>
        Bienvenido
        <span style={libreTag}> / Libre</span>
      </Heading>
      <Text style={paragraph}>
        Has sido invitado a unirte a Dinero Libre. Haz clic en el botón de abajo
        para configurar tu cuenta y empezar a aprender.
      </Text>

      <table cellPadding={0} cellSpacing={0} role="presentation">
        <tbody>
          <tr>
            <td style={buttonContainer}>
              <Button style={primaryButton} href={inviteUrl}>
                Aceptar invitación
              </Button>
            </td>
          </tr>
        </tbody>
      </table>

      <table
        cellPadding={0}
        cellSpacing={0}
        role="presentation"
        style={{ width: "100%", marginTop: "24px" }}
      >
        <tbody>
          <tr>
            <td style={calloutBox}>
              <Text style={{ ...muted, marginBottom: "4px" }}>
                También puedes iniciar sesión con Google usando este correo:
              </Text>
              <Text style={{ ...paragraph, margin: 0, fontWeight: 700 }}>
                {userEmail}
              </Text>
            </td>
          </tr>
        </tbody>
      </table>
    </EmailLayout>
  );
}
