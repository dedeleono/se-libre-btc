import { describe, it, expect } from "vitest";
import { checkoutResumeUrl, productPagePath, readCheckoutProduct } from "./checkout-return";

describe("checkoutResumeUrl", () => {
  it("keeps the page and its query so checkout resumes where it started", () => {
    expect(checkoutResumeUrl("/courses/preview/c1", "productType=COURSE&productId=c1")).toBe(
      "/courses/preview/c1?productType=COURSE&productId=c1"
    );
  });
  it("returns the bare path when there is no query", () => {
    expect(checkoutResumeUrl("/learning-paths/bitcoin", "")).toBe("/learning-paths/bitcoin");
  });
});

describe("readCheckoutProduct", () => {
  it("reads a course from the query", () => {
    expect(readCheckoutProduct(new URLSearchParams("productType=COURSE&productId=c1"))).toEqual({ productType: "COURSE", productId: "c1" });
  });
  it("reads a learning path from the query", () => {
    expect(readCheckoutProduct(new URLSearchParams("productType=LEARNING_PATH&productId=p1"))).toEqual({
      productType: "LEARNING_PATH",
      productId: "p1",
    });
  });
  it("ignores an unknown product type", () => {
    expect(readCheckoutProduct(new URLSearchParams("productType=SUBSCRIPTION&productId=s1"))).toBeNull();
  });
  it("ignores a missing product id", () => {
    expect(readCheckoutProduct(new URLSearchParams("productType=COURSE"))).toBeNull();
  });
});

describe("productPagePath", () => {
  it("sends a course back to its preview page", () => {
    expect(productPagePath({ courseId: "c1", learningPathSlug: null })).toBe("/courses/preview/c1");
  });
  it("sends a learning path back to its page", () => {
    expect(productPagePath({ courseId: null, learningPathSlug: "ruta-bitcoin" })).toBe("/learning-paths/ruta-bitcoin");
  });
  it("encodes path segments", () => {
    expect(productPagePath({ courseId: "a/b", learningPathSlug: null })).toBe("/courses/preview/a%2Fb");
  });
  it("falls back to the course catalog", () => {
    expect(productPagePath({ courseId: null, learningPathSlug: null })).toBe("/courses");
  });
});
