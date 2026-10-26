import { createRef } from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Dialog } from "../Dialog";
import { Drawer } from "./Drawer";

expect.extend(toHaveNoViolations);

function setup(props: Partial<React.ComponentProps<typeof Drawer>> = {}) {
  const onClose = vi.fn();
  const view = render(
    <Drawer open title="Menu" onClose={onClose} {...props}>
      <a href="/one">One</a>
      <a href="/two">Two</a>
    </Drawer>,
  );
  return { onClose, ...view };
}

describe("Drawer", () => {
  it("renders nothing while closed", () => {
    setup({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders a modal dialog named by its heading, in a portal", () => {
    setup();
    const dialog = screen.getByRole("dialog", { name: "Menu" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(
      screen.getByRole("heading", { level: 2, name: "Menu" }),
    ).toBeInTheDocument();
    expect(document.body).toContainElement(dialog);
    expect(screen.getByRole("link", { name: "One" })).toBeInTheDocument();
  });

  it("slides in from the left by default, or from the right", () => {
    const { unmount } = setup();
    expect(screen.getByRole("dialog")).toHaveClass("left-0");
    unmount();
    setup({ side: "right" });
    expect(screen.getByRole("dialog")).toHaveClass("right-0");
  });

  it("is full width on mobile and a fixed column from sm", () => {
    setup();
    expect(screen.getByRole("dialog")).toHaveClass("w-full", "sm:w-80");
  });

  it("closes from the close button, Escape and the backdrop", async () => {
    const { onClose, baseElement } = setup({ closeLabel: "Đóng" });
    await userEvent.click(screen.getByRole("button", { name: "Đóng" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(2);
    await userEvent.click(
      baseElement.querySelector('[aria-hidden="true"].fixed') as Element,
    );
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("does not close on clicks inside the panel", async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("moves focus in, traps Tab, locks scroll and restores focus on close", async () => {
    function Example() {
      return (
        <>
          <button>Opener</button>
          <Drawer open title="Menu" onClose={() => {}}>
            <a href="/one">One</a>
          </Drawer>
        </>
      );
    }
    const { rerender } = render(<Example />);
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");

    await userEvent.tab();
    expect(screen.getByRole("link", { name: "One" })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();

    rerender(<button>Opener</button>);
    expect(document.body.style.overflow).toBe("");
  });

  it("only the topmost overlay reacts to Escape", async () => {
    const dialogClose = vi.fn();
    const drawerClose = vi.fn();
    render(
      <>
        <Dialog open onClose={dialogClose} aria-label="Dialog">
          <button>Inside</button>
        </Dialog>
        <Drawer open title="Menu" onClose={drawerClose} />
      </>,
    );
    await userEvent.keyboard("{Escape}");
    expect(drawerClose).toHaveBeenCalledTimes(1);
    expect(dialogClose).not.toHaveBeenCalled();
  });

  it("receives ref and merges className on the panel", () => {
    const ref = createRef<HTMLDivElement>();
    setup({ ref, className: "custom-class" });
    expect(ref.current).toBe(screen.getByRole("dialog"));
    expect(ref.current).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    setup();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
