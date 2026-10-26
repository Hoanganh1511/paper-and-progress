import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { FormField } from "./FormField";
import { Input } from "../Input";

expect.extend(toHaveNoViolations);

describe("FormField", () => {
  it("links the label to the control via htmlFor", () => {
    render(
      <FormField label="Email">
        <Input />
      </FormField>,
    );
    const input = screen.getByLabelText("Email");
    expect(input.tagName).toBe("INPUT");
    expect(screen.getByText("Email")).toHaveAttribute("for", input.id);
  });

  it("marks required fields with aria-required", () => {
    render(
      <FormField label="Email" required>
        <Input />
      </FormField>,
    );
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "aria-required",
      "true",
    );
  });

  it("links the description via aria-describedby", () => {
    render(
      <FormField label="Email" description="We never share it">
        <Input />
      </FormField>,
    );
    const description = screen.getByText("We never share it");
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "aria-describedby",
      description.id,
    );
  });

  it("renders the error as an alert linked to an invalid control", () => {
    render(
      <FormField label="Email" description="Hint" error="Invalid email">
        <Input />
      </FormField>,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Invalid email");
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toContain(alert.id);
    expect(input.getAttribute("aria-describedby")).toContain(
      screen.getByText("Hint").id,
    );
  });

  it("renders no alert or aria-describedby without error or description", () => {
    render(
      <FormField label="Email">
        <Input />
      </FormField>,
    );
    const input = screen.getByRole("textbox");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute("aria-describedby");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("receives ref via props", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <FormField label="Email" ref={ref}>
        <Input />
      </FormField>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("merges custom className", () => {
    const { container } = render(
      <FormField label="Email" className="custom-class">
        <Input />
      </FormField>,
    );
    expect(container.firstElementChild).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <FormField
        label="Email"
        required
        description="We never share it"
        error="Invalid email"
      >
        <Input />
      </FormField>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
