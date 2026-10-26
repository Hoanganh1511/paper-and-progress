import { createRef } from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Copy, Trash2 } from "lucide-react";
import { Dialog } from "../Dialog";
import {
  DropdownMenu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
  type DropdownMenuProps,
} from "./index";

expect.extend(toHaveNoViolations);

function Example({
  onEdit = () => {},
  onDelete = () => {},
  ...props
}: {
  onEdit?: () => void;
  onDelete?: () => void;
} & Partial<DropdownMenuProps>) {
  return (
    <DropdownMenu {...props}>
      <MenuTrigger>
        <button>Options</button>
      </MenuTrigger>
      <MenuContent>
        <MenuLabel>Actions</MenuLabel>
        <MenuItem icon={Copy} shortcut="⌘D" onSelect={onEdit}>
          Duplicate
        </MenuItem>
        <MenuItem disabled>Archive</MenuItem>
        <MenuItem>Rename</MenuItem>
        <MenuSeparator />
        <MenuItem icon={Trash2} destructive onSelect={onDelete}>
          Delete
        </MenuItem>
      </MenuContent>
    </DropdownMenu>
  );
}

const trigger = () => screen.getByRole("button", { name: "Options" });
const item = (name: string) => screen.getByRole("menuitem", { name });

describe("DropdownMenu", () => {
  it("is closed initially with a menu-button trigger", () => {
    render(<Example />);
    expect(trigger()).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).not.toHaveAttribute("aria-controls");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens on click, names the menu by the trigger and focuses the first item", async () => {
    render(<Example />);
    await userEvent.click(trigger());
    const menu = screen.getByRole("menu", { name: "Options" });
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(trigger()).toHaveAttribute("aria-controls", menu.id);
    expect(item(/Duplicate/ as unknown as string)).toHaveFocus();
  });

  it("opens with Enter and Space on the trigger", async () => {
    render(<Example />);
    await userEvent.tab();
    expect(trigger()).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await userEvent.keyboard(" ");
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("opens on the first item with ArrowDown and on the last with ArrowUp", async () => {
    render(<Example />);
    await userEvent.tab();
    await userEvent.keyboard("{ArrowDown}");
    expect(item(/Duplicate/ as unknown as string)).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    await userEvent.keyboard("{ArrowUp}");
    expect(item(/Delete/ as unknown as string)).toHaveFocus();
  });

  it("navigates with the arrow keys, wrapping and skipping disabled items", async () => {
    render(<Example />);
    await userEvent.click(trigger());

    await userEvent.keyboard("{ArrowDown}");
    expect(item("Rename")).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(item(/Delete/ as unknown as string)).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(item(/Duplicate/ as unknown as string)).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}");
    expect(item(/Delete/ as unknown as string)).toHaveFocus();
  });

  it("jumps with Home and End", async () => {
    render(<Example />);
    await userEvent.click(trigger());
    await userEvent.keyboard("{End}");
    expect(item(/Delete/ as unknown as string)).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(item(/Duplicate/ as unknown as string)).toHaveFocus();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    render(<Example />);
    await userEvent.click(trigger());
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("selects with click, closes, and returns focus", async () => {
    const onEdit = vi.fn();
    render(<Example onEdit={onEdit} />);
    await userEvent.click(trigger());
    await userEvent.click(item(/Duplicate/ as unknown as string));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
  });

  it("selects with Enter and Space on the focused item", async () => {
    const onEdit = vi.fn();
    render(<Example onEdit={onEdit} />);
    await userEvent.click(trigger());
    await userEvent.keyboard("{Enter}");
    expect(onEdit).toHaveBeenCalledTimes(1);

    // Reopen from the trigger, move to "Rename" and choose it with Space.
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}");
    expect(item("Rename")).toHaveFocus();
    await userEvent.keyboard(" ");
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("does not select disabled items and keeps the menu open", async () => {
    const onSelect = vi.fn();
    render(
      <DropdownMenu>
        <MenuTrigger>
          <button>Options</button>
        </MenuTrigger>
        <MenuContent>
          <MenuItem disabled onSelect={onSelect}>
            Archive
          </MenuItem>
          <MenuItem>Other</MenuItem>
        </MenuContent>
      </DropdownMenu>,
    );
    await userEvent.click(trigger());
    expect(item("Archive")).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(item("Archive"));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("closes on an outside click without stealing focus", async () => {
    render(
      <>
        <button>Elsewhere</button>
        <Example />
      </>,
    );
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole("button", { name: "Elsewhere" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Elsewhere" })).toHaveFocus();
  });

  it("closes on Tab and lets focus move on", async () => {
    render(
      <>
        <Example />
        <button>After</button>
      </>,
    );
    await userEvent.click(trigger());
    await userEvent.tab();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });

  it("toggles closed when the open trigger is clicked", async () => {
    render(<Example />);
    await userEvent.click(trigger());
    await userEvent.click(trigger());
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("supports controlled open state", async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Example open={false} onOpenChange={onOpenChange} />,
    );
    await userEvent.click(trigger());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    rerender(<Example open onOpenChange={onOpenChange} />);
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("styles items: icon, shortcut, destructive, and the menu layer", async () => {
    const { container } = render(<Example />);
    await userEvent.click(trigger());
    const menu = screen.getByRole("menu");
    expect(menu).toHaveClass("z-[var(--z-dropdown)]", "shadow-floating");
    expect(
      item(/Duplicate/ as unknown as string).querySelector("svg"),
    ).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("⌘D").tagName).toBe("KBD");
    expect(item(/Delete/ as unknown as string)).toHaveClass("text-danger-text");
    expect(screen.getByRole("separator")).toBeInTheDocument();
    expect(container).toBeInTheDocument();
  });

  it("aligns the content to the end when asked", async () => {
    render(
      <DropdownMenu defaultOpen>
        <MenuTrigger>
          <button>Options</button>
        </MenuTrigger>
        <MenuContent align="end">
          <MenuItem>One</MenuItem>
        </MenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByRole("menu")).toHaveClass("right-0");
  });

  it("only closes the menu, not the dialog around it, on Escape", async () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} aria-label="Dialog">
        <Example />
      </Dialog>,
    );
    await userEvent.click(trigger());
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps the trigger's own handlers, id and ref", async () => {
    const onClick = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(
      <DropdownMenu>
        <MenuTrigger>
          <button id="my-trigger" ref={ref} onClick={onClick}>
            Options
          </button>
        </MenuTrigger>
        <MenuContent>
          <MenuItem>One</MenuItem>
        </MenuContent>
      </DropdownMenu>,
    );
    await userEvent.click(trigger());
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(trigger()).toHaveAttribute("id", "my-trigger");
    expect(ref.current).toBe(trigger());
    expect(screen.getByRole("menu")).toHaveAttribute(
      "aria-labelledby",
      "my-trigger",
    );
  });

  it("throws when a part is used outside a DropdownMenu", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<MenuItem>x</MenuItem>)).toThrow(
      "Menu parts must be used within a DropdownMenu",
    );
    spy.mockRestore();
  });

  it("receives refs and merges className", async () => {
    const rootRef = createRef<HTMLDivElement>();
    const contentRef = createRef<HTMLDivElement>();
    const { container } = render(
      <DropdownMenu ref={rootRef} className="root-class" defaultOpen>
        <MenuTrigger>
          <button>Options</button>
        </MenuTrigger>
        <MenuContent ref={contentRef} className="content-class">
          <MenuItem className="item-class">One</MenuItem>
        </MenuContent>
      </DropdownMenu>,
    );
    expect(rootRef.current).toBe(container.firstElementChild);
    expect(container.firstElementChild).toHaveClass("root-class");
    expect(contentRef.current).toBe(screen.getByRole("menu"));
    expect(screen.getByRole("menu")).toHaveClass("content-class");
    expect(item("One")).toHaveClass("item-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Example />);
    await userEvent.click(trigger());
    expect(await axe(container)).toHaveNoViolations();
  });
});
