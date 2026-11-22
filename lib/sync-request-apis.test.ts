import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import { findSyncRequestApiUses } from "./sync-request-apis";

const ROOT = join(__dirname, "..");
const SOURCE_DIRS = ["app", "actions", "components", "lib", "hooks", "context", "utilities"];

function sourceFiles(dir: string): string[] {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".test.ts") ? [path] : [];
  });
}

describe("findSyncRequestApiUses", () => {
  it.each([
    'const value = (cookies() as unknown as UnsafeUnwrappedCookies).get("x")?.value;',
    'import { cookies, type UnsafeUnwrappedCookies } from "next/headers";',
    "const t = getServerMessages();",
    "const locale = getServerLocale();",
    "const h = headers();",
    "const { isEnabled } = draftMode();",
  ])("flags %s", (line) => {
    expect(findSyncRequestApiUses(line)).toHaveLength(1);
  });

  it.each([
    "const cookieStore = await cookies();",
    "const value = (await cookies()).get(name)?.value;",
    "const t = await getServerMessages();",
    "const t = (await getServerMessages()).completion;",
    "headers: await headers(),",
    "export async function getServerMessages() {",
    "const h = new Headers();",
    "const value = response.headers();",
  ])("allows %s", (line) => {
    expect(findSyncRequestApiUses(line)).toEqual([]);
  });
});

describe("request APIs in the codebase", () => {
  it("are always awaited", () => {
    const offenders = SOURCE_DIRS.flatMap((dir) => sourceFiles(join(ROOT, dir))).flatMap((file) =>
      findSyncRequestApiUses(readFileSync(file, "utf8")).map(
        (use) => `${relative(ROOT, file)}:${use.line} ${use.text}`,
      ),
    );
    expect(offenders).toEqual([]);
  });
});
