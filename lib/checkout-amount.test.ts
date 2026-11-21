import { describe, it, expect } from "vitest";
import { resolveCheckoutAmount } from "./checkout-amount";

const product = { isPublished: true, isFree: false, price: 250 };

describe("resolveCheckoutAmount", () => {
  it("returns 404 for a missing product", () => {
    expect(resolveCheckoutAmount(null)).toEqual({ ok: false, status: 404 });
  });
  it("returns 404 for an unpublished product", () => {
    expect(resolveCheckoutAmount({ ...product, isPublished: false })).toEqual({ ok: false, status: 404 });
  });
  it("returns 400 for a free product", () => {
    expect(resolveCheckoutAmount({ ...product, isFree: true })).toEqual({ ok: false, status: 400 });
  });
  it("returns 400 when the price is missing", () => {
    expect(resolveCheckoutAmount({ ...product, price: null })).toEqual({ ok: false, status: 400 });
  });
  it("returns 400 when the price is zero", () => {
    expect(resolveCheckoutAmount({ ...product, price: 0 })).toEqual({ ok: false, status: 400 });
  });
  it("returns the catalog price for a published paid product", () => {
    expect(resolveCheckoutAmount(product)).toEqual({ ok: true, amount: 250 });
  });
});
