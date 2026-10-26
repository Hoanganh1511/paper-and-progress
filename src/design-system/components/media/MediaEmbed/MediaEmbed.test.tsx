import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { MediaEmbed } from "./MediaEmbed";

expect.extend(toHaveNoViolations);

const YOUTUBE = "https://www.youtube-nocookie.com/embed/abc123";

describe("MediaEmbed", () => {
  it("renders a titled, lazy, sandboxed iframe with a trimmed referrer", () => {
    render(<MediaEmbed src={YOUTUBE} title="Product tour" />);
    const frame = screen.getByTitle("Product tour");
    expect(frame.tagName).toBe("IFRAME");
    expect(frame).toHaveAttribute("src", YOUTUBE);
    expect(frame).toHaveAttribute("loading", "lazy");
    expect(frame).toHaveAttribute(
      "referrerpolicy",
      "strict-origin-when-cross-origin",
    );
    expect(frame).toHaveAttribute(
      "sandbox",
      expect.stringContaining("allow-scripts"),
    );
    expect(frame).toHaveAttribute(
      "allow",
      expect.stringContaining("picture-in-picture"),
    );
    expect(frame).toHaveAttribute("allowfullscreen");
  });

  it("is responsive with an aspect ratio and radius", () => {
    const { container } = render(
      <MediaEmbed
        src={YOUTUBE}
        title="Tour"
        aspectRatio="square"
        radius="soft"
      />,
    );
    expect(container.firstElementChild).toHaveClass(
      "aspect-square",
      "rounded-soft",
      "w-full",
    );
    expect(screen.getByTitle("Tour")).toHaveClass("absolute", "size-full");
  });

  it("accepts the allowed hosts, including a custom list", () => {
    const { unmount } = render(
      <MediaEmbed src="https://player.vimeo.com/video/1" title="Vimeo" />,
    );
    expect(screen.getByTitle("Vimeo")).toBeInTheDocument();
    unmount();

    render(
      <MediaEmbed
        src="https://maps.example.com/embed?q=hanoi"
        title="Map"
        allowedHosts={["maps.example.com"]}
      />,
    );
    expect(screen.getByTitle("Map")).toBeInTheDocument();
  });

  it.each([
    ["an unknown host", "https://evil.example.com/embed/1"],
    ["plain http", "http://www.youtube.com/embed/1"],
    ["a javascript URL", "javascript:alert(1)"],
    ["a malformed URL", "not a url"],
    ["a lookalike host", "https://www.youtube.com.evil.example/embed/1"],
  ])("does not load %s", (_label, src) => {
    render(<MediaEmbed src={src} title="Blocked" />);
    expect(screen.queryByTitle("Blocked")).not.toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent(
      "This content cannot be shown.",
    );
  });

  it("shows a custom fallback for a blocked source", () => {
    render(
      <MediaEmbed
        src="https://evil.example.com/x"
        title="x"
        fallback={<b>Unavailable</b>}
      />,
    );
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
  });

  describe("loadOnDemand", () => {
    it("shows a play button and loads nothing until it is pressed", async () => {
      render(<MediaEmbed src={YOUTUBE} title="Tour" loadOnDemand />);
      expect(screen.queryByTitle("Tour")).not.toBeInTheDocument();
      const button = screen.getByRole("button", { name: "Load video: Tour" });
      expect(button.querySelector("svg")).toHaveAttribute(
        "aria-hidden",
        "true",
      );

      await userEvent.click(button);
      expect(screen.getByTitle("Tour")).toHaveAttribute("src", YOUTUBE);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("shows the poster as a decorative image and supports a custom label", () => {
      const { container } = render(
        <MediaEmbed
          src={YOUTUBE}
          title="Tour"
          loadOnDemand
          poster="/poster.jpg"
          loadLabel="Phát video: {title}"
        />,
      );
      expect(container.querySelector("img")).toHaveAttribute(
        "src",
        "/poster.jpg",
      );
      expect(container.querySelector("img")).toHaveAttribute("alt", "");
      expect(
        screen.getByRole("button", { name: "Phát video: Tour" }),
      ).toBeInTheDocument();
    });

    it("is keyboard operable", async () => {
      render(<MediaEmbed src={YOUTUBE} title="Tour" loadOnDemand />);
      await userEvent.tab();
      await userEvent.keyboard("{Enter}");
      expect(screen.getByTitle("Tour")).toBeInTheDocument();
    });
  });

  it("receives ref on the iframe and merges classNames", () => {
    const ref = createRef<HTMLIFrameElement>();
    const { container } = render(
      <MediaEmbed
        src={YOUTUBE}
        title="Tour"
        ref={ref}
        className="frame-el"
        frameClassName="box"
      />,
    );
    expect(ref.current).toBeInstanceOf(HTMLIFrameElement);
    expect(ref.current).toHaveClass("frame-el");
    expect(container.firstElementChild).toHaveClass("box");
  });

  it("has no accessibility violations in any state", async () => {
    const { container, rerender } = render(
      <MediaEmbed src={YOUTUBE} title="Tour" />,
    );
    expect(await axe(container, { iframes: false })).toHaveNoViolations();
    rerender(
      <MediaEmbed src={YOUTUBE} title="Tour" loadOnDemand poster="/p.jpg" />,
    );
    expect(await axe(container, { iframes: false })).toHaveNoViolations();
    rerender(<MediaEmbed src="https://evil.example.com" title="Tour" />);
    expect(await axe(container, { iframes: false })).toHaveNoViolations();
  });
});
