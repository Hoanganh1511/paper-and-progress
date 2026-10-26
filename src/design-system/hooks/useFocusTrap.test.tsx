import { useRef } from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useFocusTrap } from "./useFocusTrap";

function Trap({
  isActive = true,
  isTopmost,
  withAutofocus = false,
  empty = false,
}: {
  isActive?: boolean;
  isTopmost?: () => boolean;
  withAutofocus?: boolean;
  empty?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, isActive, isTopmost);
  return (
    <div ref={ref} tabIndex={-1} data-testid="trap">
      {!empty && (
        <>
          <button>First</button>
          <button data-autofocus={withAutofocus ? "" : undefined}>
            Second
          </button>
          <button disabled>Disabled</button>
          <a href="/x">Last</a>
        </>
      )}
    </div>
  );
}

function Page(props: React.ComponentProps<typeof Trap>) {
  return (
    <>
      <button>Outside</button>
      <Trap {...props} />
    </>
  );
}

describe("useFocusTrap", () => {
  it("focuses the first focusable element on activation", () => {
    render(<Page />);
    expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
  });

  it("prefers the [data-autofocus] element", () => {
    render(<Page withAutofocus />);
    expect(screen.getByRole("button", { name: "Second" })).toHaveFocus();
  });

  it("focuses the container when nothing inside is focusable", () => {
    render(<Page empty />);
    expect(screen.getByTestId("trap")).toHaveFocus();
  });

  it("does nothing while inactive", () => {
    render(<Page isActive={false} />);
    expect(document.body).toHaveFocus();
  });

  it("wraps Tab from the last element to the first, skipping disabled ones", async () => {
    render(<Page />);
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Second" })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("link", { name: "Last" })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
  });

  it("wraps Shift+Tab from the first element to the last", async () => {
    render(<Page />);
    await userEvent.tab({ shift: true });
    expect(screen.getByRole("link", { name: "Last" })).toHaveFocus();
  });

  it("keeps focus on the container when it has nothing focusable to tab to", async () => {
    render(<Page empty />);
    await userEvent.tab();
    expect(screen.getByTestId("trap")).toHaveFocus();
  });

  it("pulls focus back when it moves outside", () => {
    render(<Page />);
    screen.getByRole("button", { name: "Outside" }).focus();
    expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
  });

  it("restores focus to where it was when deactivated", () => {
    const { rerender } = render(<Page isActive={false} />);
    screen.getByRole("button", { name: "Outside" }).focus();
    rerender(<Page isActive />);
    expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
    rerender(<Page isActive={false} />);
    expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
  });

  it("restores focus on unmount", () => {
    function Toggle({ show }: { show: boolean }) {
      return (
        <>
          <button>Outside</button>
          {show && <Trap />}
        </>
      );
    }
    const { rerender } = render(<Toggle show={false} />);
    screen.getByRole("button", { name: "Outside" }).focus();
    rerender(<Toggle show />);
    expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
    rerender(<Toggle show={false} />);
    expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
  });

  it("neither wraps Tab nor pulls focus back while another overlay is on top", async () => {
    const isTopmost = vi.fn(() => false);
    render(<Page isTopmost={isTopmost} />);
    screen.getByRole("button", { name: "Outside" }).focus();
    expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();

    screen.getByRole("link", { name: "Last" }).focus();
    await userEvent.tab();
    expect(screen.getByRole("link", { name: "Last" })).not.toHaveFocus();
  });
});
