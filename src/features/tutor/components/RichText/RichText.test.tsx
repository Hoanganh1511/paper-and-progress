import { render, screen } from "@testing-library/react";
import { RichText } from "./RichText";

describe("RichText", () => {
  it("renders plain text unchanged", () => {
    render(
      <p>
        <RichText text="Just words" />
      </p>,
    );
    expect(screen.getByText("Just words")).toBeInTheDocument();
  });

  it("renders code and bold spans", () => {
    render(
      <p>
        <RichText text="Run `npm test` then **commit**" />
      </p>,
    );
    expect(screen.getByText("npm test").tagName).toBe("CODE");
    expect(screen.getByText("commit").tagName).toBe("STRONG");
  });

  it("keeps backticks inside a double-backtick code span", () => {
    render(
      <p>
        <RichText text="Avoid ``gap-${n}`` here" />
      </p>,
    );
    expect(screen.getByText("gap-${n}").tagName).toBe("CODE");
  });
});
