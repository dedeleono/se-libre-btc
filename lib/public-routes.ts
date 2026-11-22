export const publicRoutes = [
  "/",
  "/about",
  "/contact",
  "/courses",
  "/error",
  "/learning-paths",
  "/onboarding",
  "/privacy",
  "/sign-in",
  "/terms",
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
