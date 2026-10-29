import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import { socialLoginLabels } from "../../labels";
import { SocialLoginButtons } from "./SocialLoginButtons";

expect.extend(toHaveNoViolations);

const ALL = ["google", "facebook", "github"] as const;

describe("SocialLoginButtons", () => {
  it("shows the divider and one button per provider, each with its logo", () => {
    render(
      <SocialLoginButtons
        labels={socialLoginLabels}
        providers={[...ALL]}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("hoặc")).toBeInTheDocument();
    for (const name of [
      "Đăng nhập với Google",
      "Đăng nhập với Facebook",
      "Đăng nhập với GitHub",
    ]) {
      const button = screen.getByRole("button", { name });
      expect(button.querySelector("svg")).not.toBeNull();
    }
  });

  it("reports which provider was picked", async () => {
    const onSelect = vi.fn();
    render(
      <SocialLoginButtons
        labels={socialLoginLabels}
        providers={[...ALL]}
        onSelect={onSelect}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Đăng nhập với GitHub" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Đăng nhập với Google" }),
    );
    expect(onSelect.mock.calls).toEqual([["github"], ["google"]]);
  });

  it("shows only the providers it is given", () => {
    render(
      <SocialLoginButtons
        labels={socialLoginLabels}
        providers={["google"]}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("renders nothing, not even the divider, when no provider is on", () => {
    const { container } = render(
      <SocialLoginButtons
        labels={socialLoginLabels}
        providers={[]}
        onSelect={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("disables every button while a redirect is under way", async () => {
    const onSelect = vi.fn();
    render(
      <SocialLoginButtons
        labels={socialLoginLabels}
        providers={[...ALL]}
        onSelect={onSelect}
        isDisabled
      />,
    );
    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
    await userEvent.click(screen.getAllByRole("button")[0]);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("never submits a surrounding form", async () => {
    const onSubmit = vi.fn((event) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <SocialLoginButtons
          labels={socialLoginLabels}
          providers={[...ALL]}
          onSelect={vi.fn()}
        />
      </form>,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Đăng nhập với Google" }),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <SocialLoginButtons
        labels={socialLoginLabels}
        providers={[...ALL]}
        onSelect={vi.fn()}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
