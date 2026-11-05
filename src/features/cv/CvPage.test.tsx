import { render, screen, within } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { CvPage } from "./CvPage";
import { CV, OWNER_LINKS } from "./cvData";

expect.extend(toHaveNoViolations);

describe("CvPage", () => {
  it("has the name as the one h1, with the role and the ways to reach the owner", () => {
    render(<CvPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: CV.name }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(CV.role).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: OWNER_LINKS.email }),
    ).toHaveAttribute("href", `mailto:${OWNER_LINKS.email}`);
    const github = screen.getByRole("link", { name: /github\.com\/anhht/ });
    expect(github).toHaveAttribute("target", "_blank");
    expect(github).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("has the five sections, each under its own h2", () => {
    render(<CvPage />);
    for (const title of [
      "Education",
      "Experience",
      "Projects",
      "Skills",
      "Achievements",
    ]) {
      expect(
        screen.getByRole("heading", { level: 2, name: title }),
      ).toBeInTheDocument();
    }
  });

  it("lists every job, project and skill group", () => {
    render(<CvPage />);
    const experience = screen.getByRole("region", { name: "Experience" });
    expect(within(experience).getAllByRole("listitem").length).toBeGreaterThan(
      CV.experience.length,
    );
    const projects = screen.getByRole("region", { name: "Projects" });
    for (const project of CV.projects) {
      expect(
        within(projects).getByRole("heading", { name: project.name }),
      ).toBeInTheDocument();
      expect(
        within(projects).getByRole("list", {
          name: `${project.name}: technologies`,
        }),
      ).toBeInTheDocument();
    }
    const skills = screen.getByRole("region", { name: "Skills" });
    for (const group of CV.skills) {
      expect(
        within(skills).getByRole("heading", { name: group.title }),
      ).toBeInTheDocument();
    }
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<CvPage />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
