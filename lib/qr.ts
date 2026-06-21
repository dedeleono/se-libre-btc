import QRCode from "qrcode";

export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 220,
    color: { dark: "#14110D", light: "#00000000" }, // transparent background
  });
}
