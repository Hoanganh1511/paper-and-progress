import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Inbox } from "lucide-react";
import { Button } from "../../actions/Button/Button";
import { EmptyState } from "./EmptyState";

expect.extend(toHaveNoViolations);

describe("EmptyState", () => {
  it("renders a hidden icon, a heading, a description and an action", () => {
    const { container } = render(
      <EmptyState
        icon={Inbox}
        title="No messages"
        description="New messages will show up here."
        action={<Button>Compose</Button>}
      />,
    );
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(
      screen.getByRole("heading", { level: 3, name: "No messages" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("New messages will show up here."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compose" })).toBeInTheDocument();
  });

  it("works with only a title", () => {
    const { container } = render(<EmptyState title="Nothing here" />);
    expect(container.querySelector("svg")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Nothing here" }),
    ).toBeInTheDocument();
  });

  it("lets the heading level be chosen", () => {
    render(<EmptyState title="No messages" titleAs="h2" />);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("receives ref via props and merges className", () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <EmptyState title="x" ref={ref} className="custom-class" />,
    );
    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <EmptyState
        icon={Inbox}
        title="No messages"
        titleAs="h2"
        description="New messages will show up here."
        action={<Button>Compose</Button>}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
