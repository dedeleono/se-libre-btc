import { describe, it, expect } from "vitest";
import { decideUpload } from "./upload-policy";

const MB = 1024 * 1024;

describe("decideUpload", () => {
  it("accepts a 1 MB png from a student through the server route", () => {
    expect(decideUpload({ role: "STUDENT", channel: "server", kind: "image", contentType: "image/png", size: MB })).toEqual({
      ok: true,
      kind: "image",
      contentType: "image/png",
    });
  });
  it("rejects a presigned upload from a student with 403", () => {
    expect(decideUpload({ role: "STUDENT", channel: "presigned", kind: "image", contentType: "image/png", size: MB })).toMatchObject({ ok: false, status: 403 });
  });
  it("rejects a video from a student with 403", () => {
    expect(decideUpload({ role: "STUDENT", channel: "server", kind: "video", contentType: "video/mp4", size: MB })).toMatchObject({ ok: false, status: 403 });
  });
  it("rejects a 5 MB image from a student with 413", () => {
    expect(decideUpload({ role: "STUDENT", channel: "server", kind: "image", contentType: "image/png", size: 5 * MB })).toMatchObject({ ok: false, status: 413 });
  });
  it("accepts a 50 MB mp4 from an admin through a presigned url", () => {
    expect(decideUpload({ role: "ADMIN", channel: "presigned", kind: "video", contentType: "video/mp4", size: 50 * MB })).toEqual({
      ok: true,
      kind: "video",
      contentType: "video/mp4",
    });
  });
  it("rejects a 101 MB video from an admin with 413", () => {
    expect(decideUpload({ role: "ADMIN", channel: "presigned", kind: "video", contentType: "video/mp4", size: 101 * MB })).toMatchObject({ ok: false, status: 413 });
  });
  it("rejects an svg image with 415", () => {
    expect(decideUpload({ role: "ADMIN", channel: "server", kind: "image", contentType: "image/svg+xml", size: MB })).toMatchObject({ ok: false, status: 415 });
  });
  it("rejects an html document with 415", () => {
    expect(decideUpload({ role: "ADMIN", channel: "server", kind: "document", contentType: "text/html", size: MB })).toMatchObject({ ok: false, status: 415 });
  });
  it("normalises the media type before checking it", () => {
    expect(decideUpload({ role: "ADMIN", channel: "server", kind: "image", contentType: "image/PNG; charset=binary", size: MB })).toEqual({
      ok: true,
      kind: "image",
      contentType: "image/png",
    });
  });
  it("rejects the mixed kind with 400", () => {
    expect(decideUpload({ role: "ADMIN", channel: "server", kind: "mixed", contentType: "image/png", size: MB })).toMatchObject({ ok: false, status: 400 });
  });
  it("rejects a non-numeric size with 400", () => {
    expect(decideUpload({ role: "ADMIN", channel: "server", kind: "image", contentType: "image/png", size: "abc" })).toMatchObject({ ok: false, status: 400 });
  });
  it("rejects a zero size with 400", () => {
    expect(decideUpload({ role: "ADMIN", channel: "server", kind: "image", contentType: "image/png", size: 0 })).toMatchObject({ ok: false, status: 400 });
  });
});
