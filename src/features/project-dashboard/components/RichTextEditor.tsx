"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  FileCode,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { Button, Input, cn } from "@/design-system";
import { toEditorContent } from "../richText";

export interface RichTextEditorProps {
  /** The stored value: HTML, or plain text from before the editor existed. */
  value: string;
  /** Accessible name of the editing area. */
  label: string;
  placeholder?: string;
  /**
   * Called with the HTML (an empty string for an empty document) when the
   * editor loses focus after the user changed something.
   */
  onCommit?: (html: string) => void;
  /** Called on every change; use it to keep a form's state. */
  onChange?: (html: string) => void;
  className?: string;
}

interface ToolbarButtonProps {
  label: string;
  icon: LucideIcon;
  isActive?: boolean;
  isDisabled?: boolean;
  onClick: () => void;
}

/** Keeps the focus in the editor on mouse down, so a format click does not end the edit. */
function ToolbarButton({
  label,
  icon: Icon,
  isActive = false,
  isDisabled = false,
  onClick,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={isActive}
      disabled={isDisabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-sharp text-text-primary transition-colors motion-reduce:transition-none",
        "hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-40",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus",
        isActive && "bg-accent-lime text-ink hover:bg-accent-lime",
      )}
    >
      <Icon aria-hidden="true" size={18} />
    </button>
  );
}

function Divider() {
  return <span aria-hidden="true" className="mx-1 h-6 w-px bg-border-subtle" />;
}

function toolbarState(editor: Editor) {
  return {
    canUndo: editor.can().undo(),
    canRedo: editor.can().redo(),
    bold: editor.isActive("bold"),
    italic: editor.isActive("italic"),
    underline: editor.isActive("underline"),
    strike: editor.isActive("strike"),
    code: editor.isActive("code"),
    highlight: editor.isActive("highlight"),
    h1: editor.isActive("heading", { level: 1 }),
    h2: editor.isActive("heading", { level: 2 }),
    h3: editor.isActive("heading", { level: 3 }),
    bulletList: editor.isActive("bulletList"),
    orderedList: editor.isActive("orderedList"),
    taskList: editor.isActive("taskList"),
    blockquote: editor.isActive("blockquote"),
    codeBlock: editor.isActive("codeBlock"),
    link: editor.isActive("link"),
    alignLeft: editor.isActive({ textAlign: "left" }),
    alignCenter: editor.isActive({ textAlign: "center" }),
    alignRight: editor.isActive({ textAlign: "right" }),
  };
}

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => toolbarState(editor),
  });
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [url, setUrl] = useState("");
  const chain = () => editor.chain().focus();

  function openLink() {
    setUrl((editor.getAttributes("link").href as string | undefined) ?? "");
    setIsLinkOpen(true);
  }

  function applyLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const href = url.trim();
    if (href) chain().extendMarkRange("link").setLink({ href }).run();
    else chain().extendMarkRange("link").unsetLink().run();
    setIsLinkOpen(false);
  }

  const groups: ReactNode[] = [
    <div key="history" className="flex">
      <ToolbarButton
        label="Hoàn tác"
        icon={Undo2}
        isDisabled={!state.canUndo}
        onClick={() => chain().undo().run()}
      />
      <ToolbarButton
        label="Làm lại"
        icon={Redo2}
        isDisabled={!state.canRedo}
        onClick={() => chain().redo().run()}
      />
    </div>,
    <div key="marks" className="flex">
      <ToolbarButton
        label="In đậm"
        icon={Bold}
        isActive={state.bold}
        onClick={() => chain().toggleBold().run()}
      />
      <ToolbarButton
        label="In nghiêng"
        icon={Italic}
        isActive={state.italic}
        onClick={() => chain().toggleItalic().run()}
      />
      <ToolbarButton
        label="Gạch chân"
        icon={Underline}
        isActive={state.underline}
        onClick={() => chain().toggleUnderline().run()}
      />
      <ToolbarButton
        label="Gạch ngang"
        icon={Strikethrough}
        isActive={state.strike}
        onClick={() => chain().toggleStrike().run()}
      />
      <ToolbarButton
        label="Mã nội dòng"
        icon={Code}
        isActive={state.code}
        onClick={() => chain().toggleCode().run()}
      />
      <ToolbarButton
        label="Tô nổi bật"
        icon={Highlighter}
        isActive={state.highlight}
        onClick={() => chain().toggleHighlight().run()}
      />
    </div>,
    <div key="headings" className="flex">
      <ToolbarButton
        label="Tiêu đề 1"
        icon={Heading1}
        isActive={state.h1}
        onClick={() => chain().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        label="Tiêu đề 2"
        icon={Heading2}
        isActive={state.h2}
        onClick={() => chain().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        label="Tiêu đề 3"
        icon={Heading3}
        isActive={state.h3}
        onClick={() => chain().toggleHeading({ level: 3 }).run()}
      />
    </div>,
    <div key="lists" className="flex">
      <ToolbarButton
        label="Danh sách gạch đầu dòng"
        icon={List}
        isActive={state.bulletList}
        onClick={() => chain().toggleBulletList().run()}
      />
      <ToolbarButton
        label="Danh sách đánh số"
        icon={ListOrdered}
        isActive={state.orderedList}
        onClick={() => chain().toggleOrderedList().run()}
      />
      <ToolbarButton
        label="Danh sách công việc"
        icon={ListChecks}
        isActive={state.taskList}
        onClick={() => chain().toggleTaskList().run()}
      />
    </div>,
    <div key="blocks" className="flex">
      <ToolbarButton
        label="Trích dẫn"
        icon={Quote}
        isActive={state.blockquote}
        onClick={() => chain().toggleBlockquote().run()}
      />
      <ToolbarButton
        label="Khối mã"
        icon={FileCode}
        isActive={state.codeBlock}
        onClick={() => chain().toggleCodeBlock().run()}
      />
      <ToolbarButton
        label="Đường kẻ ngang"
        icon={Minus}
        onClick={() => chain().setHorizontalRule().run()}
      />
      <ToolbarButton
        label="Chèn liên kết"
        icon={Link2}
        isActive={state.link}
        onClick={openLink}
      />
    </div>,
    <div key="align" className="flex">
      <ToolbarButton
        label="Căn trái"
        icon={AlignLeft}
        isActive={state.alignLeft}
        onClick={() => chain().setTextAlign("left").run()}
      />
      <ToolbarButton
        label="Căn giữa"
        icon={AlignCenter}
        isActive={state.alignCenter}
        onClick={() => chain().setTextAlign("center").run()}
      />
      <ToolbarButton
        label="Căn phải"
        icon={AlignRight}
        isActive={state.alignRight}
        onClick={() => chain().setTextAlign("right").run()}
      />
      <ToolbarButton
        label="Xoá định dạng"
        icon={RemoveFormatting}
        onClick={() => chain().unsetAllMarks().clearNodes().run()}
      />
    </div>,
  ];

  return (
    <div
      role="toolbar"
      aria-label="Định dạng văn bản"
      className="border-b-2 border-border-strong bg-surface-sunken p-1"
    >
      <div className="flex flex-wrap items-center">
        {groups.map((group, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <Divider />}
            {group}
          </div>
        ))}
      </div>
      {isLinkOpen && (
        <form
          onSubmit={applyLink}
          className="mt-1 flex flex-wrap items-center gap-2 p-1"
        >
          <Input
            aria-label="Địa chỉ liên kết"
            type="url"
            placeholder="https://..."
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className="min-w-0 flex-1"
            data-autofocus
          />
          <Button type="submit" size="compact">
            Áp dụng
          </Button>
          <Button
            type="button"
            size="compact"
            variant="outline"
            onClick={() => setIsLinkOpen(false)}
          >
            Huỷ
          </Button>
        </form>
      )}
    </div>
  );
}

/**
 * A TipTap rich-text editor: headings, bold / italic / underline / strike /
 * code / highlight, bullet, numbered and task lists, quotes, code blocks, rules,
 * links, alignment and undo / redo. The value is stored as HTML. It reads
 * `value` once, when it first mounts.
 */
export function RichTextEditor({
  value,
  label,
  placeholder = "Viết mô tả...",
  onCommit,
  onChange,
  className,
}: RichTextEditorProps) {
  const isDirty = useRef(false);
  const editor = useEditor({
    // Renders on the client only, so the server and the browser never disagree.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
    ],
    content: toEditorContent(value),
    editorProps: {
      attributes: {
        class: "rich-text min-h-32 px-3 py-2 outline-none",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": label,
      },
    },
    onUpdate: ({ editor: current }) => {
      isDirty.current = true;
      onChange?.(current.isEmpty ? "" : current.getHTML());
    },
    onBlur: ({ editor: current }) => {
      if (!isDirty.current) return;
      isDirty.current = false;
      onCommit?.(current.isEmpty ? "" : current.getHTML());
    },
  });

  return (
    <div
      className={cn(
        "overflow-hidden rounded-standard border-2 border-border-strong bg-surface-card focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-solid focus-within:outline-border-focus",
        className,
      )}
    >
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
