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
} from "./brand";

interface AuthEmailProps {
  host: string;
  url: string;
}

export default function AuthEmail({ url }: AuthEmailProps) {
  return (
    <EmailLayout
      preview="Iniciar sesión en Dinero Libre"
      footnote="Si no solicitaste este correo, puedes ignorarlo de forma segura."
    >
      <Text style={eyebrow}>Acceso · #DineroLibre</Text>
      <Heading style={h1}>
        Iniciar sesión
        <span style={libreTag}> / Libre</span>
      </Heading>
      <Text style={paragraph}>
        Haz clic en el botón de abajo para entrar a tu cuenta y seguir tu camino
        hacia el dinero libre.
      </Text>

      <table cellPadding={0} cellSpacing={0} role="presentation">
        <tbody>
          <tr>
            <td style={buttonContainer}>
              <Button style={primaryButton} href={url}>
                Iniciar sesión
              </Button>
            </td>
          </tr>
        </tbody>
      </table>

      <Text style={{ ...muted, marginTop: "20px" }}>
        Este enlace expirará en 24 horas.
      </Text>
    </EmailLayout>
  );
}
