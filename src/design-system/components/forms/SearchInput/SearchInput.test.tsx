import { createRef, useState } from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { SearchInput } from "./SearchInput";

expect.extend(toHaveNoViolations);

describe("SearchInput", () => {
  it("renders a search field with a hidden search icon and no clear button", () => {
    const { container } = render(<SearchInput aria-label="Search" />);
    expect(
      screen.getByRole("searchbox", { name: "Search" }),
    ).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(
      screen.queryByRole("button", { name: "Clear search" }),
    ).not.toBeInTheDocument();
  });

  it("shows a clear button once there is text and clears (uncontrolled)", async () => {
    const onClear = vi.fn();
    render(<SearchInput aria-label="Search" onClear={onClear} />);
    const input = screen.getByRole("searchbox");
    await userEvent.type(input, "paper");
    expect(input).toHaveValue("paper");

    await userEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", { name: "Clear search" }),
    ).not.toBeInTheDocument();
  });

  it("supports controlled usage through onClear", async () => {
    function Controlled() {
      const [value, setValue] = useState("abc");
      return (
        <SearchInput
          aria-label="Search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onClear={() => setValue("")}
        />
      );
    }
    render(<Controlled />);
    expect(screen.getByRole("searchbox")).toHaveValue("abc");
    await userEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });

  it("clears with Escape", async () => {
    const onClear = vi.fn();
    render(
      <SearchInput aria-label="Search" defaultValue="abc" onClear={onClear} />,
    );
    await userEvent.type(screen.getByRole("searchbox"), "{Escape}");
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("uses a custom clear label", () => {
    render(
      <SearchInput aria-label="Search" defaultValue="a" clearLabel="Xoá" />,
    );
    expect(screen.getByRole("button", { name: "Xoá" })).toBeInTheDocument();
  });

  it("hides the clear button when disabled", () => {
    render(<SearchInput aria-label="Search" defaultValue="a" disabled />);
    expect(
      screen.queryByRole("button", { name: "Clear search" }),
    ).not.toBeInTheDocument();
  });

  it("receives ref on the input", () => {
    const ref = createRef<HTMLInputElement>();
    render(<SearchInput aria-label="Search" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <SearchInput aria-label="Search" defaultValue="paper" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
