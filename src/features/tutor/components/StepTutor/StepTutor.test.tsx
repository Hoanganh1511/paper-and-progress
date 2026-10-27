import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import type { TutorStep } from "../../types";
import { StepTutor } from "./StepTutor";

expect.extend(toHaveNoViolations);

const steps: TutorStep[] = [
  {
    id: "a",
    title: "First step",
    group: "Phase 1",
    duration: "30 min",
    heading: "Do the `first` thing",
    lead: "Start here.",
    boxes: [
      {
        title: "Steps",
        tag: "do",
        content: [
          { type: "text", text: "Run it." },
          { type: "code", filename: "a.sh", code: "npm test" },
          { type: "check", id: "ca", text: "It passes" },
        ],
      },
    ],
  },
  {
    id: "b",
    title: "Second step",
    group: "Phase 2",
    duration: "1 hr",
    heading: "Second heading",
    lead: "Continue.",
    boxes: [],
  },
];

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "#");
});

describe("StepTutor", () => {
  it("shows the first step and lists every step", () => {
    render(<StepTutor steps={steps} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Do the first thing" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Second step/ })).toBeVisible();
    expect(screen.getByRole("button", { name: /First step/ })).toHaveAttribute(
      "aria-current",
      "step",
    );
  });

  it("moves to the next step", async () => {
    render(<StepTutor steps={steps} />);
    await userEvent.click(screen.getByRole("button", { name: "Bước sau" }));
    expect(
      await screen.findByRole("heading", { level: 2, name: "Second heading" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bước sau" })).toBeDisabled();
  });

  it("marks a step done, advances, and updates progress", async () => {
    render(<StepTutor steps={steps} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Đánh dấu đã xong" }),
    );
    expect(
      await screen.findByRole("heading", { level: 2, name: "Second heading" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 / 2 bước đã xong")).toBeInTheDocument();
  });

  it("remembers a checked item", async () => {
    const { unmount } = render(<StepTutor steps={steps} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "It passes" }));
    unmount();
    render(<StepTutor steps={steps} />);
    expect(screen.getByRole("checkbox", { name: "It passes" })).toBeChecked();
  });

  it("marks the chosen rating as pressed", async () => {
    render(<StepTutor steps={steps} />);
    const rating = screen.getByRole("button", { name: "Rõ rồi" });
    await userEvent.click(rating);
    expect(rating).toHaveAttribute("aria-pressed", "true");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<StepTutor steps={steps} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
