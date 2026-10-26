import { createRef, useState } from "react";
import { vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { FormField } from "../FormField";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  type ComboboxProps,
} from "./index";

expect.extend(toHaveNoViolations);

function Example(props: Partial<ComboboxProps>) {
  return (
    <Combobox {...props}>
      <ComboboxInput placeholder="Search a city" aria-label="City" />
      <ComboboxContent>
        <ComboboxGroup label="South">
          <ComboboxItem value="hcm">Hồ Chí Minh</ComboboxItem>
          <ComboboxItem value="ct">Cần Thơ</ComboboxItem>
        </ComboboxGroup>
        <ComboboxGroup label="Central">
          <ComboboxItem value="dn">Đà Nẵng</ComboboxItem>
          <ComboboxItem value="hue" disabled>
            Huế
          </ComboboxItem>
        </ComboboxGroup>
        <ComboboxEmpty>No city found</ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
  );
}

const input = () => screen.getByRole("combobox", { name: "City" });
const option = (name: string) => screen.getByRole("option", { name });

describe("Combobox", () => {
  it("renders a collapsed list-autocomplete combobox", () => {
    render(<Example />);
    expect(input()).toHaveAttribute("aria-autocomplete", "list");
    expect(input()).toHaveAttribute("aria-expanded", "false");
    expect(input()).toHaveValue("");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows the selected item's text in the input", () => {
    render(<Example defaultValue="dn" />);
    expect(input()).toHaveValue("Đà Nẵng");
  });

  it("opens with all items when clicked or on ArrowDown", async () => {
    render(<Example />);
    await userEvent.click(input());
    expect(screen.getAllByRole("option")).toHaveLength(4);
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getAllByRole("option")).toHaveLength(4);
    expect(input()).toHaveAttribute(
      "aria-activedescendant",
      option("Hồ Chí Minh").id,
    );
  });

  it("filters while typing, ignoring case and accents", async () => {
    render(<Example />);
    await userEvent.type(input(), "da nang");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(option("Đà Nẵng")).toBeInTheDocument();

    await userEvent.clear(input());
    await userEvent.type(input(), "CAN");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(option("Cần Thơ")).toBeInTheDocument();
  });

  it("hides groups with no matches and shows the empty message when nothing matches", async () => {
    render(<Example />);
    await userEvent.type(input(), "ho");
    // A group without matches loses all its options and is hidden by CSS.
    const central = screen.getByRole("group", { name: "Central" });
    expect(within(central).queryAllByRole("option")).toHaveLength(0);
    expect(central).toHaveClass("hidden");
    expect(
      within(screen.getByRole("group", { name: "South" })).getAllByRole(
        "option",
      ),
    ).toHaveLength(2);
    expect(screen.queryByText("No city found")).not.toBeInTheDocument();

    await userEvent.type(input(), "zzz");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText("No city found")).toBeInTheDocument();
  });

  it("makes the first match active and picks it with Enter", async () => {
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);
    await userEvent.type(input(), "can");
    expect(input()).toHaveAttribute(
      "aria-activedescendant",
      option("Cần Thơ").id,
    );

    await userEvent.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("ct");
    expect(input()).toHaveValue("Cần Thơ");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input()).toHaveFocus();
  });

  it("navigates with arrows, skipping disabled options", async () => {
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);
    await userEvent.click(input());
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(input()).toHaveAttribute(
      "aria-activedescendant",
      option("Đà Nẵng").id,
    );
    await userEvent.keyboard("{ArrowDown}");
    expect(input()).toHaveAttribute(
      "aria-activedescendant",
      option("Hồ Chí Minh").id,
    );
    await userEvent.keyboard("{ArrowUp}{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("dn");
  });

  it("selects by clicking an option", async () => {
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);
    await userEvent.click(input());
    await userEvent.click(option("Cần Thơ"));
    expect(onValueChange).toHaveBeenCalledWith("ct");
    expect(input()).toHaveValue("Cần Thơ");
  });

  it("closes on Escape and restores the selected text", async () => {
    render(<Example defaultValue="dn" />);
    await userEvent.click(input());
    await userEvent.clear(input());
    await userEvent.type(input(), "can");
    expect(input()).toHaveValue("can");

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input()).toHaveValue("Đà Nẵng");
  });

  it("closes and restores the text on blur", async () => {
    render(
      <>
        <button>Elsewhere</button>
        <Example />
      </>,
    );
    await userEvent.type(input(), "can");
    await userEvent.click(screen.getByRole("button", { name: "Elsewhere" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input()).toHaveValue("");
  });

  it("supports controlled value and a hidden form input", async () => {
    function Controlled() {
      const [value, setValue] = useState("hcm");
      return <Example name="city" value={value} onValueChange={setValue} />;
    }
    const { container } = render(<Controlled />);
    expect(input()).toHaveValue("Hồ Chí Minh");
    expect(container.querySelector('input[type="hidden"]')).toHaveValue("hcm");
    await userEvent.click(input());
    await userEvent.click(option("Cần Thơ"));
    expect(input()).toHaveValue("Cần Thơ");
    expect(container.querySelector('input[type="hidden"]')).toHaveValue("ct");
  });

  it("is disabled with the root", async () => {
    render(<Example disabled />);
    expect(input()).toBeDisabled();
  });

  it("is named, described and flagged by the surrounding FormField", async () => {
    render(
      <FormField label="City" error="Required">
        <Combobox>
          <ComboboxInput />
          <ComboboxContent>
            <ComboboxItem value="a">A</ComboboxItem>
          </ComboboxContent>
        </Combobox>
      </FormField>,
    );
    const field = screen.getByRole("combobox", { name: "City" });
    expect(field).toHaveAttribute("aria-invalid", "true");
    await userEvent.click(screen.getByText("City", { selector: "label" }));
    expect(field).toHaveFocus();
  });

  it("receives refs and merges className", () => {
    const inputRef = createRef<HTMLInputElement>();
    render(
      <Combobox className="root-class">
        <ComboboxInput ref={inputRef} className="input-class" aria-label="x" />
        <ComboboxContent />
      </Combobox>,
    );
    expect(inputRef.current).toBe(screen.getByRole("combobox"));
    expect(screen.getByRole("combobox").parentElement).toHaveClass(
      "input-class",
    );
  });

  it("has no accessibility violations closed and open", async () => {
    const { container } = render(<Example defaultValue="hcm" />);
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(input());
    expect(await axe(container)).toHaveNoViolations();
  });
});
