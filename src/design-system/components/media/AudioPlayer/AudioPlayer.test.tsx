import { vi } from "vitest";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { AudioPlayer } from "./AudioPlayer";

expect.extend(toHaveNoViolations);

const audio = (container: HTMLElement) =>
  container.querySelector("audio") as HTMLAudioElement;

function mockReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

describe("AudioPlayer", () => {
  afterEach(() => {
    Reflect.deleteProperty(window, "matchMedia");
  });

  it("renders the title, a description and a labelled audio with native controls", () => {
    const { container } = render(
      <AudioPlayer src="/ep1.mp3" title="Episode 1" description="12 min" />,
    );
    expect(screen.getByText("Episode 1")).toBeInTheDocument();
    expect(screen.getByText("12 min")).toBeInTheDocument();
    expect(audio(container)).toHaveAttribute("controls");
    expect(audio(container)).toHaveAttribute("aria-label", "Episode 1");
    expect(audio(container)).toHaveAttribute("preload", "metadata");
  });

  it("hides the decorative icon from assistive technology", () => {
    const { container } = render(
      <AudioPlayer src="/ep1.mp3" title="Episode 1" />,
    );
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("offers a download link as fallback content", () => {
    const { container } = render(
      <AudioPlayer src="/ep1.mp3" title="Episode 1" />,
    );
    expect(container.querySelector("audio a")).toHaveAttribute(
      "href",
      "/ep1.mp3",
    );
  });

  it("links a transcript when given, with a custom label", () => {
    render(
      <AudioPlayer
        src="/ep1.mp3"
        title="Episode 1"
        transcriptHref="/ep1.txt"
        transcriptLabel="Đọc bản ghi"
      />,
    );
    expect(screen.getByRole("link", { name: "Đọc bản ghi" })).toHaveAttribute(
      "href",
      "/ep1.txt",
    );
  });

  it("has no transcript link by default", () => {
    render(<AudioPlayer src="/ep1.mp3" title="Episode 1" />);
    expect(
      screen.queryByRole("link", { name: "Read the transcript" }),
    ).not.toBeInTheDocument();
  });

  it("autoplays only when motion is not reduced", () => {
    const { container, unmount } = render(
      <AudioPlayer src="/ep1.mp3" title="Episode 1" autoPlay />,
    );
    expect(audio(container).autoplay).toBe(true);
    unmount();

    mockReducedMotion(true);
    const reduced = render(
      <AudioPlayer src="/ep1.mp3" title="Episode 1" autoPlay />,
    );
    expect(audio(reduced.container).autoplay).toBe(false);
  });

  it("receives ref on the audio and merges classNames", () => {
    const ref = createRef<HTMLAudioElement>();
    const { container } = render(
      <AudioPlayer
        src="/ep1.mp3"
        title="Episode 1"
        ref={ref}
        className="audio-class"
        cardClassName="card-class"
      />,
    );
    expect(ref.current).toBeInstanceOf(HTMLAudioElement);
    expect(ref.current).toHaveClass("audio-class");
    expect(container.firstElementChild).toHaveClass("card-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <AudioPlayer
        src="/ep1.mp3"
        title="Episode 1"
        description="12 min"
        transcriptHref="/ep1.txt"
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
