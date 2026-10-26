import { createRef } from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import {
  CreateEditForm,
  type CreateEditField,
  type CreateEditFormProps,
} from "./CreateEditForm";

expect.extend(toHaveNoViolations);

const fields: CreateEditField[] = [
  { name: "name", label: "Name", required: true },
  { name: "website", label: "Website", type: "url" },
  { name: "email", label: "Contact email", type: "email" },
  { name: "budget", label: "Budget", type: "number" },
  { name: "notes", label: "Notes", type: "textarea", description: "Optional" },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    options: [
      { value: "active", label: "Active" },
      { value: "archived", label: "Archived" },
    ],
  },
  { name: "isPublic", label: "Public project", type: "checkbox" },
];

function setup(props: Partial<CreateEditFormProps> = {}) {
  const onSubmit = vi.fn();
  const view = render(
    <CreateEditForm
      mode="create"
      fields={fields}
      onSubmit={onSubmit}
      {...props}
    />,
  );
  return { onSubmit, ...view };
}

const field = (label: RegExp | string) =>
  screen.getByLabelText(label, { selector: "input, textarea, button" });

async function pickStatus(optionName: string) {
  await userEvent.click(screen.getByRole("combobox", { name: /Status/ }));
  await userEvent.click(screen.getByRole("option", { name: optionName }));
}

describe("CreateEditForm", () => {
  it("renders a labelled form with every kind of field", () => {
    setup();
    expect(screen.getByRole("form", { name: "Create" })).toBeInTheDocument();
    expect(field(/^Name/)).toHaveAttribute("type", "text");
    expect(field(/Website/)).toHaveAttribute("type", "url");
    expect(field(/Contact email/)).toHaveAttribute("type", "email");
    expect(field(/Budget/)).toHaveAttribute("inputmode", "decimal");
    expect(field(/Notes/).tagName).toBe("TEXTAREA");
    expect(screen.getByText("Optional")).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /Status/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Public project" }),
    ).toBeInTheDocument();
  });

  it("uses create or edit titles and submit labels, or custom ones", () => {
    const { unmount } = setup();
    expect(
      screen.getByRole("heading", { level: 2, name: "Create" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toHaveAttribute(
      "type",
      "submit",
    );
    unmount();

    const { unmount: unmountEdit } = setup({ mode: "edit" });
    expect(screen.getByRole("heading", { name: "Edit" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save changes" }),
    ).toBeInTheDocument();
    unmountEdit();

    setup({
      title: "New project",
      submitLabel: "Add project",
      description: "Fill in the details",
    });
    expect(
      screen.getByRole("heading", { name: "New project" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add project" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Fill in the details")).toBeInTheDocument();
  });

  it("fills the fields from defaultValues", async () => {
    const { onSubmit } = setup({
      mode: "edit",
      defaultValues: {
        name: "Atlas",
        notes: "Long running",
        status: "archived",
        isPublic: true,
      },
    });
    expect(field(/^Name/)).toHaveValue("Atlas");
    expect(field(/Notes/)).toHaveValue("Long running");
    expect(screen.getByRole("combobox", { name: /Status/ })).toHaveTextContent(
      "Archived",
    );
    expect(
      screen.getByRole("checkbox", { name: "Public project" }),
    ).toBeChecked();

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Atlas",
      website: "",
      email: "",
      budget: "",
      notes: "Long running",
      status: "archived",
      isPublic: true,
    });
  });

  it("submits typed values, trimmed, with booleans for checkboxes", async () => {
    const { onSubmit } = setup();
    await userEvent.type(field(/^Name/), "  Borealis ");
    await userEvent.type(field(/Website/), "https://example.com");
    await userEvent.type(field(/Budget/), "12.5");
    await pickStatus("Active");
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Public project" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Borealis",
      website: "https://example.com",
      email: "",
      budget: "12.5",
      notes: "",
      status: "active",
      isPublic: true,
    });
  });

  it("reports missing required fields, focuses the first, and does not submit", async () => {
    const { onSubmit } = setup();
    await userEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Name is required.")).toBeInTheDocument();
    expect(screen.getByText("Status is required.")).toBeInTheDocument();
    expect(field(/^Name/)).toHaveAttribute("aria-invalid", "true");
    expect(field(/^Name/)).toHaveFocus();
  });

  it("focuses an invalid select trigger", async () => {
    setup();
    await userEvent.type(field(/^Name/), "Atlas");
    await userEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(screen.getByRole("combobox", { name: /Status/ })).toHaveFocus();
  });

  it("checks the shape of url, email and number values", async () => {
    const { onSubmit } = setup();
    await userEvent.type(field(/^Name/), "Atlas");
    await pickStatus("Active");
    await userEvent.type(field(/Website/), "example.com");
    await userEvent.type(field(/Contact email/), "nope");
    await userEvent.type(field(/Budget/), "abc");
    await userEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(
      screen.getByText("Enter a valid URL, including https://."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Enter a valid email address."),
    ).toBeInTheDocument();
    expect(screen.getByText("Enter a valid number.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("runs a custom validate with all the values", async () => {
    const validate = vi.fn((value: string | boolean) =>
      value === "taken" ? "That name is taken" : undefined,
    );
    const { onSubmit } = setup({
      fields: [{ name: "name", label: "Name", validate }],
    });
    await userEvent.type(field(/Name/), "taken");
    await userEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(screen.getByText("That name is taken")).toBeInTheDocument();
    expect(validate).toHaveBeenCalledWith("taken", { name: "taken" });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("clears a field's error when it changes", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(screen.getByText("Name is required.")).toBeInTheDocument();
    await userEvent.type(field(/^Name/), "A");
    expect(screen.queryByText("Name is required.")).not.toBeInTheDocument();
    await pickStatus("Active");
    expect(screen.queryByText("Status is required.")).not.toBeInTheDocument();
  });

  it("links a checkbox's error to it", async () => {
    setup({
      fields: [
        { name: "terms", label: "Accept", type: "checkbox", required: true },
      ],
    });
    await userEvent.click(screen.getByRole("button", { name: "Create" }));
    const checkbox = screen.getByRole("checkbox", { name: "Accept" });
    const message = screen.getByText("Accept is required.");
    expect(checkbox).toHaveAttribute("aria-invalid", "true");
    expect(checkbox).toHaveAttribute("aria-describedby", message.id);
  });

  it("shows server errors", () => {
    setup({
      error: "Could not save",
      errors: { name: "Name already exists" },
    });
    expect(screen.getByText("Could not save")).toBeInTheDocument();
    expect(screen.getByText("Name already exists")).toBeInTheDocument();
    expect(field(/^Name/)).toHaveAttribute("aria-invalid", "true");
  });

  it("calls onCancel and shows Cancel only when it is given", async () => {
    const { unmount } = setup();
    expect(
      screen.queryByRole("button", { name: "Cancel" }),
    ).not.toBeInTheDocument();
    unmount();
    const onCancel = vi.fn();
    setup({ onCancel });
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables everything and shows a busy submit while submitting", () => {
    setup({ isSubmitting: true, onCancel: () => {} });
    expect(field(/^Name/)).toBeDisabled();
    expect(screen.getByRole("combobox", { name: /Status/ })).toBeDisabled();
    expect(screen.getByRole("checkbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Create" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("accepts translated labels", () => {
    setup({
      labels: {
        createTitle: "Tạo mới",
        createSubmit: "Tạo",
        required: "Nhập {label}.",
      },
    });
    expect(
      screen.getByRole("heading", { name: "Tạo mới" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tạo" })).toBeInTheDocument();
  });

  it("receives ref via props and merges className", () => {
    const ref = createRef<HTMLFormElement>();
    setup({ ref, className: "custom-class" });
    expect(ref.current).toBeInstanceOf(HTMLFormElement);
    expect(ref.current).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = setup({
      onCancel: () => {},
      error: "Could not save",
    });
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
