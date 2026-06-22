import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function readArrayBuffer(relPath: string): Promise<ArrayBuffer> {
  const buf = await readFile(join(process.cwd(), relPath));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

export async function loadCertificateFonts() {
  const [anton, quicksand, playfair] = await Promise.all([
    readArrayBuffer("assets/fonts/Anton-Regular.ttf"),
    readArrayBuffer("assets/fonts/Quicksand-SemiBold.ttf"),
    readArrayBuffer("assets/fonts/PlayfairDisplay-Bold.ttf"),
  ]);
  return [
    { name: "Anton", data: anton, weight: 400 as const, style: "normal" as const },
    { name: "Quicksand", data: quicksand, weight: 600 as const, style: "normal" as const },
    { name: "Playfair Display", data: playfair, weight: 700 as const, style: "normal" as const },
  ];
}

export async function loadLogoDataUrl(dark: boolean): Promise<string> {
  const buf = await readFile(join(process.cwd(), "public", dark ? "logoDark.png" : "logo.png"));
  return `data:image/png;base64,${buf.toString("base64")}`;
}

// Full-bleed certificate artwork rasterized from the source PDFs in
// public/certs. These are the exact designs; the OG route composites the
// dynamic fields on top.
export async function loadCertBackgroundDataUrl(punk: boolean): Promise<string> {
  const buf = await readFile(join(process.cwd(), "assets/certs", punk ? "punk-bg.png" : "standard-bg.png"));
  return `data:image/png;base64,${buf.toString("base64")}`;
}

export function getBaseUrl(req: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}
