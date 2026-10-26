import { createRef } from "react";
import { vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Tooltip } from "./Tooltip";

expect.extend(toHaveNoViolations);

describe("Tooltip", () => {
  describe("with timers", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

    it("is hidden initially and does not describe the trigger", () => {
      render(
        <Tooltip content="Save">
          <button>Trigger</button>
        </Tooltip>,
      );
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      expect(screen.getByRole("button")).not.toHaveAttribute(
        "aria-describedby",
      );
    });

    it("shows on hover after the delay and describes the trigger", () => {
      render(
        <Tooltip content="Save" delay={300}>
          <button>Trigger</button>
        </Tooltip>,
      );
      fireEvent.mouseEnter(screen.getByRole("button"));
      advance(299);
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      advance(1);
      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toHaveTextContent("Save");
      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-describedby",
        tooltip.id,
      );
    });

    it("hides immediately on mouse leave and cancels a pending show", () => {
      render(
        <Tooltip content="Save">
          <button>Trigger</button>
        </Tooltip>,
      );
      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);
      fireEvent.mouseLeave(button);
      advance(1000);
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

      fireEvent.mouseEnter(button);
      advance(200);
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
      fireEvent.mouseLeave(button);
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("renders inside the hover area so the pointer can move onto it", () => {
      const { container } = render(
        <Tooltip content="Save">
          <button>Trigger</button>
        </Tooltip>,
      );
      fireEvent.mouseEnter(screen.getByRole("button"));
      advance(200);
      expect(container.firstElementChild).toContainElement(
        screen.getByRole("tooltip"),
      );
    });

    it("shows on keyboard focus and hides on blur", () => {
      render(
        <Tooltip content="Save">
          <button>Trigger</button>
        </Tooltip>,
      );
      const button = screen.getByRole("button");
      fireEvent.focusIn(button);
      advance(200);
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      fireEvent.focusOut(button);
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("dismisses on Escape without letting the key reach other handlers", () => {
      const onKeyDown = vi.fn();
      document.addEventListener("keydown", onKeyDown);
      render(
        <Tooltip content="Save">
          <button>Trigger</button>
        </Tooltip>,
      );
      const button = screen.getByRole("button");
      fireEvent.focusIn(button);
      advance(200);
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      fireEvent.keyDown(button, { key: "Escape" });
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      expect(onKeyDown).not.toHaveBeenCalled();
      document.removeEventListener("keydown", onKeyDown);
    });
  });

  it("shows immediately when delay is 0", async () => {
    render(
      <Tooltip content="Save" delay={0}>
        <button>Trigger</button>
      </Tooltip>,
    );
    await userEvent.hover(screen.getByRole("button"));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("keeps an existing aria-describedby on the trigger", async () => {
    render(
      <>
        <p id="hint">Hint</p>
        <Tooltip content="Save" delay={0}>
          <button aria-describedby="hint">Trigger</button>
        </Tooltip>
      </>,
    );
    await userEvent.hover(screen.getByRole("button"));
    expect(screen.getByRole("button").getAttribute("aria-describedby")).toBe(
      `hint ${screen.getByRole("tooltip").id}`,
    );
  });

  it("does not show when content is empty", async () => {
    render(
      <Tooltip content="" delay={0}>
        <button>Trigger</button>
      </Tooltip>,
    );
    await userEvent.hover(screen.getByRole("button"));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("applies the placement and the ink/paper caption style", async () => {
    const expected = {
      top: "bottom-full",
      bottom: "top-full",
      left: "right-full",
      right: "left-full",
    } as const;
    for (const placement of Object.keys(
      expected,
    ) as (keyof typeof expected)[]) {
      const { unmount } = render(
        <Tooltip content="Save" placement={placement} delay={0}>
          <button>Trigger</button>
        </Tooltip>,
      );
      await userEvent.hover(screen.getByRole("button"));
      const tooltip = screen.getByRole("tooltip");
      expect(tooltip.parentElement).toHaveClass(expected[placement]);
      expect(tooltip).toHaveClass(
        "bg-action-primary",
        "text-text-inverse",
        "text-caption",
      );
      unmount();
    }
  });

  it("receives ref via props and merges className on the wrapper", () => {
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(
      <Tooltip content="Save" ref={ref} className="custom-class">
        <button>Trigger</button>
      </Tooltip>,
    );
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    expect(container.firstElementChild).toHaveClass("custom-class");
  });

  it("has no accessibility violations while open", async () => {
    const { container } = render(
      <Tooltip content="Save changes" delay={0}>
        <button>Save</button>
      </Tooltip>,
    );
    await userEvent.tab();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
