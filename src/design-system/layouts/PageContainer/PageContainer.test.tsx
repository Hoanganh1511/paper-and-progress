import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { PageContainer } from "./PageContainer";

expect.extend(toHaveNoViolations);

describe("PageContainer", () => {
  it("is a centered default-size container with default vertical padding", () => {
    render(<PageContainer>Test</PageContainer>);
    expect(screen.getByText("Test")).toHaveClass(
      "mx-auto",
      "px-4",
      "max-w-[var(--width-container-default)]",
      "py-6",
      "md:py-8",
    );
  });

  it("applies each spacing", () => {
    const expected = {
      compact: "py-4",
      default: "py-6",
      spacious: "py-8",
    } as const;
    (Object.keys(expected) as (keyof typeof expected)[]).forEach((spacing) => {
      const { unmount } = render(
        <PageContainer spacing={spacing}>Test</PageContainer>,
      );
      expect(screen.getByText("Test")).toHaveClass(expected[spacing]);
      unmount();
    });
  });

  it("passes size through to the Container", () => {
    render(<PageContainer size="wide">Test</PageContainer>);
    expect(screen.getByText("Test")).toHaveClass(
      "max-w-[var(--width-container-wide)]",
    );
  });

  it("receives ref via props and merges className", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <PageContainer ref={ref} className="custom-class">
        Test
      </PageContainer>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <PageContainer>
        <p>Content</p>
      </PageContainer>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
