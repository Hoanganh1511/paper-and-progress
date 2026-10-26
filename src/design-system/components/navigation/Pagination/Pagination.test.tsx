import { createRef } from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Pagination, getPageItems } from "./Pagination";

expect.extend(toHaveNoViolations);

describe("getPageItems", () => {
  it("lists every page when they all fit", () => {
    expect(getPageItems(1, 1)).toEqual([1]);
    expect(getPageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("collapses the end when near the start", () => {
    expect(getPageItems(1, 20)).toEqual([1, 2, 3, 4, 5, "end-ellipsis", 20]);
    expect(getPageItems(3, 20)).toEqual([1, 2, 3, 4, 5, "end-ellipsis", 20]);
  });

  it("collapses the start when near the end", () => {
    expect(getPageItems(20, 20)).toEqual([
      1,
      "start-ellipsis",
      16,
      17,
      18,
      19,
      20,
    ]);
  });

  it("collapses both sides in the middle, keeping the slot count stable", () => {
    expect(getPageItems(10, 20)).toEqual([
      1,
      "start-ellipsis",
      9,
      10,
      11,
      "end-ellipsis",
      20,
    ]);
    expect(getPageItems(10, 20, 2)).toEqual([
      1,
      "start-ellipsis",
      8,
      9,
      10,
      11,
      12,
      "end-ellipsis",
      20,
    ]);
  });
});

describe("Pagination", () => {
  it("renders a labelled navigation with page buttons", () => {
    render(<Pagination page={2} pageCount={5} onPageChange={() => {}} />);
    expect(
      screen.getByRole("navigation", { name: "Pagination" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Page / })).toHaveLength(5);
  });

  it("marks the current page with aria-current", () => {
    render(<Pagination page={2} pageCount={5} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Page 3" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("changes page from a number and from previous/next", async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} pageCount={5} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Page 5" }));
    expect(onPageChange).toHaveBeenLastCalledWith(5);
    await userEvent.click(
      screen.getByRole("button", { name: "Previous page" }),
    );
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    await userEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenLastCalledWith(4);
  });

  it("disables previous on the first page and next on the last", () => {
    const { rerender } = render(
      <Pagination page={1} pageCount={5} onPageChange={() => {}} />,
    );
    expect(
      screen.getByRole("button", { name: "Previous page" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();
    rerender(<Pagination page={5} pageCount={5} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("hides the ellipsis from assistive technology", () => {
    const { container } = render(
      <Pagination page={10} pageCount={20} onPageChange={() => {}} />,
    );
    const ellipses = container.querySelectorAll('span[aria-hidden="true"]');
    expect(ellipses).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /^Page / })).toHaveLength(5);
  });

  it("clamps an out-of-range page", () => {
    render(<Pagination page={99} pageCount={5} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Page 5" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("accepts translated labels", () => {
    render(
      <Pagination
        page={1}
        pageCount={3}
        onPageChange={() => {}}
        labels={{
          navigation: "Phân trang",
          next: "Trang sau",
          page: "Trang {page}",
        }}
      />,
    );
    expect(
      screen.getByRole("navigation", { name: "Phân trang" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Trang sau" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trang 2" })).toBeInTheDocument();
  });

  it("receives ref via props and merges className", () => {
    const ref = createRef<HTMLElement>();
    render(
      <Pagination
        page={1}
        pageCount={3}
        onPageChange={() => {}}
        ref={ref}
        className="custom-class"
      />,
    );
    expect(ref.current).toBe(screen.getByRole("navigation"));
    expect(ref.current).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Pagination page={10} pageCount={20} onPageChange={() => {}} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
