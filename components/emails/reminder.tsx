import { Button, Link } from "@react-email/components";
import * as React from "react";
import {
  EmailLayout,
  Heading,
  Text,
  Section,
  eyebrow,
  h1,
  paragraph,
  muted,
  link,
  primaryButton,
  buttonContainer,
  calloutBox,
  BASE_URL,
} from "./brand";

interface GithubAccessTokenEmailProps {
  username?: string;
}

export const GithubAccessTokenEmail = ({
  username = "Estudiante",
}: GithubAccessTokenEmailProps) => (
  <EmailLayout
    preview="Recordatorio: tienes una tarea pendiente en la plataforma"
    footnote="Recibes este correo porque eres parte de la comunidad Dinero Libre."
  >
    <Text style={eyebrow}>Recordatorio · #DineroLibre</Text>
    <Heading style={h1}>Tienes pendientes</Heading>
    <Text style={paragraph}>
      Hola <strong>{username}</strong>, hay actividades en tu plataforma que
      requieren tu atención.
    </Text>

    <table
      cellPadding={0}
      cellSpacing={0}
      role="presentation"
      style={{ width: "100%" }}
    >
      <tbody>
        <tr>
          <td style={calloutBox}>
            <Text style={{ ...paragraph, margin: 0 }}>
              Tienes tareas pendientes por revisar.{" "}
              <Link style={link} href={`${BASE_URL}/student`}>
                Ver detalles
              </Link>
            </Text>
          </td>
        </tr>
      </tbody>
    </table>

    <table cellPadding={0} cellSpacing={0} role="presentation">
      <tbody>
        <tr>
          <td style={buttonContainer}>
            <Button style={primaryButton} href={`${BASE_URL}/student`}>
              Ver mis tareas
            </Button>
          </td>
        </tr>
      </tbody>
    </table>

    <Section style={{ marginTop: "24px" }}>
      <Text style={muted}>
        <Link style={link} href={`${BASE_URL}/contact`}>
          Centro de ayuda
        </Link>{" "}
        ·{" "}
        <Link style={link} href={`${BASE_URL}/contact`}>
          Contactar soporte
        </Link>
      </Text>
    </Section>
  </EmailLayout>
);

GithubAccessTokenEmail.PreviewProps = {
  username: "estudiante",
} as GithubAccessTokenEmailProps;

export default GithubAccessTokenEmail;
