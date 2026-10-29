import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { EnglishDiary } from "./EnglishDiary";

expect.extend(toHaveNoViolations);

beforeEach(() => localStorage.clear());

describe("EnglishDiary", () => {
  it("shows the newest log in the detail panel on open", () => {
    render(<EnglishDiary />);
    const detail = screen.getByRole("region", { name: "Learning Session" });
    expect(
      within(detail).getByRole("heading", { name: "Introduce a Project" }),
    ).toBeInTheDocument();
    expect(within(detail).getByText("elaborate on")).toBeInTheDocument();
  });

  it("selects another log", async () => {
    render(<EnglishDiary />);
    await userEvent.click(
      screen.getByRole("button", { name: /^(?!Tuỳ chọn).*Read an AI article/ }),
    );
    const detail = screen.getByRole("region", { name: "Learning Session" });
    expect(
      within(detail).getByRole("heading", { name: "Read an AI article" }),
    ).toBeInTheDocument();
  });

  it("filters by skill and by search text", async () => {
    render(<EnglishDiary />);
    await userEvent.click(screen.getByRole("button", { name: "Nghe" }));
    expect(
      screen.queryByText("Introduce a Project", { selector: "span" }),
    ).toBeNull();
    expect(screen.getAllByText("TED Talk practice").length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("button", { name: "Tất cả" }));
    await userEvent.type(screen.getByLabelText("Tìm kiếm log"), "zzz");
    expect(screen.getByText("Không tìm thấy log nào")).toBeInTheDocument();
  });

  it("creates a log that appears in the timeline and persists", async () => {
    render(<EnglishDiary />);
    await userEvent.click(screen.getByRole("button", { name: "Tạo log mới" }));
    const dialog = screen.getByRole("dialog");

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Lưu log" }),
    );
    expect(
      within(dialog).getByText("Nhập tiêu đề buổi học."),
    ).toBeInTheDocument();

    await userEvent.type(
      within(dialog).getByLabelText(/Tiêu đề buổi học/),
      "Shadowing practice",
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Lưu log" }),
    );

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(
      screen.getByRole("button", {
        name: /Shadowing practice/,
        current: true,
      }),
    ).toBeInTheDocument();
    expect(localStorage.getItem("pp.english-diary.logs")).toContain(
      "Shadowing practice",
    );
  });

  it("archives and deletes a log from its menu", async () => {
    render(<EnglishDiary />);
    await userEvent.click(
      screen.getByRole("button", { name: "Tuỳ chọn cho TED Talk practice" }),
    );
    await userEvent.click(screen.getByRole("menuitem", { name: "Lưu trữ" }));
    expect(
      screen.queryByRole("button", { name: /TED Talk practice$/ }),
    ).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Đã lưu trữ" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Tuỳ chọn cho TED Talk practice" }),
    );
    await userEvent.click(screen.getByRole("menuitem", { name: "Xoá" }));
    await userEvent.click(screen.getByRole("button", { name: "Xoá" }));
    expect(
      screen.getByText("Chưa có log nào được lưu trữ"),
    ).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<EnglishDiary />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
