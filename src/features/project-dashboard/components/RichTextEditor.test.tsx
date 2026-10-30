import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import { toEditorContent, toPlainText } from "../richText";
import { RichTextEditor } from "./RichTextEditor";

expect.extend(toHaveNoViolations);

// ProseMirror measures text with Range rectangles and hit-tests clicks, which jsdom cannot do.
beforeAll(() => {
  document.elementFromPoint = () => null;
  const rect = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    toJSON: () => ({}),
  };
  Range.prototype.getBoundingClientRect = () => rect as DOMRect;
  Range.prototype.getClientRects = () =>
    ({
      item: () => null,
      length: 0,
      [Symbol.iterator]: [][Symbol.iterator],
    }) as unknown as DOMRectList;
});

async function renderEditor(
  props: Partial<Parameters<typeof RichTextEditor>[0]> = {},
) {
  const view = render(<RichTextEditor value="" label="Mô tả" {...props} />);
  await screen.findByRole("textbox", { name: "Mô tả" });
  return view;
}

describe("RichTextEditor", () => {
  it("has the full toolbar", async () => {
    await renderEditor();
    for (const name of [
      "Hoàn tác",
      "Làm lại",
      "In đậm",
      "In nghiêng",
      "Gạch chân",
      "Gạch ngang",
      "Mã nội dòng",
      "Tô nổi bật",
      "Tiêu đề 1",
      "Tiêu đề 2",
      "Tiêu đề 3",
      "Danh sách gạch đầu dòng",
      "Danh sách đánh số",
      "Danh sách công việc",
      "Trích dẫn",
      "Khối mã",
      "Đường kẻ ngang",
      "Chèn liên kết",
      "Căn trái",
      "Căn giữa",
      "Căn phải",
      "Xoá định dạng",
    ]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("shows older plain-text descriptions with their line breaks", async () => {
    await renderEditor({ value: "Dòng một\nDòng <hai>" });
    const box = screen.getByRole("textbox", { name: "Mô tả" });
    expect(box.querySelectorAll("p")).toHaveLength(2);
    expect(box).toHaveTextContent("Dòng một");
    expect(box).toHaveTextContent("Dòng <hai>");
  });

  it("commits the HTML on blur, only after something changed", async () => {
    const onCommit = vi.fn();
    await renderEditor({ value: "<p>Xin chào</p>", onCommit });
    const box = screen.getByRole("textbox", { name: "Mô tả" });

    await userEvent.click(box);
    await userEvent.tab();
    expect(onCommit).not.toHaveBeenCalled();

    await userEvent.click(box);
    await userEvent.keyboard("{Control>}b{/Control}mới");
    await act(async () => {
      box.blur();
    });
    await waitFor(() => expect(onCommit).toHaveBeenCalledTimes(1));
    expect(onCommit.mock.calls[0][0]).toContain("<strong>");
  });

  it("applies a format from the toolbar and reports it as pressed", async () => {
    const onChange = vi.fn();
    await renderEditor({ onChange });
    await userEvent.click(screen.getByRole("textbox", { name: "Mô tả" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Danh sách gạch đầu dòng" }),
    );
    expect(
      screen.getByRole("button", { name: "Danh sách gạch đầu dòng" }),
    ).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard("một việc");
    expect(onChange).toHaveBeenLastCalledWith(expect.stringContaining("<ul>"));
  });

  it("commits an empty string for an empty document", async () => {
    const onCommit = vi.fn();
    await renderEditor({ value: "<p>Cũ</p>", onCommit });
    const box = screen.getByRole("textbox", { name: "Mô tả" });
    await userEvent.click(box);
    await userEvent.keyboard("{Control>}a{/Control}{Backspace}");
    await act(async () => {
      box.blur();
    });
    await waitFor(() => expect(onCommit).toHaveBeenCalledWith(""));
  });

  it("has no accessibility violations", async () => {
    const { container } = await renderEditor({ value: "<p>Nội dung</p>" });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("rich text helpers", () => {
  it("turns plain text into paragraphs and escapes markup", () => {
    expect(toEditorContent("a\nb")).toBe("<p>a</p><p>b</p>");
    expect(toEditorContent("1 < 2")).toBe("<p>1 &lt; 2</p>");
    expect(toEditorContent("<p>giữ nguyên</p>")).toBe("<p>giữ nguyên</p>");
    expect(toEditorContent("")).toBe("");
  });

  it("strips markup for a preview", () => {
    expect(
      toPlainText("<h1>Tiêu đề</h1><p>Nội dung &amp; <strong>đậm</strong></p>"),
    ).toBe("Tiêu đề Nội dung & đậm");
    expect(toPlainText("văn bản thường")).toBe("văn bản thường");
    expect(toPlainText(null)).toBe("");
  });
});
