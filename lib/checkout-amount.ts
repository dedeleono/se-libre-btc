export type Purchasable = { isPublished: boolean; isFree: boolean; price: number | null };
export type CheckoutAmount = { ok: true; amount: number } | { ok: false; status: 400 | 404 };

export function resolveCheckoutAmount(product: Purchasable | null): CheckoutAmount {
  if (!product || !product.isPublished) return { ok: false, status: 404 };
  if (product.isFree || product.price === null || !(product.price > 0)) return { ok: false, status: 400 };
  return { ok: true, amount: product.price };
}
