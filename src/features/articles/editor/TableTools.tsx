"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useEditorState, type Editor } from "@tiptap/react";
import { cn } from "@/design-system";

/** Where the bar sits against the table: over it, under it, or held at the top of the screen over a long one. */
export type TableToolsPlacement = "above" | "below" | "stuck";

/** The table the cursor is in: its size and where it starts in the document. */
function tableAt(editor: Editor) {
  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth);
    if (node.type.name === "table") {
      return {
        rows: node.childCount,
        cols: node.firstChild?.childCount ?? 0,
        pos: $from.before(depth),
      };
    }
  }
  return undefined;
}

function toolsState(editor: Editor) {
  const table = tableAt(editor);
  return {
    size: table && { rows: table.rows, cols: table.cols },
    tablePos: table?.pos,
    isFocused: editor.isFocused,
    canAddRowBefore: editor.can().addRowBefore(),
    canAddRowAfter: editor.can().addRowAfter(),
    canDeleteRow: editor.can().deleteRow(),
    canAddColumnBefore: editor.can().addColumnBefore(),
    canAddColumnAfter: editor.can().addColumnAfter(),
    canDeleteColumn: editor.can().deleteColumn(),
    hasHeaderRow: editor.isActive("tableHeader"),
  };
}

/** The gap kept between the bar and the table, and from the edges of the screen. */
const GAP = 8;

/** How far down the sticky site header reaches, so the bar never hides under it. */
function headerOffset() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    "--app-header-height",
  );
  const header = Number.parseFloat(raw);
  return (Number.isFinite(header) ? header : 64) + GAP;
}

/**
 * Where the bar goes for a table at `rect` (in the window), `height` tall.
 *
 * Right over the table when there is room. When the table starts too high on
 * the screen: under it if it is short enough to show its bottom, and held at
 * the top of the screen, over the table, if it is long, so it stays in reach
 * for as long as any part of the table is in view.
 */
export function placeBar(
  rect: { top: number; bottom: number; left: number },
  height: number,
  view: { top: number; height: number },
): { top: number; placement: TableToolsPlacement } {
  const above = rect.top - height - GAP;
  if (above >= view.top) return { top: above, placement: "above" };
  const isTopInView = rect.top >= view.top;
  const below = rect.bottom + GAP;
  // The table starts in view but has no room above: under it, if that fits on screen.
  if (isTopInView && below + height <= view.height - GAP) {
    return { top: below, placement: "below" };
  }
  // A long table: keep the bar at the top of the screen, but never past the end of the table.
  return {
    top: Math.min(Math.max(view.top, rect.top), rect.bottom - height),
    placement: "stuck",
  };
}

function Tool({
  label,
  title,
  onRun,
  disabled = false,
  isPressed,
  isDanger = false,
  children,
}: {
  /** The full name, for screen readers. */
  label: string;
  title?: string;
  onRun: () => void;
  disabled?: boolean;
  isPressed?: boolean;
  isDanger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title ?? label}
      aria-pressed={isPressed}
      disabled={disabled}
      // Keep the cursor in its cell: the command acts on the cell it is in.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onRun}
      className={cn(
        "inline-flex h-10 min-w-11 cursor-pointer items-center justify-center rounded-sharp border-2 border-transparent px-2.5 text-body-sm font-semibold",
        "hover:border-border-strong hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-transparent disabled:hover:bg-transparent",
        isPressed && "bg-accent-lime text-ink hover:bg-accent-lime",
        isDanger && "text-danger-text",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Changes the table the cursor is in: add a row above or below, add a column
 * left or right, delete the row or column, turn the header row on or off, or
 * delete the whole table. It floats right over the table the cursor is in
 * and goes away when the cursor leaves it. A long table that starts above the
 * screen holds the bar at the top of the screen, and a table with no room above
 * gets it underneath, so it is always where the table is.
 */
export function TableTools({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => toolsState(current),
  });
  const barRef = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<{
    top: number;
    left: number;
    placement: TableToolsPlacement;
  }>();
  const { tablePos } = state;
  const isShown = state.size !== undefined && state.isFocused;

  const measure = useCallback(() => {
    const bar = barRef.current;
    if (tablePos === undefined || !bar) return;
    const dom = editor.view.nodeDOM(tablePos);
    if (!(dom instanceof HTMLElement)) return;
    const rect = dom.getBoundingClientRect();
    const barRect = bar.getBoundingClientRect();
    const { top, placement } = placeBar(rect, barRect.height, {
      top: headerOffset(),
      height: window.innerHeight,
    });
    // Starts at the table's left edge, kept on the screen.
    const left = Math.max(
      GAP,
      Math.min(rect.left, window.innerWidth - barRect.width - GAP),
    );
    setPlace((previous) =>
      previous &&
      previous.top === top &&
      previous.left === left &&
      previous.placement === placement
        ? previous
        : { top, left, placement },
    );
  }, [editor, tablePos]);

  // Place the bar whenever the table or the cursor changes, then follow the scroll and the window.
  useLayoutEffect(() => {
    if (isShown) measure();
  });
  useEffect(() => {
    if (!isShown) return;
    // Capturing: the page, or any box the editor scrolls in, may be what moves.
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [isShown, measure]);

  if (!isShown || !state.size) return null;
  const run = () => editor.chain().focus();

  return createPortal(
    <div
      ref={barRef}
      role="group"
      aria-label="Chỉnh bảng"
      data-placement={place?.placement}
      // Fixed to the window and out of the editor's box, so it is never cut off by it.
      style={{
        top: place?.top ?? 0,
        left: place?.left ?? 0,
        visibility: place ? "visible" : "hidden",
      }}
      className="fixed z-[200] flex max-w-[calc(100vw-1rem)] flex-wrap items-center gap-x-1 gap-y-1 rounded-standard border-2 border-border-strong bg-surface-card px-2 py-1 shadow-floating"
    >
      <span
        role="status"
        className="mr-2 text-body-sm font-semibold text-text-secondary"
      >
        Bảng {state.size.rows} hàng × {state.size.cols} cột
      </span>

      <div role="group" aria-label="Hàng" className="flex items-center">
        <Tool
          label="Thêm hàng phía trên"
          disabled={!state.canAddRowBefore}
          onRun={() => run().addRowBefore().run()}
        >
          + Hàng trên
        </Tool>
        <Tool
          label="Thêm hàng phía dưới"
          disabled={!state.canAddRowAfter}
          onRun={() => run().addRowAfter().run()}
        >
          + Hàng dưới
        </Tool>
        <Tool
          label="Xoá hàng này"
          disabled={!state.canDeleteRow}
          onRun={() => run().deleteRow().run()}
        >
          − Hàng
        </Tool>
      </div>

      <span aria-hidden="true" className="mx-1 h-6 w-px bg-border-subtle" />

      <div role="group" aria-label="Cột" className="flex items-center">
        <Tool
          label="Thêm cột bên trái"
          disabled={!state.canAddColumnBefore}
          onRun={() => run().addColumnBefore().run()}
        >
          + Cột trái
        </Tool>
        <Tool
          label="Thêm cột bên phải"
          disabled={!state.canAddColumnAfter}
          onRun={() => run().addColumnAfter().run()}
        >
          + Cột phải
        </Tool>
        <Tool
          label="Xoá cột này"
          disabled={!state.canDeleteColumn}
          onRun={() => run().deleteColumn().run()}
        >
          − Cột
        </Tool>
      </div>

      <span aria-hidden="true" className="mx-1 h-6 w-px bg-border-subtle" />

      <Tool
        label="Hàng tiêu đề"
        title="Bật hoặc tắt hàng tiêu đề"
        isPressed={state.hasHeaderRow}
        onRun={() => run().toggleHeaderRow().run()}
      >
        Hàng tiêu đề
      </Tool>
      <Tool
        label="Xoá cả bảng"
        isDanger
        onRun={() => run().deleteTable().run()}
      >
        Xoá bảng
      </Tool>
    </div>,
    document.body,
  );
}
