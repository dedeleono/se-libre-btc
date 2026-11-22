import { describe, it, expect } from "vitest";
import { decideCohortEnroll, decideSelfEnroll } from "./enrollment-policy";

const freeProduct = { isPublished: true, isFree: true };

describe("decideSelfEnroll", () => {
  it("lets an admin enroll in anything", () => {
    expect(decideSelfEnroll({ isPublished: false, isFree: false }, "ADMIN")).toEqual({ ok: true });
  });
  it("returns 404 for a missing product", () => {
    expect(decideSelfEnroll(null, "STUDENT")).toEqual({ ok: false, status: 404 });
  });
  it("returns 404 for an unpublished product", () => {
    expect(decideSelfEnroll({ isPublished: false, isFree: true }, "STUDENT")).toEqual({ ok: false, status: 404 });
  });
  it("returns 402 for a paid product", () => {
    expect(decideSelfEnroll({ isPublished: true, isFree: false }, "STUDENT")).toEqual({ ok: false, status: 402 });
  });
  it("accepts a published free product", () => {
    expect(decideSelfEnroll(freeProduct, "STUDENT")).toEqual({ ok: true });
  });
});

const openCohort = {
  status: "OPEN" as const,
  capacity: 10,
  takenSeats: 3,
  holdsSeat: false,
  content: [freeProduct],
};

describe("decideCohortEnroll", () => {
  it("accepts an open cohort with seats and free published content", () => {
    expect(decideCohortEnroll(openCohort, "STUDENT")).toEqual({ ok: true });
  });
  it("accepts a cohort that is in progress", () => {
    expect(decideCohortEnroll({ ...openCohort, status: "IN_PROGRESS" }, "STUDENT")).toEqual({ ok: true });
  });
  it("returns 404 for a missing cohort", () => {
    expect(decideCohortEnroll(null, "STUDENT")).toEqual({ ok: false, status: 404 });
  });
  it.each(["DRAFT", "COMPLETED", "CANCELLED"] as const)("returns 404 for a %s cohort", (status) => {
    expect(decideCohortEnroll({ ...openCohort, status }, "STUDENT")).toEqual({ ok: false, status: 404 });
  });
  it("returns 409 when every seat is taken", () => {
    expect(decideCohortEnroll({ ...openCohort, takenSeats: 10 }, "STUDENT")).toEqual({ ok: false, status: 409 });
  });
  it("lets a student who already holds a seat re-enroll in a full cohort", () => {
    expect(decideCohortEnroll({ ...openCohort, takenSeats: 10, holdsSeat: true }, "STUDENT")).toEqual({ ok: true });
  });
  it("treats a missing capacity as unlimited", () => {
    expect(decideCohortEnroll({ ...openCohort, capacity: null, takenSeats: 500 }, "STUDENT")).toEqual({ ok: true });
  });
  it("returns 402 when the linked content is paid", () => {
    expect(decideCohortEnroll({ ...openCohort, content: [freeProduct, { isPublished: true, isFree: false }] }, "STUDENT")).toEqual({ ok: false, status: 402 });
  });
  it("returns 404 when the linked content is unpublished", () => {
    expect(decideCohortEnroll({ ...openCohort, content: [{ isPublished: false, isFree: true }] }, "STUDENT")).toEqual({ ok: false, status: 404 });
  });
  it("accepts a cohort with no linked content", () => {
    expect(decideCohortEnroll({ ...openCohort, content: [] }, "STUDENT")).toEqual({ ok: true });
  });
  it("sells the last seat once when two requests are serialized by the cohort lock", () => {
    const lastSeat = { ...openCohort, capacity: 1, takenSeats: 0 };
    expect(decideCohortEnroll(lastSeat, "STUDENT")).toEqual({ ok: true });
    expect(decideCohortEnroll({ ...lastSeat, takenSeats: 1 }, "STUDENT")).toEqual({ ok: false, status: 409 });
    expect(decideCohortEnroll({ ...lastSeat, takenSeats: 1, holdsSeat: true }, "STUDENT")).toEqual({ ok: true });
  });
  it("lets an admin join a full draft cohort", () => {
    expect(decideCohortEnroll({ ...openCohort, status: "DRAFT", takenSeats: 10 }, "ADMIN")).toEqual({ ok: true });
  });
});
