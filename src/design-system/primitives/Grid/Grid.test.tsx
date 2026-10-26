import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Grid } from "./Grid";

expect.extend(toHaveNoViolations);

describe("Grid", () => {
  it("renders a single-column grid with default gap", () => {
    render(<Grid>Test</Grid>);
    expect(screen.getByText("Test")).toHaveClass(
      "grid",
      "grid-cols-1",
      "gap-4",
    );
  });

  it("applies each gap", () => {
    const gaps = [1, 2, 3, 4, 5, 6, 8] as const;
    gaps.forEach((gap) => {
      const { unmount } = render(<Grid gap={gap}>Test</Grid>);
      expect(screen.getByText("Test")).toHaveClass(`gap-${gap}`);
      unmount();
    });
  });

  it("is responsive by default: 1 col mobile, 2 tablet, `columns` desktop", () => {
    render(<Grid columns={4}>Test</Grid>);
    expect(screen.getByText("Test")).toHaveClass(
      "grid-cols-1",
      "sm:grid-cols-2",
      "lg:grid-cols-4",
    );
  });

  it("applies each column count at desktop when responsive", () => {
    const columns = [2, 3, 4, 6, 12] as const;
    columns.forEach((count) => {
      const { unmount } = render(<Grid columns={count}>Test</Grid>);
      const el = screen.getByText("Test");
      expect(el).toHaveClass("grid-cols-1", "sm:grid-cols-2");
      expect(el).toHaveClass(
        count === 2 ? "sm:grid-cols-2" : `lg:grid-cols-${count}`,
      );
      unmount();
    });
  });

  it("keeps a single column at every breakpoint when columns is 1", () => {
    render(<Grid columns={1}>Test</Grid>);
    const el = screen.getByText("Test");
    expect(el).toHaveClass("grid-cols-1");
    expect(el.className).not.toContain("sm:grid-cols-2");
  });

  it("uses fixed columns when responsive is false", () => {
    const columns = [1, 2, 3, 4, 6, 12] as const;
    columns.forEach((count) => {
      const { unmount } = render(
        <Grid columns={count} responsive={false}>
          Test
        </Grid>,
      );
      const el = screen.getByText("Test");
      expect(el).toHaveClass(`grid-cols-${count}`);
      expect(el.className).not.toContain("sm:");
      unmount();
    });
  });

  it("receives ref via props", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Grid ref={ref}>Test</Grid>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("merges custom className", () => {
    render(<Grid className="custom-class">Test</Grid>);
    expect(screen.getByText("Test")).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Grid columns={2}>
        <p>One</p>
        <p>Two</p>
      </Grid>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
