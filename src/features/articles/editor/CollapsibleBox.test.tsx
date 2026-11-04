import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { CollapsibleBox } from "./CollapsibleBox";

expect.extend(toHaveNoViolations);

describe("CollapsibleBox", () => {
  it("is open at first and folds with the button, keeping its content mounted", async () => {
    render(
      <CollapsibleBox title="Đăng bài">
        <input aria-label="Ô nhập" />
      </CollapsibleBox>,
    );
    const toggle = screen.getByRole("button", { name: /Thu gọn: Đăng bài/ });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("Ô nhập")).toBeVisible();

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAccessibleName(/Mở rộng: Đăng bài/);
    expect(screen.getByLabelText("Ô nhập", { selector: "input" })).not.toBeVisible();

    await userEvent.click(toggle);
    expect(screen.getByLabelText("Ô nhập")).toBeVisible();
  });

  it("can start folded", () => {
    render(
      <CollapsibleBox title="Chi tiết" isDefaultOpen={false}>
        <p>Nội dung</p>
      </CollapsibleBox>,
    );
    expect(screen.getByText("Nội dung")).not.toBeVisible();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <CollapsibleBox title="Đăng bài">
        <p>Nội dung</p>
      </CollapsibleBox>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
