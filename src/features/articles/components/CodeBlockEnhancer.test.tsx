import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import { ArticleBody } from "./ArticleBody";

expect.extend(toHaveNoViolations);

const html =
  '<p>Intro</p><pre><code class="language-tsx">const a = 1;</code></pre>';

describe("CodeBlockEnhancer", () => {
  it("adds a bar with the language and a copy button to each code block", () => {
    render(<ArticleBody html={html} />);
    expect(screen.getByText("tsx")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Sao chép mã tsx" }),
    ).toBeTruthy();
  });

  it("copies the code and says so", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    render(<ArticleBody html={html} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Sao chép mã tsx" }),
    );
    expect(writeText).toHaveBeenCalledWith("const a = 1;");
    expect(await screen.findByText("Đã sao chép")).toBeTruthy();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ArticleBody html={html} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
