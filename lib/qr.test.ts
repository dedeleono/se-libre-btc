import { describe, it, expect } from "vitest";
import { generateQrDataUrl } from "./qr";

describe("generateQrDataUrl", () => {
  it("returns a png data url for a verification link", async () => {
    const dataUrl = await generateQrDataUrl("https://example.com/verify/DL-2026-ABC123");
    expect(dataUrl.startsWith("data:image/png;base64,")).toBe(true);
    expect(dataUrl.length).toBeGreaterThan(100);
  });
});
