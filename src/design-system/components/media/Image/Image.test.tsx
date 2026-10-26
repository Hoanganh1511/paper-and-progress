import { createRef } from "react";
import { vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Image } from "./Image";

expect.extend(toHaveNoViolations);

const frame = (container: HTMLElement) =>
  container.firstElementChild as HTMLElement;

describe("Image", () => {
  it("renders a lazy, async-decoded image with its alt text", () => {
    render(<Image src="/a.jpg" alt="A mountain" />);
    const img = screen.getByRole("img", { name: "A mountain" });
    expect(img).toHaveAttribute("src", "/a.jpg");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
  });

  it("supports a decorative image with empty alt", () => {
    const { container } = render(<Image src="/a.jpg" alt="" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("applies aspect ratio, radius and fit", () => {
    const { container } = render(
      <Image
        src="/a.jpg"
        alt="x"
        aspectRatio="video"
        radius="soft"
        fit="contain"
      />,
    );
    expect(frame(container)).toHaveClass("aspect-video", "rounded-soft");
    expect(screen.getByRole("img")).toHaveClass("size-full", "object-contain");
  });

  it("lets the image set its own height with the auto aspect ratio", () => {
    render(<Image src="/a.jpg" alt="x" />);
    expect(screen.getByRole("img")).toHaveClass(
      "h-auto",
      "w-full",
      "object-cover",
    );
  });

  it("pulses a placeholder until loaded, then stops", () => {
    const { container } = render(<Image src="/a.jpg" alt="x" />);
    expect(frame(container)).toHaveClass(
      "animate-pulse",
      "motion-reduce:animate-none",
    );
    fireEvent.load(screen.getByRole("img"));
    expect(frame(container)).not.toHaveClass("animate-pulse");
  });

  it("calls the onLoad and onError handlers it wraps", () => {
    const onLoad = vi.fn();
    const onError = vi.fn();
    render(<Image src="/a.jpg" alt="x" onLoad={onLoad} onError={onError} />);
    fireEvent.load(screen.getByRole("img"));
    expect(onLoad).toHaveBeenCalledTimes(1);
    fireEvent.error(screen.getByRole("img"));
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("falls back to a labelled icon when the image fails", () => {
    const { container } = render(<Image src="/missing.jpg" alt="A mountain" />);
    fireEvent.error(screen.getByRole("img", { name: "A mountain" }));
    expect(container.querySelector("img")).not.toBeInTheDocument();
    const fallback = screen.getByRole("img", { name: "A mountain" });
    expect(fallback.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(frame(container)).not.toHaveClass("animate-pulse");
  });

  it("hides the fallback of a decorative image from assistive technology", () => {
    const { container } = render(<Image src="/missing.jpg" alt="" />);
    fireEvent.error(container.querySelector("img") as HTMLElement);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders a custom fallback", () => {
    render(<Image src="/missing.jpg" alt="x" fallback={<b>No photo</b>} />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByText("No photo")).toBeInTheDocument();
  });

  it("tries again when src changes", () => {
    const { rerender } = render(<Image src="/missing.jpg" alt="x" />);
    fireEvent.error(screen.getByRole("img"));
    expect(document.querySelector("img")).not.toBeInTheDocument();
    rerender(<Image src="/other.jpg" alt="x" />);
    expect(document.querySelector("img")).toHaveAttribute("src", "/other.jpg");
  });

  it("receives ref on the img and merges classNames", () => {
    const ref = createRef<HTMLImageElement>();
    const { container } = render(
      <Image
        src="/a.jpg"
        alt="x"
        ref={ref}
        className="img-class"
        frameClassName="frame-class"
      />,
    );
    expect(ref.current).toBe(screen.getByRole("img"));
    expect(ref.current).toHaveClass("img-class");
    expect(frame(container)).toHaveClass("frame-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <Image src="/a.jpg" alt="A mountain" aspectRatio="square" />
        <Image src="/b.jpg" alt="" />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
