import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface TipsEmailProps {
  tips?: { id: number; description: string }[];
}

const baseUrl = "https://saber-ver-v2.vercel.app";

const PropDefaults: TipsEmailProps = {
  tips: [
    {
      id: 1,
      description:
        'Para encontrar tus tareas pendientes, usa el filtro "Por entregar"',
    },
    {
      id: 2,
      description:
        "Para ver tus calificaciones, visita la sección de 'Evaluaciones'",
    },
    {
      id: 3,
      description:
        'Para comunicarte con tus profesores, utiliza la sección de "Mensajes" en cada curso',
    },
  ],
};

export const TipsEmail = ({ tips = [] }: TipsEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>Consejos para usar la plataforma educativa</Preview>
      <Container style={container}>
        <Section style={logo}>
          <Img
            alt="saber-ver"
            src="https://saber-ver-v2.vercel.app/logo.png"
            width="160"
            height="55"
            className="mx-auto"
          />
        </Section>

        <Section style={header}>
          <Row>
            <Column style={headerContent}>
              <Heading style={headerContentTitle}>
                Aprovecha al máximo tu plataforma
              </Heading>
              <Text style={headerContentSubtitle}>
                Consejos útiles para tu experiencia educativa
              </Text>
            </Column>
            <Column style={headerImageContainer}>
              <Img
                style={headerImage}
                width={340}
                src={`${baseUrl}/static/platform-header.png`}
              />
            </Column>
          </Row>
        </Section>

        <Section style={content}>
          <Heading as="h2" style={title}>
            Navegando por la plataforma
          </Heading>
          <Text style={paragraph}>
            Con todas las herramientas disponibles, queremos asegurarnos de que
            aproveches al máximo tu experiencia de aprendizaje.
          </Text>

          <Hr style={divider} />

          <Heading as="h2" style={title}>
            Consejos para mejorar tu experiencia
          </Heading>
          <Text style={paragraph}>
            Aquí hay algunos consejos útiles para comenzar:
          </Text>
          <ul>
            {tips.map((tip) => (
              <li key={tip.id}>
                <Text style={paragraph}>{tip.description}</Text>
              </li>
            ))}
          </ul>

          <Text style={paragraph}>
            Cuanta más información tengas sobre cómo usar la plataforma, mejor
            será tu experiencia de aprendizaje.
          </Text>

          <Hr style={divider} />

          <Heading as="h2" style={title}>
            ¿Necesitas un descanso? Visita nuestra biblioteca virtual
          </Heading>

          <Section style={buttonContainer}>
            <Link style={button} href="https://www.saber-ver.com/biblioteca">
              Explorar biblioteca
            </Link>
          </Section>
        </Section>
      </Container>

      <Section style={footer}>
        <Text style={footerText}>
          Recibes este correo porque eres parte de la comunidad educativa de
          Se Libre BTC.
        </Text>

        <Link href="/" style={footerLink}>
          Cancelar suscripción{" "}
        </Link>
        <Link href="/" style={footerLink}>
          Configurar correos{" "}
        </Link>
        <Link href="/" style={footerLink}>
          Contáctanos
        </Link>
        <Link href="/" style={footerLink}>
          Privacidad
        </Link>

        <Hr style={footerDivider} />

        <Img width={111} src={`${baseUrl}/static/logo-sm.png`} />
        <Text style={footerAddress}>
          <strong>Se Libre</strong>
        </Text>
        <Text style={footerHeart}>{"<3"}</Text>
      </Section>
    </Body>
  </Html>
);

TipsEmail.PreviewProps = {
  tips: PropDefaults.tips,
} as TipsEmailProps;

export default TipsEmail;

const main = {
  backgroundColor: "#f3f3f5",
  fontFamily: "HelveticaNeue,Helvetica,Arial,sans-serif",
};

const headerContent = { padding: "20px 30px 15px" };

const headerContentTitle = {
  color: "#fff",
  fontSize: "27px",
  fontWeight: "bold",
  lineHeight: "27px",
};

const headerContentSubtitle = {
  color: "#fff",
  fontSize: "17px",
};

const headerImageContainer = {
  padding: "30px 10px",
};

const headerImage = {
  maxWidth: "100%",
};

const title = {
  margin: "0 0 15px",
  fontWeight: "bold",
  fontSize: "21px",
  lineHeight: "21px",
  color: "#0c0d0e",
};

const paragraph = {
  fontSize: "15px",
  lineHeight: "21px",
  color: "#3c3f44",
};

const divider = {
  margin: "30px 0",
};

const container = {
  width: "680px",
  maxWidth: "100%",
  margin: "0 auto",
  backgroundColor: "#ffffff",
};

const footer = {
  width: "680px",
  maxWidth: "100%",
  margin: "32px auto 0 auto",
  padding: "0 30px",
};

const content = {
  padding: "30px 30px 40px 30px",
};

const logo = {
  display: "flex",
  background: "#f3f3f5",
  padding: "20px 30px",
};

const header = {
  borderRadius: "5px 5px 0 0",
  display: "flex",
  flexDireciont: "column",
  backgroundColor: "#034180",
};

const buttonContainer = {
  marginTop: "24px",
  display: "block",
};

const button = {
  backgroundColor: "#034180",
  border: "1px solid #023366",
  fontSize: "17px",
  lineHeight: "17px",
  padding: "13px 17px",
  borderRadius: "4px",
  maxWidth: "120px",
  color: "#fff",
};

const footerDivider = {
  ...divider,
  borderColor: "#d6d8db",
};

const footerText = {
  fontSize: "12px",
  lineHeight: "15px",
  color: "#9199a1",
  margin: "0",
};

const footerLink = {
  display: "inline-block",
  color: "#9199a1",
  textDecoration: "underline",
  fontSize: "12px",
  marginRight: "10px",
  marginBottom: "0",
  marginTop: "8px",
};

const footerAddress = {
  margin: "4px 0",
  fontSize: "12px",
  lineHeight: "15px",
  color: "#9199a1",
};

const footerHeart = {
  borderRadius: "1px",
  border: "1px solid #d6d9dc",
  padding: "4px 6px 3px 6px",
  fontSize: "11px",
  lineHeight: "11px",
  fontFamily: "Consolas,monospace",
  color: "#e06c77",
  maxWidth: "min-content",
  margin: "0 0 32px 0",
};
