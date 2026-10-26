import { cn } from "./cn";

describe("cn", () => {
  it("joins class names and skips falsy values", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("supports conditional objects and arrays", () => {
    expect(cn(["a", { b: true, c: false }], "d")).toBe("a b d");
  });

  it("lets the later Tailwind class win a conflict", () => {
    expect(cn("p-4", "p-6")).toBe("p-6");
    expect(cn("px-4 py-2", "px-0")).toBe("py-2 px-0");
  });

  it("keeps non-conflicting classes", () => {
    expect(cn("flex", "items-center", "gap-2")).toBe("flex items-center gap-2");
  });

  it("treats the custom --text-* tokens as font sizes, not colors", () => {
    expect(cn("text-display-xl", "text-text-primary")).toBe(
      "text-display-xl text-text-primary",
    );
    expect(cn("text-body-md", "text-heading-lg")).toBe("text-heading-lg");
  });

  it("still resolves conflicts between colors", () => {
    expect(cn("text-text-primary", "text-text-muted")).toBe("text-text-muted");
  });

  it("keeps variant-prefixed classes apart from plain ones", () => {
    expect(cn("h-10", "sm:h-12")).toBe("h-10 sm:h-12");
  });
});
