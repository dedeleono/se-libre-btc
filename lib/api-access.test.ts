import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, it, expect } from "vitest";

type Access = "PUBLIC" | "AUTHED" | "OWNER" | "ADMIN";
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const METHODS: readonly Method[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

// Keys: route file path relative to app/api, with "/" separators.
// A new route.ts fails this test until it is listed here with a deliberate level.
const API_ACCESS: Record<string, Partial<Record<Method, Access>>> = {
  "admin/invitations/route.ts": { POST: "ADMIN" },
  "auth/[...all]/route.ts": { GET: "PUBLIC", POST: "PUBLIC", PUT: "PUBLIC", PATCH: "PUBLIC", DELETE: "PUBLIC" },
  "auth/logout/route.ts": { GET: "PUBLIC", POST: "PUBLIC" },
  "auth/post-login/route.ts": { GET: "PUBLIC" },
  "auth/verify-invitation/route.ts": { GET: "PUBLIC" },
  "categories/route.ts": { POST: "ADMIN" },
  "chapters/[chapterId]/discussions/route.ts": { GET: "OWNER", POST: "OWNER" },
  "chapters/[chapterId]/quiz/route.ts": { POST: "ADMIN" },
  "checkout/callback/route.ts": { GET: "PUBLIC" },
  "cohorts/[cohortId]/enroll/route.ts": { POST: "AUTHED" },
  "cohorts/[cohortId]/live-sessions/route.ts": { POST: "ADMIN" },
  "cohorts/[cohortId]/route.ts": { PATCH: "ADMIN", DELETE: "ADMIN" },
  "cohorts/route.ts": { POST: "ADMIN" },
  "contact/route.ts": { POST: "PUBLIC" },
  "courses/[courseId]/attachments/[attachmentId]/route.ts": { DELETE: "ADMIN" },
  "courses/[courseId]/attachments/route.ts": { POST: "ADMIN" },
  "courses/[courseId]/chapters/[chapterId]/progress/route.ts": { PUT: "OWNER" },
  "courses/[courseId]/course-categories/route.ts": { PATCH: "ADMIN" },
  "courses/[courseId]/course-modules/[moduleId]/chapters/[chapterId]/attachments/[attachmentId]/route.ts": { DELETE: "ADMIN" },
  "courses/[courseId]/course-modules/[moduleId]/chapters/[chapterId]/attachments/route.ts": { POST: "ADMIN" },
  "courses/[courseId]/course-modules/[moduleId]/chapters/[chapterId]/publish/route.ts": { PATCH: "ADMIN" },
  "courses/[courseId]/course-modules/[moduleId]/chapters/[chapterId]/route.ts": { GET: "ADMIN", DELETE: "ADMIN", PATCH: "ADMIN" },
  "courses/[courseId]/course-modules/[moduleId]/chapters/[chapterId]/unpublish/route.ts": { PATCH: "ADMIN" },
  "courses/[courseId]/course-modules/[moduleId]/chapters/reorder/route.ts": { PUT: "ADMIN" },
  "courses/[courseId]/course-modules/[moduleId]/chapters/route.ts": { POST: "ADMIN" },
  "courses/[courseId]/course-modules/[moduleId]/route.ts": { PATCH: "ADMIN", DELETE: "ADMIN" },
  "courses/[courseId]/course-modules/reorder/route.ts": { PUT: "ADMIN" },
  "courses/[courseId]/course-modules/route.ts": { POST: "ADMIN" },
  "courses/[courseId]/enroll/route.ts": { POST: "AUTHED" },
  "courses/[courseId]/publish/route.ts": { PATCH: "ADMIN" },
  "courses/[courseId]/resources/route.ts": { GET: "OWNER" },
  "courses/[courseId]/route.ts": { DELETE: "ADMIN", PATCH: "ADMIN" },
  "courses/[courseId]/unpublish/route.ts": { PATCH: "ADMIN" },
  "courses/latest/route.ts": { GET: "PUBLIC" },
  "courses/route.ts": { POST: "ADMIN" },
  "dashboard/admin/users/complete-invitation/route.ts": { POST: "OWNER" },
  "email/send/route.ts": { POST: "ADMIN" },
  "forum/[postId]/comments/route.ts": { POST: "OWNER" },
  "forum/[postId]/route.ts": { DELETE: "ADMIN" },
  "forum/[postId]/view/route.ts": { POST: "AUTHED" },
  "forum/posts/route.ts": { POST: "ADMIN" },
  "forum/route.ts": { GET: "OWNER", POST: "ADMIN" },
  "learning-paths/[learningPathId]/courses/[courseId]/route.ts": { DELETE: "ADMIN" },
  "learning-paths/[learningPathId]/courses/reorder/route.ts": { PATCH: "ADMIN" },
  "learning-paths/[learningPathId]/courses/route.ts": { POST: "ADMIN" },
  "learning-paths/[learningPathId]/enroll/route.ts": { POST: "AUTHED" },
  "learning-paths/[learningPathId]/publish/route.ts": { PATCH: "ADMIN" },
  "learning-paths/[learningPathId]/route.ts": { PATCH: "ADMIN", DELETE: "ADMIN" },
  "learning-paths/[learningPathId]/unpublish/route.ts": { PATCH: "ADMIN" },
  "learning-paths/route.ts": { GET: "PUBLIC", POST: "ADMIN" },
  "live-sessions/[liveSessionId]/route.ts": { PATCH: "ADMIN", DELETE: "ADMIN" },
  "live-sessions/route.ts": { POST: "ADMIN" },
  "notes/route.ts": { GET: "OWNER", POST: "OWNER" },
  "notifications/[notificationId]/mark-read/route.ts": { PATCH: "OWNER" },
  "notifications/mark-all-read/route.ts": { PATCH: "OWNER" },
  "notifications/route.ts": { GET: "AUTHED" },
  "payments/create/route.ts": { POST: "AUTHED" },
  "payments/getAll/route.ts": { GET: "ADMIN" },
  "payments/getPaymentsByStudent/route.ts": { GET: "OWNER" },
  "payments/set-intent/route.ts": { POST: "PUBLIC" },
  "payments/status/[paymentIntentId]/route.ts": { GET: "PUBLIC" },
  "quizzes/[quizId]/attempts/route.ts": { POST: "OWNER" },
  "quizzes/[quizId]/questions/[questionId]/route.ts": { PATCH: "ADMIN", DELETE: "ADMIN" },
  "quizzes/[quizId]/questions/reorder/route.ts": { PATCH: "ADMIN" },
  "quizzes/[quizId]/questions/route.ts": { POST: "ADMIN" },
  "quizzes/[quizId]/route.ts": { PATCH: "ADMIN", DELETE: "ADMIN" },
  "quizzes/[quizId]/submit/route.ts": { POST: "OWNER" },
  "s3/asset-upload/route.ts": { POST: "AUTHED" },
  "s3/file/[...key]/route.ts": { GET: "PUBLIC" },
  "s3/presigned-url/route.ts": { POST: "ADMIN" },
  "s3/youtube-download/route.ts": { POST: "ADMIN" },
  "s3/yt/route.ts": { POST: "ADMIN" },
  "users/[userId]/soft-delete/route.ts": { PATCH: "ADMIN" },
  "users/me/route.ts": { PATCH: "OWNER" },
};

const API_DIR = join(process.cwd(), "app", "api");

function listRouteFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return listRouteFiles(full);
    return entry === "route.ts" ? [relative(API_DIR, full).split(sep).join("/")] : [];
  });
}

function isMethod(name: string): name is Method {
  return (METHODS as readonly string[]).includes(name);
}

function exportedMethods(source: string): Set<Method> {
  const found = new Set<Method>();
  for (const match of source.matchAll(/^export\s+(?:async\s+)?function\s+([A-Z]+)\s*\(/gm)) {
    if (isMethod(match[1])) found.add(match[1]);
  }
  for (const match of source.matchAll(/^export\s+const\s+\{([^}]*)\}\s*=/gm)) {
    for (const name of match[1].split(",").map((part) => part.trim())) {
      if (isMethod(name)) found.add(name);
    }
  }
  for (const match of source.matchAll(/^export\s*\{([^}]*)\}/gm)) {
    for (const part of match[1].split(",")) {
      const alias = part.trim().split(/\s+as\s+/).pop()?.trim() ?? "";
      if (isMethod(alias)) found.add(alias);
    }
  }
  return found;
}

function handlerBody(source: string, method: Method): string {
  const start = source.search(new RegExp(`^export\\s+(?:async\\s+)?function\\s+${method}\\s*\\(`, "m"));
  if (start === -1) return "";
  const rest = source.slice(start + 1);
  const next = rest.search(/^export /m);
  return next === -1 ? source.slice(start) : source.slice(start, start + 1 + next);
}

function readRoute(file: string): string {
  return readFileSync(join(API_DIR, file), "utf8");
}

describe("API access table", () => {
  const files = listRouteFiles(API_DIR);

  it("lists every route file on disk", () => {
    expect(files.filter((f) => !(f in API_ACCESS))).toEqual([]);
  });

  it("has no entries for files that no longer exist", () => {
    expect(Object.keys(API_ACCESS).filter((f) => !files.includes(f))).toEqual([]);
  });

  for (const [file, methods] of Object.entries(API_ACCESS)) {
    for (const [method, access] of Object.entries(methods) as [Method, Access][]) {
      it(`${access} ${method} ${file}`, () => {
        const source = readRoute(file);
        expect(exportedMethods(source).has(method)).toBe(true);
        if (access === "ADMIN") expect(handlerBody(source, method)).toContain("requireAdminApi(");
        if (access === "AUTHED" || access === "OWNER") {
          expect(handlerBody(source, method)).toMatch(/\bauth\(\)|requireAdminApi\(/);
        }
      });
    }
  }

  it("declares every exported handler", () => {
    const undeclared = files.flatMap((file) => {
      const declared = API_ACCESS[file] ?? {};
      return [...exportedMethods(readRoute(file))].filter((m) => !(m in declared)).map((m) => `${m} ${file}`);
    });
    expect(undeclared).toEqual([]);
  });
});
