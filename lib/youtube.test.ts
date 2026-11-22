import { describe, expect, it } from "vitest";

import { parseYouTubeId } from "./youtube";

describe("parseYouTubeId", () => {
  it("reads the v param from www.youtube.com watch URLs", () => {
    expect(parseYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("reads the v param from youtube.com without www", () => {
    expect(parseYouTubeId("https://youtube.com/watch?v=abc123&t=42")).toBe("abc123");
  });
  it("reads the path from youtu.be short links", () => {
    expect(parseYouTubeId("https://youtu.be/abc123")).toBe("abc123");
  });
  it("returns null for a watch URL without v", () => {
    expect(parseYouTubeId("https://www.youtube.com/watch")).toBeNull();
  });
  it("returns null for other hosts", () => {
    expect(parseYouTubeId("https://vimeo.com/123")).toBeNull();
  });
  it("returns null for strings that are not URLs", () => {
    expect(parseYouTubeId("not a url")).toBeNull();
    expect(parseYouTubeId("")).toBeNull();
  });
});
