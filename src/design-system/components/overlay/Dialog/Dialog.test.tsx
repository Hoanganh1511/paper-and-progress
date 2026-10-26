import { createRef, useState } from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "./index";

expect.extend(toHaveNoViolations);

function Example({
  onClose = () => {},
  isDismissible,
}: {
  onClose?: () => void;
  isDismissible?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <Dialog
        open={open}
        isDismissible={isDismissible}
        onClose={() => {
          onClose();
          setOpen(false);
        }}
      >
        <DialogHeader title="Edit profile" description="Change your details" />
        <DialogContent>
          <input aria-label="Name" />
        </DialogContent>
        <DialogFooter>
          <button>Cancel</button>
          <button>Save</button>
        </DialogFooter>
      </Dialog>
    </>
  );
}

async function openExample() {
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  return screen.getByRole("dialog");
}

describe("Dialog", () => {
  it("renders nothing while closed", () => {
    render(
      <Dialog open={false} onClose={() => {}} aria-label="Empty">
        Content
      </Dialog>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders a modal dialog named and described by its header", async () => {
    render(<Example />);
    const dialog = await openExample();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Edit profile");
    expect(dialog).toHaveAccessibleDescription("Change your details");
    expect(document.body).toContainElement(dialog);
  });

  it("uses aria-label instead of the title id when given", () => {
    render(
      <Dialog open onClose={() => {}} aria-label="Custom name">
        Content
      </Dialog>,
    );
    const dialog = screen.getByRole("dialog", { name: "Custom name" });
    expect(dialog).not.toHaveAttribute("aria-labelledby");
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    render(<Example onClose={onClose} />);
    await openExample();
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on backdrop click but not on clicks inside", async () => {
    const onClose = vi.fn();
    const { baseElement } = render(<Example onClose={onClose} />);
    const dialog = await openExample();

    await userEvent.click(dialog);
    await userEvent.click(screen.getByText("Edit profile"));
    expect(onClose).not.toHaveBeenCalled();

    const backdrop = baseElement.querySelector('[aria-hidden="true"].fixed');
    await userEvent.click(backdrop as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes from the header close button", async () => {
    const onClose = vi.fn();
    render(<Example onClose={onClose} />);
    await openExample();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ignores Escape, backdrop and the close button when not dismissible", async () => {
    const onClose = vi.fn();
    const { baseElement } = render(
      <Example onClose={onClose} isDismissible={false} />,
    );
    await openExample();
    expect(
      screen.queryByRole("button", { name: "Close" }),
    ).not.toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    await userEvent.click(
      baseElement.querySelector('[aria-hidden="true"].fixed') as Element,
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("moves focus into the dialog and restores it on close", async () => {
    render(<Example />);
    const opener = screen.getByRole("button", { name: "Open" });
    await userEvent.click(opener);
    expect(screen.getByRole("dialog")).toContainElement(
      document.activeElement as HTMLElement,
    );
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    expect(opener).toHaveFocus();
  });

  it("traps Tab and Shift+Tab inside the dialog", async () => {
    render(<Example />);
    await openExample();
    const close = screen.getByRole("button", { name: "Close" });
    const save = screen.getByRole("button", { name: "Save" });

    await userEvent.tab({ shift: true });
    expect(save).toHaveFocus();
    await userEvent.tab();
    expect(close).toHaveFocus();

    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    expect(save).toHaveFocus();
  });

  it("locks page scroll while open and unlocks afterwards", async () => {
    render(<Example />);
    expect(document.body.style.overflow).toBe("");
    await openExample();
    expect(document.body.style.overflow).toBe("hidden");
    await userEvent.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("");
  });

  it("is a bottom sheet on mobile and centered from sm", async () => {
    render(<Example />);
    const dialog = await openExample();
    expect(dialog).toHaveClass("rounded-t-soft", "sm:rounded-soft", "w-full");
    expect(dialog.parentElement).toHaveClass("items-end", "sm:items-center");
  });

  it("applies size", () => {
    const { rerender } = render(
      <Dialog open onClose={() => {}} aria-label="x" size="sm">
        x
      </Dialog>,
    );
    expect(screen.getByRole("dialog")).toHaveClass("sm:max-w-sm");
    rerender(
      <Dialog open onClose={() => {}} aria-label="x" size="lg">
        x
      </Dialog>,
    );
    expect(screen.getByRole("dialog")).toHaveClass("sm:max-w-2xl");
  });

  it("only the topmost of stacked dialogs reacts to Escape", async () => {
    const outer = vi.fn();
    const inner = vi.fn();
    render(
      <>
        <Dialog open onClose={outer} aria-label="Outer">
          <button>Outer button</button>
        </Dialog>
        <Dialog open onClose={inner} aria-label="Inner">
          <button>Inner button</button>
        </Dialog>
      </>,
    );
    await userEvent.keyboard("{Escape}");
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
  });

  it("throws when a part is used outside a Dialog", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<DialogHeader title="x" />)).toThrow(
      "Dialog parts must be used within a Dialog",
    );
    spy.mockRestore();
  });

  it("receives ref and className on the panel and on the parts", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Dialog
        open
        onClose={() => {}}
        aria-label="x"
        ref={ref}
        className="panel"
      >
        <DialogContent className="content">C</DialogContent>
        <DialogFooter className="footer">F</DialogFooter>
      </Dialog>,
    );
    expect(ref.current).toBe(screen.getByRole("dialog"));
    expect(screen.getByRole("dialog")).toHaveClass("panel");
    expect(screen.getByText("C")).toHaveClass("content");
    expect(screen.getByText("F")).toHaveClass("footer");
  });

  it("has no accessibility violations", async () => {
    render(<Example />);
    await openExample();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
