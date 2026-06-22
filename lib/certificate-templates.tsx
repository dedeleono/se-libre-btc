import { messages } from "@/lib/i18n/messages";

// Canvas matches the source PDF artwork aspect (A4 landscape, 1.4153:1) at a
// print-friendly resolution. The committed backgrounds in assets/certs are
// rendered at exactly these dimensions, so the artwork maps 1:1 and only the
// dynamic fields are drawn on top.
export const CERT_WIDTH = 2480;
export const CERT_HEIGHT = 1753;

export type CertTemplateProps = {
  recipientName: string;
  courseTitle: string;
  issuedAt: Date;
  serial: string;
  qrDataUrl: string;
  bgDataUrl: string;
  locale: "es" | "en";
};

const fmtDate = (d: Date, locale: string) =>
  new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-GT", {
    day: "numeric", month: "long", year: "numeric",
  }).format(d);

// Satori does not auto-fit text, so shrink long names to keep them inside the
// artwork's name slot (the input allows up to 80 chars).
const nameSize = (name: string, base: number) => {
  const n = name.trim().length;
  if (n <= 14) return base;
  if (n <= 20) return Math.round(base * 0.82);
  if (n <= 30) return Math.round(base * 0.66);
  return Math.round(base * 0.5);
};

const Background = ({ src }: { src: string }) => (
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  <img src={src} width={CERT_WIDTH} height={CERT_HEIGHT} style={{ position: "absolute", top: 0, left: 0 }} />
);

/**
 * STANDARD (cream / classic). The artwork already prints the heading, the
 * "Otorgado a:" line and the thin name rule, the seal and "ASOCIACIÓN GUATEMALA
 * LIBRE". We overlay: recipient name (on the rule), issue date + folio
 * (bottom-left), and the verification QR (bottom-right).
 */
export function StandardCertificate(p: CertTemplateProps) {
  const t = messages[p.locale].certificate;
  return (
    <div style={{ position: "relative", display: "flex", width: CERT_WIDTH, height: CERT_HEIGHT }}>
      <Background src={p.bgDataUrl} />

      {/* Recipient name — centered, sitting on the printed rule (~62%) */}
      <div style={{ position: "absolute", top: 1018, left: 0, width: CERT_WIDTH, display: "flex", justifyContent: "center" }}>
        <div style={{ fontFamily: "Playfair Display", fontWeight: 700, fontSize: nameSize(p.recipientName, 96), color: "#14110D" }}>{p.recipientName}</div>
      </div>

      {/* Issue date + folio — bottom-left, inside the inner frame (frame bottom ~92%) */}
      <div style={{ position: "absolute", left: 170, top: 1452, display: "flex", flexDirection: "column", lineHeight: 1.35, fontFamily: "Quicksand", fontSize: 30, color: "#5B4636" }}>
        <span>{t.issuedOn}: {fmtDate(p.issuedAt, p.locale)}</span>
        <span>{t.serialLabel}: {p.serial}</span>
      </div>

      {/* Verification QR — bottom-right, inside the inner frame */}
      <img src={p.qrDataUrl} width={200} height={200} alt="" style={{ position: "absolute", right: 182, top: 1356 }} />
    </div>
  );
}

/**
 * PUNK (dark / orange). Artwork prints the stickers, heading, body, seal,
 * "SÉ TU PROPIO BANCO" and the bottom marquee. We overlay: recipient name (on
 * the orange rule), issue date + folio (bottom-left above the marquee), and the
 * verification QR (bottom-right above the marquee, on a light chip so it scans).
 */
export function PunkCertificate(p: CertTemplateProps) {
  const t = messages[p.locale].certificate;
  return (
    <div style={{ position: "relative", display: "flex", width: CERT_WIDTH, height: CERT_HEIGHT }}>
      <Background src={p.bgDataUrl} />

      {/* Recipient name — centered, above the orange rule (~65%) */}
      <div style={{ position: "absolute", top: 1092, left: 0, width: CERT_WIDTH, display: "flex", justifyContent: "center" }}>
        <div style={{ fontFamily: "Anton", fontSize: nameSize(p.recipientName, 88), color: "#F7931A", textTransform: "uppercase", letterSpacing: 4 }}>{p.recipientName}</div>
      </div>

      {/* Issue date + folio — bottom-left, above the marquee strip (marquee top ~92%) */}
      <div style={{ position: "absolute", left: 132, top: 1478, display: "flex", flexDirection: "column", lineHeight: 1.35, fontFamily: "Quicksand", fontSize: 26, color: "#D2C2A2" }}>
        <span>{t.issuedOn}: {fmtDate(p.issuedAt, p.locale)}</span>
        <span>{t.serialLabel}: {p.serial}</span>
      </div>

      {/* Verification QR — bottom-right, above the marquee strip, on a light chip */}
      <div style={{ position: "absolute", right: 110, top: 1286, display: "flex", background: "#FBF6EE", padding: 10 }}>
        <img src={p.qrDataUrl} width={188} height={188} alt="" />
      </div>
    </div>
  );
}
