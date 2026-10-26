import { createRef } from "react";
import { vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { OTPVerification, type OTPVerificationProps } from "./OTPVerification";

expect.extend(toHaveNoViolations);

function setup(props: Partial<OTPVerificationProps> = {}) {
  const onVerify = vi.fn();
  const view = render(<OTPVerification onVerify={onVerify} {...props} />);
  return { onVerify, ...view };
}

const digits = () => screen.getAllByRole("textbox");
const submit = () => screen.getByRole("button", { name: "Verify" });

describe("OTPVerification", () => {
  it("renders a labelled form with a grouped set of digit boxes", () => {
    setup({ email: "ann@example.com" });
    expect(
      screen.getByRole("form", { name: "Verify your email" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Verification code" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Enter the 6-digit code we sent to ann@example.com."),
    ).toBeInTheDocument();
    expect(digits()).toHaveLength(6);
    expect(digits()[0]).toHaveAccessibleName("Digit 1 of 6");
    expect(digits()[5]).toHaveAccessibleName("Digit 6 of 6");
    expect(digits()[0]).toHaveAttribute("autocomplete", "one-time-code");
    expect(digits()[0]).toHaveAttribute("inputmode", "numeric");
  });

  it("supports a custom length", () => {
    setup({ length: 4 });
    expect(digits()).toHaveLength(4);
    expect(digits()[3]).toHaveAccessibleName("Digit 4 of 4");
  });

  it("moves forward as digits are typed and ignores non-digits", async () => {
    setup();
    await userEvent.click(digits()[0]);
    await userEvent.keyboard("1a2");
    expect(digits()[0]).toHaveValue("1");
    expect(digits()[1]).toHaveValue("2");
    expect(digits()[2]).toHaveFocus();
  });

  it("goes back and clears with Backspace on an empty box", async () => {
    setup();
    await userEvent.click(digits()[0]);
    await userEvent.keyboard("12");
    expect(digits()[2]).toHaveFocus();
    await userEvent.keyboard("{Backspace}");
    expect(digits()[1]).toHaveFocus();
    expect(digits()[1]).toHaveValue("");
    expect(digits()[0]).toHaveValue("1");
  });

  it("moves with the arrow keys, Home and End", async () => {
    setup();
    await userEvent.click(digits()[2]);
    await userEvent.keyboard("{ArrowLeft}");
    expect(digits()[1]).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(digits()[3]).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(digits()[5]).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(digits()[0]).toHaveFocus();
  });

  it("fills every box from a pasted code and focuses the last", async () => {
    const onComplete = vi.fn();
    setup({ onComplete });
    await userEvent.click(digits()[0]);
    await userEvent.paste("12 34-56");
    expect(digits().map((box) => (box as HTMLInputElement).value)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
    ]);
    expect(digits()[5]).toHaveFocus();
    expect(onComplete).toHaveBeenCalledWith("123456");
  });

  it("calls onComplete only when the last digit is entered", async () => {
    const onComplete = vi.fn();
    setup({ onComplete });
    await userEvent.click(digits()[0]);
    await userEvent.keyboard("12345");
    expect(onComplete).not.toHaveBeenCalled();
    await userEvent.keyboard("6");
    expect(onComplete).toHaveBeenCalledWith("123456");
  });

  it("verifies the full code on submit", async () => {
    const { onVerify } = setup();
    await userEvent.click(digits()[0]);
    await userEvent.keyboard("123456");
    await userEvent.click(submit());
    expect(onVerify).toHaveBeenCalledWith("123456");
  });

  it("asks for the missing digits and focuses the first empty box", async () => {
    const { onVerify } = setup();
    await userEvent.click(digits()[0]);
    await userEvent.keyboard("123");
    await userEvent.click(submit());
    expect(onVerify).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Enter all 6 digits.");
    expect(digits()[3]).toHaveFocus();
    digits().forEach((box) =>
      expect(box).toHaveAttribute("aria-invalid", "true"),
    );
    expect(digits()[0].getAttribute("aria-describedby")).toBe(
      screen.getByRole("alert").id,
    );

    await userEvent.keyboard("4");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an error from props", () => {
    setup({ error: "That code is incorrect" });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "That code is incorrect",
    );
  });

  it("disables the boxes and shows a busy button while submitting", () => {
    setup({ isSubmitting: true });
    digits().forEach((box) => expect(box).toBeDisabled());
    expect(submit()).toHaveAttribute("aria-busy", "true");
  });

  describe("resend", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("is hidden without onResend", () => {
      setup();
      expect(
        screen.queryByRole("button", { name: /Resend/ }),
      ).not.toBeInTheDocument();
    });

    it("counts down, then resends, clears the boxes and restarts the countdown", () => {
      const onResend = vi.fn();
      setup({ onResend, resendCooldown: 3 });
      const resend = () => screen.getByRole("button", { name: /Resend/ });

      expect(resend()).toBeDisabled();
      expect(resend()).toHaveTextContent("Resend in 3s");
      act(() => vi.advanceTimersByTime(1000));
      expect(resend()).toHaveTextContent("Resend in 2s");
      // One tick per act: each second schedules the next after a re-render.
      act(() => vi.advanceTimersByTime(1000));
      act(() => vi.advanceTimersByTime(1000));
      expect(resend()).toHaveTextContent("Resend code");
      expect(resend()).toBeEnabled();

      act(() => resend().click());
      expect(onResend).toHaveBeenCalledTimes(1);
      expect(resend()).toBeDisabled();
      expect(resend()).toHaveTextContent("Resend in 3s");
    });

    it("is available immediately when the cooldown is 0", () => {
      setup({ onResend: () => {}, resendCooldown: 0 });
      expect(screen.getByRole("button", { name: "Resend code" })).toBeEnabled();
    });
  });

  it("accepts translated labels", () => {
    setup({
      labels: {
        title: "Xác minh",
        codeLegend: "Mã xác minh",
        digitLabel: "Số {index}/{length}",
        submit: "Xác nhận",
      },
    });
    expect(
      screen.getByRole("heading", { name: "Xác minh" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Mã xác minh" }),
    ).toBeInTheDocument();
    expect(digits()[1]).toHaveAccessibleName("Số 2/6");
    expect(
      screen.getByRole("button", { name: "Xác nhận" }),
    ).toBeInTheDocument();
  });

  it("receives ref via props", () => {
    const ref = createRef<HTMLFormElement>();
    setup({ ref });
    expect(ref.current).toBeInstanceOf(HTMLFormElement);
  });

  it("has no accessibility violations", async () => {
    const { container } = setup({
      onResend: () => {},
      email: "ann@example.com",
    });
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(submit());
    expect(await axe(container)).toHaveNoViolations();
  });
});
