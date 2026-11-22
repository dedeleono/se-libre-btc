import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

// An `overflow-x: auto` box clips an absolutely positioned descendant only when it is
// that descendant's containing block, i.e. when the box itself is positioned. Report
// cells carry `sr-only` text (position: absolute). Without `relative` on the scroller,
// those spans escaped it and widened the whole analytics page to 753 px at 375 px.
const read = (path: string) => readFileSync(join(__dirname, "..", path), "utf8");
const scrollerClasses = (tsx: string) =>
  [...tsx.matchAll(/className="([^"]*\boverflow-x-auto\b[^"]*)"/g)].map((m) => m[1].split(/\s+/));

describe("table scrollers clip their sr-only descendants", () => {
  it.each(["components/table-scroll-region.tsx", "components/ui/table.tsx"])("%s scroller is positioned", (path) => {
    const scrollers = scrollerClasses(read(path));
    expect(scrollers.length).toBeGreaterThan(0);
    for (const classes of scrollers) expect(classes).toContain("relative");
  });
});
