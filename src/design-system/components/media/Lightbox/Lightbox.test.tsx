import { createRef, useState } from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Lightbox, type LightboxProps } from "./Lightbox";

expect.extend(toHaveNoViolations);

const items = [
  { src: "/a.jpg", alt: "Mountain", caption: "Fansipan" },
  { src: "/b.jpg", alt: "River" },
  { src: "/c.jpg", alt: "Forest" },
];

function Controlled(props: Partial<LightboxProps> & { startIndex?: number }) {
  const { startIndex = 0, onClose = () => {}, ...rest } = props;
  const [index, setIndex] = useState(startIndex);
  return (
    <Lightbox
      open
      onClose={onClose}
      items={items}
      index={index}
      onIndexChange={setIndex}
      {...rest}
    />
  );
}

describe("Lightbox", () => {
  it("renders nothing while closed", () => {
    render(
      <Lightbox
        open={false}
        onClose={() => {}}
        items={items}
        index={0}
        onIndexChange={() => {}}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders nothing when there is no image at the index", () => {
    render(
      <Lightbox
        open
        onClose={() => {}}
        items={items}
        index={9}
        onIndexChange={() => {}}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders a modal dialog with the current image, its caption and a counter", () => {
    render(<Controlled />);
    const dialog = screen.getByRole("dialog", { name: "Image viewer" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(document.body).toContainElement(dialog);
    expect(screen.getByRole("img", { name: "Mountain" })).toHaveAttribute(
      "src",
      "/a.jpg",
    );
    expect(screen.getByText("Fansipan")).toBeInTheDocument();
    expect(screen.getByText("Image 1 of 3")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it("moves with the buttons and disables them at the ends", async () => {
    render(<Controlled />);
    const previous = () =>
      screen.getByRole("button", { name: "Previous image" });
    const next = () => screen.getByRole("button", { name: "Next image" });
    expect(previous()).toBeDisabled();

    await userEvent.click(next());
    expect(screen.getByRole("img", { name: "River" })).toBeInTheDocument();
    expect(screen.getByText("Image 2 of 3")).toBeInTheDocument();
    await userEvent.click(next());
    expect(screen.getByRole("img", { name: "Forest" })).toBeInTheDocument();
    expect(next()).toBeDisabled();
    await userEvent.click(previous());
    expect(screen.getByRole("img", { name: "River" })).toBeInTheDocument();
  });

  it("moves with the Left and Right arrow keys, stopping at the ends", async () => {
    render(<Controlled startIndex={1} />);
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("img", { name: "Forest" })).toBeInTheDocument();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("img", { name: "Forest" })).toBeInTheDocument();
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}{ArrowLeft}");
    expect(screen.getByRole("img", { name: "Mountain" })).toBeInTheDocument();
  });

  it("has no navigation or counter for a single image", () => {
    render(
      <Lightbox
        open
        onClose={() => {}}
        items={[items[0]]}
        index={0}
        onIndexChange={() => {}}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Next image" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Image 1 of/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("closes from the button, Escape and a click on the dark area, not on the image", async () => {
    const onClose = vi.fn();
    render(<Controlled onClose={onClose} />);
    await userEvent.click(screen.getByRole("img", { name: "Mountain" }));
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(2);
    await userEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("moves focus in, traps it, locks scroll and restores focus", async () => {
    function Example({ isOpen }: { isOpen: boolean }) {
      return (
        <>
          <button>Opener</button>
          <Lightbox
            open={isOpen}
            onClose={() => {}}
            items={items}
            index={0}
            onIndexChange={() => {}}
          />
        </>
      );
    }
    const { rerender } = render(<Example isOpen={false} />);
    screen.getByRole("button", { name: "Opener" }).focus();
    rerender(<Example isOpen />);
    expect(screen.getByRole("dialog")).toContainElement(
      document.activeElement as HTMLElement,
    );
    expect(document.body.style.overflow).toBe("hidden");

    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole("dialog")).toContainElement(
      document.activeElement as HTMLElement,
    );

    rerender(<Example isOpen={false} />);
    expect(screen.getByRole("button", { name: "Opener" })).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });

  it("accepts translated labels", () => {
    render(
      <Controlled
        labels={{
          dialog: "Xem ảnh",
          close: "Đóng",
          next: "Ảnh sau",
          counter: "Ảnh {current}/{total}",
        }}
      />,
    );
    expect(screen.getByRole("dialog", { name: "Xem ảnh" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đóng" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ảnh sau" })).toBeInTheDocument();
    expect(screen.getByText("Ảnh 1/3")).toBeInTheDocument();
  });

  it("receives ref and merges className on the dialog", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Controlled ref={ref} className="custom-class" />);
    expect(ref.current).toBe(screen.getByRole("dialog"));
    expect(ref.current).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    render(<Controlled />);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
