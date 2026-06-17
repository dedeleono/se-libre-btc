import { Button } from "@react-email/components";
import * as React from "react";
import {
  EmailLayout,
  Heading,
  Text,
  eyebrow,
  h1,
  paragraph,
  libreTag,
  primaryButton,
  buttonContainer,
  BASE_URL,
} from "./brand";

interface KoalaWelcomeEmailProps {
  userFirstname: string;
}

export const KoalaWelcomeEmail = ({ userFirstname }: KoalaWelcomeEmailProps) => (
  <EmailLayout
    preview="Bienvenido a la plataforma educativa de Dinero Libre"
    footnote="Recibes este correo porque te uniste a la comunidad Dinero Libre."
  >
    <Text style={eyebrow}>Bienvenida · #DineroLibre</Text>
    <Heading style={h1}>
      Hola, {userFirstname}
      <span style={libreTag}> / Libre</span>
    </Heading>
    <Text style={paragraph}>
      Bienvenido a Dinero Libre, tu plataforma para aprender cómo funciona el
      dinero, protegerte de la inflación y ejercer tu soberanía financiera.
    </Text>
    <Text style={paragraph}>
      Aprende. Practica. Comparte. Empieza cuando quieras, a tu propio ritmo.
    </Text>

    <table cellPadding={0} cellSpacing={0} role="presentation">
      <tbody>
        <tr>
          <td style={buttonContainer}>
            <Button style={primaryButton} href={`${BASE_URL}/courses`}>
              Comenzar
            </Button>
          </td>
        </tr>
      </tbody>
    </table>

    <Text style={{ ...paragraph, marginTop: "24px", marginBottom: 0 }}>
      Con vos,
      <br />
      El equipo de Dinero Libre
    </Text>
  </EmailLayout>
);

KoalaWelcomeEmail.PreviewProps = {
  userFirstname: "Juan",
} as KoalaWelcomeEmailProps;

export default KoalaWelcomeEmail;
