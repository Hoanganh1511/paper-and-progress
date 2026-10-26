import { createRef } from "react";
import { vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import {
  Toast,
  ToastProvider,
  useToast,
  type ToastOptions,
  type ToastProviderProps,
} from "./index";

expect.extend(toHaveNoViolations);

describe("Toast", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a polite alert with title and description", () => {
    render(<Toast title="Saved" description="Your changes are live" />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "polite");
    expect(alert).toHaveTextContent("Saved");
    expect(alert).toHaveTextContent("Your changes are live");
  });

  it("renders each variant with its own icon", () => {
    const expected = {
      info: ["bg-info-bg", "lucide-info"],
      success: ["bg-success-bg", "lucide-circle-check"],
      warning: ["bg-warning-bg", "lucide-triangle-alert"],
      danger: ["bg-danger-bg", "lucide-circle-alert"],
    } as const;
    (Object.keys(expected) as (keyof typeof expected)[]).forEach((variant) => {
      const { unmount } = render(<Toast variant={variant} title="Hello" />);
      const [background, iconClass] = expected[variant];
      expect(screen.getByRole("alert")).toHaveClass(background);
      const icon = screen.getByRole("alert").querySelector("svg");
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon).toHaveClass(iconClass);
      unmount();
    });
  });

  it("defaults to the info variant", () => {
    render(<Toast title="Hello" />);
    expect(screen.getByRole("alert")).toHaveClass("bg-info-bg");
  });

  it("shows a dismiss button only when onDismiss is given", async () => {
    const onDismiss = vi.fn();
    const { rerender } = render(<Toast title="Hello" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    rerender(
      <Toast title="Hello" onDismiss={onDismiss} dismissLabel="Close" />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  describe("auto-dismiss", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it("calls onDismiss after 5000ms by default", () => {
      const onDismiss = vi.fn();
      render(<Toast title="Hello" onDismiss={onDismiss} />);
      act(() => vi.advanceTimersByTime(4999));
      expect(onDismiss).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(1));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("honours a custom duration and never dismisses when it is 0", () => {
      const onDismiss = vi.fn();
      const { rerender } = render(
        <Toast title="Hello" duration={1000} onDismiss={onDismiss} />,
      );
      act(() => vi.advanceTimersByTime(1000));
      expect(onDismiss).toHaveBeenCalledTimes(1);

      rerender(<Toast title="Hello" duration={0} onDismiss={onDismiss} />);
      act(() => vi.advanceTimersByTime(60_000));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("pauses while hovered and restarts afterwards", () => {
      const onDismiss = vi.fn();
      render(<Toast title="Hello" onDismiss={onDismiss} />);
      const alert = screen.getByRole("alert");

      fireEvent.mouseEnter(alert);
      act(() => vi.advanceTimersByTime(20_000));
      expect(onDismiss).not.toHaveBeenCalled();

      fireEvent.mouseLeave(alert);
      act(() => vi.advanceTimersByTime(5000));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("pauses while focus is inside", () => {
      const onDismiss = vi.fn();
      render(<Toast title="Hello" onDismiss={onDismiss} />);
      const button = screen.getByRole("button", { name: "Dismiss" });

      fireEvent.focusIn(button);
      act(() => vi.advanceTimersByTime(20_000));
      expect(onDismiss).not.toHaveBeenCalled();

      fireEvent.focusOut(button);
      act(() => vi.advanceTimersByTime(5000));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("does not restart the timer when the handler changes", () => {
      const first = vi.fn();
      const second = vi.fn();
      const { rerender } = render(<Toast title="Hello" onDismiss={first} />);
      act(() => vi.advanceTimersByTime(3000));
      rerender(<Toast title="Hello" onDismiss={second} />);
      act(() => vi.advanceTimersByTime(2000));
      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
    });
  });

  it("receives ref via props and merges className", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Toast title="Hello" ref={ref} className="custom-class" />);
    expect(ref.current).toBe(screen.getByRole("alert"));
    expect(screen.getByRole("alert")).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Toast
        variant="danger"
        title="Failed"
        description="Try again"
        onDismiss={() => {}}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

function Trigger({ options }: { options: ToastOptions }) {
  const { toast, dismiss, dismissAll } = useToast();
  return (
    <>
      <button
        onClick={() => {
          const id = toast(options);
          document.body.dataset.lastToast = id;
        }}
      >
        Show
      </button>
      <button onClick={() => dismiss(document.body.dataset.lastToast ?? "")}>
        Dismiss last
      </button>
      <button onClick={dismissAll}>Dismiss all</button>
    </>
  );
}

function setup(
  options: ToastOptions = { title: "Saved" },
  props: Partial<ToastProviderProps> = {},
) {
  return render(
    <ToastProvider {...props}>
      <Trigger options={options} />
    </ToastProvider>,
  );
}

const show = () =>
  fireEvent.click(screen.getByRole("button", { name: "Show" }));

describe("ToastProvider and useToast", () => {
  afterEach(() => {
    vi.useRealTimers();
    delete document.body.dataset.lastToast;
  });

  it("renders nothing until a toast is shown", () => {
    setup();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a toast in a named region on the toast layer", () => {
    setup({ title: "Saved", variant: "success" });
    show();
    const region = screen.getByRole("region", { name: "Notifications" });
    expect(region).toHaveClass("z-[var(--z-toast)]", "fixed");
    expect(region).toContainElement(screen.getByRole("alert"));
    expect(screen.getByRole("alert")).toHaveClass("bg-success-bg");
  });

  it("supports a custom region label", () => {
    setup({ title: "Saved" }, { label: "Thông báo" });
    show();
    expect(
      screen.getByRole("region", { name: "Thông báo" }),
    ).toBeInTheDocument();
  });

  it("dismisses one toast or all of them", () => {
    setup();
    show();
    show();
    expect(screen.getAllByRole("alert")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Dismiss last" }));
    expect(screen.getAllByRole("alert")).toHaveLength(1);

    show();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss all" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("dismisses from the toast's own button", async () => {
    setup();
    show();
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("removes a toast after 5000ms", () => {
    vi.useFakeTimers();
    setup();
    show();
    act(() => vi.advanceTimersByTime(4999));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows at most 3 toasts, queues the rest and starts their timers when they appear", () => {
    vi.useFakeTimers();
    setup({ title: "Saved" });
    for (let i = 0; i < 4; i += 1) show();
    expect(screen.getAllByRole("alert")).toHaveLength(3);

    fireEvent.click(screen.getByRole("button", { name: "Dismiss all" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    for (let i = 0; i < 4; i += 1) show();
    act(() => vi.advanceTimersByTime(4000));
    // Still the first three; the fourth is waiting, with its timer not started.
    fireEvent.click(screen.getAllByRole("button", { name: "Dismiss" })[0]);
    expect(screen.getAllByRole("alert")).toHaveLength(3);
    act(() => vi.advanceTimersByTime(1000));
    // The first two remaining expired; the late one has had only 1000ms.
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    act(() => vi.advanceTimersByTime(3999));
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("honours maxVisible, a provider duration and a per-toast duration", () => {
    vi.useFakeTimers();
    setup({ title: "Saved", duration: 0 }, { maxVisible: 1, duration: 1000 });
    show();
    show();
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  it("applies the provider duration to toasts without their own", () => {
    vi.useFakeTimers();
    setup({ title: "Saved" }, { duration: 1000 });
    show();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("throws when useToast is used outside a ToastProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Trigger options={{ title: "x" }} />)).toThrow(
      "useToast must be used within a ToastProvider",
    );
    spy.mockRestore();
  });

  it("receives ref and className on the region", () => {
    const ref = createRef<HTMLDivElement>();
    setup({ title: "Saved" }, { ref, className: "region-class" });
    show();
    expect(ref.current).toBe(screen.getByRole("region"));
    expect(screen.getByRole("region")).toHaveClass("region-class");
  });

  it("has no accessibility violations with toasts showing", async () => {
    setup({ title: "Saved", description: "All good", variant: "success" });
    show();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
