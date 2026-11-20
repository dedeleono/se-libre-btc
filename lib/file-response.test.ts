import { describe, it, expect } from "vitest";
import { fileResponseHeaders, isServableKey } from "./file-response";

describe("fileResponseHeaders", () => {
  it("serves a png inline with nosniff", () => {
    const headers = fileResponseHeaders({ contentType: "image/png", contentLength: 10 });
    expect(headers.get("Content-Type")).toBe("image/png");
    expect(headers.get("Content-Disposition")).toBe("inline");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Content-Length")).toBe("10");
    expect(headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
  });
  it("serves a pdf inline", () => {
    const headers = fileResponseHeaders({ contentType: "application/pdf" });
    expect(headers.get("Content-Type")).toBe("application/pdf");
    expect(headers.get("Content-Disposition")).toBe("inline");
  });
  it("sends html as an octet-stream attachment", () => {
    const headers = fileResponseHeaders({ contentType: "text/html" });
    expect(headers.get("Content-Type")).toBe("application/octet-stream");
    expect(headers.get("Content-Disposition")).toBe("attachment");
  });
  it("sends svg as an attachment", () => {
    expect(fileResponseHeaders({ contentType: "image/svg+xml" }).get("Content-Disposition")).toBe("attachment");
  });
  it("sends a file with no stored type as an attachment", () => {
    const headers = fileResponseHeaders({});
    expect(headers.get("Content-Disposition")).toBe("attachment");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});

describe("isServableKey", () => {
  it("accepts keys under assets/", () => {
    expect(isServableKey("assets/image/1-a.png")).toBe(true);
  });
  it("rejects keys outside assets/", () => {
    expect(isServableKey("private/x")).toBe(false);
  });
  it("rejects path traversal", () => {
    expect(isServableKey("assets/../x")).toBe(false);
  });
});
