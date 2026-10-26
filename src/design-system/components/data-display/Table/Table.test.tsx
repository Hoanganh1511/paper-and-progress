import { createRef } from "react";
import { vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  type SortDirection,
  type TableProps,
} from "./index";

expect.extend(toHaveNoViolations);

function Example({
  sortDirection,
  onSort,
  ...props
}: {
  sortDirection?: SortDirection;
  onSort?: () => void;
} & TableProps) {
  return (
    <Table {...props}>
      <TableCaption>Team members</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead sortable sortDirection={sortDirection} onSort={onSort}>
            Name
          </TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Ann</TableCell>
          <TableCell>Designer</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Bao</TableCell>
          <TableCell>Engineer</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell>2</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

describe("Table", () => {
  it("renders a semantic table named by its caption", () => {
    render(<Example />);
    const table = screen.getByRole("table", { name: "Team members" });
    expect(within(table).getAllByRole("rowgroup")).toHaveLength(3);
    expect(within(table).getAllByRole("columnheader")).toHaveLength(2);
    expect(within(table).getAllByRole("row")).toHaveLength(4);
    expect(within(table).getAllByRole("cell")).toHaveLength(6);
  });

  it("gives column headings scope=col by default and accepts scope=row", () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableHead scope="row">Ann</TableHead>
            <TableCell>Designer</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole("rowheader", { name: "Ann" })).toHaveAttribute(
      "scope",
      "row",
    );
    render(<Example />);
    expect(screen.getByRole("columnheader", { name: "Role" })).toHaveAttribute(
      "scope",
      "col",
    );
  });

  it("is plain by default and reflects striped, hoverable and compact", () => {
    const { rerender } = render(<Example />);
    const table = screen.getByRole("table");
    expect(table).not.toHaveAttribute("data-striped");
    expect(table).not.toHaveAttribute("data-hoverable");
    expect(table).not.toHaveAttribute("data-compact");

    rerender(<Example striped hoverable compact />);
    expect(table).toHaveAttribute("data-striped", "true");
    expect(table).toHaveAttribute("data-hoverable", "true");
    expect(table).toHaveAttribute("data-compact", "true");
  });

  it("wires the options into the body and cells through group variants", () => {
    render(<Example />);
    const [body] = screen.getAllByRole("rowgroup").slice(1);
    expect(body).toHaveClass(
      "group-data-[striped]/table:[&>tr:nth-child(even)]:bg-surface-sunken/50",
      "group-data-[hoverable]/table:[&>tr:hover]:bg-surface-sunken",
    );
    expect(screen.getByRole("table")).toHaveClass("group/table");
    expect(screen.getByRole("cell", { name: "Ann" })).toHaveClass(
      "px-4",
      "py-3",
      "group-data-[compact]/table:px-3",
      "group-data-[compact]/table:py-2",
    );
  });

  it("only makes sortable headings buttons with aria-sort", () => {
    render(<Example />);
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute(
      "aria-sort",
      "none",
    );
    expect(screen.getByRole("button", { name: "Name" })).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Role" }),
    ).not.toHaveAttribute("aria-sort");
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("reflects the sort direction in aria-sort and the icon", () => {
    const directions = ["ascending", "descending", "none"] as const;
    directions.forEach((direction) => {
      const { unmount } = render(<Example sortDirection={direction} />);
      expect(
        screen.getByRole("columnheader", { name: "Name" }),
      ).toHaveAttribute("aria-sort", direction);
      const icon = screen
        .getByRole("button", { name: "Name" })
        .querySelector("svg");
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon).toHaveClass(
        {
          ascending: "lucide-arrow-up",
          descending: "lucide-arrow-down",
          none: "lucide-chevrons-up-down",
        }[direction],
      );
      unmount();
    });
  });

  it("calls onSort from the heading button, by click and keyboard", async () => {
    const onSort = vi.fn();
    render(<Example onSort={onSort} />);
    await userEvent.click(screen.getByRole("button", { name: "Name" }));
    expect(onSort).toHaveBeenCalledTimes(1);

    // The click above left focus on the button.
    expect(screen.getByRole("button", { name: "Name" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onSort).toHaveBeenCalledTimes(2);
  });

  it("receives ref and merges className on every part", () => {
    const refs = {
      table: createRef<HTMLTableElement>(),
      caption: createRef<HTMLTableCaptionElement>(),
      header: createRef<HTMLTableSectionElement>(),
      body: createRef<HTMLTableSectionElement>(),
      footer: createRef<HTMLTableSectionElement>(),
      row: createRef<HTMLTableRowElement>(),
      head: createRef<HTMLTableCellElement>(),
      cell: createRef<HTMLTableCellElement>(),
    };
    const { container } = render(
      <Table
        ref={refs.table}
        className="table-class"
        containerClassName="box-class"
      >
        <TableCaption ref={refs.caption} className="caption-class">
          C
        </TableCaption>
        <TableHeader ref={refs.header} className="header-class">
          <TableRow>
            <TableHead ref={refs.head} className="head-class">
              H
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody ref={refs.body} className="body-class">
          <TableRow ref={refs.row} className="row-class">
            <TableCell ref={refs.cell} className="cell-class">
              X
            </TableCell>
          </TableRow>
        </TableBody>
        <TableFooter ref={refs.footer} className="footer-class" />
      </Table>,
    );
    Object.values(refs).forEach((ref) => {
      expect(ref.current).toBeInstanceOf(HTMLElement);
    });
    expect(container.firstElementChild).toHaveClass("box-class");
    expect(refs.table.current).toHaveClass("table-class");
    expect(refs.caption.current).toHaveClass("caption-class");
    expect(refs.header.current).toHaveClass("header-class");
    expect(refs.body.current).toHaveClass("body-class");
    expect(refs.footer.current).toHaveClass("footer-class");
    expect(refs.row.current).toHaveClass("row-class");
    expect(refs.head.current).toHaveClass("head-class");
    expect(refs.cell.current).toHaveClass("cell-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Example striped hoverable compact sortDirection="ascending" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
