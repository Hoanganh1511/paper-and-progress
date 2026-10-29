import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import { CreateLearningLogDialog } from "./CreateLearningLogDialog";

expect.extend(toHaveNoViolations);

const STORAGE_KEY = "pp.learning-logs";

function setup() {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(<CreateLearningLogDialog open onClose={onClose} onSaved={onSaved} />);
  return { onClose, onSaved };
}

const title = () => screen.getByLabelText(/Tiêu đề buổi học/);
const skill = () => screen.getByLabelText(/Kỹ năng chính/);
const save = () => screen.getByRole("button", { name: "Lưu log" });
const storedLogs = () =>
  JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("opening", () => {
  it("focuses the title and shows the header, required marks and defaults", () => {
    setup();
    expect(screen.getByRole("dialog", { name: "Viết thêm Log" })).toBeVisible();
    expect(
      screen.getByText("Ghi lại những gì bạn đã học hôm nay."),
    ).toBeInTheDocument();
    expect(title()).toHaveFocus();
    expect(title()).toHaveAttribute("aria-required", "true");
    expect(screen.getByLabelText("Thời gian học")).toHaveValue("30");
    expect(screen.getByLabelText("Trạng thái")).toHaveValue("completed");
  });

  it("offers no draft or template option, since neither is implemented", () => {
    setup();
    expect(screen.queryByText(/Lưu nháp/)).toBeNull();
    expect(screen.queryByText(/Lưu làm mẫu/)).toBeNull();
  });
});

describe("validation", () => {
  it("requires the title and the skill, with the messages beside the fields", async () => {
    const { onClose } = setup();
    await userEvent.click(save());
    expect(screen.getByText("Nhập tiêu đề buổi học.")).toBeInTheDocument();
    expect(screen.getByText("Chọn kỹ năng chính.")).toBeInTheDocument();
    expect(title()).toHaveAttribute("aria-invalid", "true");
    expect(skill()).toHaveAttribute("aria-invalid", "true");
    expect(onClose).not.toHaveBeenCalled();
    expect(storedLogs()).toEqual([]);
    // Focus moves to the first invalid field.
    await vi.waitFor(() => expect(title()).toHaveFocus());
  });

  it("rejects a reference that is not an http(s) URL", async () => {
    setup();
    await userEvent.type(title(), "React cơ bản");
    await userEvent.selectOptions(skill(), "programming");
    await userEvent.type(
      screen.getByLabelText("Tài liệu tham khảo"),
      "react.dev",
    );
    await userEvent.click(save());
    expect(
      screen.getByText("Nhập đường dẫn bắt đầu bằng http:// hoặc https://."),
    ).toBeInTheDocument();
    expect(storedLogs()).toEqual([]);
  });
});

describe("tags", () => {
  const tagField = () => screen.getByPlaceholderText("Nhập tag và nhấn Enter");

  it("adds tags with Enter or a comma, and removes them with their button", async () => {
    setup();
    await userEvent.type(tagField(), "React{Enter}");
    await userEvent.type(tagField(), "useState,");
    const list = screen.getByRole("list", { name: "Tag đã thêm" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(within(list).getByText("#React")).toBeInTheDocument();
    expect(within(list).getByText("#useState")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Xoá tag React" }),
    );
    expect(within(list).queryByText("#React")).toBeNull();
  });

  it("does not submit the form when Enter adds a tag", async () => {
    const { onClose } = setup();
    await userEvent.type(title(), "React cơ bản");
    await userEvent.selectOptions(skill(), "programming");
    await userEvent.type(tagField(), "React{Enter}");
    expect(onClose).not.toHaveBeenCalled();
    expect(storedLogs()).toEqual([]);
  });

  it("takes the last tag back with Backspace in the empty field", async () => {
    setup();
    await userEvent.type(tagField(), "a{Enter}b{Enter}");
    await userEvent.keyboard("{Backspace}");
    const list = screen.getByRole("list", { name: "Tag đã thêm" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
  });

  it("explains a duplicate tag instead of adding it", async () => {
    setup();
    await userEvent.type(tagField(), "React{Enter}");
    await userEvent.type(tagField(), "react{Enter}");
    expect(screen.getByText("Tag này đã có.")).toBeInTheDocument();
    expect(
      within(screen.getByRole("list", { name: "Tag đã thêm" })).getAllByRole(
        "listitem",
      ),
    ).toHaveLength(1);
  });

  it("stops at 10 tags", async () => {
    setup();
    for (let index = 0; index < 10; index += 1) {
      await userEvent.type(tagField(), `t${index}{Enter}`);
    }
    await userEvent.type(tagField(), "extra{Enter}");
    expect(screen.getByText("Tối đa 10 tag.")).toBeInTheDocument();
  });
});

describe("saving", () => {
  async function fillValid() {
    await userEvent.type(title(), "  React cơ bản  ");
    await userEvent.selectOptions(skill(), "programming");
    await userEvent.type(screen.getByLabelText("Mục tiêu"), "Hiểu useState");
    await userEvent.type(
      screen.getByPlaceholderText("Nhập tag và nhấn Enter"),
      "React{Enter}",
    );
    await userEvent.type(
      screen.getByLabelText("Tài liệu tham khảo"),
      "https://react.dev",
    );
  }

  it("stores a normalised log, reports it and closes", async () => {
    const { onClose, onSaved } = setup();
    await fillValid();
    await userEvent.click(save());

    await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    const [stored] = storedLogs();
    expect(stored).toMatchObject({
      title: "React cơ bản",
      skillId: "programming",
      durationMinutes: 30,
      goal: "Hiểu useState",
      tags: ["React"],
      referenceUrls: ["https://react.dev/"],
      status: "completed",
    });
    expect(stored.id).toEqual(expect.any(String));
    expect(onSaved).toHaveBeenCalledWith(
      expect.objectContaining({ id: stored.id, title: "React cơ bản" }),
    );
  });

  it("keeps a tag that was typed but not confirmed", async () => {
    const { onClose } = setup();
    await userEvent.type(title(), "React cơ bản");
    await userEvent.selectOptions(skill(), "programming");
    // No Enter: the click on Save must not throw the text away.
    await userEvent.type(
      screen.getByPlaceholderText("Nhập tag và nhấn Enter"),
      "Frontend",
    );
    await userEvent.click(save());
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(storedLogs()[0].tags).toEqual(["Frontend"]);
  });

  it("keeps everything and shows an error when storing fails, then saves on retry", async () => {
    const { onClose } = setup();
    await fillValid();
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementationOnce(() => {
        throw new Error("QuotaExceededError");
      });
    await userEvent.click(save());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Không lưu được log trên trình duyệt này",
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(title()).toHaveValue("  React cơ bản  ");
    expect(screen.getByLabelText("Mục tiêu")).toHaveValue("Hiểu useState");
    expect(save()).toBeEnabled();

    await userEvent.click(save());
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(setItem).toHaveBeenCalledTimes(2);
  });

  it("saves once however many times submit fires", async () => {
    const { onSaved } = setup();
    await fillValid();
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const form = title().closest("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    await vi.waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledTimes(1);
  });
});

describe("closing and resetting", () => {
  it("closes at once when nothing was typed", async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByRole("button", { name: "Đóng" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("asks before throwing changes away, and lets the user keep writing", async () => {
    const { onClose } = setup();
    await userEvent.type(title(), "Dang viet do");
    await userEvent.click(screen.getByRole("button", { name: "Đóng" }));

    const confirm = screen.getByRole("alertdialog", {
      name: "Bỏ các thay đổi?",
    });
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(
      within(confirm).getByRole("button", { name: "Tiếp tục viết" }),
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(title()).toHaveValue("Dang viet do");

    await userEvent.click(screen.getByRole("button", { name: "Đóng" }));
    await userEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Bỏ thay đổi",
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(storedLogs()).toEqual([]);
  });

  it("also asks when Escape is pressed on a changed form", async () => {
    const { onClose } = setup();
    await userEvent.type(title(), "abc");
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("alertdialog")).toBeVisible();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("resets after confirmation, and is disabled while nothing changed", async () => {
    setup();
    const reset = screen.getByRole("button", { name: "Đặt lại" });
    expect(reset).toBeDisabled();

    await userEvent.type(title(), "Nội dung tạm");
    await userEvent.selectOptions(skill(), "design");
    expect(reset).toBeEnabled();
    await userEvent.click(reset);
    await userEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Đặt lại",
      }),
    );
    expect(title()).toHaveValue("");
    expect(skill()).toHaveValue("");
  });
});

describe("accessibility", () => {
  it("has no violations", async () => {
    setup();
    expect(await axe(screen.getByRole("dialog"))).toHaveNoViolations();
  });
});
