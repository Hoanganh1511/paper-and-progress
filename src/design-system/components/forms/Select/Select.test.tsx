import { createRef, useState } from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { FormField } from "../FormField";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  type SelectProps,
} from "./index";

expect.extend(toHaveNoViolations);

function Example(props: Partial<SelectProps>) {
  return (
    <Select {...props}>
      <SelectTrigger placeholder="Pick a fruit" aria-label="Fruit" />
      <SelectContent>
        <SelectGroup label="Common">
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="cherry" disabled>
            Cherry
          </SelectItem>
        </SelectGroup>
        <SelectGroup label="Exotic">
          <SelectItem value="dragon fruit">Dragon fruit</SelectItem>
          <SelectItem value="durian">Durian</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

const trigger = () => screen.getByRole("combobox", { name: "Fruit" });
const option = (name: string) => screen.getByRole("option", { name });

describe("Select", () => {
  it("renders a collapsed combobox button with a placeholder", () => {
    render(<Example />);
    expect(trigger()).toHaveTextContent("Pick a fruit");
    expect(trigger()).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows the label of the default value", () => {
    render(<Example defaultValue="banana" />);
    expect(trigger()).toHaveTextContent("Banana");
  });

  it("opens on click with grouped options, wired through aria-controls", async () => {
    render(<Example />);
    await userEvent.click(trigger());
    const listbox = screen.getByRole("listbox");
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(trigger()).toHaveAttribute("aria-controls", listbox.id);
    expect(screen.getAllByRole("option")).toHaveLength(5);
    expect(screen.getByRole("group", { name: "Exotic" })).toBeInTheDocument();
    expect(option("Cherry")).toHaveAttribute("aria-disabled", "true");
  });

  it("selects with a click, closes, calls onValueChange and refocuses the trigger", async () => {
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);
    await userEvent.click(trigger());
    await userEvent.click(option("Banana"));
    expect(onValueChange).toHaveBeenCalledWith("banana");
    expect(trigger()).toHaveTextContent("Banana");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
  });

  it("marks the selected option with aria-selected and a check", async () => {
    render(<Example defaultValue="apple" />);
    await userEvent.click(trigger());
    expect(option("Apple")).toHaveAttribute("aria-selected", "true");
    expect(option("Apple").querySelector("svg")).toBeInTheDocument();
    expect(option("Banana")).toHaveAttribute("aria-selected", "false");
  });

  it("does not select disabled options", async () => {
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);
    await userEvent.click(trigger());
    await userEvent.click(option("Cherry"));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("opens with Enter, Space and ArrowDown, highlighting the first option", async () => {
    render(<Example />);
    await userEvent.tab();
    expect(trigger()).toHaveFocus();

    for (const key of ["{Enter}", " ", "{ArrowDown}"]) {
      await userEvent.keyboard(key);
      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(trigger()).toHaveAttribute(
        "aria-activedescendant",
        option("Apple").id,
      );
      await userEvent.keyboard("{Escape}");
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    }
  });

  it("opens on the last option with ArrowUp when nothing is selected", async () => {
    render(<Example />);
    await userEvent.tab();
    await userEvent.keyboard("{ArrowUp}");
    expect(trigger()).toHaveAttribute(
      "aria-activedescendant",
      option("Durian").id,
    );
  });

  it("opens on the selected option", async () => {
    render(<Example defaultValue="durian" />);
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(trigger()).toHaveAttribute(
      "aria-activedescendant",
      option("Durian").id,
    );
  });

  it("navigates with arrows (wrapping, skipping disabled) and Home/End", async () => {
    render(<Example />);
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");

    await userEvent.keyboard("{ArrowDown}");
    expect(trigger()).toHaveAttribute(
      "aria-activedescendant",
      option("Banana").id,
    );
    await userEvent.keyboard("{ArrowDown}");
    expect(trigger()).toHaveAttribute(
      "aria-activedescendant",
      option("Dragon fruit").id,
    );
    await userEvent.keyboard("{End}");
    expect(trigger()).toHaveAttribute(
      "aria-activedescendant",
      option("Durian").id,
    );
    await userEvent.keyboard("{ArrowDown}");
    expect(trigger()).toHaveAttribute(
      "aria-activedescendant",
      option("Apple").id,
    );
    await userEvent.keyboard("{ArrowUp}");
    expect(trigger()).toHaveAttribute(
      "aria-activedescendant",
      option("Durian").id,
    );
    await userEvent.keyboard("{Home}");
    expect(trigger()).toHaveAttribute(
      "aria-activedescendant",
      option("Apple").id,
    );
  });

  it("selects the active option with Enter and with Space", async () => {
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);
    await userEvent.tab();
    await userEvent.keyboard("{Enter}{ArrowDown}{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("banana");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await userEvent.keyboard(" {ArrowDown} ");
    expect(onValueChange).toHaveBeenLastCalledWith("dragon fruit");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger()).toHaveTextContent("Dragon fruit");
  });

  it("closes on Escape keeping the value, and on Tab", async () => {
    render(<Example defaultValue="apple" />);
    await userEvent.tab();
    await userEvent.keyboard("{Enter}{ArrowDown}{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger()).toHaveTextContent("Apple");
    expect(trigger()).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    await userEvent.tab();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes on an outside click", async () => {
    render(
      <>
        <button>Elsewhere</button>
        <Example />
      </>,
    );
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole("button", { name: "Elsewhere" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("jumps to matching options by typing", async () => {
    render(<Example />);
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("d");
    expect(trigger()).toHaveAttribute(
      "aria-activedescendant",
      option("Dragon fruit").id,
    );
    await userEvent.keyboard("d");
    expect(trigger()).toHaveAttribute(
      "aria-activedescendant",
      option("Durian").id,
    );
  });

  it("opens the list when typing a letter while closed", async () => {
    render(<Example />);
    await userEvent.tab();
    await userEvent.keyboard("b");
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(trigger()).toHaveAttribute(
      "aria-activedescendant",
      option("Banana").id,
    );
  });

  it("supports controlled value", async () => {
    function Controlled() {
      const [value, setValue] = useState("apple");
      return <Example value={value} onValueChange={setValue} />;
    }
    render(<Controlled />);
    await userEvent.click(trigger());
    await userEvent.click(option("Durian"));
    expect(trigger()).toHaveTextContent("Durian");
  });

  it("renders a hidden input for form submission when named", () => {
    const { container } = render(
      <Example name="fruit" defaultValue="banana" />,
    );
    const input = container.querySelector('input[type="hidden"]');
    expect(input).toHaveAttribute("name", "fruit");
    expect(input).toHaveValue("banana");
  });

  it("does not open when disabled", async () => {
    render(<Example disabled />);
    expect(trigger()).toBeDisabled();
    await userEvent.click(trigger());
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("is named, described and flagged by the surrounding FormField", async () => {
    render(
      <FormField label="Fruit" description="Pick one" error="Required" required>
        <Select>
          <SelectTrigger placeholder="Choose" />
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
          </SelectContent>
        </Select>
      </FormField>,
    );
    const field = screen.getByRole("combobox", { name: /Fruit/ });
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAttribute("aria-required", "true");
    expect(field.getAttribute("aria-describedby")).toContain(
      screen.getByRole("alert").id,
    );
    await userEvent.click(screen.getByText("Fruit", { selector: "label" }));
    expect(field).toHaveFocus();
  });

  it("applies sizes", () => {
    const sizes = ["compact", "default", "comfortable"] as const;
    sizes.forEach((size) => {
      const { unmount } = render(
        <Select>
          <SelectTrigger size={size} aria-label="x" />
          <SelectContent />
        </Select>,
      );
      expect(screen.getByRole("combobox")).toHaveClass(
        `h-[var(--height-${size})]`,
      );
      unmount();
    });
  });

  it("throws when a part is used outside a Select", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<SelectItem value="x">x</SelectItem>)).toThrow(
      "Select parts must be used within a Select or Combobox",
    );
    spy.mockRestore();
  });

  it("receives refs and merges className", () => {
    const rootRef = createRef<HTMLDivElement>();
    const triggerRef = createRef<HTMLButtonElement>();
    const contentRef = createRef<HTMLDivElement>();
    render(
      <Select ref={rootRef} className="root-class">
        <SelectTrigger
          ref={triggerRef}
          className="trigger-class"
          aria-label="x"
        />
        <SelectContent ref={contentRef} className="content-class">
          <SelectItem value="a" className="item-class">
            A
          </SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(rootRef.current).toHaveClass("root-class");
    expect(triggerRef.current).toBe(screen.getByRole("combobox"));
    expect(triggerRef.current).toHaveClass("trigger-class");
    expect(contentRef.current).toHaveClass("content-class");
    expect(contentRef.current).toHaveAttribute("role", "listbox");
  });

  it("has no accessibility violations closed and open", async () => {
    const { container } = render(<Example defaultValue="apple" />);
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(trigger());
    expect(await axe(container)).toHaveNoViolations();
  });
});
