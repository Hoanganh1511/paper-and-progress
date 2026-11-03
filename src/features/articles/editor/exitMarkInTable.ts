import { Extension, Mark } from "@tiptap/react";

/** The marks that step out of themselves when → is pressed at their end. */
const EXITABLE_MARKS = ["code", "link"];

/**
 * Lets → step out of inline code (or a link) at the end of a table cell.
 *
 * TipTap already does this outside tables: at the end of a code span, → leaves
 * the code and the text goes on in the same paragraph. In a table, though, the
 * table's own arrow handling runs first and takes the key to move to the next
 * cell, so after `code` there was no way to keep writing beside it in the same
 * cell. This runs before the table's handler and uses TipTap's own exit, so the
 * cursor behaves the same in a cell as anywhere else. Once out of the code, →
 * moves to the next cell as usual.
 */
export const ExitMarkInTable = Extension.create({
  name: "exitMarkInTable",
  // Higher than the table's, so this one sees the key first.
  priority: 1000,
  addKeyboardShortcuts() {
    return {
      ArrowRight: ({ editor }) => {
        const isInCell =
          editor.isActive("tableCell") || editor.isActive("tableHeader");
        if (!isInCell) return false;
        for (const name of EXITABLE_MARKS) {
          const mark = editor.extensionManager.extensions.find(
            (extension) => extension.name === name,
          );
          if (mark && Mark.handleExit({ editor, mark: mark as Mark })) {
            return true;
          }
        }
        return false;
      },
    };
  },
});
