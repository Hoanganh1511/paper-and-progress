import type { Editor } from "@tiptap/react";
import { uploadImage, validateImage } from "../articlesApi";

export interface ImageInsertHandlers {
  onStart: () => void;
  onDone: () => void;
  onError: (message: string) => void;
}

/**
 * Uploads each image file and puts it into the editor at the cursor. A file that
 * is too big or not an image is refused before any request is made.
 */
export async function insertImages(
  editor: Editor,
  files: File[],
  handlers: ImageInsertHandlers,
) {
  const images = files.filter((file) => file.type.startsWith("image/"));
  for (const file of images) {
    const problem = validateImage(file);
    if (problem) {
      handlers.onError(`${file.name}: ${problem}`);
      continue;
    }
    handlers.onStart();
    try {
      const src = await uploadImage(file);
      editor.chain().focus().setImage({ src, alt: file.name }).run();
    } catch (caught) {
      handlers.onError(
        caught instanceof Error ? caught.message : "Không tải được ảnh lên.",
      );
    } finally {
      handlers.onDone();
    }
  }
  return images.length;
}

/** The image files in a paste or drop event. */
export const imageFilesOf = (data: DataTransfer | null) =>
  Array.from(data?.files ?? []).filter((file) =>
    file.type.startsWith("image/"),
  );
