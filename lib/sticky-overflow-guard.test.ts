import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

// `overflow: hidden` (or `overflow-x: hidden`) on an ancestor turns it into a
// scroll container, and every `position: sticky` inside it stops sticking.
// `clip` stops sideways overflow without creating a scroll container.

const root = join(__dirname, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

/** Declarations of every rule whose selector is exactly `selector`, in source order. */
const ruleBodies = (css: string, selector: string): string[] =>
  [...css.matchAll(new RegExp(`(?:^|[\\s}])${selector}\\s*\\{([^{}]*)\\}`, "g"))].map((m) => m[1]);

/** Values of `overflow` / `overflow-x` in declaration order (the last one wins). */
const overflowValues = (body: string): string[] =>
  [...body.matchAll(/(?:^|;|\s)overflow(?:-x)?\s*:\s*([a-z-]+)/g)].map((m) => m[1]);

const OVERFLOW_HIDDEN_UTILITY = /\boverflow(-x)?-hidden\b/;

const PAGE_WRAPPERS = [
  "app/(auth)/layout.tsx",
  "app/(client)/layout.tsx",
  "app/(client)/page.tsx",
  "app/(client)/about/page.tsx",
  "app/(course)/courses/[courseId]/layout.tsx",
  "app/(course)/courses/loading.tsx",
  "app/(dashboard)/_components/dashboard-shell.tsx",
];

/** Class lists of every element carrying the `dl-app` page-wrapper class. */
const wrapperClasses = (tsx: string): string[] =>
  [...tsx.matchAll(/className="([^"]*\bdl-app\b[^"]*)"/g)].map((m) => m[1]);

describe("sticky positioning is not broken by page-level overflow", () => {
  const css = read("app/globals.css");

  it("html declares no overflow, so body's overflow moves to the viewport", () => {
    for (const body of ruleBodies(css, "html")) expect(overflowValues(body)).toEqual([]);
  });

  it("body clips sideways overflow instead of hiding it", () => {
    const [main] = ruleBodies(css, "body");
    expect(main).toBeDefined();
    expect(overflowValues(main)).toEqual(["clip"]);
  });

  it("body falls back to hidden only where clip is unsupported", () => {
    const outsideSupports = css.replace(/@supports not \(overflow-x: clip\)\s*\{[^{}]*\{[^{}]*\}\s*\}/g, "");
    for (const body of ruleBodies(outsideSupports, "body")) {
      expect(overflowValues(body)).not.toContain("hidden");
    }
  });

  it("the root <body> carries no overflow-hidden utility", () => {
    const body = /<body className="([^"]*)"/.exec(read("app/layout.tsx"));
    expect(body).not.toBeNull();
    expect(body![1]).not.toMatch(OVERFLOW_HIDDEN_UTILITY);
  });

  it.each(PAGE_WRAPPERS)("%s page wrapper uses clip, not hidden", (path) => {
    const classes = wrapperClasses(read(path));
    expect(classes.length).toBeGreaterThan(0);
    for (const list of classes) expect(list).not.toMatch(OVERFLOW_HIDDEN_UTILITY);
  });
});
