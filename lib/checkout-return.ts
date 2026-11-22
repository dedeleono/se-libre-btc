export type CheckoutProduct = { productType: "COURSE" | "LEARNING_PATH"; productId: string };

export function checkoutResumeUrl(pathname: string, query: string): string {
  return query ? `${pathname}?${query}` : pathname;
}

export function readCheckoutProduct(params: URLSearchParams): CheckoutProduct | null {
  const productType = params.get("productType");
  const productId = params.get("productId");
  if (!productId || (productType !== "COURSE" && productType !== "LEARNING_PATH")) return null;
  return { productType, productId };
}

export function productPagePath(product: { courseId: string | null; learningPathSlug: string | null }): string {
  if (product.courseId) return `/courses/preview/${encodeURIComponent(product.courseId)}`;
  if (product.learningPathSlug) return `/learning-paths/${encodeURIComponent(product.learningPathSlug)}`;
  return "/courses";
}
