import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { devFixtureOnly } from "./dev-fixture";

const DEV_ROUTES = join(__dirname, "..", "app", "(dev)");

function pageFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return pageFiles(path);
    return entry.name === "page.tsx" ? [path] : [];
  });
}

describe("dev fixture routes", () => {
  it("respond 404 in production", () => {
    let thrown: unknown;
    try {
      devFixtureOnly("production");
    } catch (error) {
      thrown = error;
    }
    expect((thrown as { digest?: string } | undefined)?.digest).toMatch(/;404$/);
  });

  it("render in development and test", () => {
    expect(() => devFixtureOnly("development")).not.toThrow();
    expect(() => devFixtureOnly("test")).not.toThrow();
  });

  it("guard every page before it renders anything", () => {
    const pages = pageFiles(DEV_ROUTES);
    expect(pages.length).toBeGreaterThan(0);
    for (const page of pages) {
      const body = readFileSync(page, "utf8").match(/export default async function \w+\([^)]*\)[^{]*\{\s*([^\n]*)/);
      expect(body?.[1], page).toBe("devFixtureOnly();");
    }
  });
});
