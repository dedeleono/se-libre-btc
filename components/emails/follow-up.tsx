import { Button } from "@react-email/components";
import * as React from "react";
import {
  EmailLayout,
  Heading,
  Text,
  Section,
  Hr,
  eyebrow,
  h1,
  h2,
  paragraph,
  primaryButton,
  buttonContainer,
  hr,
  colors,
  bodyFont,
  BASE_URL,
} from "./brand";

interface TipsEmailProps {
  tips?: { id: number; description: string }[];
}

const PropDefaults: TipsEmailProps = {
  tips: [
    {
      id: 1,
      description:
        'Para encontrar tus tareas pendientes, usa el filtro "Por entregar".',
    },
    {
      id: 2,
      description:
        "Para ver tus calificaciones, visita la sección de 'Evaluaciones'.",
    },
    {
      id: 3,
      description:
        'Para comunicarte con tus instructores, utiliza la sección de "Mensajes" en cada curso.',
    },
  ],
};

const tipMark: React.CSSProperties = {
  color: colors.naranja,
  fontWeight: 800,
  marginRight: "10px",
};

const tipText: React.CSSProperties = {
  fontFamily: bodyFont,
  fontSize: "15px",
  lineHeight: "22px",
  color: colors.cafe700,
  margin: "0 0 12px",
};

export const TipsEmail = ({ tips = [] }: TipsEmailProps) => (
  <EmailLayout
    preview="Consejos para aprovechar al máximo tu plataforma"
    footnote="Recibes este correo porque eres parte de la comunidad Dinero Libre."
  >
    <Text style={eyebrow}>Seguimiento · #DineroLibre</Text>
    <Heading style={h1}>Aprovéchala al máximo</Heading>
    <Text style={paragraph}>
      Con todas las herramientas disponibles, queremos asegurarnos de que saques
      el mayor provecho a tu experiencia de aprendizaje.
    </Text>

    <Hr style={hr} />

    <Heading as="h2" style={h2}>
      Consejos para empezar
    </Heading>
    <Section>
      {tips.map((tip) => (
        <Text key={tip.id} style={tipText}>
          <span style={tipMark}>✦</span>
          {tip.description}
        </Text>
      ))}
    </Section>

    <Hr style={hr} />

    <Heading as="h2" style={h2}>
      ¿Listo para seguir aprendiendo?
    </Heading>
    <Text style={paragraph}>
      Explora los cursos y rutas de aprendizaje disponibles en la plataforma.
    </Text>

    <table cellPadding={0} cellSpacing={0} role="presentation">
      <tbody>
        <tr>
          <td style={buttonContainer}>
            <Button style={primaryButton} href={`${BASE_URL}/courses`}>
              Explorar cursos
            </Button>
          </td>
        </tr>
      </tbody>
    </table>
  </EmailLayout>
);

TipsEmail.PreviewProps = {
  tips: PropDefaults.tips,
} as TipsEmailProps;

export default TipsEmail;
