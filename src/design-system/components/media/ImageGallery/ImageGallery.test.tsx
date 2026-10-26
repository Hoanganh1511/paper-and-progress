import { createRef } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { ImageGallery } from "./ImageGallery";

expect.extend(toHaveNoViolations);

const images = [
  {
    src: "/a.jpg",
    thumbnailSrc: "/a-thumb.jpg",
    alt: "Mountain",
    caption: "Fansipan",
  },
  { src: "/b.jpg", alt: "River" },
  { src: "/c.jpg", alt: "Forest" },
];

const thumb = (alt: string) =>
  screen.getByRole("button", { name: `View larger: ${alt}` });

describe("ImageGallery", () => {
  it("renders a list with one button per image, named by the image's alt", () => {
    render(<ImageGallery images={images} />);
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(thumb("Mountain")).toBeInTheDocument();
  });

  it("uses the thumbnail in the grid, falling back to the full image", () => {
    render(<ImageGallery images={images} />);
    expect(thumb("Mountain").querySelector("img")).toHaveAttribute(
      "src",
      "/a-thumb.jpg",
    );
    expect(thumb("River").querySelector("img")).toHaveAttribute(
      "src",
      "/b.jpg",
    );
    expect(thumb("River").querySelector("img")).toHaveAttribute("alt", "");
  });

  it("lays out responsive columns and an aspect ratio", () => {
    render(<ImageGallery images={images} columns={4} aspectRatio="video" />);
    expect(screen.getByRole("list")).toHaveClass(
      "grid",
      "grid-cols-1",
      "sm:grid-cols-2",
      "lg:grid-cols-4",
    );
    expect(thumb("Mountain").firstElementChild).toHaveClass("aspect-video");
  });

  it("opens the viewer on the chosen image", async () => {
    render(<ImageGallery images={images} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(thumb("River"));
    const dialog = screen.getByRole("dialog", { name: "Image viewer" });
    expect(within(dialog).getByRole("img", { name: "River" })).toHaveAttribute(
      "src",
      "/b.jpg",
    );
    expect(within(dialog).getByText("Image 2 of 3")).toBeInTheDocument();
  });

  it("steps through the images in the viewer", async () => {
    render(<ImageGallery images={images} />);
    await userEvent.click(thumb("Mountain"));
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByRole("img", { name: "Forest" })).toHaveAttribute(
      "src",
      "/c.jpg",
    );
  });

  it("closes the viewer with Escape and returns focus to the thumbnail", async () => {
    render(<ImageGallery images={images} />);
    await userEvent.click(thumb("Forest"));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(thumb("Forest")).toHaveFocus();
  });

  it("opens from the keyboard", async () => {
    render(<ImageGallery images={images} />);
    await userEvent.tab();
    expect(thumb("Mountain")).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("accepts translated labels for the gallery and the viewer", async () => {
    render(
      <ImageGallery
        images={images}
        labels={{ view: "Xem ảnh lớn: {alt}", lightbox: { close: "Đóng" } }}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Xem ảnh lớn: Mountain" }),
    );
    expect(screen.getByRole("button", { name: "Đóng" })).toBeInTheDocument();
  });

  it("renders nothing interactive for an empty gallery", () => {
    render(<ImageGallery images={[]} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("receives ref via props and merges className", () => {
    const ref = createRef<HTMLDivElement>();
    render(<ImageGallery images={images} ref={ref} className="custom-class" />);
    expect(ref.current).toBe(screen.getByRole("list"));
    expect(ref.current).toHaveClass("custom-class");
  });

  it("has no accessibility violations, closed and open", async () => {
    const { container } = render(<ImageGallery images={images} />);
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(thumb("Mountain"));
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
