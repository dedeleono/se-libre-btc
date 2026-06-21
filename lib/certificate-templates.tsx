import { messages } from "@/lib/i18n/messages";

export type CertTemplateProps = {
  recipientName: string;
  courseTitle: string;
  issuedAt: Date;
  serial: string;
  qrDataUrl: string;
  logoDataUrl: string;
  locale: "es" | "en";
};

const fmtDate = (d: Date, locale: string) =>
  new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-GT", {
    day: "numeric", month: "long", year: "numeric",
  }).format(d);

export function StandardCertificate(p: CertTemplateProps) {
  const t = messages[p.locale].certificate;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", padding: 48, background: "#14110D" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#FBF6EE", border: "3px solid #14110D", padding: 56 }}>
        <div style={{ position: "absolute", top: 70, left: 70, right: 70, bottom: 70, border: "1px solid #B79A82" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "space-between", paddingTop: 24, paddingBottom: 16 }}>
          <img src={p.logoDataUrl} width={150} style={{ objectFit: "contain" }} alt="" />
          <div style={{ fontFamily: "Anton", fontSize: 92, color: "#14110D", letterSpacing: 4, textTransform: "uppercase" }}>CERTIFICADO</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ fontFamily: "Quicksand", fontSize: 26, color: "#4B2E1E" }}>{t.bodyStandard(p.courseTitle)}</div>
            <div style={{ fontFamily: "Quicksand", fontSize: 22, color: "#6F4A33" }}>{t.issuedTo}</div>
            <div style={{ fontFamily: "Playfair Display", fontSize: 56, fontWeight: 700, color: "#14110D", borderBottom: "2px solid #C0573B", paddingBottom: 8, marginTop: 4 }}>{p.recipientName}</div>
          </div>
          <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", fontFamily: "Quicksand", fontSize: 18, color: "#6F4A33" }}>
              <span>{t.issuedOn}: {fmtDate(p.issuedAt, p.locale)}</span>
              <span>{t.serialLabel}: {p.serial}</span>
            </div>
            <div style={{ fontFamily: "Anton", fontSize: 22, color: "#14110D", textTransform: "uppercase", letterSpacing: 2 }}>Asociación Guatemala Libre</div>
            <img src={p.qrDataUrl} width={110} height={110} alt="" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PunkCertificate(p: CertTemplateProps) {
  const t = messages[p.locale].certificate;
  const tag = (label: string) => (
    <div style={{ display: "flex", background: "#F7931A", color: "#14110D", fontFamily: "Anton", fontSize: 18, padding: "6px 12px", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
  );
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#14110D", border: "3px solid #F7931A", padding: 48, position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {tag("#DINEROLIBRE")}
        <img src={p.logoDataUrl} width={150} style={{ objectFit: "contain" }} alt="" />
        {tag("SIN PERMISO")}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center", gap: 14 }}>
        <div style={{ fontFamily: "Quicksand", fontSize: 20, color: "#E2B23A", letterSpacing: 4, textTransform: "uppercase" }}>Ni bancos · Ni permiso · Ni miedo</div>
        <div style={{ fontFamily: "Anton", fontSize: 104, color: "#FBF6EE", letterSpacing: 4, textTransform: "uppercase", textShadow: "6px 6px 0 #F7931A" }}>CERTIFICADO</div>
        <div style={{ fontFamily: "Quicksand", fontSize: 24, color: "#F4ECDE" }}>{t.bodyPunk(p.courseTitle)}</div>
        <div style={{ fontFamily: "Quicksand", fontSize: 20, color: "#E8DCC6" }}>{t.issuedTo}</div>
        <div style={{ fontFamily: "Anton", fontSize: 52, color: "#F7931A", textTransform: "uppercase", letterSpacing: 2 }}>{p.recipientName}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", fontFamily: "Quicksand", fontSize: 18, color: "#D2C2A2" }}>
          <span>{t.issuedOn}: {fmtDate(p.issuedAt, p.locale)}</span>
          <span>{t.serialLabel}: {p.serial}</span>
        </div>
        <div style={{ fontFamily: "Anton", fontSize: 22, color: "#FBF6EE", textTransform: "uppercase", letterSpacing: 2 }}>Sé tu propio banco</div>
        <img src={p.qrDataUrl} width={110} height={110} style={{ background: "#FBF6EE", padding: 6 }} alt="" />
      </div>
    </div>
  );
}
