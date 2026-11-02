import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { PageTransition } from "./PageTransition";

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");
const css = read("src/app/globals.css");

describe("PageTransition", () => {
  it("passes the page through", () => {
    render(
      <PageTransition>
        <p>Nội dung trang</p>
      </PageTransition>,
    );
    expect(screen.getByText("Nội dung trang")).toBeInTheDocument();
  });

  it("fades the old page out, and fades the new one in and up", () => {
    expect(css).toContain("::view-transition-old(.page-out)");
    expect(css).toContain("::view-transition-new(.page-in)");
    expect(css).toMatch(/@keyframes page-fade-out\s*{\s*to\s*{\s*opacity:\s*0/);
    expect(css).toMatch(
      /@keyframes page-fade-in\s*{\s*from\s*{\s*opacity:\s*0;\s*transform:\s*translateY/,
    );
  });

  it("lets clicks through while it runs, and does not move for reduced motion", () => {
    expect(css).toMatch(/::view-transition\s*{\s*pointer-events:\s*none/);
    expect(css).toMatch(
      /prefers-reduced-motion: reduce\)\s*{[\s\S]*::view-transition-old\(\*\)[\s\S]*animation-duration:\s*0s/,
    );
  });
});

describe("the templates", () => {
  const groups = [
    "(application)/(sidebar)",
    "(application)",
    "(marketing)",
    "(auth)",
  ];

  it.each(groups)(
    "%s has one that wraps its pages in the transition",
    (group) => {
      expect(read(`src/app/${group}/template.tsx`)).toContain(
        "<PageTransition>",
      );
    },
  );

  it("keeps the sidebar out of the sidebar group's template: the sidebar is in the layout", () => {
    const layout = read("src/app/(application)/(sidebar)/layout.tsx");
    const template = read("src/app/(application)/(sidebar)/template.tsx");
    expect(layout).toContain("HomeSidebar");
    expect(template).not.toContain("HomeSidebar");
  });
});
