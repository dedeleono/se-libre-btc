export type Hsl = readonly [h: number, s: number, l: number];
export type Rgb = readonly [r: number, g: number, b: number];
export type ThemeTokens = Record<string, string>;

export function hslToRgb255([h, s, l]: Hsl): Rgb {
  const k = (n: number) => (n + h / 30) % 12;
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) =>
    l / 100 - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map((x) => Math.round(x * 255)) as unknown as Rgb;
}

function relativeLuminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((c) => {
    const x = c / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function wcagContrastRgb(fg: Rgb, bg: Rgb): number {
  const a = relativeLuminance(fg);
  const b = relativeLuminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function wcagContrast(fg: Hsl, bg: Hsl): number {
  return wcagContrastRgb(hslToRgb255(fg), hslToRgb255(bg));
}

function apcaLuminance([r, g, b]: Rgb): number {
  const y =
    0.2126729 * (r / 255) ** 2.4 +
    0.7151522 * (g / 255) ** 2.4 +
    0.072175 * (b / 255) ** 2.4;
  return y > 0.022 ? y : y + (0.022 - y) ** 1.414;
}

export function apcaContrastRgb(text: Rgb, bg: Rgb): number {
  const t = apcaLuminance(text);
  const b = apcaLuminance(bg);
  if (b > t) {
    const s = (b ** 0.56 - t ** 0.57) * 1.14;
    return s < 0.1 ? 0 : (s - 0.027) * 100;
  }
  const s = (b ** 0.65 - t ** 0.62) * 1.14;
  return s > -0.1 ? 0 : (s + 0.027) * 100;
}

export function apcaContrast(text: Hsl, bg: Hsl): number {
  return apcaContrastRgb(hslToRgb255(text), hslToRgb255(bg));
}

function blockBody(css: string, selector: RegExp): string {
  const match = selector.exec(css);
  if (!match) throw new Error(`theme block not found: ${selector}`);
  const start = match.index + match[0].length;
  let depth = 1;
  for (let i = start; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) return css.slice(start, i);
  }
  throw new Error(`unterminated theme block: ${selector}`);
}

function declarations(body: string): ThemeTokens {
  const tokens: ThemeTokens = {};
  for (const [, name, value] of body
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
    tokens[name] = value.trim();
  }
  return tokens;
}

export function parseThemeTokens(css: string): {
  light: ThemeTokens;
  dark: ThemeTokens;
} {
  const light = declarations(blockBody(css, /^\s*:root\s*\{/m));
  const dark = { ...light, ...declarations(blockBody(css, /^\s*\.dark\s*\{/m)) };
  return { light, dark };
}

export function resolveHsl(tokens: ThemeTokens, name: string): Hsl {
  const value = tokens[name];
  if (value === undefined) throw new Error(`missing --${name}`);
  const alias = /^var\(--([a-z0-9-]+)\)$/.exec(value);
  if (alias) return resolveHsl(tokens, alias[1]);
  const triplet = /^(-?[\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/.exec(value);
  if (!triplet) throw new Error(`--${name} is not an HSL triplet: "${value}"`);
  return [Number(triplet[1]), Number(triplet[2]), Number(triplet[3])];
}
