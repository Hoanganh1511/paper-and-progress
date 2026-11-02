import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import type { Engagement } from "../types";
import { ReactionBar } from "./ReactionBar";

expect.extend(toHaveNoViolations);

const engagement = {
  counts: { LIKE: 1, LOVE: 2, INSIGHTFUL: 0, CELEBRATE: 3 },
  mine: ["LIKE"],
  isBookmarked: false,
} as Engagement;

function setup(overrides: Partial<Engagement> = {}) {
  const onReact = vi.fn();
  const onToggleBookmark = vi.fn();
  const view = render(
    <ReactionBar
      engagement={{ ...engagement, ...overrides }}
      title="Bài viết"
      onReact={onReact}
      onToggleBookmark={onToggleBookmark}
    />,
  );
  return { ...view, onReact, onToggleBookmark };
}

describe("ReactionBar", () => {
  it("is one named group of four reactions, save and share", () => {
    setup();
    const group = screen.getByRole("group", { name: "Phản hồi bài viết" });
    expect(group.querySelectorAll("button")).toHaveLength(6);
  });

  it("shows the reaction that is on as pressed and pink, and the others as not", () => {
    setup();
    const like = screen.getByRole("button", { name: "Thích, 1 lượt" });
    expect(like).toHaveAttribute("aria-pressed", "true");
    expect(like).toHaveClass("bg-accent-pink");
    const love = screen.getByRole("button", { name: "Yêu thích, 2 lượt" });
    expect(love).toHaveAttribute("aria-pressed", "false");
    expect(love).not.toHaveClass("bg-accent-pink");
  });

  it("tells which reaction was chosen", async () => {
    const { onReact } = setup();
    await userEvent.click(
      screen.getByRole("button", { name: "Yêu thích, 2 lượt" }),
    );
    expect(onReact).toHaveBeenCalledWith("LOVE");
  });

  it("saves, and shows a saved article as pressed and yellow", async () => {
    const { onToggleBookmark, rerender } = setup();
    await userEvent.click(screen.getByRole("button", { name: "Lưu bài" }));
    expect(onToggleBookmark).toHaveBeenCalledTimes(1);
    rerender(
      <ReactionBar
        engagement={{ ...engagement, isBookmarked: true }}
        title="Bài viết"
        onReact={vi.fn()}
        onToggleBookmark={vi.fn()}
      />,
    );
    const saved = screen.getByRole("button", { name: "Đã lưu" });
    expect(saved).toHaveAttribute("aria-pressed", "true");
    expect(saved).toHaveClass("bg-accent-yellow");
  });

  it("copies the link when it cannot use the share sheet, and says so", async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();
    setup();
    await user.click(screen.getByRole("button", { name: "Chia sẻ" }));
    expect(writeText).toHaveBeenCalled();
    expect(
      await screen.findByRole("button", { name: "Đã sao chép liên kết" }),
    ).toBeInTheDocument();
  });

  it("is white with a black border and a lime edge along the left and bottom, with a panda over a hill", () => {
    const { container } = setup();
    const bar = screen.getByRole("group", { name: "Phản hồi bài viết" });
    expect(bar).toHaveClass("bg-surface-card", "border-2");
    expect(bar.className).toContain(
      "shadow-[-6px_7px_0_0_var(--color-accent-lime)]",
    );
    const panda = container.querySelector("[data-decor='panda-peek']");
    expect(panda).toHaveAttribute("aria-hidden", "true");
  });

  it("makes every control at least 44px", () => {
    setup();
    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveClass("min-h-11");
    }
  });

  it("has no axe violations", async () => {
    const { container } = setup();
    expect(await axe(container)).toHaveNoViolations();
  });
});
