import { vi } from "vitest";
import { createRef } from "react";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { VideoPlayer } from "./VideoPlayer";

expect.extend(toHaveNoViolations);

const video = (container: HTMLElement) =>
  container.querySelector("video") as HTMLVideoElement;

function mockReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

describe("VideoPlayer", () => {
  afterEach(() => {
    Reflect.deleteProperty(window, "matchMedia");
  });

  it("renders a labelled video with native controls and metadata preload", () => {
    const { container } = render(
      <VideoPlayer src="/clip.mp4" title="Product tour" />,
    );
    expect(video(container)).toHaveAttribute("controls");
    expect(video(container)).toHaveAttribute("aria-label", "Product tour");
    expect(video(container)).toHaveAttribute("preload", "metadata");
    expect(video(container)).toHaveAttribute("src", "/clip.mp4");
  });

  it("renders caption tracks, defaulting to kind captions", () => {
    const { container } = render(
      <VideoPlayer
        src="/clip.mp4"
        title="Tour"
        tracks={[
          { src: "/en.vtt", srcLang: "en", label: "English", isDefault: true },
          {
            src: "/vi.vtt",
            srcLang: "vi",
            label: "Tiếng Việt",
            kind: "subtitles",
          },
        ]}
      />,
    );
    const tracks = container.querySelectorAll("track");
    expect(tracks).toHaveLength(2);
    expect(tracks[0]).toHaveAttribute("kind", "captions");
    expect(tracks[0]).toHaveAttribute("srclang", "en");
    expect(tracks[0]).toHaveAttribute("label", "English");
    expect(tracks[0]).toHaveProperty("default", true);
    expect(tracks[1]).toHaveAttribute("kind", "subtitles");
    expect(tracks[1]).toHaveProperty("default", false);
  });

  it("offers a download link as fallback content", () => {
    const { container } = render(<VideoPlayer src="/clip.mp4" title="Tour" />);
    expect(container.querySelector("a")).toHaveAttribute("href", "/clip.mp4");
  });

  it("lets children replace the fallback content", () => {
    const { container } = render(
      <VideoPlayer title="Tour">
        <source src="/clip.webm" type="video/webm" />
      </VideoPlayer>,
    );
    expect(container.querySelector("source")).toBeInTheDocument();
    expect(container.querySelector("a")).not.toBeInTheDocument();
  });

  it("applies aspect ratio and radius", () => {
    const { container } = render(
      <VideoPlayer
        src="/c.mp4"
        title="Tour"
        aspectRatio="square"
        radius="soft"
      />,
    );
    expect(video(container)).toHaveClass(
      "aspect-square",
      "rounded-soft",
      "w-full",
    );
  });

  it("autoplays only when motion is not reduced", () => {
    const { container, unmount } = render(
      <VideoPlayer src="/c.mp4" title="Tour" autoPlay />,
    );
    expect(video(container).autoplay).toBe(true);
    unmount();

    mockReducedMotion(true);
    const reduced = render(<VideoPlayer src="/c.mp4" title="Tour" autoPlay />);
    expect(video(reduced.container).autoplay).toBe(false);
  });

  it("receives ref via props and merges className", () => {
    const ref = createRef<HTMLVideoElement>();
    render(
      <VideoPlayer
        src="/c.mp4"
        title="Tour"
        ref={ref}
        className="custom-class"
      />,
    );
    expect(ref.current).toBeInstanceOf(HTMLVideoElement);
    expect(ref.current).toHaveClass("custom-class");
  });

  it("has no accessibility violations when it has captions", async () => {
    const { container } = render(
      <VideoPlayer
        src="/clip.mp4"
        title="Product tour"
        tracks={[{ src: "/en.vtt", srcLang: "en", label: "English" }]}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
