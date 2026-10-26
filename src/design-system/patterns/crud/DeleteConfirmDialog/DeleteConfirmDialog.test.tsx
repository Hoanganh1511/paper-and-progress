import { useState } from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import {
  DeleteConfirmDialog,
  type DeleteConfirmDialogProps,
} from "./DeleteConfirmDialog";

expect.extend(toHaveNoViolations);

function setup(props: Partial<DeleteConfirmDialogProps> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const view = render(
    <DeleteConfirmDialog
      open
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { onConfirm, onCancel, ...view };
}

const deleteButton = () => screen.getByRole("button", { name: "Delete" });

describe("DeleteConfirmDialog", () => {
  it("renders nothing while closed", () => {
    setup({ open: false });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("renders a destructive alertdialog with a generic title", () => {
    setup();
    const dialog = screen.getByRole("alertdialog", {
      name: "Delete this item?",
    });
    expect(dialog).toHaveAccessibleDescription("This action cannot be undone.");
    expect(deleteButton()).toHaveClass("bg-danger-text");
  });

  it("names the item, or counts items for a bulk delete", () => {
    const { unmount } = setup({ itemName: "Atlas" });
    expect(
      screen.getByRole("alertdialog", { name: "Delete “Atlas”?" }),
    ).toBeInTheDocument();
    unmount();
    setup({ count: 3, itemName: "ignored" });
    expect(
      screen.getByRole("alertdialog", { name: "Delete 3 items?" }),
    ).toBeInTheDocument();
  });

  it("accepts a custom description", () => {
    setup({ description: "All tasks inside go too." });
    expect(screen.getByRole("alertdialog")).toHaveAccessibleDescription(
      "All tasks inside go too.",
    );
  });

  it("focuses Cancel first and calls onCancel / onConfirm", async () => {
    const { onCancel, onConfirm } = setup();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await userEvent.click(deleteButton());
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("does not close on Escape", async () => {
    const { onCancel } = setup();
    await userEvent.keyboard("{Escape}");
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("shows the error and a busy Delete button while deleting", async () => {
    const { onConfirm } = setup({
      error: "Could not delete",
      isDeleting: true,
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Could not delete");
    expect(deleteButton()).toHaveAttribute("aria-busy", "true");
    await userEvent.click(deleteButton());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  describe("with a confirmation phrase", () => {
    it("keeps Delete disabled until the phrase is typed exactly", async () => {
      const { onConfirm } = setup({ confirmationText: "Atlas" });
      const input = screen.getByLabelText("Type Atlas to confirm");
      expect(deleteButton()).toBeDisabled();

      await userEvent.type(input, "Atla");
      expect(deleteButton()).toBeDisabled();
      await userEvent.type(input, "s");
      expect(deleteButton()).toBeEnabled();

      await userEvent.click(deleteButton());
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("confirms with Enter once the phrase matches", async () => {
      const { onConfirm } = setup({ confirmationText: "Atlas" });
      const input = screen.getByLabelText("Type Atlas to confirm");
      await userEvent.type(input, "Atl{Enter}");
      expect(onConfirm).not.toHaveBeenCalled();
      await userEvent.type(input, "as{Enter}");
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("starts empty again every time it opens", async () => {
      function Reopen() {
        const [open, setOpen] = useState(true);
        return (
          <>
            <button onClick={() => setOpen(true)}>Open</button>
            <DeleteConfirmDialog
              open={open}
              confirmationText="Atlas"
              onConfirm={() => {}}
              onCancel={() => setOpen(false)}
            />
          </>
        );
      }
      render(<Reopen />);
      await userEvent.type(
        screen.getByLabelText("Type Atlas to confirm"),
        "Atlas",
      );
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
      await userEvent.click(screen.getByRole("button", { name: "Open" }));
      expect(screen.getByLabelText("Type Atlas to confirm")).toHaveValue("");
      expect(deleteButton()).toBeDisabled();
    });
  });

  it("accepts translated labels", () => {
    setup({
      itemName: "Atlas",
      labels: { titleNamed: "Xoá “{name}”?", confirm: "Xoá", cancel: "Huỷ" },
    });
    expect(
      screen.getByRole("alertdialog", { name: "Xoá “Atlas”?" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xoá" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Huỷ" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    setup({
      itemName: "Atlas",
      confirmationText: "Atlas",
      error: "Could not delete",
    });
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
