import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  apcaContrast,
  apcaContrastRgb,
  parseThemeTokens,
  resolveHsl,
  wcagContrast,
  wcagContrastRgb,
} from "./contrast";

const BLACK = [0, 0, 0] as const;
const WHITE = [255, 255, 255] as const;
const GREY_88 = [136, 136, 136] as const;

describe("contrast math", () => {
  it("matches WCAG 2 reference ratios", () => {
    expect(wcagContrast([0, 0, 0], [0, 0, 100])).toBeCloseTo(21, 5);
    expect(wcagContrastRgb([118, 118, 118], WHITE)).toBeCloseTo(4.54, 2);
  });

  it("matches APCA 0.0.98G-4g reference values", () => {
    expect(apcaContrastRgb(GREY_88, WHITE)).toBeCloseTo(63.06, 1);
    expect(apcaContrastRgb(WHITE, GREY_88)).toBeCloseTo(-68.54, 1);
    expect(apcaContrastRgb(BLACK, WHITE)).toBeCloseTo(106.04, 1);
    expect(apcaContrastRgb(WHITE, BLACK)).toBeCloseTo(-107.88, 1);
  });
});

describe("theme token parser", () => {
  const css = `
    :root {
      --a: 0 0% 100%;
      --b: var(--a);
      --font: "Anton", sans-serif;
    }
    .dark .dl-app { --a: 0 0% 50%; }
    .dark {
      --a: 0 0% 0%;
    }
  `;
  const { light, dark } = parseThemeTokens(css);

  it("resolves var() aliases to the aliased triplet", () => {
    expect(resolveHsl(light, "b")).toEqual([0, 0, 100]);
  });

  it("lets dark inherit light tokens it does not override", () => {
    expect(resolveHsl(dark, "b")).toEqual([0, 0, 0]);
  });

  it("reads the exact .dark block, not a .dark descendant selector", () => {
    expect(resolveHsl(dark, "a")).toEqual([0, 0, 0]);
  });

  it("names the token when a value is not an HSL triplet or is missing", () => {
    expect(() => resolveHsl(light, "font")).toThrow("--font");
    expect(() => resolveHsl(light, "nope")).toThrow("missing --nope");
  });
});

const themes = parseThemeTokens(
  fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8"),
);

const SURFACES = ["background", "card", "popover", "muted"];
const TEXT_ON_SURFACES = [
  "foreground",
  "muted-foreground",
  "primary-text",
  "destructive",
  "success",
  "accent",
];
const FILLS = ["primary", "secondary", "accent", "destructive", "success"];

type Pair = { fg: string; bg: string; min: number };

const pairs: Pair[] = [
  ...TEXT_ON_SURFACES.flatMap((fg) => SURFACES.map((bg) => ({ fg, bg, min: 4.5 }))),
  { fg: "card-foreground", bg: "card", min: 4.5 },
  { fg: "popover-foreground", bg: "popover", min: 4.5 },
  ...FILLS.map((x) => ({ fg: `${x}-foreground`, bg: x, min: 4.5 })),
  ...SURFACES.map((bg) => ({ fg: "ring", bg, min: 3 })),
  ...["chart-1", "chart-2", "chart-3"].map((fg) => ({ fg, bg: "card", min: 3 })),
];

const cases = (["light", "dark"] as const).flatMap((theme) =>
  pairs.map((pair) => ({ theme, ...pair })),
);

describe("theme tokens in app/globals.css", () => {
  it.each(cases)("$theme: $fg on $bg ≥ $min:1", ({ theme, fg, bg, min }) => {
    const tokens = themes[theme];
    const ratio = wcagContrast(resolveHsl(tokens, fg), resolveHsl(tokens, bg));
    expect(ratio, `${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(min);
  });

  it.each(
    (["light", "dark"] as const).flatMap((theme) =>
      ["background", "card", "popover"].map((bg) => ({ theme, bg })),
    ),
  )("$theme: foreground on $bg reaches APCA |Lc| ≥ 75", ({ theme, bg }) => {
    const tokens = themes[theme];
    const lc = apcaContrast(resolveHsl(tokens, "foreground"), resolveHsl(tokens, bg));
    expect(Math.abs(lc), `Lc ${lc.toFixed(1)}`).toBeGreaterThanOrEqual(75);
  });
});
