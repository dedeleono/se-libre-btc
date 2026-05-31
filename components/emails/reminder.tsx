import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface GithubAccessTokenEmailProps {
  username?: string;
}

const baseUrl = "https://saber-ver-v2.vercel.app";

export const GithubAccessTokenEmail = ({ username }: GithubAccessTokenEmailProps) => (
  <Html>
    <Head />
    <Preview>Recordatorio: Tienes una tarea pendiente en la plataforma</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          alt="saber-ver"
          src="https://saber-ver-v2.vercel.app/logo.png"
          width="160"
          height="55"
          className="mx-auto"
        />

        <Text style={title}>
          <strong>@{username}</strong>, tienes actividades pendientes por
          revisar.
        </Text>

        <Section style={section}>
          <Text style={text}>
            Hola <strong>{username}</strong>!
          </Text>
          <Text style={text}>
            Hay tareas pendientes en tu plataforma (<Link>ver detalles</Link>)
            que requieren tu atención.
          </Text>

          <Button style={button}>Ver mis tareas</Button>
        </Section>
        <Text style={links}>
          <Link style={link}>Centro de ayuda</Link> ・{" "}
          <Link style={link}>Contactar soporte</Link>
        </Text>

        <Text style={footer}>
          Se Libre ・Tu camino hacia la autonomía
        </Text>
      </Container>
    </Body>
  </Html>
);

GithubAccessTokenEmail.PreviewProps = {
  username: "estudiante",
} as GithubAccessTokenEmailProps;

export default GithubAccessTokenEmail;

const main = {
  backgroundColor: "#ffffff",
  color: "#24292e",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"',
};

const container = {
  maxWidth: "480px",
  margin: "0 auto",
  padding: "20px 0 48px",
};

const title = {
  fontSize: "24px",
  lineHeight: 1.25,
};

const section = {
  padding: "24px",
  border: "solid 1px #dedede",
  borderRadius: "5px",
  textAlign: "center" as const,
};

const text = {
  margin: "0 0 10px 0",
  textAlign: "left" as const,
};

const button = {
  fontSize: "14px",
  backgroundColor: "#034180",
  color: "#fff",
  lineHeight: 1.5,
  borderRadius: "0.5em",
  padding: "12px 24px",
};

const links = {
  textAlign: "center" as const,
};

const link = {
  color: "#034180",
  fontSize: "12px",
};

const footer = {
  color: "#6a737d",
  fontSize: "12px",
  textAlign: "center" as const,
  marginTop: "60px",
};
