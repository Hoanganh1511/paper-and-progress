import { createRef, useState } from "react";
import { vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Button } from "../../../components";
import {
  DataListPage,
  type DataListPageProps,
  type DataListSort,
} from "./DataListPage";

expect.extend(toHaveNoViolations);

interface Project {
  id: string;
  name: string;
  owner: string;
}

const projects: Project[] = [
  { id: "1", name: "Atlas", owner: "Ann" },
  { id: "2", name: "Borealis", owner: "Bao" },
  { id: "3", name: "Cirrus", owner: "Chi" },
];

function setup(props: Partial<DataListPageProps<Project>> = {}) {
  return render(
    <DataListPage<Project>
      title="Projects"
      description="All your projects"
      columns={[
        { id: "name", header: "Name", cell: (row) => row.name, sortable: true },
        { id: "owner", header: "Owner", cell: (row) => row.owner },
      ]}
      rows={projects}
      getRowId={(row) => row.id}
      getRowLabel={(row) => row.name}
      {...props}
    />,
  );
}

const rowCount = () => screen.getAllByRole("row").length - 1;

describe("DataListPage", () => {
  it("renders the heading, description, actions and a captioned table", () => {
    setup({ actions: <Button>New project</Button> });
    expect(
      screen.getByRole("heading", { level: 1, name: "Projects" }),
    ).toBeInTheDocument();
    expect(screen.getByText("All your projects")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New project" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Projects" })).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Owner" }),
    ).toBeInTheDocument();
    expect(rowCount()).toBe(3);
    expect(screen.getByRole("cell", { name: "Borealis" })).toBeInTheDocument();
  });

  it("applies table options", () => {
    setup({ tableOptions: { striped: true, compact: true } });
    expect(screen.getByRole("table")).toHaveAttribute("data-striped", "true");
    expect(screen.getByRole("table")).toHaveAttribute("data-compact", "true");
  });

  it("renders row actions in their own column", async () => {
    const onEdit = vi.fn();
    setup({
      rowActions: (row) => (
        <Button size="compact" onClick={() => onEdit(row.id)}>
          Edit {row.name}
        </Button>
      ),
    });
    expect(
      screen.getByRole("columnheader", { name: "Actions" }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Edit Borealis" }),
    );
    expect(onEdit).toHaveBeenCalledWith("2");
  });

  describe("search and filters", () => {
    it("shows a search field only when onSearchChange is given", () => {
      const { unmount } = setup();
      expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
      unmount();
      setup({ onSearchChange: () => {} });
      expect(screen.getByRole("search")).toBeInTheDocument();
      expect(
        screen.getByRole("searchbox", { name: "Search" }),
      ).toBeInTheDocument();
    });

    it("reports typing and clearing", async () => {
      const onSearchChange = vi.fn();
      setup({ onSearchChange, searchValue: "at" });
      await userEvent.type(screen.getByRole("searchbox"), "l");
      expect(onSearchChange).toHaveBeenLastCalledWith("atl");
      await userEvent.click(
        screen.getByRole("button", { name: "Clear search" }),
      );
      expect(onSearchChange).toHaveBeenLastCalledWith("");
    });

    it("renders custom filter controls", () => {
      setup({ filters: <button>Status filter</button> });
      expect(
        screen.getByRole("button", { name: "Status filter" }),
      ).toBeInTheDocument();
    });

    it("shows active filters as removable badges and can clear them all", async () => {
      const onRemoveFilter = vi.fn();
      const onClearFilters = vi.fn();
      setup({
        activeFilters: [
          { id: "status", label: "Status: Active" },
          { id: "owner", label: "Owner: Ann" },
        ],
        onRemoveFilter,
        onClearFilters,
      });
      const group = screen.getByRole("group", { name: "Active filters" });
      expect(within(group).getByText("Status: Active")).toBeInTheDocument();
      await userEvent.click(
        screen.getByRole("button", { name: "Remove filter Owner: Ann" }),
      );
      expect(onRemoveFilter).toHaveBeenCalledWith("owner");
      await userEvent.click(
        screen.getByRole("button", { name: "Clear all filters" }),
      );
      expect(onClearFilters).toHaveBeenCalledTimes(1);
    });
  });

  describe("sorting", () => {
    it("only sortable columns with a handler become sort buttons", () => {
      const { unmount } = setup();
      expect(
        screen.queryByRole("button", { name: "Name" }),
      ).not.toBeInTheDocument();
      unmount();
      setup({ onSortChange: () => {} });
      expect(screen.getByRole("button", { name: "Name" })).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Owner" }),
      ).not.toBeInTheDocument();
    });

    it("reflects the sort in aria-sort", () => {
      const sort: DataListSort = { columnId: "name", direction: "descending" };
      setup({ sort, onSortChange: () => {} });
      expect(
        screen.getByRole("columnheader", { name: "Name" }),
      ).toHaveAttribute("aria-sort", "descending");
    });

    it("cycles ascending, descending, none", async () => {
      function Controlled() {
        const [sort, setSort] = useState<DataListSort>();
        return (
          <DataListPage<Project>
            title="Projects"
            columns={[
              {
                id: "name",
                header: "Name",
                cell: (row) => row.name,
                sortable: true,
              },
            ]}
            rows={projects}
            getRowId={(row) => row.id}
            sort={sort}
            onSortChange={setSort}
          />
        );
      }
      render(<Controlled />);
      const header = () => screen.getByRole("columnheader", { name: "Name" });
      const button = () => screen.getByRole("button", { name: "Name" });

      expect(header()).toHaveAttribute("aria-sort", "none");
      await userEvent.click(button());
      expect(header()).toHaveAttribute("aria-sort", "ascending");
      await userEvent.click(button());
      expect(header()).toHaveAttribute("aria-sort", "descending");
      await userEvent.click(button());
      expect(header()).toHaveAttribute("aria-sort", "none");
    });

    it("starts ascending when another column was sorted", async () => {
      const onSortChange = vi.fn();
      setup({
        sort: { columnId: "owner", direction: "descending" },
        onSortChange,
      });
      await userEvent.click(screen.getByRole("button", { name: "Name" }));
      expect(onSortChange).toHaveBeenCalledWith({
        columnId: "name",
        direction: "ascending",
      });
    });
  });

  describe("selection and bulk actions", () => {
    it("has no checkboxes unless selectable", () => {
      setup();
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });

    it("selects and deselects rows", async () => {
      const onSelectedIdsChange = vi.fn();
      setup({ selectable: true, selectedIds: ["1"], onSelectedIdsChange });
      expect(
        screen.getByRole("checkbox", { name: "Select Atlas" }),
      ).toBeChecked();
      await userEvent.click(
        screen.getByRole("checkbox", { name: "Select Borealis" }),
      );
      expect(onSelectedIdsChange).toHaveBeenLastCalledWith(["1", "2"]);
      await userEvent.click(
        screen.getByRole("checkbox", { name: "Select Atlas" }),
      );
      expect(onSelectedIdsChange).toHaveBeenLastCalledWith([]);
    });

    it("select-all is indeterminate when partial, and selects or clears the page", async () => {
      const onSelectedIdsChange = vi.fn();
      const { rerender } = setup({
        selectable: true,
        selectedIds: ["1", "other-page"],
        onSelectedIdsChange,
      });
      const all = () =>
        screen.getByRole("checkbox", { name: "Select all rows" });
      expect(all()).toBePartiallyChecked();

      await userEvent.click(all());
      expect(onSelectedIdsChange).toHaveBeenLastCalledWith([
        "1",
        "other-page",
        "2",
        "3",
      ]);

      rerender(
        <DataListPage<Project>
          title="Projects"
          columns={[{ id: "name", header: "Name", cell: (row) => row.name }]}
          rows={projects}
          getRowId={(row) => row.id}
          selectable
          selectedIds={["1", "2", "3", "other-page"]}
          onSelectedIdsChange={onSelectedIdsChange}
        />,
      );
      expect(all()).toBeChecked();
      await userEvent.click(all());
      expect(onSelectedIdsChange).toHaveBeenLastCalledWith(["other-page"]);
    });

    it("shows the bulk bar with a count, the actions and a clear button", async () => {
      const onSelectedIdsChange = vi.fn();
      const onDelete = vi.fn();
      setup({
        selectable: true,
        selectedIds: ["1", "3"],
        onSelectedIdsChange,
        bulkActions: (ids) => (
          <Button size="compact" onClick={() => onDelete(ids)}>
            Delete selected
          </Button>
        ),
      });
      const bar = screen.getByRole("region", { name: "Bulk actions" });
      expect(within(bar).getByText("2 selected")).toBeInTheDocument();
      await userEvent.click(
        within(bar).getByRole("button", { name: "Delete selected" }),
      );
      expect(onDelete).toHaveBeenCalledWith(["1", "3"]);
      await userEvent.click(
        within(bar).getByRole("button", { name: "Clear selection" }),
      );
      expect(onSelectedIdsChange).toHaveBeenCalledWith([]);
    });

    it("accepts static bulk actions and hides the bar without a selection", () => {
      const { rerender } = setup({
        selectable: true,
        selectedIds: [],
        bulkActions: <button>Archive</button>,
      });
      expect(
        screen.queryByRole("region", { name: "Bulk actions" }),
      ).not.toBeInTheDocument();
      rerender(
        <DataListPage<Project>
          title="Projects"
          columns={[{ id: "name", header: "Name", cell: (row) => row.name }]}
          rows={projects}
          getRowId={(row) => row.id}
          selectable
          selectedIds={["1"]}
          bulkActions={<button>Archive</button>}
        />,
      );
      expect(
        screen.getByRole("button", { name: "Archive" }),
      ).toBeInTheDocument();
    });
  });

  describe("states", () => {
    it("shows skeleton rows and a busy table while loading", () => {
      const { container } = setup({ isLoading: true });
      expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
      expect(
        container.querySelectorAll('[aria-hidden="true"].animate-pulse'),
      ).toHaveLength(5);
      expect(screen.getByRole("status")).toHaveTextContent("Loading");
      expect(
        screen.queryByRole("cell", { name: "Atlas" }),
      ).not.toBeInTheDocument();
    });

    it("shows the empty state when there are no rows", () => {
      setup({ rows: [] });
      expect(
        screen.getByRole("heading", { level: 2, name: "Nothing to show" }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("shows a custom empty state", () => {
      setup({ rows: [], emptyState: <p>No projects yet</p> });
      expect(screen.getByText("No projects yet")).toBeInTheDocument();
    });

    it("shows the error with a retry instead of the table", async () => {
      const onRetry = vi.fn();
      setup({ error: "Server unavailable", onRetry });
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Could not load the list",
      );
      expect(screen.getByText("Server unavailable")).toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Try again" }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe("pagination", () => {
    it("shows pagination when there is more than one page", async () => {
      const onPageChange = vi.fn();
      setup({ page: 2, pageCount: 5, onPageChange });
      expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      await userEvent.click(screen.getByRole("button", { name: "Next page" }));
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it("hides pagination for a single page", () => {
      setup({ page: 1, pageCount: 1, onPageChange: () => {} });
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    });
  });

  it("accepts translated labels", () => {
    setup({
      onSearchChange: () => {},
      selectable: true,
      labels: { search: "Tìm kiếm", selectAll: "Chọn tất cả" },
    });
    expect(
      screen.getByRole("searchbox", { name: "Tìm kiếm" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Chọn tất cả" }),
    ).toBeInTheDocument();
  });

  it("receives ref via props and merges className", () => {
    const ref = createRef<HTMLElement>();
    setup({ ref, className: "custom-class" });
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = setup({
      actions: <Button>New project</Button>,
      onSearchChange: () => {},
      onSortChange: () => {},
      sort: { columnId: "name", direction: "ascending" },
      selectable: true,
      selectedIds: ["1"],
      bulkActions: <Button size="compact">Delete selected</Button>,
      activeFilters: [{ id: "a", label: "Active" }],
      onRemoveFilter: () => {},
      rowActions: (row) => <Button size="compact">Edit {row.name}</Button>,
      page: 2,
      pageCount: 5,
      onPageChange: () => {},
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
