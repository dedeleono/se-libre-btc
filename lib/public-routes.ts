export const publicRoutes = [
  "/",
  "/about",
  "/checkout",
  "/checkout/error",
  "/checkout/success",
  "/contact",
  "/courses",
  "/error",
  "/learning-paths",
  "/onboarding",
  "/sign-in",
  "/verify-request",
];

export function isPublicRoute(pathname: string): boolean {
  return (
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/learning-paths/") ||
    pathname.startsWith("/courses/preview/") ||
    pathname.startsWith("/verify/")
  );
}
