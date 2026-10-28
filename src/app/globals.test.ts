import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

/** Text between the braces of the first block that starts with `marker`. */
function block(marker: string) {
  const start = css.indexOf(marker);
  if (start === -1) throw new Error(`"${marker}" not found in globals.css`);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}") depth -= 1;
    if (depth === 0) return css.slice(open + 1, index);
  }
  throw new Error(`Unclosed block after "${marker}"`);
}

function customProperties(text: string) {
  const result: Record<string, string> = {};
  for (const match of text.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) {
    result[match[1]] = match[2].trim().toLowerCase();
  }
  return result;
}

const light = customProperties(block("@theme"));
// Dark mode has two entry points: the `.dark` class (the toggle) and the
// prefers-color-scheme media query (no choice made yet). They must agree.
const darkClass = customProperties(block(".dark {"));
const darkMedia = customProperties(
  block("@media (prefers-color-scheme: dark)"),
);

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

describe("globals.css theme tokens", () => {
  it("defines the same dark tokens for the .dark class and the media query", () => {
    const withoutScheme = (tokens: Record<string, string>) => {
      const { "color-scheme": _ignored, ...rest } = tokens;
      void _ignored;
      return rest;
    };
    expect(withoutScheme(darkClass)).toEqual(withoutScheme(darkMedia));
  });

  it("only overrides tokens that exist in the light theme", () => {
    Object.keys(darkClass).forEach((name) => {
      expect(light).toHaveProperty([name]);
    });
  });

  it("really changes the surfaces and text in dark mode", () => {
    const unchanged = [
      "--color-surface-page",
      "--color-surface-card",
      "--color-surface-overlay",
      "--color-surface-sunken",
      "--color-text-primary",
      "--color-text-secondary",
      "--color-text-muted",
    ].filter(
      (name) =>
        darkClass[name] === undefined || darkClass[name] === light[name],
    );
    // Lists the offending tokens in the failure message.
    expect(unchanged).toEqual([]);
  });

  it("keeps dark text readable on every dark surface", () => {
    const text = [
      "--color-text-primary",
      "--color-text-secondary",
      "--color-text-muted",
    ];
    const surfaces = [
      "--color-surface-page",
      "--color-surface-card",
      "--color-surface-overlay",
      "--color-surface-sunken",
    ];
    const unreadable = text.flatMap((fg) =>
      surfaces
        .filter((bg) => contrast(darkClass[fg], darkClass[bg]) < 4.5)
        .map((bg) => `${fg} on ${bg}`),
    );
    expect(unreadable).toEqual([]);
  });

  it("keeps primary and secondary light text readable on the light surfaces", () => {
    const surfaces = [
      "--color-surface-page",
      "--color-surface-card",
      "--color-surface-overlay",
    ];
    const unreadable = [
      "--color-text-primary",
      "--color-text-secondary",
    ].flatMap((fg) =>
      surfaces
        .filter((bg) => contrast(light[fg], light[bg]) < 4.5)
        .map((bg) => `${fg} on ${bg}`),
    );
    expect(unreadable).toEqual([]);
  });

  it("tells the browser which color scheme native controls should use in dark mode", () => {
    expect(block(".dark {")).toMatch(/color-scheme:\s*dark/);
    expect(block("@media (prefers-color-scheme: dark)")).toMatch(
      /color-scheme:\s*dark/,
    );
  });

  it("paints the page with the semantic surface and text tokens", () => {
    expect(block("body {")).toMatch(
      /background-color:\s*var\(--color-surface-page\)/,
    );
    expect(block("body {")).toMatch(/color:\s*var\(--color-text-primary\)/);
  });

  it("draws a 50px square grid on the page with faint 1px lines", () => {
    const body = block("body {");
    expect(body).toMatch(/background-size:\s*50px 50px/);
    // One gradient for the horizontal lines and one for the vertical ones.
    expect(body.match(/linear-gradient\(/g)).toHaveLength(2);
    expect(body).toMatch(/var\(--color-grid-line\) 1px/);

    // Translucent in light and dark, never a solid colour.
    const alpha = (css: string) =>
      Number(/--color-grid-line:\s*rgba\([^)]*,\s*([\d.]+)\)/.exec(css)?.[1]);
    [
      css,
      block(".dark {"),
      block("@media (prefers-color-scheme: dark)"),
    ].forEach((source) => {
      expect(alpha(source)).toBeGreaterThan(0);
      expect(alpha(source)).toBeLessThanOrEqual(0.12);
    });
  });
  it("keeps white text readable on every illustrated-card theme color and its badge color", () => {
    const themes = Object.keys(light).filter((name) =>
      name.startsWith("--color-theme-"),
    );
    // Five themes, each with a card color and a darker badge color.
    expect(themes).toHaveLength(10);
    const unreadable = themes.filter(
      (name) => contrast("#ffffff", light[name]) < 4.5,
    );
    expect(unreadable).toEqual([]);
  });

  it("makes each badge color darker than its card color", () => {
    ["blue", "green", "orange", "pink", "purple"].forEach((name) => {
      const card = light[`--color-theme-${name}`];
      const badge = light[`--color-theme-${name}-strong`];
      expect(luminance(badge)).toBeLessThan(luminance(card));
    });
  });
});
