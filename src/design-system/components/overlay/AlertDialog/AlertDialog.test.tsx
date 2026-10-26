import { useState } from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Dialog } from "../Dialog";
import { AlertDialog } from "./AlertDialog";

expect.extend(toHaveNoViolations);

function setup(props: Partial<React.ComponentProps<typeof AlertDialog>> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const view = render(
    <AlertDialog
      open
      title="Delete project?"
      description="This cannot be undone."
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { ...view, onConfirm, onCancel };
}

describe("AlertDialog", () => {
  it("renders an alertdialog named and described", () => {
    setup();
    const dialog = screen.getByRole("alertdialog", { name: "Delete project?" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
    expect(
      screen.queryByRole("button", { name: "Close" }),
    ).not.toBeInTheDocument();
  });

  it("renders nothing while closed", () => {
    setup({ open: false });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("does not close on Escape or backdrop click", async () => {
    const { baseElement, onCancel, onConfirm } = setup();
    await userEvent.keyboard("{Escape}");
    await userEvent.click(
      baseElement.querySelector('[aria-hidden="true"].fixed') as Element,
    );
    expect(onCancel).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("focuses Cancel first", () => {
    setup();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });

  it("calls onCancel and onConfirm from its buttons", async () => {
    const { onCancel, onConfirm } = setup({
      confirmLabel: "Delete",
      cancelLabel: "Keep",
    });
    await userEvent.click(screen.getByRole("button", { name: "Keep" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("styles the confirm button by variant", () => {
    const { unmount } = setup({ variant: "destructive" });
    expect(screen.getByRole("button", { name: "Confirm" })).toHaveClass(
      "bg-danger-text",
    );
    unmount();
    setup();
    expect(screen.getByRole("button", { name: "Confirm" })).toHaveClass(
      "bg-action-primary",
    );
  });

  it("shows a busy confirm button while loading", async () => {
    const { onConfirm } = setup({ isLoading: true });
    const confirm = screen.getByRole("button", { name: "Confirm" });
    expect(confirm).toHaveAttribute("aria-busy", "true");
    await userEvent.click(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("keeps Confirm unavailable while isConfirmDisabled", async () => {
    const { onConfirm } = setup({ isConfirmDisabled: true });
    const confirm = screen.getByRole("button", { name: "Confirm" });
    expect(confirm).toBeDisabled();
    await userEvent.click(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("renders extra children", () => {
    setup({ children: <p>Type the project name to confirm.</p> });
    expect(
      screen.getByText("Type the project name to confirm."),
    ).toBeInTheDocument();
  });

  it("lets Escape reach only the topmost dialog when stacked on a Dialog", async () => {
    const onClose = vi.fn();
    function Stacked() {
      const [open] = useState(true);
      return (
        <>
          <Dialog open={open} onClose={onClose} aria-label="Base">
            <button>Base button</button>
          </Dialog>
          <AlertDialog
            open
            title="Sure?"
            onConfirm={() => {}}
            onCancel={() => {}}
          />
        </>
      );
    }
    render(<Stacked />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    setup({ variant: "destructive" });
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
