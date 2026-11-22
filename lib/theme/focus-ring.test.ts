import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const TRANSLUCENT_RING = /\bring-(?:ring|primary)\/\d+|ring-\[hsl\(var\(--primary\)\/0\.\d+\)\]/;
const EXCLUDED = new Set([path.join("app", "(client)", "page.tsx")]);

function offendingLines(): string[] {
  return ["app", "components"].flatMap((dir) =>
    fs
      .readdirSync(path.join(process.cwd(), dir), { recursive: true, encoding: "utf8" })
      .filter((file) => file.endsWith(".tsx"))
      .map((file) => path.join(dir, file))
      .filter((file) => !EXCLUDED.has(file))
      .flatMap((file) =>
        fs
          .readFileSync(path.join(process.cwd(), file), "utf8")
          .split("\n")
          .flatMap((line, i) => (TRANSLUCENT_RING.test(line) ? [`${file}:${i + 1}`] : [])),
      ),
  );
}

describe("focus rings", () => {
  it("focus and selection rings are fully opaque (landing page excluded until its PR lands)", () => {
    const offenders = offendingLines();
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
