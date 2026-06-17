import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

/**
 * Shared Dinero Libre email design system.
 *
 * Email clients can't load the brand web fonts (Anton / Quicksand / Playfair),
 * so the stamp/poster aesthetic is recreated with web-safe fallbacks plus the
 * brand palette, 2px volcán borders, hard offset shadows and uppercase tracked
 * type. Logo is a text wordmark (no external image dependency).
 */

// Web-safe approximations of the brand faces.
export const displayFont =
  '"Arial Narrow", "Helvetica Neue", Helvetica, Arial, sans-serif';
export const bodyFont = '"Helvetica Neue", Helvetica, Arial, sans-serif';
export const serifFont = 'Georgia, "Times New Roman", Times, serif';

// Brand palette (mirrors tokens in app/globals.css).
export const colors = {
  ink: "#14110D", // volcán-900
  volcan700: "#1F1B16",
  paper: "#FBF6EE", // crema-050
  card: "#FFFDF7",
  cremaBorder: "#E8DCC6", // crema-200
  naranja: "#F7931A",
  naranja050: "#FFF3E3",
  terracota: "#8A3A23", // terracota-700
  cafe700: "#4B2E1E",
  cafe500: "#6F4A33",
  cafe300: "#B79A82",
  maiz: "#E2B23A",
};

export const main: React.CSSProperties = {
  backgroundColor: colors.paper,
  fontFamily: bodyFont,
  margin: 0,
  padding: "32px 0",
};

export const container: React.CSSProperties = {
  width: "100%",
  maxWidth: "560px",
  margin: "0 auto",
  padding: "0 16px",
};

export const card: React.CSSProperties = {
  backgroundColor: colors.card,
  border: `2px solid ${colors.ink}`,
  borderRadius: "2px",
  boxShadow: `4px 4px 0 ${colors.ink}`,
  overflow: "hidden",
};

export const headerBar: React.CSSProperties = {
  backgroundColor: colors.ink,
  borderBottom: `2px solid ${colors.ink}`,
  padding: "18px 28px",
};

export const cardBody: React.CSSProperties = {
  padding: "32px 28px 36px",
};

export const eyebrow: React.CSSProperties = {
  fontFamily: bodyFont,
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: colors.terracota,
  margin: "0 0 12px",
};

export const h1: React.CSSProperties = {
  fontFamily: displayFont,
  fontSize: "34px",
  lineHeight: "34px",
  fontWeight: 800,
  letterSpacing: "0.01em",
  textTransform: "uppercase",
  color: colors.ink,
  margin: "0 0 18px",
};

export const h2: React.CSSProperties = {
  fontFamily: displayFont,
  fontSize: "22px",
  lineHeight: "24px",
  fontWeight: 800,
  letterSpacing: "0.02em",
  textTransform: "uppercase",
  color: colors.ink,
  margin: "0 0 12px",
};

export const paragraph: React.CSSProperties = {
  fontFamily: bodyFont,
  fontSize: "15px",
  lineHeight: "24px",
  color: colors.cafe700,
  margin: "0 0 16px",
};

export const muted: React.CSSProperties = {
  fontFamily: bodyFont,
  fontSize: "13px",
  lineHeight: "20px",
  color: colors.cafe500,
  margin: "0",
};

export const libreTag: React.CSSProperties = {
  fontFamily: serifFont,
  fontStyle: "italic",
  fontWeight: 400,
  textTransform: "none",
  fontSize: "0.62em",
  letterSpacing: "0.02em",
  color: colors.terracota,
};

export const buttonContainer: React.CSSProperties = {
  margin: "8px 0 4px",
};

export const primaryButton: React.CSSProperties = {
  backgroundColor: colors.naranja,
  color: colors.ink,
  border: `2px solid ${colors.ink}`,
  borderRadius: "2px",
  boxShadow: `4px 4px 0 ${colors.ink}`,
  fontFamily: bodyFont,
  fontSize: "14px",
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  textDecoration: "none",
  padding: "14px 30px",
  display: "inline-block",
};

export const hr: React.CSSProperties = {
  border: "none",
  borderTop: `1px solid ${colors.ink}`,
  margin: "28px 0",
};

export const calloutBox: React.CSSProperties = {
  backgroundColor: colors.naranja050,
  border: `2px solid ${colors.ink}`,
  borderRadius: "2px",
  boxShadow: `4px 4px 0 ${colors.ink}`,
  padding: "20px 22px",
  margin: "4px 0 24px",
};

export const link: React.CSSProperties = {
  color: colors.terracota,
  fontWeight: 700,
  textDecoration: "underline",
};

// Base URL for CTA links — follows the codebase convention (see lib/auth.ts).
export const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.BETTER_AUTH_URL ??
  "http://localhost:3000";

const coin: React.CSSProperties = {
  display: "inline-block",
  width: "26px",
  height: "26px",
  lineHeight: "26px",
  textAlign: "center",
  backgroundColor: colors.naranja,
  color: colors.ink,
  borderRadius: "50%",
  fontFamily: bodyFont,
  fontSize: "14px",
  fontWeight: 700,
  verticalAlign: "middle",
  marginRight: "10px",
};

const wordmark: React.CSSProperties = {
  display: "inline-block",
  fontFamily: displayFont,
  fontSize: "21px",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: colors.paper,
  verticalAlign: "middle",
};

export function Wordmark() {
  return (
    <Text style={{ margin: 0 }}>
      <span style={coin}>₿</span>
      <span style={wordmark}>Dinero Libre</span>
    </Text>
  );
}

const footerWrap: React.CSSProperties = {
  maxWidth: "560px",
  margin: "24px auto 0",
  padding: "0 28px",
  textAlign: "center",
};

const footerBrand: React.CSSProperties = {
  fontFamily: displayFont,
  fontSize: "13px",
  fontWeight: 800,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: colors.ink,
  margin: "0 0 6px",
};

const footerText: React.CSSProperties = {
  fontFamily: bodyFont,
  fontSize: "12px",
  lineHeight: "18px",
  color: colors.cafe300,
  margin: "0 0 4px",
};

export function BrandFooter({ note }: { note?: string }) {
  return (
    <Section style={footerWrap}>
      <Text style={footerBrand}>Dinero Libre</Text>
      {note ? <Text style={footerText}>{note}</Text> : null}
      <Text style={footerText}>
        Educación financiera · Soberanía · Dinero sano
      </Text>
    </Section>
  );
}

export function EmailLayout({
  preview,
  children,
  footnote,
}: {
  preview: string;
  children: React.ReactNode;
  footnote?: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={card}>
            <Section style={headerBar}>
              <Wordmark />
            </Section>
            <Section style={cardBody}>{children}</Section>
          </Section>
          <BrandFooter note={footnote} />
        </Container>
      </Body>
    </Html>
  );
}

// Re-export primitives so templates import everything from one place.
export { Heading, Hr, Section, Text };
