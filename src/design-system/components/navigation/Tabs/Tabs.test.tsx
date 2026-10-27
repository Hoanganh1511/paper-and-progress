import { createRef, useState } from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { TabList, TabPanel, TabTrigger, Tabs, type TabsProps } from "./index";

expect.extend(toHaveNoViolations);

function Example(props: Partial<TabsProps>) {
  return (
    <Tabs defaultValue="account" {...props}>
      <TabList aria-label="Settings">
        <TabTrigger value="account">Account</TabTrigger>
        <TabTrigger value="billing" disabled>
          Billing
        </TabTrigger>
        <TabTrigger value="team">Team</TabTrigger>
        <TabTrigger value="api keys">API keys</TabTrigger>
      </TabList>
      <TabPanel value="account">Account panel</TabPanel>
      <TabPanel value="billing">Billing panel</TabPanel>
      <TabPanel value="team">Team panel</TabPanel>
      <TabPanel value="api keys">API panel</TabPanel>
    </Tabs>
  );
}

const tab = (name: string) => screen.getByRole("tab", { name });

describe("Tabs", () => {
  it("renders a labelled tablist with tabs and the selected panel", () => {
    render(<Example />);
    expect(screen.getByRole("tablist", { name: "Settings" })).toHaveAttribute(
      "aria-orientation",
      "horizontal",
    );
    expect(screen.getAllByRole("tab")).toHaveLength(4);
    expect(tab("Account")).toHaveAttribute("aria-selected", "true");
    expect(tab("Team")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Account panel");
  });

  it("links each tab and panel through aria-controls and aria-labelledby", () => {
    render(<Example />);
    ["Account", "Team", "API keys"].forEach((name) => {
      const controlsId = tab(name).getAttribute("aria-controls") as string;
      const panel = document.getElementById(controlsId) as HTMLElement;
      expect(panel).toHaveAttribute("role", "tabpanel");
      expect(panel).toHaveAttribute("aria-labelledby", tab(name).id);
    });
  });

  it("hides panels that are not selected but keeps them in the DOM", () => {
    render(<Example />);
    expect(screen.getAllByRole("tabpanel", { hidden: true })).toHaveLength(4);
    expect(screen.getByText("Team panel")).not.toBeVisible();
    expect(screen.getByText("Account panel")).toBeVisible();
  });

  it("selects a tab on click (uncontrolled)", async () => {
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);
    await userEvent.click(tab("Team"));
    expect(tab("Team")).toHaveAttribute("aria-selected", "true");
    expect(tab("Account")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Team panel");
    expect(onValueChange).toHaveBeenCalledWith("team");
  });

  it("does not select disabled tabs", async () => {
    render(<Example />);
    await userEvent.click(tab("Billing"));
    expect(tab("Account")).toHaveAttribute("aria-selected", "true");
  });

  it("is controlled by value and onValueChange", async () => {
    function Controlled() {
      const [value, setValue] = useState("team");
      return <Example value={value} onValueChange={setValue} />;
    }
    render(<Controlled />);
    expect(tab("Team")).toHaveAttribute("aria-selected", "true");
    await userEvent.click(tab("Account"));
    expect(tab("Account")).toHaveAttribute("aria-selected", "true");
  });

  it("stays on the controlled value until the parent changes it", async () => {
    const onValueChange = vi.fn();
    render(<Example value="account" onValueChange={onValueChange} />);
    await userEvent.click(tab("Team"));
    expect(onValueChange).toHaveBeenCalledWith("team");
    expect(tab("Account")).toHaveAttribute("aria-selected", "true");
  });

  it("uses a roving tabindex: Tab goes to the selected tab, then the panel", async () => {
    render(<Example />);
    expect(tab("Account")).toHaveAttribute("tabindex", "0");
    expect(tab("Team")).toHaveAttribute("tabindex", "-1");

    await userEvent.tab();
    expect(tab("Account")).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("tabpanel")).toHaveFocus();
  });

  it("moves with ArrowRight/ArrowLeft, selecting, wrapping and skipping disabled tabs", async () => {
    render(<Example />);
    await userEvent.tab();

    await userEvent.keyboard("{ArrowRight}");
    expect(tab("Team")).toHaveFocus();
    expect(tab("Team")).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{ArrowRight}");
    expect(tab("API keys")).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");
    expect(tab("Account")).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Account panel");

    await userEvent.keyboard("{ArrowLeft}");
    expect(tab("API keys")).toHaveFocus();
    expect(tab("API keys")).toHaveAttribute("aria-selected", "true");
  });

  it("jumps to the first and last enabled tab with Home and End", async () => {
    render(<Example defaultValue="team" />);
    await userEvent.tab();
    expect(tab("Team")).toHaveFocus();

    await userEvent.keyboard("{End}");
    expect(tab("API keys")).toHaveFocus();
    expect(tab("API keys")).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{Home}");
    expect(tab("Account")).toHaveFocus();
    expect(tab("Account")).toHaveAttribute("aria-selected", "true");
  });

  it("keeps every tab reachable while nothing is selected", () => {
    render(<Example defaultValue={undefined} />);
    screen
      .getAllByRole("tab")
      .forEach((element) => expect(element).toHaveAttribute("tabindex", "0"));
  });

  it("applies the underline and pill variants", () => {
    const { rerender } = render(<Example />);
    expect(screen.getByRole("tablist")).toHaveClass("border-b-2");
    expect(tab("Account")).toHaveClass("aria-selected:after:bg-action-primary");

    rerender(<Example variant="pill" />);
    expect(screen.getByRole("tablist")).toHaveClass("rounded-pill");
    expect(tab("Account")).toHaveClass("aria-selected:bg-accent-lime", "h-11");
  });

  it("throws when a part is used outside Tabs", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TabTrigger value="x">x</TabTrigger>)).toThrow(
      "Tabs parts must be used within Tabs",
    );
    spy.mockRestore();
  });

  it("receives refs and merges className on every part", () => {
    const refs = {
      root: createRef<HTMLDivElement>(),
      list: createRef<HTMLDivElement>(),
      trigger: createRef<HTMLButtonElement>(),
      panel: createRef<HTMLDivElement>(),
    };
    render(
      <Tabs defaultValue="a" ref={refs.root} className="root-class">
        <TabList aria-label="x" ref={refs.list} className="list-class">
          <TabTrigger value="a" ref={refs.trigger} className="trigger-class">
            A
          </TabTrigger>
        </TabList>
        <TabPanel value="a" ref={refs.panel} className="panel-class">
          Panel
        </TabPanel>
      </Tabs>,
    );
    Object.values(refs).forEach((ref) => {
      expect(ref.current).toBeInstanceOf(HTMLElement);
    });
    expect(refs.root.current).toHaveClass("root-class");
    expect(refs.list.current).toHaveClass("list-class");
    expect(refs.trigger.current).toHaveClass("trigger-class");
    expect(refs.panel.current).toHaveClass("panel-class");
  });

  it("has no accessibility violations", async () => {
    const { container, rerender } = render(<Example />);
    expect(await axe(container)).toHaveNoViolations();
    rerender(<Example variant="pill" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
