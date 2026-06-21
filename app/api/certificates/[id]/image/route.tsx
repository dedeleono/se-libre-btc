import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { generateQrDataUrl } from "@/lib/qr";
import { loadCertificateFonts, loadLogoDataUrl, getBaseUrl } from "@/lib/certificate-assets";
import { StandardCertificate, PunkCertificate } from "@/lib/certificate-templates";
import { getServerLocale } from "@/lib/i18n-server";

export const runtime = "nodejs";

const WIDTH = 1600;
const HEIGHT = 1131;

export async function GET(req: Request, props0: { params: Promise<{ id: string }> }) {
  const params = await props0.params;
  const cert = await prisma.certificate.findUnique({
    where: { id: params.id },
    include: { course: { select: { title: true } } },
  });
  if (!cert) return new Response("Not found", { status: 404 });

  try {
    const locale = getServerLocale();
    const baseUrl = getBaseUrl(req);
    const [fonts, qrDataUrl, logoDataUrl] = await Promise.all([
      loadCertificateFonts(),
      generateQrDataUrl(`${baseUrl}/verify/${cert.serial}`),
      loadLogoDataUrl(cert.design === "PUNK"),
    ]);

    const props = {
      recipientName: cert.recipientName,
      courseTitle: cert.course.title.trim(),
      issuedAt: cert.issuedAt,
      serial: cert.serial,
      qrDataUrl,
      logoDataUrl,
      locale,
    };

    const element = cert.design === "PUNK" ? PunkCertificate(props) : StandardCertificate(props);

    const res = new ImageResponse(element, { width: WIDTH, height: HEIGHT, fonts });

    const download = new URL(req.url).searchParams.get("download");
    if (download) {
      res.headers.set(
        "Content-Disposition",
        `attachment; filename="certificado-dinero-libre-${cert.serial}.png"`
      );
    }
    return res;
  } catch (error) {
    console.error("[CERT_IMAGE]", error);
    return new Response("Error generating certificate", { status: 500 });
  }
}
