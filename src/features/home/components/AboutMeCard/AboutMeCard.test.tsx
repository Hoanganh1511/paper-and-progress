import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { AboutMeCard } from "./AboutMeCard";

expect.extend(toHaveNoViolations);

describe("AboutMeCard", () => {
  it("names the owner and links the email and phone", () => {
    render(<AboutMeCard />);
    expect(
      screen.getByRole("heading", { name: "Về tôi (Chủ web)" }),
    ).toBeInTheDocument();
    expect(screen.getByText("AnhHT")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "anhht.fe@gmail.com" }),
    ).toHaveAttribute("href", "mailto:anhht.fe@gmail.com");
    expect(screen.getByRole("link", { name: "0969605812" })).toHaveAttribute(
      "href",
      "tel:0969605812",
    );
  });

  it("copies a value and says so", async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();
    render(<AboutMeCard />);
    await user.click(screen.getByRole("button", { name: "Sao chép email" }));
    expect(writeText).toHaveBeenCalledWith("anhht.fe@gmail.com");
    expect(
      await screen.findByRole("button", { name: "Đã sao chép email" }),
    ).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<AboutMeCard />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
