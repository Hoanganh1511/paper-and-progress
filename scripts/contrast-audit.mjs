// Computes WCAG 2.x contrast ratios for the design tokens in src/app/globals.css.
// Run: node scripts/contrast-audit.mjs   (add --markdown for a table)
// jsdom cannot compute colors, so jest-axe never checks contrast: this does.
import { readFileSync } from "node:fs";

const css = readFileSync(
  new URL("../src/app/globals.css", import.meta.url),
  "utf8",
);

function block(startMarker) {
  const start = css.indexOf(startMarker);
  let depth = 0;
  let i = css.indexOf("{", start);
  const open = i;
  for (; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  return "";
}

function vars(text) {
  const map = {};
  for (const m of text.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    map[m[1]] = m[2].toLowerCase();
  }
  return map;
}

const light = vars(block("@theme"));
const dark = { ...light, ...vars(block(".dark")) };

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = (h) => {
  const [r, g, b] = hex(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
// Composite `fg` at `alpha` over `bg`.
// const mix = (fg, bg, alpha) =>
//   "#" +
//   hex(fg)
//     .map((c, i) => Math.round(c * alpha + hex(bg)[i] * (1 - alpha)))
//     .map((c) => c.toString(16).padStart(2, "0"))
//     .join("");

// [label, foreground token, background token or {mix}, required ratio, kind]
const pairs = [
  ["Body text on page", "text-primary", "surface-page", 4.5],
  ["Body text on card", "text-primary", "surface-card", 4.5],
  ["Body text on sunken", "text-primary", "surface-sunken", 4.5],
  ["Secondary text on page", "text-secondary", "surface-page", 4.5],
  ["Secondary text on card", "text-secondary", "surface-card", 4.5],
  [
    "Secondary text on sunken (pill tabs)",
    "text-secondary",
    "surface-sunken",
    4.5,
  ],
  ["Muted text on page", "text-muted", "surface-page", 4.5],
  [
    "Muted text on card (placeholders, captions)",
    "text-muted",
    "surface-card",
    4.5,
  ],
  ["Muted text on sunken", "text-muted", "surface-sunken", 4.5],
  ["Disabled text on card (exempt)", "text-disabled", "surface-card", 4.5],
  [
    "Primary button: inverse on action-primary",
    "text-inverse",
    "action-primary",
    4.5,
  ],
  ["Primary button hover", "text-inverse", "action-primary-hover", 4.5],
  ["Primary button active", "text-inverse", "action-primary-active", 4.5],
  ["Accent button / active nav: ink on lime", "ink", "accent-lime", 4.5],
  ["Badge: ink on pink", "ink", "accent-pink", 4.5],
  ["Badge: ink on yellow", "ink", "accent-yellow", 4.5],
  ["Badge: ink on blue", "ink", "accent-blue", 4.5],
  ["Destructive button: surface on danger-text", "surface", "danger-text", 4.5],
  ["Success text on success-bg", "success-text", "success-bg", 4.5],
  ["Warning text on warning-bg", "warning-text", "warning-bg", 4.5],
  ["Danger text on danger-bg", "danger-text", "danger-bg", 4.5],
  ["Info text on info-bg", "info-text", "info-bg", 4.5],
  ["Illustrated card: white on theme-blue", "#ffffff", "theme-blue", 4.5],
  ["Illustrated card: white on theme-green", "#ffffff", "theme-green", 4.5],
  ["Illustrated card: white on theme-orange", "#ffffff", "theme-orange", 4.5],
  ["Illustrated card: white on theme-pink", "#ffffff", "theme-pink", 4.5],
  ["Illustrated card: white on theme-purple", "#ffffff", "theme-purple", 4.5],
  [
    "Illustrated card badge: white on theme-blue-strong",
    "#ffffff",
    "theme-blue-strong",
    4.5,
  ],
  [
    "Illustrated card badge: white on theme-green-strong",
    "#ffffff",
    "theme-green-strong",
    4.5,
  ],
  [
    "Illustrated card badge: white on theme-orange-strong",
    "#ffffff",
    "theme-orange-strong",
    4.5,
  ],
  [
    "Illustrated card badge: white on theme-pink-strong",
    "#ffffff",
    "theme-pink-strong",
    4.5,
  ],
  [
    "Illustrated card badge: white on theme-purple-strong",
    "#ffffff",
    "theme-purple-strong",
    4.5,
  ],
  ["Danger text on page (field errors)", "danger-text", "surface-page", 4.5],
  ["Danger text on card (field errors)", "danger-text", "surface-card", 4.5],
  ["Danger text on dialog (overlay)", "danger-text", "surface-overlay", 4.5],
  // Non-text contrast, 3:1
  ["Focus ring on page", "border-focus", "surface-page", 3],
  ["Focus ring on card", "border-focus", "surface-card", 3],
  ["Focus ring on sunken", "border-focus", "surface-sunken", 3],
  [
    "Input border (border-default) on card",
    "border-default",
    "surface-card",
    3,
  ],
  [
    "Input border (border-default) on page",
    "border-default",
    "surface-page",
    3,
  ],
  [
    "Checkbox / radio / switch edge (text-muted) on card",
    "text-muted",
    "surface-card",
    3,
  ],
  [
    "Outlined button / strong border on page",
    "border-strong",
    "surface-page",
    3,
  ],
  ["Subtle border on card (decorative)", "border-subtle", "surface-card", 3],
  ["Switch thumb (surface) on track (text-muted)", "surface", "text-muted", 3],
  ["Icon: accent-lime on card", "accent-lime", "surface-card", 3],
  ["Icon: accent-pink on card", "accent-pink", "surface-card", 3],
  ["Icon: accent-yellow on card", "accent-yellow", "surface-card", 3],
  ["Icon: accent-blue on card", "accent-blue", "surface-card", 3],
  ["Skeleton (border-subtle) on page", "border-subtle", "surface-page", 3],
];

const rows = [];
for (const [label, fg, bg, needed] of pairs) {
  const result = { label, needed };
  for (const [theme, tokens] of [
    ["light", light],
    ["dark", dark],
  ]) {
    const a = fg.startsWith("#") ? fg : tokens[fg];
    const b = bg.startsWith("#") ? bg : tokens[bg];
    result[theme] = a && b ? ratio(a, b) : null;
    result[`${theme}Pair`] = `${a} on ${b}`;
  }
  rows.push(result);
}

const format = (value) => (value == null ? "n/a" : value.toFixed(2));
const verdict = (value, needed) =>
  value == null ? "n/a" : value >= needed ? "pass" : "FAIL";

if (process.argv.includes("--markdown")) {
  console.log("| Pair | Needs | Light | Dark |");
  console.log("| --- | --- | --- | --- |");
  for (const row of rows) {
    const cell = (value) =>
      `${format(value)} ${verdict(value, row.needed) === "FAIL" ? "**FAIL**" : "pass"}`;
    console.log(
      `| ${row.label} | ${row.needed}:1 | ${cell(row.light)} | ${cell(row.dark)} |`,
    );
  }
} else {
  for (const row of rows) {
    console.log(
      `${verdict(row.light, row.needed).padEnd(4)} ${format(row.light).padStart(5)} | ` +
        `${verdict(row.dark, row.needed).padEnd(4)} ${format(row.dark).padStart(5)} | ` +
        `need ${row.needed} | ${row.label}`,
    );
  }
}
